import type { SupabaseClient } from '@supabase/supabase-js'

import { AI_RATE_LIMITS } from '@/config/ai'

interface RateLimitResult {
    allowed: boolean
    remaining: number
    resetAt: string | null
}

export async function checkRateLimit(
    supabase: SupabaseClient,
    action: keyof typeof AI_RATE_LIMITS,
): Promise<RateLimitResult> {
    if (process.env.NODE_ENV === 'development') {
        return { allowed: true, remaining: 999, resetAt: null }
    }

    try {
        const { data, error } = await supabase.rpc('check_and_record_usage', {
            p_action: action,
            p_limit: AI_RATE_LIMITS[action],
        })

        if (error) {
            console.error('Rate limit check failed:', error.message)
            // Fail open — allow the request if DB is unreachable
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
