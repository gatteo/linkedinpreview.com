import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { IDEAS_SYSTEM_PROMPT, ideasUserPrompt } from '@/config/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema, ideasSchema } from './route.schema'

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

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(supabase, 'ideas')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily ideas limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'ideas',
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
            schema: ideasSchema,
            system: IDEAS_SYSTEM_PROMPT,
            prompt: ideasUserPrompt(parsed.data),
        })

        return Response.json(object)
    } catch {
        return Response.json(
            { error: 'Failed to generate post ideas', code: AI_ERROR_CODES.GENERATION_FAILED },
            { status: 500 },
        )
    }
}
