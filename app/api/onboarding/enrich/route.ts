import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { env } from '@/env.mjs'
import { AI_ERROR_CODES } from '@/config/ai'
import { getRoleContent, resolveRole } from '@/config/onboarding-personalization'
import type { BrandingRole } from '@/lib/branding'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { bodySchema, enrichSchema } from './route.schema'

export const maxDuration = 30

const ENRICH_SYSTEM_PROMPT =
    "You infer a LinkedIn creator's role, niche, target audience, and writing tone from limited profile signal (name, headline, profile URL, and a stated goal). Output strict JSON matching the schema. Base inferences only on the given signal plus the stated goal; if signal is weak, pick the safest role for the stated goal and set a LOW confidence (<= 0.4). Never fabricate metrics, follower counts, or post history - you only see basic profile fields. toneSummary is a short phrase like 'direct and practical'. opportunityLine is one encouraging, role-aware sentence. niche is a short label like 'B2B SaaS growth'."

// Map a stated welcome goal to the safest role so the Mirror screen has a sane
// fallback when AI inference is unavailable.
function deriveRoleFromGoal(goal: string | undefined): BrandingRole {
    switch (goal) {
        case 'employer-branding':
            return 'team-lead'
        case 'career-opportunities':
            return 'employee'
        case 'company-awareness':
            return 'founder'
        default:
            return 'creator'
    }
}

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

    const rateLimit = await checkRateLimit(supabase, 'onbEnrich')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'onbEnrich',
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const { name, headline, vanityUrl, profileUrl, welcomeGoal } = parsed.data
    const role = resolveRole(deriveRoleFromGoal(welcomeGoal))

    const signals: string[] = []
    if (name) signals.push(`Name: ${name}`)
    if (headline) signals.push(`Headline: ${headline}`)
    if (vanityUrl) signals.push(`Vanity URL: ${vanityUrl}`)
    if (profileUrl) signals.push(`Profile URL: ${profileUrl}`)
    if (welcomeGoal) signals.push(`Stated goal: ${welcomeGoal}`)

    const prompt =
        signals.length > 0
            ? `Infer the creator's role, niche, target audience, and writing tone from these signals:\n${signals.join('\n')}`
            : 'No profile signals were provided. Pick the safest role for a general creator and set a low confidence.'

    const openai = createOpenAI({ apiKey: env.LLM_API_KEY })

    try {
        const { object } = await generateObject({
            model: openai(env.LLM_MODEL ?? 'gpt-4o-mini'),
            schema: enrichSchema,
            system: ENRICH_SYSTEM_PROMPT,
            prompt,
        })

        return Response.json(object)
    } catch {
        // Graceful degradation: never surface an error on the Mirror screen. Return
        // a low-confidence, role-aware fallback as a normal 200 response.
        const content = getRoleContent(role)
        return Response.json({
            role,
            niche: '',
            primaryAudience: content.defaultAudience[0] ?? 'new-clients',
            toneSummary: '',
            opportunityLine: content.mirrorOpportunity,
            confidence: 0,
        })
    }
}
