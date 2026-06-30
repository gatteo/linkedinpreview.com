import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { fallbackPost } from '@/config/onboarding-personalization'
import type { BrandingRole } from '@/lib/branding'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema, firstPostSchema } from './route.schema'

export const maxDuration = 30

const FIRST_POST_SYSTEM_PROMPT =
    'You are an expert LinkedIn writer. Write ONE publish-ready LinkedIn post. Strong scroll-stopping hook on the first line, short skimmable paragraphs separated by blank lines, exactly one clear takeaway, end with a light question or soft CTA. Use **bold** sparingly (1-3 short key phrases) and never bold whole sentences. No hashtag spam (0-2 max). NEVER use em dashes - use commas or separate sentences. Target ~120-180 words. Output only the post text in the `text` field.'

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid JSON body', code: AI_ERROR_CODES.INVALID_INPUT }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        return Response.json(
            { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: AI_ERROR_CODES.INVALID_INPUT },
            { status: 400 },
        )
    }

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(supabase, 'onbFirstPost')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'onbFirstPost',
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const { role, niche, primaryGoal, audience, tone, name, brandingContext } = parsed.data

    const audienceText = audience && audience.length > 0 ? audience.join(', ') : 'their target audience'
    const goalText = primaryGoal ?? 'grow on LinkedIn'
    const toneText = tone ?? 'professional'

    let prompt = `Write one LinkedIn post for a ${role}`
    if (niche) prompt += ` in ${niche}`
    prompt += ` whose goal is ${goalText}, speaking to ${audienceText}, in a ${toneText} voice.`
    if (name) prompt += ` Write in first person as ${name}.`
    if (brandingContext) prompt += `\n\nAuthor branding context (reference, match voice):\n${brandingContext}`

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })

    try {
        const { object } = await generateObject({
            model: openai(env.LLM_MODEL ?? 'gpt-4o-mini'),
            schema: firstPostSchema,
            system: FIRST_POST_SYSTEM_PROMPT,
            prompt,
            abortSignal: request.signal,
            maxRetries: 1,
        })

        return Response.json({ text: object.text })
    } catch {
        // Graceful degradation: the "aha" screen must always show a strong post.
        return Response.json({ text: fallbackPost(role as BrandingRole, niche), fallback: true })
    }
}
