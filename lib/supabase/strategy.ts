import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_STRATEGY, type StrategyData } from '@/lib/strategy'

function mergeWithDefaults(stored: Partial<StrategyData>): StrategyData {
    return {
        goals: stored.goals ?? DEFAULT_STRATEGY.goals,
        audience: stored.audience ?? DEFAULT_STRATEGY.audience,
        frequency: stored.frequency ?? DEFAULT_STRATEGY.frequency,
        schedule: stored.schedule ?? DEFAULT_STRATEGY.schedule,
        formats: stored.formats ?? DEFAULT_STRATEGY.formats,
        weeklyIdeas: stored.weeklyIdeas ?? DEFAULT_STRATEGY.weeklyIdeas,
        completedAt: stored.completedAt ?? DEFAULT_STRATEGY.completedAt,
    }
}

export async function fetchStrategy(client: SupabaseClient): Promise<StrategyData> {
    const { data, error } = await client.from('strategy').select('data').single()

    if (error) {
        if (error.code === 'PGRST116') return DEFAULT_STRATEGY
        throw error
    }

    return mergeWithDefaults((data?.data ?? {}) as Partial<StrategyData>)
}

export async function upsertStrategy(client: SupabaseClient, userId: string, data: StrategyData): Promise<void> {
    const { error } = await client
        .from('strategy')
        .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

    if (error) throw error
}
