// ---------------------------------------------------------------------------
// Strategy schema
// ---------------------------------------------------------------------------

export type StrategyGoal =
    | 'revenue-growth'
    | 'company-awareness'
    | 'career-opportunities'
    | 'employer-branding'
    | 'media-pr'

export type StrategyAudience =
    | 'new-clients'
    | 'existing-clients'
    | 'talents'
    | 'partners'
    | 'investors'
    | 'colleagues'
    | 'potential-employers'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type ScheduleSlot = {
    time: string // HH:MM
    days: DayOfWeek[]
}

export type FormatCategory = 'personal' | 'educational' | 'organizational' | 'promotional'

export type StrategyFormat = {
    name: string
    enabled: boolean
    category: FormatCategory
}

export type PostIdea = {
    topic: string
    format: string
    hook: string
    reasoning: string
}

export type WeeklyIdeas = {
    ideas: PostIdea[]
    generatedAt: string
    weekOf: string
}

export type StrategyData = {
    goals: StrategyGoal[]
    audience: StrategyAudience[]
    frequency: number
    schedule: ScheduleSlot[]
    formats: StrategyFormat[]
    weeklyIdeas: WeeklyIdeas | null
    completedAt: string | null
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STRATEGY_GOALS: { value: StrategyGoal; label: string; icon: string }[] = [
    { value: 'revenue-growth', label: 'Revenue Growth', icon: 'TrendingUp' },
    { value: 'company-awareness', label: 'Company Awareness', icon: 'Megaphone' },
    { value: 'career-opportunities', label: 'Career Opportunities', icon: 'Briefcase' },
    { value: 'employer-branding', label: 'Employer Branding', icon: 'Building2' },
    { value: 'media-pr', label: 'More Media & PR', icon: 'Newspaper' },
]

export const STRATEGY_AUDIENCES: { value: StrategyAudience; label: string; icon: string }[] = [
    { value: 'new-clients', label: 'New Clients', icon: 'UserPlus' },
    { value: 'existing-clients', label: 'Existing Clients', icon: 'Users' },
    { value: 'talents', label: 'Talents', icon: 'Sparkles' },
    { value: 'partners', label: 'Partners', icon: 'Building' },
    { value: 'investors', label: 'Investors', icon: 'Landmark' },
    { value: 'colleagues', label: 'Colleagues', icon: 'UserCheck' },
    { value: 'potential-employers', label: 'Potential Employers', icon: 'BriefcaseBusiness' },
]

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' },
]

// Map each POST_FORMAT to a category
export const FORMAT_CATEGORIES: Record<string, FormatCategory> = {
    'Personal Milestones': 'personal',
    'Mindset & Motivation': 'personal',
    'Career Before & After': 'personal',
    'Tool & Resource Insights': 'educational',
    'Case Studies': 'educational',
    'Actionable Guides': 'educational',
    'Culture Moments': 'organizational',
    'Offer Highlight': 'promotional',
    'Client Success Story': 'promotional',
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_STRATEGY: StrategyData = {
    goals: [],
    audience: [],
    frequency: 3,
    schedule: [{ time: '09:00', days: ['mon', 'wed', 'fri'] }],
    formats: [],
    weeklyIdeas: null,
    completedAt: null,
}
