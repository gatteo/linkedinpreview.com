import {
    BarChart3Icon,
    BriefcaseBusinessIcon,
    BriefcaseIcon,
    Building2Icon,
    BuildingIcon,
    CalendarDaysIcon,
    HelpCircleIcon,
    LandmarkIcon,
    LayoutGridIcon,
    LightbulbIcon,
    MegaphoneIcon,
    NewspaperIcon,
    SparklesIcon,
    TrendingUpIcon,
    UserCheckIcon,
    UserPlusIcon,
    UsersIcon,
    type LucideIcon,
} from 'lucide-react'

// Maps the string icon names used across the strategy/personalization config
// (STRATEGY_GOALS, STRATEGY_AUDIENCES, SPOTLIGHT_CONTENT, WELCOME_OPTIONS) to
// their lucide components so onboarding steps can render them through primitives.
const ICON_MAP: Record<string, LucideIcon> = {
    TrendingUp: TrendingUpIcon,
    Megaphone: MegaphoneIcon,
    Briefcase: BriefcaseIcon,
    BriefcaseBusiness: BriefcaseBusinessIcon,
    Building2: Building2Icon,
    Building: BuildingIcon,
    Newspaper: NewspaperIcon,
    Sparkles: SparklesIcon,
    Users: UsersIcon,
    UserPlus: UserPlusIcon,
    UserCheck: UserCheckIcon,
    Landmark: LandmarkIcon,
    HelpCircle: HelpCircleIcon,
    BarChart3: BarChart3Icon,
    CalendarDays: CalendarDaysIcon,
    LayoutGrid: LayoutGridIcon,
    Lightbulb: LightbulbIcon,
}

export function iconFor(name: string): LucideIcon {
    return ICON_MAP[name] ?? SparklesIcon
}
