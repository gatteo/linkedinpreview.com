import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { POSITIONING_SYSTEM_PROMPT, positioningUserPrompt } from '@/config/prompts'
import { isAIProviderRateLimit } from '@/lib/ai-provider-error'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema, positioningSchema } from './route.schema'

export const maxDuration = 30

type PositioningRouteDependencies = {
    createClient: typeof createClient
    checkRateLimit: typeof checkRateLimit
    createOpenAI: typeof createOpenAI
    generateObject: typeof generateObject
}

const productionDependencies: PositioningRouteDependencies = {
    createClient,
    checkRateLimit,
    createOpenAI,
    generateObject,
}

export async function handlePositioningRequest(
    request: Request,
    {
        createClient,
        checkRateLimit,
        createOpenAI,
        generateObject,
    }: PositioningRouteDependencies = productionDependencies,
) {
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

    const rateLimit = await checkRateLimit(supabase, 'quickAction')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily limit reached',
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
            schema: positioningSchema,
            system: POSITIONING_SYSTEM_PROMPT,
            prompt: positioningUserPrompt(parsed.data),
        })

        return Response.json(object)
    } catch (err) {
        if (isAIProviderRateLimit(err)) {
            return Response.json(
                {
                    error: 'AI generation is temporarily unavailable. Please try again later.',
                    code: AI_ERROR_CODES.PROVIDER_RATE_LIMITED,
                },
                { status: 429 },
            )
        }

        return Response.json(
            { error: 'Failed to generate positioning statement', code: AI_ERROR_CODES.GENERATION_FAILED },
            { status: 500 },
        )
    }
}

export function POST(request: Request) {
    return handlePositioningRequest(request)
}
