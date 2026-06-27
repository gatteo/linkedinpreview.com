import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { assertSameOrigin, checkIpRateLimit } from '@/lib/ai-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
    postText: z.string().min(1).max(10_000),
})

export async function POST(request: Request) {
    const originBlock = assertSameOrigin(request)
    if (originBlock) return originBlock

    const ipLimit = checkIpRateLimit(request, { id: 'suggestions', limit: 30, windowMs: 10 * 60 * 1000 })
    if (!ipLimit.allowed) {
        return Response.json(
            { error: 'Too many requests', code: AI_ERROR_CODES.RATE_LIMITED, resetAt: ipLimit.resetAt },
            { status: 429 },
        )
    }

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

    // Per-user daily cap. Suggestions fire automatically after each generation/refinement,
    // so this stops a holder of a free anonymous session from looping the endpoint.
    const rateLimit = await checkRateLimit(supabase, 'suggestions')
    if (!rateLimit.allowed) {
        return Response.json(
            { error: 'Daily suggestions limit reached', code: AI_ERROR_CODES.RATE_LIMITED, resetAt: rateLimit.resetAt },
            { status: 429 },
        )
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })

    try {
        const { object } = await generateObject({
            model: openai(env.LLM_MODEL ?? 'gpt-4o-mini'),
            schema: z.object({
                suggestions: z.array(z.string()).length(3),
            }),
            system: `You suggest short refinement prompts for a LinkedIn post.
Each suggestion must be 4-8 words and start with a verb.
Make them specific to the post content - reference actual topics, themes, or points from the post.
Cover different aspects: one about content, one about structure or length, one about style or tone.`,
            prompt: `Suggest 3 ways to refine this LinkedIn post:\n\n${parsed.data.postText}`,
        })

        return Response.json(object)
    } catch {
        return Response.json({ error: 'Failed to generate suggestions' }, { status: 500 })
    }
}
