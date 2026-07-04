import type { SupabaseClient } from '@supabase/supabase-js'

import { aiLimitsForPlan, type AiAction } from '@/config/ai'
import type { Plan } from '@/lib/billing'

type RateLimitResult = {
    allowed: boolean
    remaining: number
    resetAt: string | null
}

/**
 * Read the current user's plan from the billing table (RLS-scoped to them).
 * Fails closed to 'free' so a transient DB error never silently grants paid
 * limits. Anonymous/new users with no billing row are 'free'.
 */
async function getPlan(supabase: SupabaseClient): Promise<Plan> {
    try {
        const { data, error } = await supabase.from('billing').select('plan').maybeSingle()
        if (error || !data) return 'free'
        return (data.plan as Plan) ?? 'free'
    } catch {
        return 'free'
    }
}

type RateLimitOptions = {
    /**
     * Fail CLOSED when the limiter itself errors. Use for actions that spend
     * real per-call money on third parties (paid scrapes) where availability
     * must not trump the budget; LLM-only actions keep the fail-open default.
     */
    failClosed?: boolean
}

export async function checkRateLimit(
    supabase: SupabaseClient,
    action: AiAction,
    options?: RateLimitOptions,
): Promise<RateLimitResult> {
    if (process.env.NODE_ENV === 'development') {
        return { allowed: true, remaining: 999, resetAt: null }
    }

    const onError = (): RateLimitResult => ({ allowed: !options?.failClosed, remaining: 0, resetAt: null })

    try {
        const plan = await getPlan(supabase)
        const limit = aiLimitsForPlan(plan)[action]

        const { data, error } = await supabase.rpc('check_and_record_usage', {
            p_action: action,
            p_limit: limit,
        })

        if (error) {
            console.error('Rate limit check failed:', error.message)
            return onError()
        }

        return {
            allowed: data.allowed,
            remaining: data.remaining,
            resetAt: data.reset_at,
        }
    } catch (err) {
        console.error('Rate limit check error:', err)
        return onError()
    }
}
