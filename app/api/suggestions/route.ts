import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { SUGGESTIONS_SYSTEM_PROMPT, suggestionsUserPrompt } from '@/config/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema, suggestionsSchema } from './route.schema'

export const maxDuration = 30

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

    // Auth: validate the anonymous session
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    // Rate limit: 10 suggestions per day
    const rateLimit = await checkRateLimit(supabase, 'quickAction')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily suggestion limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'quickAction',
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })

    try {
        const { object } = await generateObject({
            model: openai(env.LLM_MODEL ?? 'gpt-4o-mini'),
            schema: suggestionsSchema,
            system: SUGGESTIONS_SYSTEM_PROMPT,
            prompt: suggestionsUserPrompt(parsed.data.postText),
        })

        return Response.json(object)
    } catch {
        return Response.json(
            { error: 'Failed to generate suggestions', code: AI_ERROR_CODES.GENERATION_FAILED },
            { status: 500 },
        )
    }
}
