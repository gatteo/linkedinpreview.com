# Wave 1: Smart Content Creation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the dashboard into an intelligent content creation platform with a multi-step creation wizard, AI analysis/scoring, quick AI actions, and post labels.

**Architecture:** Two main surfaces sharing a unified `/api/generate` backend. The creation wizard (modal) handles "zero to draft" via source input, hook selection, and variant picking. The editor enhancements (right panel tabs + toolbar) handle "draft to polished" via analysis scores, suggestions, and quick AI actions. All generation uses branding context for personalization.

**Tech Stack:** Next.js 16.1, React 19, Vercel AI SDK v6 (`generateObject`), OpenAI (gpt-4o-mini), Supabase (auth + storage), TipTap (editor), Tailwind CSS 4, shadcn/ui, Zod, `pdf-parse`, `mammoth`, `@mozilla/readability`, `linkedom`.

**Design doc:** `docs/plans/2026-03-02-wave1-smart-content-creation-design.md`

---

## Task 1: Install dependencies + DB migration + label type updates

**Files:**

- Modify: `package.json`
- Create: `supabase/migrations/005_add_labels.sql`
- Modify: `lib/drafts.ts`
- Modify: `lib/supabase/drafts.ts`
- Modify: `hooks/use-drafts.ts`
- Modify: `config/ai.ts`

**Step 1: Install new dependencies**

```bash
pnpm add pdf-parse mammoth @mozilla/readability linkedom
pnpm add -D @types/pdf-parse
```

**Step 2: Create DB migration for labels**

Create `supabase/migrations/005_add_labels.sql`:

```sql
alter table public.drafts add column label text;
```

Note: User must apply this migration to their Supabase instance manually.

**Step 3: Update draft types**

In `lib/drafts.ts`, add `label` to `DraftManifestEntry`:

```typescript
export interface DraftManifestEntry {
    id: string
    title: string
    status: DraftStatus
    label: string | null // <-- add this
    createdAt: number
    updatedAt: number
    charCount: number
    wordCount: number
}
```

Also add the `POST_LABELS` constant:

```typescript
export const POST_LABELS = [
    'Personal Milestones',
    'Mindset & Motivation',
    'Career Before & After',
    'Tool & Resource Insights',
    'Case Studies',
    'Actionable Guides',
    'Culture Moments',
    'Offer Highlight',
    'Client Success Story',
] as const

export type PostLabel = (typeof POST_LABELS)[number]
```

**Step 4: Update Supabase drafts data layer**

In `lib/supabase/drafts.ts`:

- Add `label` to the `mapRow` function (maps `row.label` to `entry.label`)
- Add `label` to `updateDraft` function's `updates` parameter type
- Add `label` to `createDraft` function (optional param, defaults to null)
- Include `label` in all SELECT queries

**Step 5: Update use-drafts hook**

In `hooks/use-drafts.ts`:

- Add `label` to the `updateDraft` function's `updates` type: `{ content?: any; media?: any; status?: DraftStatus; label?: string | null }`

**Step 6: Update AI rate limits config**

In `config/ai.ts`, add new rate limits:

```typescript
export const AI_RATE_LIMITS = {
    generation: 1,
    refinement: 3,
    analysis: 20,
    wizard: 5, // <-- add: creation wizard generations/day
    quickAction: 10, // <-- add: editor quick actions/day
} as const
```

**Step 7: Commit**

```bash
git add -A && git commit -m "feat: add label support, new deps, rate limits for wave 1"
```

---

## Task 2: Branding context utility + /api/generate endpoint

**Files:**

- Create: `lib/ai-branding.ts`
- Create: `app/api/generate/route.ts`

**Step 1: Create branding context assembly**

Create `lib/ai-branding.ts`:

```typescript
import { type BrandingData } from '@/lib/branding'

export function assembleBrandingContext(branding: BrandingData): string {
    const parts: string[] = []

    if (branding.name) parts.push(`Author: ${branding.name}`)
    if (branding.role) parts.push(`Role: ${branding.role}`)
    if (branding.positioning) parts.push(`Positioning: ${branding.positioning}`)
    if (branding.expertise?.length) parts.push(`Expertise: ${branding.expertise.filter(Boolean).join(', ')}`)

    const style: string[] = []
    if (branding.language) style.push(`Language: ${branding.language}`)
    if (branding.sentenceLength) style.push(`Sentence length: ${branding.sentenceLength}`)
    if (branding.postLength) style.push(`Post length: ${branding.postLength}`)
    if (branding.emojiFrequency) style.push(`Emoji usage: ${branding.emojiFrequency}`)
    if (style.length) parts.push(`Writing style: ${style.join(', ')}`)

    if (branding.dos) parts.push(`Do's: ${branding.dos}`)
    if (branding.donts) parts.push(`Don'ts: ${branding.donts}`)
    if (branding.footer && branding.footerEnabled) parts.push(`Always append this footer:\n${branding.footer}`)

    return parts.join('\n')
}
```

Read `lib/branding.ts` to verify the exact field names on `BrandingData` before implementing. The function should reference only fields that actually exist.

**Step 2: Create /api/generate endpoint**

Create `app/api/generate/route.ts`. This is the unified generation endpoint. Key points:

- Uses `generateObject` from `ai` package (not streaming)
- Validates request with Zod
- Requires auth via `supabase.auth.getUser()`
- Rate limits: `wizard` for hooks/posts actions, `quickAction` for variation/shorten/lengthen/restyle/apply-suggestion
- Uses OpenAI model from env

Action types and their behavior:

| Action             | Input                                       | Output                                          | Rate limit  |
| ------------------ | ------------------------------------------- | ----------------------------------------------- | ----------- |
| `hooks`            | `sourceText`, `brandingContext`             | `hooks[]` (4 items with text, category, type)   | wizard      |
| `posts`            | `sourceText`, `hook`, `brandingContext`     | `posts[]` (2 items with text, wordCount, label) | wizard      |
| `variation`        | `postText`, `brandingContext`               | `result` (string)                               | quickAction |
| `shorten`          | `postText`, `brandingContext`               | `result` (string)                               | quickAction |
| `lengthen`         | `postText`, `brandingContext`               | `result` (string)                               | quickAction |
| `restyle`          | `postText`, `tone`, `brandingContext`       | `result` (string)                               | quickAction |
| `apply-suggestion` | `postText`, `suggestion`, `brandingContext` | `result` (string)                               | quickAction |

Response Zod schemas:

- hooks: `z.object({ hooks: z.array(z.object({ text: z.string(), category: z.string(), type: z.string() })).length(4) })`
- posts: `z.object({ posts: z.array(z.object({ text: z.string(), wordCount: z.number(), label: z.string().optional() })).length(2) })`
- single result: `z.object({ result: z.string() })`

System prompts should be specific to each action. For hooks: "Generate 4 LinkedIn post hooks..." For posts: "Write 2 LinkedIn post variants using this hook..." For quick actions: "Rewrite this LinkedIn post to be shorter/longer/etc..."

All prompts include the branding context and the standard formatting rules (bold, italic, no em dashes, etc.) from the existing chat endpoint.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add branding context utility and /api/generate endpoint"
```

---

## Task 3: /api/extract endpoint (file + URL content extraction)

**Files:**

- Create: `app/api/extract/route.ts`

**Step 1: Create /api/extract endpoint**

Create `app/api/extract/route.ts`. Two modes:

**URL mode** (JSON body `{ url: string }`):

- Validates URL format with Zod
- Fetches URL content server-side with `fetch()` (5s timeout)
- Parses HTML with `linkedom` (`parseHTML`)
- Extracts article content with `@mozilla/readability` (`Readability`)
- Returns `{ text: string, title?: string }`
- Truncates text to 10,000 chars

**File mode** (multipart FormData with `file` field):

- Accepts PDF, DOCX, TXT, MD files (max 5MB)
- For PDF: use `pdf-parse` to extract text
- For DOCX: use `mammoth` to convert to text (`mammoth.extractRawText()`)
- For TXT/MD: read as UTF-8 text
- Returns `{ text: string, title?: string }` (title from filename)
- Truncates text to 10,000 chars

Auth required (same pattern as other endpoints). No rate limiting on extraction itself.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add /api/extract endpoint for file and URL content extraction"
```

---

## Task 4: Enhanced /api/suggestions endpoint

**Files:**

- Modify: `app/api/suggestions/route.ts`

**Step 1: Enhance suggestions response**

Update the suggestions endpoint to return richer suggestions with a `type` field. Change the Zod output schema:

```typescript
// Old
z.object({ suggestions: z.array(z.string()).length(3) })

// New
z.object({
    suggestions: z
        .array(
            z.object({
                text: z.string(),
                type: z.enum(['content', 'structure', 'tone', 'engagement']),
            }),
        )
        .length(3),
})
```

Update the system prompt to instruct the AI to return objects with `text` and `type` instead of plain strings. Each suggestion should be 4-8 words starting with a verb, and the type should categorize the suggestion.

Update `lib/ai-suggestions.ts` to match the new response shape:

```typescript
export interface Suggestion {
    text: string
    type: 'content' | 'structure' | 'tone' | 'engagement'
}

export async function fetchSuggestions(postText: string): Promise<Suggestion[]> {
    // ...same fetch logic but return Suggestion[] instead of string[]
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: enhance suggestions endpoint with typed categories"
```

---

## Task 5: Client-side content scoring utility

**Files:**

- Create: `lib/content-scoring.ts`

**Step 1: Create content scoring module**

Create `lib/content-scoring.ts` with pure client-side scoring functions:

```typescript
export interface ContentStats {
    charCount: number
    wordCount: number
    sentenceCount: number
    readabilityGrade: number // Flesch-Kincaid grade level
    readabilityLabel: string // 'Easy' | 'Standard' | 'Complex'
    sentenceDistribution: {
        tiny: number // 1-5 words (percentage)
        short: number // 6-10 words
        medium: number // 11-20 words
        long: number // 21-30 words
        veryLong: number // 31+ words
    }
    hashtagCount: number
    recommendedHashtags: string // '3-5 recommended'
    lengthStatus: 'too_short' | 'optimal' | 'too_long'
    lineCount: number
    emojiCount: number
}

export function computeContentStats(text: string): ContentStats
```

Implementation notes:

- Flesch-Kincaid: `0.39 * (words/sentences) + 11.8 * (syllables/words) - 15.59`
- Syllable counting: simple heuristic (count vowel groups, handle silent-e)
- Sentence splitting: split on `.!?` followed by space or end
- Hashtag counting: regex `/#\w+/g`
- Length status: < 100 chars = too_short, > 3000 = too_long, else optimal
- Emoji counting: regex for emoji Unicode ranges

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add client-side content scoring utility"
```

---

## Task 6: Creation wizard - source picker + notes input

**Files:**

- Create: `components/dashboard/creation-wizard/creation-wizard.tsx`
- Create: `components/dashboard/creation-wizard/source-picker.tsx`
- Create: `components/dashboard/creation-wizard/notes-input.tsx`
- Modify: `components/dashboard/dashboard-sidebar.tsx` (wire up wizard)

**Step 1: Create the wizard shell**

Create `creation-wizard.tsx` - the main component managing wizard state:

```typescript
type WizardStep = 'source' | 'input' | 'hooks' | 'variants'
type SourceType = 'notes' | 'voice' | 'file' | 'url'

interface WizardState {
    step: WizardStep
    source: SourceType | null
    sourceText: string
    selectedHook: string | null
    hooks: Array<{ text: string; category: string; type: string }>
    variants: Array<{ text: string; wordCount: number; label?: string }>
    isGenerating: boolean
}
```

Uses a `Dialog` from shadcn/ui. Steps are rendered conditionally based on `state.step`. The wizard fetches branding via `useBranding()` and assembles context via `assembleBrandingContext()`.

Navigation: Back button on steps 2-4. Close button always. Step indicator at top ("Step 1 of 3").

**Step 2: Create source picker**

Create `source-picker.tsx` - renders the 5 source options (same icons as current `new-post-dialog.tsx`). Blank immediately creates draft + navigates. Others set `source` and advance to `input` step.

**Step 3: Create notes input**

Create `notes-input.tsx` - textarea with max 5000 chars, character counter, and "Generate" button. Calls parent's `onSubmit(text)` callback.

**Step 4: Wire up wizard in sidebar**

In `dashboard-sidebar.tsx`, replace the `NewPostDialog` import/usage with `CreationWizard`. The "New Post" button opens the wizard instead.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: creation wizard shell with source picker and notes input"
```

---

## Task 7: Creation wizard - voice, file, URL inputs

**Files:**

- Create: `components/dashboard/creation-wizard/voice-input.tsx`
- Create: `components/dashboard/creation-wizard/file-input.tsx`
- Create: `components/dashboard/creation-wizard/url-input.tsx`

**Step 1: Create voice input**

Create `voice-input.tsx` using the Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`):

- Check browser support on mount. Show fallback message if unsupported.
- Record button toggles listening. Show real-time transcript.
- On stop, finalize transcript text.
- "Use this text" button passes transcript to parent's `onSubmit(text)`.
- Visual: microphone icon, recording indicator (pulsing dot), transcript area.

**Step 2: Create file input**

Create `file-input.tsx`:

- Dropzone (click or drag) accepting `.pdf`, `.docx`, `.txt`, `.md` (max 5MB).
- On file select: for TXT/MD read client-side with `FileReader`. For PDF/DOCX, send to `/api/extract` as FormData.
- Show loading spinner during extraction.
- Show extracted text in a readonly textarea for confirmation.
- "Use this text" button passes extracted text to parent.

**Step 3: Create URL input**

Create `url-input.tsx`:

- URL input field with validation.
- "Extract" button sends `{ url }` to `/api/extract`.
- Show loading spinner during extraction.
- Show extracted title + text in readonly textarea for confirmation.
- "Use this text" button passes extracted text to parent.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add voice, file, and URL input components for creation wizard"
```

---

## Task 8: Creation wizard - hook picker + variant picker

**Files:**

- Create: `components/dashboard/creation-wizard/hook-picker.tsx`
- Create: `components/dashboard/creation-wizard/variant-picker.tsx`
- Modify: `components/dashboard/creation-wizard/creation-wizard.tsx` (wire up API calls + all steps)

**Step 1: Create hook picker**

Create `hook-picker.tsx`:

- Receives `hooks` array as prop (4 items, each with `text`, `category`, `type`).
- Radio button list. Each option shows hook text + two badges (category, type).
- "Write my own" option at bottom with inline textarea.
- "Regenerate" button (calls parent callback to fetch new hooks).
- "Next" button (disabled until selection made).

**Step 2: Create variant picker**

Create `variant-picker.tsx`:

- Receives `variants` array as prop (2 items, each with `text`, `wordCount`, `label`).
- Two cards side-by-side (stacked on mobile). Each shows:
    - Full post text in a scrollable area (max-h-72)
    - Word count badge
    - Suggested label badge
    - "Use this" button
- Clicking "Use this" calls parent's `onSelect(variant)` callback.

**Step 3: Wire up the full wizard flow**

In `creation-wizard.tsx`, implement the API integration:

1. After source input submitted: call `/api/generate` with `action: 'hooks'`, `sourceText`, `brandingContext`. Show loading. On success, set hooks and advance to hooks step.
2. After hook selected: call `/api/generate` with `action: 'posts'`, `sourceText`, `hook`, `brandingContext`. Show loading. On success, set variants and advance to variants step.
3. After variant selected: call `createDraft(initialContent)` from `useDrafts()`, set label, navigate to editor.

Handle errors with `toast.error()`. Handle rate limits by showing remaining count.

**Step 4: Remove old NewPostDialog**

Delete `components/dashboard/new-post-dialog.tsx` or repurpose it. Update all imports.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: complete creation wizard with hooks and variant pickers"
```

---

## Task 9: Editor - tabbed right panel (Preview + Analyze)

**Files:**

- Create: `components/dashboard/analyze-panel.tsx`
- Modify: `components/dashboard/dashboard-editor.tsx`

**Step 1: Create the analyze panel**

Create `analyze-panel.tsx`:

**Props:**

```typescript
interface AnalyzePanelProps {
    content: any // TipTap JSON
    contentText: string // Plain text version
    onApplySuggestion: (newText: string) => void
}
```

**Sections:**

_Scores section:_

- Overall score: circular progress gauge (0-100). Use a simple SVG circle with stroke-dashoffset.
- Color: red (< 40), yellow (40-70), green (> 70).
- Sub-scores as horizontal bars: Hook score, Readability score, CTA score. Each shows label + score + colored bar.
- Badges: category, sentiment.

_Suggestions section:_

- Fetches suggestions from `/api/suggestions` (enhanced endpoint).
- Each suggestion: text + type badge + "Apply" button.
- "Apply" calls `/api/generate` with `action: 'apply-suggestion'`, `postText`, `suggestion`. On success, calls `onApplySuggestion(result)`.
- Loading state while applying.

_Stats section:_

- Uses `computeContentStats()` from `lib/content-scoring.ts`.
- Displays all stats: readability grade, sentence distribution (mini bar chart), hashtag count, length indicator.
- Always up-to-date (recomputed on content change).

**Analysis trigger:**

- Auto-analyze when tab is activated and content has changed since last analysis.
- "Re-analyze" button to manually trigger.
- Cache results until content changes (compare content hash).

**Step 2: Modify dashboard-editor.tsx**

Transform the right panel from a single `PreviewPanel` to a tabbed interface:

- Add tab state: `'preview' | 'analyze'`
- Render tab buttons at the top of the right panel: `[Preview] [Analyze]`
- Conditionally render `PreviewPanel` or `AnalyzePanel` based on active tab.
- Track `contentText` state alongside `content` (extract plain text from TipTap JSON for analyze panel).

The desktop layout becomes:

```tsx
<Group orientation='horizontal' ...>
    <Panel defaultSize='50%' ...>
        <EditorPanel ... />
    </Panel>
    <ResizeHandle />
    <Panel defaultSize='50%' ...>
        <div className='flex h-full flex-col'>
            <div className='flex border-b'>
                <TabButton active={tab === 'preview'}>Preview</TabButton>
                <TabButton active={tab === 'analyze'}>Analyze</TabButton>
            </div>
            {tab === 'preview' ? <PreviewPanel ... /> : <AnalyzePanel ... />}
        </div>
    </Panel>
</Group>
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Analyze tab with scoring, suggestions, and stats"
```

---

## Task 10: Editor - quick AI actions toolbar

**Files:**

- Create: `components/dashboard/ai-actions.tsx`
- Modify: `components/dashboard/dashboard-editor.tsx`

**Step 1: Create AI actions toolbar**

Create `ai-actions.tsx`:

**Props:**

```typescript
interface AIActionsProps {
    postText: string
    brandingContext: string
    onResult: (newText: string) => void
    disabled?: boolean
}
```

**UI:** A horizontal row of small buttons:

- Style (dropdown: 6 tone options from `TONE_OPTIONS`)
- Hook (button: opens hook picker in a popover)
- Shorter (button)
- Longer (button)
- Variation (button)

Each button calls `/api/generate` with the appropriate action. Shows loading spinner on the active button. On success, calls `onResult(text)`. On error, shows toast.

For "Hook": opens a small popover/dialog that calls `/api/generate` with `action: 'hooks'` using the current post text as `sourceText`. Shows 4 hooks. User picks one, which replaces the first paragraph of the post.

**Step 2: Integrate into dashboard-editor.tsx**

Add `AIActions` component between the editor and the media/share bar. Pass `postText` (extracted from content state), `brandingContext` (from branding hook), and `onResult` callback that updates the editor content.

The `onResult` callback should:

1. Create a new TipTap-compatible JSON from the returned plain text
2. Set it as the editor content via `editor.commands.setContent()`
3. This preserves undo history (TipTap tracks command-based changes)

Note: The `EditorPanel` doesn't currently expose the editor instance. You'll need to either:

- Add a `ref` to `EditorPanel` that exposes `setContent(text)`, OR
- Lift the "replace content" logic into `dashboard-editor.tsx` by passing a callback to `EditorPanel`

Read `components/tool/editor-panel.tsx` to understand how to best integrate this.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add quick AI actions toolbar to editor"
```

---

## Task 11: Label picker + posts table integration

**Files:**

- Create: `components/dashboard/label-picker.tsx`
- Modify: `components/dashboard/posts-table.tsx`
- Modify: `components/dashboard/posts-list.tsx`
- Modify: `components/dashboard/dashboard-editor.tsx`

**Step 1: Create label picker**

Create `label-picker.tsx`:

```typescript
interface LabelPickerProps {
    value: string | null
    onChange: (label: string | null) => void
}
```

Uses a `Select` from shadcn/ui. Options: all `POST_LABELS` items + "None" (sets null). Shows colored badge preview for each option.

**Step 2: Add label column to posts table**

In `posts-table.tsx`, add a "Label" column after "Status":

- Shows colored badge with label text
- "No label" in muted text if null

**Step 3: Add label filter to posts list**

In `posts-list.tsx`, add label filter alongside the existing status filter. Could be a dropdown or a second row of filter pills.

**Step 4: Add label picker to editor**

In `dashboard-editor.tsx`, add `LabelPicker` in the header area (near the page title). Uses `updateDraft(draftId, { label })` to persist.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add post labels with picker, table column, and filters"
```

---

## Task 12: Polish, lint, build, and verify

**Files:**

- All modified files

**Step 1: Run lint and fix**

```bash
pnpm lint:fix
pnpm lint
```

Fix any remaining errors. Warnings from `useReactTable` are pre-existing and can be ignored.

**Step 2: Run build**

```bash
pnpm clean && pnpm build
```

Fix any build errors.

**Step 3: Manual verification checklist**

- [ ] "New Post" button opens creation wizard
- [ ] Blank option creates draft and opens editor
- [ ] Notes input accepts text, generates hooks
- [ ] Voice input records and transcribes (Chrome/Edge)
- [ ] File input extracts text from PDF/DOCX/TXT
- [ ] URL input extracts article content
- [ ] Hook picker shows 4 options with badges
- [ ] Regenerate produces new hooks
- [ ] Variant picker shows 2 post options
- [ ] Selecting variant creates draft and opens editor
- [ ] Analyze tab shows scores and suggestions
- [ ] "Apply" on a suggestion modifies editor content
- [ ] Stats section shows readability, sentence distribution, etc.
- [ ] Quick actions (shorter/longer/variation/style) work
- [ ] Label picker in editor saves label
- [ ] Labels show in posts table
- [ ] All errors show as toasts (no console.error)
- [ ] Rate limits work correctly

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: polish wave 1 - lint fixes and build verification"
```

---

## Parallelism Guide

Tasks that can run in parallel (no dependencies between them):

| Group | Tasks      | Description                                                           |
| ----- | ---------- | --------------------------------------------------------------------- |
| A     | 1          | Foundation (must run first)                                           |
| B     | 2, 3, 4, 5 | Backend endpoints + utilities (all independent after Task 1)          |
| C     | 6, 7       | Wizard input components (independent of each other, depend on Task 1) |
| D     | 8          | Wizard flow integration (depends on Tasks 2, 6, 7)                    |
| E     | 9, 10, 11  | Editor enhancements (depend on Tasks 2, 4, 5)                         |
| F     | 12         | Polish (depends on everything)                                        |

Optimal execution: A -> [B + C in parallel] -> [D + E in parallel] -> F
