# Wave 2: Content Strategy - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a content strategy system with a 7-step wizard, progress dashboard, and AI-generated weekly post ideas.

**Architecture:** New `strategy` Supabase table (JSONB, same pattern as `branding`). Wizard reads/writes both `branding` and `strategy` tables. Three new API routes for AI features. Single dashboard page at `/dashboard/strategy` with empty state, overview, monthly progress, and ideas sections.

**Tech Stack:** Next.js 16.1, React 19, Supabase (anonymous auth + RLS), Vercel AI SDK v6 + OpenAI, shadcn/ui, Tailwind CSS 4, Zod.

**Design doc:** `docs/plans/2026-03-05-wave2-content-strategy-design.md`

**Reference screenshots:** `references/screenshots/strategy/`

**No test runner configured.** Verify with `pnpm type-check` and `pnpm lint` (15s timeout).

---

## Task 1: Data Layer (types, migration, CRUD, hook)

**Files:**

- Create: `lib/strategy.ts`
- Create: `lib/supabase/strategy.ts`
- Create: `hooks/use-strategy.ts`
- Create: `supabase/migrations/007_strategy.sql`

### Step 1: Create `lib/strategy.ts`

Types, constants, and defaults. Follow the `lib/branding.ts` pattern.

```typescript
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
```

### Step 2: Create `supabase/migrations/007_strategy.sql`

Follow the pattern from `004_dashboard_data.sql`.

```sql
-- Strategy table (single row per user, JSONB data)
create table public.strategy (
    user_id     uuid primary key references auth.users(id) on delete cascade,
    data        jsonb not null default '{}',
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table public.strategy enable row level security;

create policy "Users can view own strategy" on public.strategy
    for select using (auth.uid() = user_id);
create policy "Users can upsert own strategy" on public.strategy
    for insert with check (auth.uid() = user_id);
create policy "Users can update own strategy" on public.strategy
    for update using (auth.uid() = user_id);
create policy "Users can delete own strategy" on public.strategy
    for delete using (auth.uid() = user_id);
```

**Apply to local Supabase** (or note for deployment): This migration needs to be run against the database.

### Step 3: Create `lib/supabase/strategy.ts`

Follow exact pattern of `lib/supabase/branding.ts`.

```typescript
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
```

### Step 4: Create `hooks/use-strategy.ts`

Follow exact pattern of `hooks/use-branding.ts`.

```typescript
'use client'

import * as React from 'react'
import { toast } from 'sonner'

import { DEFAULT_STRATEGY, type StrategyData } from '@/lib/strategy'
import { fetchStrategy, upsertStrategy } from '@/lib/supabase/strategy'
import { useAuth } from '@/components/dashboard/auth-provider'

export function useStrategy() {
    const { isReady, userId, supabase } = useAuth()
    const [strategy, setStrategy] = React.useState<StrategyData>(DEFAULT_STRATEGY)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        if (!isReady || !userId) return

        let cancelled = false
        setIsLoading(true)
        fetchStrategy(supabase)
            .then((data) => {
                if (!cancelled) {
                    setStrategy(data)
                    setIsLoading(false)
                }
            })
            .catch(() => {
                toast.error('Failed to load strategy')
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [isReady, userId, supabase])

    const updateStrategy = React.useCallback(
        (updates: Partial<StrategyData>) => {
            setStrategy((current) => {
                const updated = { ...current, ...updates }
                if (userId) {
                    upsertStrategy(supabase, userId, updated).catch(() => {
                        toast.error('Failed to save strategy')
                    })
                }
                return updated
            })
        },
        [supabase, userId],
    )

    return { strategy, isLoading, updateStrategy }
}
```

### Step 5: Update settings reset

**Modify:** `components/dashboard/settings-form.tsx`

Add after the `post_analyses` delete block:

```typescript
const { error: strategyError } = await supabase.from('strategy').delete().neq('user_id', '')
if (strategyError) throw strategyError
```

### Step 6: Verify and commit

```bash
pnpm type-check
pnpm lint
git add lib/strategy.ts lib/supabase/strategy.ts hooks/use-strategy.ts supabase/migrations/007_strategy.sql components/dashboard/settings-form.tsx
git commit -m "feat(strategy): add data layer - types, migration, CRUD, hook"
```

---

## Task 2: API Endpoints

**Files:**

- Create: `app/api/strategy/positioning/route.ts`
- Create: `app/api/strategy/positioning/route.schema.ts`
- Create: `app/api/strategy/formats/route.ts`
- Create: `app/api/strategy/formats/route.schema.ts`
- Create: `app/api/ideas/route.ts`
- Create: `app/api/ideas/route.schema.ts`
- Modify: `config/prompts.ts` (add strategy prompts)
- Modify: `config/ai.ts` (add `ideas` rate limit)
- Modify: `supabase/migrations/006_extend_ai_usage_actions.sql` (add `ideas` action)

### Step 1: Add rate limit for ideas

**Modify `config/ai.ts`:**

```typescript
export const AI_RATE_LIMITS = {
    generation: 1,
    refinement: 3,
    analysis: 20,
    wizard: 5,
    quickAction: 10,
    ideas: 3,
} as const
```

**Create new migration `supabase/migrations/008_add_ideas_action.sql`:**

```sql
alter table public.ai_usage drop constraint ai_usage_action_check;
alter table public.ai_usage add constraint ai_usage_action_check
    check (action in ('generation', 'refinement', 'analysis', 'wizard', 'quickAction', 'ideas'));
```

### Step 2: Add prompts to `config/prompts.ts`

Add these exports to the bottom of `config/prompts.ts`:

```typescript
// ---------------------------------------------------------------------------
// Strategy prompts
// ---------------------------------------------------------------------------

export const POSITIONING_SYSTEM_PROMPT = `You are a LinkedIn personal branding strategist. Generate a concise positioning statement based on the user's role, goals, audience, and expertise. The statement should follow the format: "I help [audience] [achieve outcome] by [method/expertise]". Keep it to 1-2 sentences, professional but approachable. Do not use em dashes.`

export function positioningUserPrompt(input: {
    role: string
    goals: string[]
    audience: string[]
    topics: string[]
}): string {
    return `Generate a positioning statement for:
- Role: ${input.role}
- Goals: ${input.goals.join(', ')}
- Target audience: ${input.audience.join(', ')}
- Areas of expertise: ${input.topics.join(', ')}`
}

export const STRATEGY_FORMATS_SYSTEM_PROMPT = `You are a LinkedIn content strategist. Based on the user's profile, suggest which content formats they should use. Enable formats that align with their goals and audience. Categorize each format. Return ALL formats with enabled true/false.`

export function strategyFormatsUserPrompt(input: {
    role: string
    goals: string[]
    audience: string[]
    topics: string[]
}): string {
    return `Suggest content formats for:
- Role: ${input.role}
- Goals: ${input.goals.join(', ')}
- Target audience: ${input.audience.join(', ')}
- Areas of expertise: ${input.topics.join(', ')}

Available formats: Personal Milestones, Mindset & Motivation, Career Before & After, Tool & Resource Insights, Case Studies, Actionable Guides, Culture Moments, Offer Highlight, Client Success Story

Categorize each as: personal, educational, organizational, or promotional.`
}

export const IDEAS_SYSTEM_PROMPT = `You are a LinkedIn content strategist. Generate post ideas that align with the user's content strategy and brand voice. Each idea should have a specific topic, a recommended format, a compelling one-line hook, and brief reasoning for why this idea fits their strategy. Hooks should be attention-grabbing first lines. Do not use em dashes. Vary the formats across ideas.`

export function ideasUserPrompt(input: {
    goals: string[]
    audience: string[]
    topics: string[]
    formats: string[]
    positioning: string
    recentTitles: string[]
}): string {
    return `Generate 5-7 LinkedIn post ideas for this creator:

Strategy:
- Goals: ${input.goals.join(', ')}
- Target audience: ${input.audience.join(', ')}
- Expertise: ${input.topics.join(', ')}
- Positioning: ${input.positioning}
- Active formats: ${input.formats.join(', ')}

${input.recentTitles.length > 0 ? `Recent posts (avoid repeating these topics):\n${input.recentTitles.map((t) => `- ${t}`).join('\n')}` : ''}`
}
```

### Step 3: Create positioning endpoint

**`app/api/strategy/positioning/route.schema.ts`:**

```typescript
import { z } from 'zod'

export const bodySchema = z.object({
    role: z.string().min(1),
    goals: z.array(z.string()).min(1).max(5),
    audience: z.array(z.string()).min(1).max(7),
    topics: z.array(z.string()).min(1).max(4),
})

export const positioningSchema = z.object({
    statement: z.string(),
})
```

**`app/api/strategy/positioning/route.ts`:**

Follow the exact pattern from `app/api/suggestions/route.ts`:

1. Parse JSON
2. Validate with `bodySchema`
3. Auth check via `createClient()` + `getUser()`
4. Rate limit with `checkRateLimit(supabase, 'quickAction')`
5. Call `generateObject` with `positioningSchema`, `POSITIONING_SYSTEM_PROMPT`, `positioningUserPrompt(parsed.data)`
6. Return `Response.json(object)`

`export const maxDuration = 30`

### Step 4: Create formats endpoint

**`app/api/strategy/formats/route.schema.ts`:**

```typescript
import { z } from 'zod'

export const bodySchema = z.object({
    role: z.string().min(1),
    goals: z.array(z.string()).min(1).max(5),
    audience: z.array(z.string()).min(1).max(7),
    topics: z.array(z.string()).min(1).max(4),
})

export const formatsSchema = z.object({
    formats: z.array(
        z.object({
            name: z.string(),
            enabled: z.boolean(),
            category: z.enum(['personal', 'educational', 'organizational', 'promotional']),
        }),
    ),
})
```

**`app/api/strategy/formats/route.ts`:** Same auth/rate-limit pattern. Uses `STRATEGY_FORMATS_SYSTEM_PROMPT` and `strategyFormatsUserPrompt`. Rate limit: `quickAction`.

### Step 5: Create ideas endpoint

**`app/api/ideas/route.schema.ts`:**

```typescript
import { z } from 'zod'

export const bodySchema = z.object({
    goals: z.array(z.string()),
    audience: z.array(z.string()),
    topics: z.array(z.string()),
    formats: z.array(z.string()),
    positioning: z.string(),
    recentTitles: z.array(z.string()).max(20),
})

export const ideasSchema = z.object({
    ideas: z
        .array(
            z.object({
                topic: z.string(),
                format: z.string(),
                hook: z.string(),
                reasoning: z.string(),
            }),
        )
        .min(5)
        .max(7),
})
```

**`app/api/ideas/route.ts`:** Same auth/rate-limit pattern. Uses `IDEAS_SYSTEM_PROMPT` and `ideasUserPrompt`. Rate limit: `ideas` (3/day).

### Step 6: Verify and commit

```bash
pnpm type-check
pnpm lint
git add app/api/strategy/ app/api/ideas/ config/prompts.ts config/ai.ts supabase/migrations/008_add_ideas_action.sql
git commit -m "feat(strategy): add API endpoints for positioning, formats, and ideas"
```

---

## Task 3: Strategy Wizard

**Files:**

- Create: `components/dashboard/strategy/strategy-wizard.tsx`
- Create: `components/dashboard/strategy/wizard-steps/role-step.tsx`
- Create: `components/dashboard/strategy/wizard-steps/goals-step.tsx`
- Create: `components/dashboard/strategy/wizard-steps/audience-step.tsx`
- Create: `components/dashboard/strategy/wizard-steps/expertise-step.tsx`
- Create: `components/dashboard/strategy/wizard-steps/frequency-step.tsx`
- Create: `components/dashboard/strategy/wizard-steps/positioning-step.tsx`
- Create: `components/dashboard/strategy/wizard-steps/formats-step.tsx`

### Design reference

Match Scribe's wizard UI closely (see `references/screenshots/strategy/`):

- Full-screen dialog (use `Dialog` from shadcn, `sm:max-w-3xl` or larger)
- Each step: centered content, large heading, subtitle, interactive controls
- Progress bar at the bottom (thin colored line showing completion percentage)
- Back button (bottom-left), Continue button (bottom-right)
- Cancel button (top-right)
- Clean, spacious layout with generous padding

### Step 1: Create step components

Each step component receives props and calls back on change. Pattern:

```typescript
type StepProps = {
    value: <step-specific-type>
    onChange: (value: <step-specific-type>) => void
}
```

**`role-step.tsx`:** Single-select card list. Cards are full-width rows with the role name. Selected card has a visible border/background. Uses `BRANDING_ROLES` or inline role options matching Scribe's screenshot (Founder/C-Level, Freelancer, Team Lead, Employee, Creator, Consultant, Agency).

**`goals-step.tsx`:** Multi-select chips (max 3). Each chip has an icon + label. Uses `STRATEGY_GOALS` from `lib/strategy.ts`. Selected chips get a distinct style (filled vs outline).

**`audience-step.tsx`:** Multi-select chips. Each chip has an icon + label. Uses `STRATEGY_AUDIENCES` from `lib/strategy.ts`.

**`expertise-step.tsx`:** 4 text inputs in a 2-column grid. Labels: "Topic 1 _", "Topic 2 _", "Topic 3", "Topic 4". Placeholder examples like Scribe: "e.g. Entrepreneurship", "e.g. Product Strategy", "e.g. B2B SaaS Growth", "e.g. Leadership".

**`frequency-step.tsx`:** Two parts:

1. Number picker: 7 large square buttons (1-7), selected one is filled/primary
2. Schedule grid: Table with columns TIME, MON-SUN. Each row is a time slot with a time input and day-of-week checkboxes. "+ Add Time Slot" button below.

**`positioning-step.tsx`:** Editable textarea with the positioning statement. On mount, if the statement is empty, calls `POST /api/strategy/positioning` to generate one (with loading state). "Edit Statement:" label above the textarea.

**`formats-step.tsx`:** Category filter tabs (All Selected, Personal, Educational, Organizational, Promotional). Below: list of format rows, each with icon + name + toggle switch. "Regenerate Suggestion" button calls `POST /api/strategy/formats`. "Save & Finish Strategy" replaces the normal Continue button on this step.

### Step 2: Create wizard orchestrator `strategy-wizard.tsx`

State management pattern (follows `creation-wizard.tsx`):

```typescript
type WizardStep = 'role' | 'goals' | 'audience' | 'expertise' | 'frequency' | 'positioning' | 'formats'

const STEPS: WizardStep[] = ['role', 'goals', 'audience', 'expertise', 'frequency', 'positioning', 'formats']
```

The wizard manages all form state internally:

- `role: BrandingRole` (pre-filled from `branding.role`)
- `goals: StrategyGoal[]`
- `audience: StrategyAudience[]`
- `topics: string[]` (pre-filled from `branding.expertise.topics`)
- `frequency: number`
- `schedule: ScheduleSlot[]`
- `positioning: string` (pre-filled from `branding.positioning.statement`)
- `formats: StrategyFormat[]`

Props:

```typescript
type StrategyWizardProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialBranding: BrandingData
    initialStrategy: StrategyData
    onComplete: (strategyData: StrategyData, brandingUpdates: Partial<BrandingData>) => void
}
```

On "Save & Finish Strategy":

1. Build `StrategyData` from wizard state (set `completedAt` to `new Date().toISOString()`)
2. Build `Partial<BrandingData>` with `{ role, expertise: { topics }, positioning: { statement: positioning } }`
3. Call `onComplete(strategyData, brandingUpdates)`

Validation per step:

- Role: must be selected
- Goals: at least 1 selected
- Audience: at least 1 selected
- Expertise: at least 2 topics filled
- Frequency: always valid (default 3)
- Positioning: non-empty string
- Formats: at least 1 enabled

### Step 3: Verify and commit

```bash
pnpm type-check
pnpm lint
git add components/dashboard/strategy/
git commit -m "feat(strategy): add 7-step strategy wizard"
```

---

## Task 4: Strategy Dashboard Page

**Files:**

- Create: `app/dashboard/strategy/page.tsx`
- Create: `components/dashboard/strategy/strategy-page.tsx`
- Create: `components/dashboard/strategy/strategy-empty.tsx`
- Create: `components/dashboard/strategy/strategy-dashboard.tsx`
- Create: `components/dashboard/strategy/overview-section.tsx`
- Create: `components/dashboard/strategy/progress-section.tsx`
- Create: `components/dashboard/strategy/activity-heatmap.tsx`
- Create: `components/dashboard/strategy/format-targets.tsx`
- Create: `components/dashboard/strategy/ideas-section.tsx`
- Create: `components/dashboard/strategy/idea-card.tsx`

### Step 1: Create page route

**`app/dashboard/strategy/page.tsx`:**

```typescript
import type { Metadata } from 'next'

import { PageHeader } from '@/components/dashboard/page-header'
import { StrategyPage } from '@/components/dashboard/strategy/strategy-page'

export const metadata: Metadata = { title: 'Content Strategy - LinkedInPreview.com' }

export default function StrategyPageRoute() {
    return <StrategyPage />
}
```

### Step 2: Create `strategy-page.tsx` (orchestrator)

Client component. Uses `useStrategy()`, `useBranding()`, `useDrafts()`. Renders:

- If `!strategy.completedAt`: `<StrategyEmpty onCreateStrategy={() => setWizardOpen(true)} />`
- Else: `<PageHeader title='Content Strategy' actions={<Button onClick={() => setWizardOpen(true)}>Edit Strategy</Button>} />` + `<StrategyDashboard strategy={strategy} branding={branding} drafts={drafts} />`

Always renders `<StrategyWizard>` (controlled by `wizardOpen` state). On wizard complete, calls `updateStrategy(strategyData)` and `updateBranding(brandingUpdates)`.

### Step 3: Create empty state

**`strategy-empty.tsx`:** Match Scribe's empty state screenshot. Centered layout with:

- CSS-only decorative rings (concentric colored circles using `border` + `rounded-full`)
- "Get Your Content Strategy" heading
- 3 bullets with icons (Sparkles, RefreshCw, BarChart3)
- Primary "Create new strategy" button

### Step 4: Create dashboard view

**`strategy-dashboard.tsx`:** Scrollable container with sections:

```tsx
<div className='flex-1 space-y-8 overflow-y-auto p-4 lg:p-6'>
    <OverviewSection strategy={strategy} branding={branding} />
    <div className='border-border border-t' />
    <ProgressSection strategy={strategy} drafts={drafts} />
    <div className='border-border border-t' />
    <IdeasSection strategy={strategy} branding={branding} drafts={drafts} onUpdateStrategy={onUpdateStrategy} />
</div>
```

### Step 5: Create overview section

**`overview-section.tsx`:** Row of cards (use CSS grid, `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`):

- Profile card: avatar + name from branding
- Purpose statement card: positioning text (from branding)
- Goals card: goal chips
- Audience + Topics card: audience chips + topic badges

Use `Card` from shadcn. Each card has a small label header and content below.

### Step 6: Create progress section

**`progress-section.tsx`:** "Monthly Progress: [Month Year]" header with arrow buttons for month navigation. State: `selectedMonth` (Date).

Three-column layout (`grid-cols-1 lg:grid-cols-3`):

1. **Activity Targets** card: compute `postsThisMonth` from drafts created in selected month. Target = `strategy.frequency * weeksInMonth`. Show as "X / Y posts". Below: category donut breakdown. Use a simple CSS pie chart or just colored bars.
2. **Format Targets** (`format-targets.tsx`): Per enabled format, show "Format Name X/Y" as a row with a small progress bar. Targets distributed proportionally.
3. **Monthly Activity** (`activity-heatmap.tsx`): 7-column grid (Sun-Sat). Each cell is a small square colored by intensity (0 posts = muted, 1 = light green, 2+ = dark green). Show the selected month's days laid out in a calendar grid.

All data computed from `drafts` filtered by `createdAt` in selected month.

### Step 7: Create ideas section

**`ideas-section.tsx`:** "Post Ideas" header + "Generate Ideas" button. Uses `strategy.weeklyIdeas`.

Logic:

- If `weeklyIdeas` is null or `weekOf` is not the current week's Monday: show empty state with "Generate Ideas" CTA
- If ideas exist for current week: render `IdeaCard` for each
- "Generate Ideas" calls `POST /api/ideas` with strategy data + branding positioning + recent draft titles
- On success: update strategy with new `weeklyIdeas` via `onUpdateStrategy`
- Loading state: skeleton cards while generating

**`idea-card.tsx`:** Card with:

- Topic as heading
- Format badge (colored by category)
- Hook text in quotes
- "Create Post" button that navigates to `/dashboard/editor` with the hook pre-filled (via creation wizard or direct draft creation)

### Step 8: Verify and commit

```bash
pnpm type-check
pnpm lint
git add app/dashboard/strategy/ components/dashboard/strategy/
git commit -m "feat(strategy): add strategy page with dashboard and ideas"
```

---

## Task 5: Sidebar Update + Integration

**Files:**

- Modify: `components/dashboard/dashboard-sidebar.tsx`

### Step 1: Enable Content Strategy link

In `dashboard-sidebar.tsx`, replace the disabled Content Strategy menu item:

```tsx
// Before (disabled):
<SidebarMenuItem>
    <SidebarMenuButton disabled tooltip='Content Strategy'>
        <TargetIcon />
        <span>Content Strategy</span>
    </SidebarMenuButton>
    <SidebarMenuBadge className='text-[10px] opacity-60'>Soon</SidebarMenuBadge>
</SidebarMenuItem>

// After (active):
<SidebarMenuItem>
    <SidebarMenuButton
        asChild
        isActive={isActive('/dashboard/strategy')}
        tooltip='Content Strategy'>
        <Link href='/dashboard/strategy'>
            <TargetIcon />
            <span>Content Strategy</span>
        </Link>
    </SidebarMenuButton>
</SidebarMenuItem>
```

### Step 2: Verify and commit

```bash
pnpm type-check
pnpm lint
git add components/dashboard/dashboard-sidebar.tsx
git commit -m "feat(strategy): enable Content Strategy in sidebar navigation"
```

---

## Task 6: Documentation Update

**Files:**

- Modify: `docs/ROADMAP.md` (mark Wave 2 as in progress)
- Modify: `docs/PRODUCT.md` (add strategy features as Live)
- Modify: `docs/ARCHITECTURE.md` (add strategy route + table)
- Modify: `docs/features/200-content-strategy-wizard.md` (check acceptance criteria)
- Modify: `docs/features/201-content-strategy-dashboard.md` (check acceptance criteria)
- Modify: `docs/features/202-weekly-ai-post-ideas.md` (check acceptance criteria)

Use the `update-docs` skill for this task. Update all feature specs to mark acceptance criteria as `[x]`. Update ROADMAP to mark Wave 2 as COMPLETE with status column. Update PRODUCT to change 200/201/202 from Planned to Live.

```bash
git add docs/
git commit -m "docs: update Wave 2 feature status and architecture"
```

---

## Task Dependencies

```
Task 1 (Data Layer) ──┬──> Task 3 (Wizard) ──┬──> Task 4 (Dashboard) ──> Task 5 (Sidebar)
                      │                       │                          │
Task 2 (API)    ──────┘                       └──────────────────────────┘
                                                                         │
                                                                         └──> Task 6 (Docs)
```

Tasks 1 and 2 can run in parallel. Task 3 needs Task 1 types. Task 4 needs Tasks 1-3. Task 5 is small. Task 6 runs last.

---

## Verification Checklist

After all tasks:

1. `pnpm type-check` passes
2. `pnpm lint` passes (15s timeout)
3. Strategy wizard opens from empty state and sidebar
4. All 7 wizard steps work with Back/Continue navigation
5. Wizard pre-fills from branding and syncs back on save
6. Strategy dashboard shows overview, progress, and ideas sections
7. Monthly progress computes from drafts data
8. AI endpoints return structured data (positioning, formats, ideas)
9. Settings reset clears strategy table
10. Sidebar shows active Content Strategy link
