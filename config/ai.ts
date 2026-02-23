export const AI_RATE_LIMITS = { generation: 1, refinement: 3, analysis: 20 } as const

export const AI_ERROR_CODES = { RATE_LIMITED: 'RATE_LIMITED', AUTH_REQUIRED: 'AUTH_REQUIRED' } as const

export type Tone = 'professional' | 'casual' | 'inspirational' | 'educational' | 'storytelling' | 'humorous'

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'inspirational', label: 'Inspirational' },
    { value: 'educational', label: 'Educational' },
    { value: 'storytelling', label: 'Storytelling' },
    { value: 'humorous', label: 'Humorous' },
]
