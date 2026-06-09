import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText } from 'ai'
import type { UIMessage } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { CHAT_SYSTEM_PROMPT } from '@/config/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema } from './route.schema'

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

    // Rate limiting: first message = generation, subsequent = refinement
    const action = parsed.data.messages.length === 1 ? 'generation' : 'refinement'
    const rateLimit = await checkRateLimit(supabase, action)

    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: `Daily ${action} limit reached`,
                code: AI_ERROR_CODES.RATE_LIMITED,
                action,
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })
    const model = env.LLM_MODEL ?? 'gpt-4o-mini'

    const modelMessages = await convertToModelMessages(parsed.data.messages as UIMessage[])

    const result = streamText({
        model: openai(model),
        system: CHAT_SYSTEM_PROMPT,
        messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
}
