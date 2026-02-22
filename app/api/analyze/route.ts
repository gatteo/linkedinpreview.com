import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
    postText: z.string().min(1).max(10_000),
    hasImage: z.boolean(),
    hasFormatting: z.boolean(),
    contentLength: z.number().int(),
    lineCount: z.number().int(),
    hashtagCount: z.number().int(),
    emojiCount: z.number().int(),
})

const analysisSchema = z.object({
    score: z.number().int().min(1).max(100),
    hook_score: z.number().int().min(1).max(100),
    readability_score: z.number().int().min(1).max(100),
    cta_score: z.number().int().min(1).max(100),
    strengths: z.array(z.string()).min(1).max(3),
    improvements: z.array(z.string()).min(1).max(3),
})

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
            { error: 'Daily analysis limit reached', code: AI_ERROR_CODES.RATE_LIMITED, resetAt: rateLimit.resetAt },
            { status: 429 },
        )
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })

    let object: z.infer<typeof analysisSchema>
    try {
        const result = await generateObject({
            model: openai(env.LLM_MODEL ?? 'gpt-4o-mini'),
            schema: analysisSchema,
            system: `You are a LinkedIn content analyst. Evaluate posts for professional impact.
Score each dimension 1-100. Be concise and specific.
Consider: hook effectiveness (first line), readability (structure, sentences),
call-to-action clarity, use of formatting/hashtags, appropriate length.
Strengths and improvements should be 1 sentence each, referencing the actual post content.`,
            prompt: `Analyze this LinkedIn post:

Post length: ${parsed.data.contentLength} chars, ${parsed.data.lineCount} lines
Has image: ${parsed.data.hasImage}, Has formatting: ${parsed.data.hasFormatting}
Hashtags: ${parsed.data.hashtagCount}, Emojis: ${parsed.data.emojiCount}

---
${parsed.data.postText}
---`,
        })
        object = result.object
    } catch (err) {
        console.error('AI analysis failed:', err)
        return Response.json({ error: 'Failed to analyze post' }, { status: 500 })
    }

    // Store the result — fail silently if the insert fails
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
        strengths: object.strengths,
        improvements: object.improvements,
    })

    if (insertError) {
        console.error('Failed to store analysis:', insertError.message)
    }

    return Response.json({ success: true })
}
