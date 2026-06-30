import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES, DEFAULT_LLM_MODEL } from '@/config/ai'
import { CAROUSEL_GENERATE_SYSTEM, carouselGenerateUserPrompt } from '@/config/carousel-prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema, deckSchema } from './route.schema'

export const maxDuration = 60

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

    const rateLimit = await checkRateLimit(supabase, 'carouselGenerate')

    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily carouselGenerate limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'carouselGenerate',
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const { source, content, carouselType, targetSlides, brandingContext } = parsed.data

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })
    const model = env.LLM_MODEL ?? DEFAULT_LLM_MODEL

    try {
        const { object } = await generateObject({
            model: openai(model),
            schema: deckSchema,
            system: CAROUSEL_GENERATE_SYSTEM,
            prompt: carouselGenerateUserPrompt({ source, content, carouselType, targetSlides, brandingContext }),
        })

        return Response.json(object)
    } catch (err) {
        console.error('[/api/carousel/generate]', err instanceof Error ? err.message : err)
        return Response.json(
            { error: 'Failed to generate carousel', code: AI_ERROR_CODES.GENERATION_FAILED },
            { status: 500 },
        )
    }
}
