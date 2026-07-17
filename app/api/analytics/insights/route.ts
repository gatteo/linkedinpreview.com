import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import type { z } from 'zod'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES, DEFAULT_LLM_MODEL } from '@/config/ai'
import { INSIGHTS_SYSTEM_PROMPT, insightsUserPrompt } from '@/config/prompts'
import { buildAnalyticsDigest } from '@/lib/analytics/digest'
import { checkRateLimit } from '@/lib/rate-limit'
import { fetchDrafts } from '@/lib/supabase/drafts'
import { fetchPostMetrics } from '@/lib/supabase/post-metrics'
import { fetchPublishedPostsContent } from '@/lib/supabase/published-posts'
import { createClient } from '@/lib/supabase/server'

import { insightsSchema } from './route.schema'

export const maxDuration = 30

// Need at least a few published posts before AI insight is meaningful.
const MIN_POSTS = 3

/** Return the member's last generated insights (cached), if any. */
export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    const { data } = await supabase
        .from('analytics_insights')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle()
    if (!data) return Response.json({ insights: null, generatedAt: null })
    return Response.json({ insights: data.data, generatedAt: new Date(data.updated_at as string).getTime() })
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    // The client's timezone offset lets the server compute "best day/time" in the
    // member's local time so the AI's advice matches the dashboard. Optional.
    let tzOffsetMinutes: number | undefined
    try {
        const body = (await request.json()) as { tzOffsetMinutes?: unknown }
        if (typeof body?.tzOffsetMinutes === 'number' && Number.isFinite(body.tzOffsetMinutes)) {
            tzOffsetMinutes = body.tzOffsetMinutes
        }
    } catch {
        // No/invalid body - fall back to UTC.
    }

    // Pull the member's data server-side so insights are grounded in real,
    // RLS-scoped numbers rather than anything the client could spoof.
    let digest
    try {
        const [drafts, metrics, content] = await Promise.all([
            fetchDrafts(supabase),
            fetchPostMetrics(supabase),
            fetchPublishedPostsContent(supabase),
        ])
        const publishedCount = drafts.filter((d) => d.status === 'published').length
        if (publishedCount < MIN_POSTS) {
            return Response.json({ success: true, notEnoughData: true, publishedCount })
        }
        digest = buildAnalyticsDigest(drafts, metrics, content, Date.now(), tzOffsetMinutes)
    } catch (err) {
        console.error('[analytics/insights] digest build failed:', err)
        return Response.json({ error: 'Failed to load analytics data' }, { status: 500 })
    }

    // Rate limit only once we know we will actually call the model.
    const rateLimit = await checkRateLimit(supabase, 'insights')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily insights limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'insights',
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })

    let object: z.infer<typeof insightsSchema>
    try {
        const result = await generateObject({
            model: openai(env.LLM_MODEL ?? DEFAULT_LLM_MODEL),
            schema: insightsSchema,
            system: INSIGHTS_SYSTEM_PROMPT,
            prompt: insightsUserPrompt(digest),
        })
        object = result.object
    } catch (err) {
        console.error('[analytics/insights] generation failed:', err)
        return Response.json(
            { error: 'Failed to generate insights', code: AI_ERROR_CODES.GENERATION_FAILED },
            { status: 500 },
        )
    }

    // Persist so the insights show across devices/sessions (fail silently).
    const generatedAt = Date.now()
    const { error: upsertError } = await supabase
        .from('analytics_insights')
        .upsert(
            { user_id: user.id, data: object, updated_at: new Date(generatedAt).toISOString() },
            { onConflict: 'user_id' },
        )
    if (upsertError) {
        console.error('[analytics/insights] failed to persist:', upsertError.message)
    }

    return Response.json({ success: true, insights: object, generatedAt })
}
