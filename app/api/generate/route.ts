import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// Formatting rules injected into every prompt
// ---------------------------------------------------------------------------

const FORMATTING_RULES = `
## Formatting Rules

- Use **bold** and *italic* sparingly - only for key phrases (1-5 words), never full sentences
- Short paragraphs (1-3 sentences) separated by blank lines
- End with 3-5 relevant hashtags on the last line
- Never use em dashes (—) - use commas, semicolons, or separate sentences instead
- Professional but conversational tone - like a knowledgeable colleague
- If using a list, write each item as its own short paragraph with no bullet symbols
`

function withBranding(brandingContext?: string): string {
    if (!brandingContext) return ''
    return `\n## Author Branding Context\n\n${brandingContext}\n`
}

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const bodySchema = z.object({
    action: z.enum(['hooks', 'posts', 'variation', 'shorten', 'lengthen', 'restyle', 'apply-suggestion']),
    sourceText: z.string().max(10_000).optional(),
    hook: z.string().max(2_000).optional(),
    postText: z.string().max(10_000).optional(),
    tone: z.string().max(100).optional(),
    style: z.string().max(100).optional(),
    suggestion: z.string().max(2_000).optional(),
    brandingContext: z.string().max(5_000).optional(),
})

// ---------------------------------------------------------------------------
// Output schemas per action
// ---------------------------------------------------------------------------

const POST_LABELS = [
    'Personal Milestones',
    'Mindset & Motivation',
    'Career Before & After',
    'Tool & Resource Insights',
    'Case Studies',
    'Actionable Guides',
    'Culture Moments',
    'Offer Highlight',
    'Client Success Story',
] as const

const hooksSchema = z.object({
    hooks: z
        .array(
            z.object({
                text: z.string(),
                category: z.string(),
                type: z.string(),
            }),
        )
        .length(4),
})

const postsSchema = z.object({
    posts: z
        .array(
            z.object({
                text: z.string(),
                wordCount: z.number(),
                label: z.string().optional(),
            }),
        )
        .length(2),
})

const resultSchema = z.object({ result: z.string() })

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

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

    const { action, sourceText, hook, postText, tone, suggestion, brandingContext } = parsed.data

    // Rate limiting: wizard actions are more expensive
    const rateLimitAction = action === 'hooks' || action === 'posts' ? 'wizard' : 'quickAction'
    const rateLimit = await checkRateLimit(supabase, rateLimitAction)

    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: `Daily ${rateLimitAction} limit reached`,
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: rateLimitAction,
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })
    const model = env.LLM_MODEL ?? 'gpt-4o-mini'

    try {
        // hooks
        if (action === 'hooks') {
            const { object } = await generateObject({
                model: openai(model),
                schema: hooksSchema,
                system: `You are an expert LinkedIn content strategist.${withBranding(brandingContext)}${FORMATTING_RULES}`,
                prompt: `Generate 4 compelling LinkedIn post hooks from the following source material. Each hook should grab attention in the first line and make people want to keep reading. Vary the hook styles (e.g., question, bold claim, personal story opener, surprising stat). For each hook, provide a category (e.g., 'Question', 'Bold Claim', 'Story', 'Stat') and a type (e.g., 'curiosity', 'authority', 'empathy', 'controversy').

Source material:
${sourceText}`,
            })

            return Response.json(object)
        }

        // posts
        if (action === 'posts') {
            const { object } = await generateObject({
                model: openai(model),
                schema: postsSchema,
                system: `You are an expert LinkedIn content writer. You write complete, engaging LinkedIn posts.${withBranding(brandingContext)}${FORMATTING_RULES}`,
                prompt: `Write 2 full LinkedIn post variants using the hook and source material below. Each post should be different in structure or angle but both use the same hook. Count the words in each post and include the word count. Assign each post one of these content labels that best describes it: ${POST_LABELS.join(', ')}.

Hook: ${hook}

Source material:
${sourceText}`,
            })

            return Response.json(object)
        }

        // variation
        if (action === 'variation') {
            const { object } = await generateObject({
                model: openai(model),
                schema: resultSchema,
                system: `You are an expert LinkedIn content writer.${withBranding(brandingContext)}${FORMATTING_RULES}`,
                prompt: `Generate an alternative version of this LinkedIn post. Keep the core message and insights but change the structure, angle, or hook to create a fresh take. Output only the post text.\n\n${postText}`,
            })

            return Response.json(object)
        }

        // shorten
        if (action === 'shorten') {
            const { object } = await generateObject({
                model: openai(model),
                schema: resultSchema,
                system: `You are an expert LinkedIn content writer.${withBranding(brandingContext)}${FORMATTING_RULES}`,
                prompt: `Make this LinkedIn post more concise while preserving the key message and insights. Cut filler, tighten sentences, and remove redundancy. Output only the post text.\n\n${postText}`,
            })

            return Response.json(object)
        }

        // lengthen
        if (action === 'lengthen') {
            const { object } = await generateObject({
                model: openai(model),
                schema: resultSchema,
                system: `You are an expert LinkedIn content writer.${withBranding(brandingContext)}${FORMATTING_RULES}`,
                prompt: `Expand this LinkedIn post with more detail, examples, or context. Add depth without padding - every addition should add real value. Output only the post text.\n\n${postText}`,
            })

            return Response.json(object)
        }

        // restyle
        if (action === 'restyle') {
            const { object } = await generateObject({
                model: openai(model),
                schema: resultSchema,
                system: `You are an expert LinkedIn content writer.${withBranding(brandingContext)}${FORMATTING_RULES}`,
                prompt: `Rewrite this LinkedIn post in a ${tone ?? 'professional'} tone. Keep the same core content and message but adapt the language, phrasing, and energy to match the requested tone. Output only the post text.\n\n${postText}`,
            })

            return Response.json(object)
        }

        // apply-suggestion
        if (action === 'apply-suggestion') {
            const { object } = await generateObject({
                model: openai(model),
                schema: resultSchema,
                system: `You are an expert LinkedIn content writer.${withBranding(brandingContext)}${FORMATTING_RULES}`,
                prompt: `Apply this suggestion to the LinkedIn post below. Make the requested change while keeping the rest of the post intact. Output only the updated post text.

Suggestion: ${suggestion}

Post:
${postText}`,
            })

            return Response.json(object)
        }

        return Response.json({ error: 'Unknown action' }, { status: 400 })
    } catch {
        return Response.json({ error: 'Failed to generate content' }, { status: 500 })
    }
}
