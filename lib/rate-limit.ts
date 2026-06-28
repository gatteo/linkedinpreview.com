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

export async function checkRateLimit(supabase: SupabaseClient, action: AiAction): Promise<RateLimitResult> {
    if (process.env.NODE_ENV === 'development') {
        return { allowed: true, remaining: 999, resetAt: null }
    }

    try {
        const plan = await getPlan(supabase)
        const limit = aiLimitsForPlan(plan)[action]

        const { data, error } = await supabase.rpc('check_and_record_usage', {
            p_action: action,
            p_limit: limit,
        })

        if (error) {
            console.error('Rate limit check failed:', error.message)
            // Fail open - allow the request if DB is unreachable
            return { allowed: true, remaining: 0, resetAt: null }
        }

        return {
            allowed: data.allowed,
            remaining: data.remaining,
            resetAt: data.reset_at,
        }
    } catch (err) {
        console.error('Rate limit check error:', err)
        // Fail open
        return { allowed: true, remaining: 0, resetAt: null }
    }
}
