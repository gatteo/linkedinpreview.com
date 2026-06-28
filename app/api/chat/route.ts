import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, streamText } from 'ai'
import type { UIMessage } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { chatSystemPrompt } from '@/config/prompts'
import { assertSameOrigin, checkIpRateLimit } from '@/lib/ai-guard'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema } from './route.schema'

export const maxDuration = 30

export async function POST(request: Request) {
    // Block naive cross-origin calls before doing any work.
    const originBlock = assertSameOrigin(request)
    if (originBlock) return originBlock

    // Per-IP backstop ahead of the per-user Supabase limit (blunts bursts).
    const ipLimit = checkIpRateLimit(request, { id: 'chat', limit: 30, windowMs: 10 * 60 * 1000 })
    if (!ipLimit.allowed) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'generation',
                resetAt: ipLimit.resetAt,
                remaining: ipLimit.remaining,
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } },
        )
    }

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

    let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>
    try {
        modelMessages = await convertToModelMessages(parsed.data.messages as UIMessage[])
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid message format' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const result = streamText({
        model: openai(model),
        system: chatSystemPrompt(parsed.data.brandingContext),
        messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
}
