# Wave 2: Content Strategy - Design

## Overview

Add a content strategy system to the dashboard: a multi-step wizard for defining goals/audience/frequency/formats, a dashboard page tracking monthly progress, and AI-generated weekly post ideas. Inspired by Scribe's strategy feature (see `references/screenshots/strategy/`).

## Data Model

### Principle: no duplication

Role, expertise topics, and positioning statement already live in the `branding` table. Strategy stores only strategy-specific fields. The wizard reads from branding to pre-fill overlapping steps and writes back to branding when changed.

### `strategy` Supabase table

```sql
CREATE TABLE public.strategy (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.strategy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own strategy" ON public.strategy
    FOR ALL USING (user_id = auth.uid());
```

### TypeScript schema (`lib/strategy.ts`)

```typescript
type StrategyGoal = 'revenue-growth' | 'company-awareness' | 'career-opportunities' | 'employer-branding' | 'media-pr'

type StrategyAudience =
    | 'new-clients'
    | 'existing-clients'
    | 'talents'
    | 'partners'
    | 'investors'
    | 'colleagues'
    | 'potential-employers'

type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

type ScheduleSlot = {
    time: string // HH:MM format
    days: DayOfWeek[] // which days this slot is active
}

type StrategyFormat = {
    name: string // matches POST_FORMATS values
    enabled: boolean
    category: 'personal' | 'educational' | 'organizational' | 'promotional'
}

type StrategyData = {
    goals: StrategyGoal[] // max 3
    audience: StrategyAudience[] // multi-select
    frequency: number // posts per week (1-7)
    schedule: ScheduleSlot[] // weekly time slots
    formats: StrategyFormat[] // toggleable content formats
    completedAt: string | null // ISO date when wizard finished
}

// Weekly ideas are stored alongside strategy
type PostIdea = {
    topic: string
    format: string // POST_FORMAT name
    hook: string // one-line hook
    reasoning: string // why this idea fits the strategy
}

type WeeklyIdeas = {
    ideas: PostIdea[]
    generatedAt: string // ISO date
    weekOf: string // ISO date of the Monday of the week
}
```

### Data flow between branding and strategy

The wizard touches both tables:

| Wizard step              | Reads from                       | Writes to                                           |
| ------------------------ | -------------------------------- | --------------------------------------------------- |
| 1. Role                  | `branding.role`                  | `branding.role`                                     |
| 2. Goals                 | -                                | `strategy.data.goals`                               |
| 3. Target Audience       | -                                | `strategy.data.audience`                            |
| 4. Areas of Expertise    | `branding.expertise.topics`      | `branding.expertise.topics`                         |
| 5. Frequency & Schedule  | -                                | `strategy.data.frequency`, `strategy.data.schedule` |
| 6. Positioning Statement | `branding.positioning.statement` | `branding.positioning.statement`                    |
| 7. Content Formats       | -                                | `strategy.data.formats`                             |

On wizard completion, a single save writes strategy data to `strategy` table and updated branding fields to `branding` table.

## Wizard UI

Full-screen dialog (like Scribe), 7 steps with a progress bar at the bottom.

### Step 1: Role

- "Tell us about your primary role"
- Single-select cards: Founder/C-Level, Freelancer, Team Lead, Employee, Creator, Consultant, Agency
- Pre-filled from branding.role if set

### Step 2: Goals

- "Choose your main goals" / "Select up to 3 goals"
- Multi-select chips with icons: Revenue Growth, Company Awareness, Career Opportunities, Employer Branding, More Media & PR

### Step 3: Target Audience

- "Choose your target audience" / "Who do you want to reach?"
- Multi-select chips with icons: New Clients, Existing Clients, Talents, Partners, Investors, Colleagues, Potential Employers

### Step 4: Areas of Expertise

- "What are your main areas of expertise?"
- "List up to 4 topics you know best. We use these to suggest relevant post ideas."
- 4 text inputs (first 2 required), with placeholder examples
- Pre-filled from branding.expertise.topics

### Step 5: Posting Frequency & Schedule

- "Set your posting frequency & schedule"
- Number picker (1-7 posts/week), large selectable number buttons
- Weekly schedule grid: time input + day-of-week checkboxes per row
- "+ Add Time Slot" button for multiple slots

### Step 6: Positioning Statement

- "Your Positioning Statement"
- "Review and refine your generated statement below. This will guide your content creation."
- AI-generated editable textarea
- Calls `POST /api/strategy/positioning` with role, goals, audience, topics
- Pre-filled from branding.positioning.statement if it exists (skip AI generation)
- User can edit freely

### Step 7: Content Formats

- "Suggested Content Strategy"
- "Edit the suggested post formats to your preferences."
- Category tabs: All Selected, Personal, Educational, Organizational, Promotional
- Toggleable format rows with icon, name, edit pencil, +/- buttons
- "Regenerate Suggestion" button calls `POST /api/strategy/formats`
- "Save & Finish Strategy" button saves everything

## Strategy Dashboard Page

Route: `/dashboard/strategy`

### Empty state (no strategy.completedAt)

Centered layout:

- Decorative circular illustration (CSS-only, colored rings)
- "Get Your Content Strategy" heading
- 3 benefit bullets with icons:
    - "Get AI-powered post suggestions tailored to your goals"
    - "Maintain consistent posting with smart scheduling"
    - "Keep track of your monthly progress"
- "Create new strategy" primary button (opens wizard)

### Strategy set (strategy.completedAt exists)

PageHeader: "Content Strategy" + "Edit Strategy" button (re-opens wizard pre-filled)

#### Overview section

Row of cards:

- **Profile card**: Avatar + name (from branding.profile)
- **Purpose Statement card**: positioning statement text with edit icon
- **Goals card**: goal chips
- **Audience card**: audience chips
- **Topics card**: expertise topic badges

#### Monthly Progress section

Header: "Monthly Progress: March 2026" with left/right arrows for month navigation.

Three columns:

1. **Activity Targets**: "X / Y posts" with category donut (Personal/Educational/Organizational/Promotional breakdown based on draft labels)
2. **Post Format Targets**: Per-format rows showing "format name: X/Y" based on enabled formats and frequency distribution
3. **Monthly Activity**: GitHub-style heatmap calendar grid (7 cols = days of week, rows = weeks of month). Color intensity based on number of posts created that day.

All metrics computed client-side from drafts data (filter by `createdAt` within the selected month, group by `label`).

Format targets are calculated by distributing the monthly target (frequency x ~4.3 weeks) proportionally across enabled formats.

#### Weekly Post Ideas section

Header: "Post Ideas" + "Generate Ideas" button

- Shows 5-7 AI-generated idea cards
- Each card: topic heading, format badge, one-line hook text, "Create Post" button
- "Create Post" opens the creation wizard with the hook pre-filled as notes
- Ideas stored in strategy JSONB under a `weeklyIdeas` key with `generatedAt` timestamp
- Auto-generates when visiting the section if no ideas exist for the current week
- "Generate Ideas" button for manual refresh (rate limited)
- Empty state: "Generate ideas to get AI-powered post suggestions based on your strategy"

## API Endpoints

### `POST /api/strategy/positioning`

Input: `{ role, goals, audience, topics }`
Output: `{ statement: string }`

Uses `generateObject` to create a positioning statement. Prompt instructs the model to write a concise "I help [audience] achieve [outcome] by [method]" statement based on the inputs.

Rate limit: `quickAction` (10/day).

### `POST /api/strategy/formats`

Input: `{ role, goals, audience, topics }`
Output: `{ formats: StrategyFormat[] }`

Uses `generateObject` to suggest which POST_FORMATS to enable, categorized into personal/educational/organizational/promotional. Returns all formats with `enabled: true/false`.

Rate limit: `quickAction` (10/day).

### `POST /api/ideas`

Input: `{ strategy, branding, recentDrafts }` (summaries, not full content)
Output: `{ ideas: PostIdea[] }`

Uses `generateObject` to produce 5-7 post ideas. Prompt includes strategy (goals, audience, formats), branding context, and titles of recent drafts (to avoid repetition).

Rate limit: new `ideas` limit (3/day).

## Sidebar Changes

- Enable "Content Strategy" link in Personalization section (remove `disabled`, remove "Soon" badge)
- Point to `/dashboard/strategy`
- Active state: `isActive('/dashboard/strategy')`

## File Structure

```
app/dashboard/strategy/page.tsx
app/api/strategy/positioning/route.ts
app/api/strategy/formats/route.ts
app/api/ideas/route.ts
components/dashboard/strategy/
    strategy-page.tsx          # orchestrator (empty state vs dashboard)
    strategy-wizard.tsx        # full-screen wizard dialog
    wizard-steps/
        role-step.tsx
        goals-step.tsx
        audience-step.tsx
        expertise-step.tsx
        frequency-step.tsx
        positioning-step.tsx
        formats-step.tsx
    strategy-dashboard.tsx     # the dashboard view
    overview-section.tsx
    progress-section.tsx
    activity-heatmap.tsx
    format-targets.tsx
    ideas-section.tsx
    idea-card.tsx
lib/strategy.ts               # types, defaults, constants
lib/supabase/strategy.ts      # CRUD (fetchStrategy, upsertStrategy)
hooks/use-strategy.ts          # React hook
config/prompts.ts              # add strategy-related prompts
supabase/migrations/006_strategy.sql
```

## Settings Reset

Add `strategy` table to the reset logic in `settings-form.tsx` alongside drafts/branding/post_analyses.
