import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import type { z } from 'zod'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { ANALYZE_SYSTEM_PROMPT, analyzeUserPrompt } from '@/config/prompts'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { analysisSchema, bodySchema } from './route.schema'

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

    // Rate limit: 20 analyses per day
    const rateLimit = await checkRateLimit(supabase, 'analysis')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily analysis limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'analysis',
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })

    let object: z.infer<typeof analysisSchema>
    try {
        const result = await generateObject({
            model: openai(env.LLM_MODEL ?? 'gpt-4o-mini'),
            schema: analysisSchema,
            system: ANALYZE_SYSTEM_PROMPT,
            prompt: analyzeUserPrompt(parsed.data),
        })
        object = result.object
    } catch (err) {
        console.error('AI analysis failed:', err)
        return Response.json(
            { error: 'Failed to analyze post', code: AI_ERROR_CODES.GENERATION_FAILED },
            { status: 500 },
        )
    }

    // Store the result - fail silently if the insert fails
    const { error: insertError } = await supabase.from('post_analyses').insert({
        user_id: user.id,
        post_text: parsed.data.postText,
        content_length: parsed.data.contentLength,
        line_count: parsed.data.lineCount,
        hashtag_count: parsed.data.hashtagCount,
        emoji_count: parsed.data.emojiCount,
        has_formatting: parsed.data.hasFormatting,
        has_image: parsed.data.hasImage,
        score: object.score,
        hook_score: object.hook_score,
        readability_score: object.readability_score,
        cta_score: object.cta_score,
        engagement_score: object.engagement_score,
        strengths: object.strengths,
        improvements: object.improvements,
        topics: object.topics,
        sentiment: object.sentiment,
        category: object.category,
        tone: object.tone,
        has_hook: object.has_hook,
        has_cta: object.has_cta,
        hook_quality: object.hook_quality,
    })

    if (insertError) {
        console.error('Failed to store analysis:', insertError.message)
    }

    return Response.json({ success: true, analysis: object })
}
