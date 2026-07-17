import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { GENERATE_PROMPTS, generateConstraints } from '@/config/prompts'
import { countWords } from '@/lib/content-scoring'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema, schemaMap } from './route.schema'

export const maxDuration = 30

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        return Response.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    // Auth: validate the anonymous session
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    const { action, sourceText, hook, postText, tone, suggestion, brandingContext, footerText, dosDonts } = parsed.data

    // Rate limiting: wizard actions are more expensive
    const rateLimitAction = action === 'hooks' || action === 'posts' ? 'wizard' : 'quickAction'
    const rateLimit = await checkRateLimit(supabase, rateLimitAction)

    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: `Daily ${rateLimitAction} limit reached`,
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: rateLimitAction,
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const prompts = GENERATE_PROMPTS[action]
    if (!prompts) {
        return Response.json({ error: 'Unknown action' }, { status: 400 })
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })
    const model = env.LLM_MODEL ?? 'gpt-4o-mini'

    try {
        const { object } = await generateObject({
            model: openai(model),
            schema: schemaMap[action],
            system: prompts.system + generateConstraints(dosDonts),
            prompt: prompts.user({ sourceText, hook, postText, tone, suggestion, brandingContext }),
        })

        // Deterministically append the footer to full-post variants only. Quick
        // actions transform existing text that may already carry the footer, so
        // appending there would duplicate it. The footer flows in as structured
        // data, not a prompt instruction, so compliance is guaranteed.
        const trimmedFooter = footerText?.trim()
        if (action === 'posts' && trimmedFooter) {
            const result = object as { posts: Array<{ text: string; wordCount: number; label: string }> }
            const posts = result.posts.map((post) => {
                const text = `${post.text}\n\n${trimmedFooter}`
                return { ...post, text, wordCount: countWords(text) }
            })
            return Response.json({ posts })
        }

        return Response.json(object)
    } catch (err) {
        console.error('[/api/generate] action:', action, err instanceof Error ? err.message : err)
        return Response.json(
            { error: 'Failed to generate content', code: AI_ERROR_CODES.GENERATION_FAILED },
            { status: 500 },
        )
    }
}
