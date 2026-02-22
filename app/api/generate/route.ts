import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { z } from 'zod'

import { env } from '@/env.mjs'

const SYSTEM_PROMPT = `You are an expert LinkedIn content writer. Your task is to transform a user's topic, key points, or rough draft into a polished, engaging LinkedIn post.

Follow these guidelines:
- Start with a compelling hook that grabs attention in the first line
- Use short paragraphs (1-3 sentences each) separated by blank lines for readability
- Write in a professional-but-conversational tone — like a knowledgeable colleague, not a corporate press release
- End with 3-5 relevant hashtags on the last line
- Target 1300-2000 characters in total length
- Use plain text only — no markdown formatting, no bold/italic markers, no bullet point symbols like * or -
- If using a list, write each item as its own short paragraph
- Make the content feel authentic and personal, sharing genuine insights or a clear perspective`

const bodySchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
})

export async function POST(request: Request) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
        return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        })
    }

    const model = env.LLM_MODEL ?? 'gpt-4o-mini'

    try {
        const result = streamText({
            model: openai(model),
            system: SYSTEM_PROMPT,
            prompt: parsed.data.prompt,
        })

        return result.toTextStreamResponse()
    } catch (error) {
        console.error('LLM generation error:', error)
        return new Response(JSON.stringify({ error: 'Failed to generate post. Please try again.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
