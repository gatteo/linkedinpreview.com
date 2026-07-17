# Wave 1: Smart Content Creation - Design Document

> Approved: 2026-03-02

## Overview

Wave 1 transforms the dashboard from a basic editor into an intelligent content creation platform. Two main surfaces:

1. **Creation Wizard** (modal) - Guides users from raw input to a polished draft
2. **Editor Enhancements** - AI-powered analysis, suggestions, and quick actions for refining drafts

## Features

- 1.1 AI-powered post generation from any source (notes, voice, file, URL)
- 1.2 AI hook suggestion (4 options, user picks one)
- 1.3 Content scoring panel (readability, writing flow, length, hashtags)
- 1.4 Smart suggestions (Analyze tab with scoring + actionable suggestions)
- 1.5 Quick AI actions (shorter, longer, variation, style, hook)
- 1.6 Post labels (format categorization)

---

## 1. Creation Wizard (1.1 + 1.2)

### Flow

The "New Post" button opens a multi-step modal dialog replacing the current `NewPostDialog`.

**Step 1 - Choose Source & Input**

Five input options displayed as a list:

- **Blank**: Immediately creates a draft and opens the editor (existing behavior).
- **Notes**: Textarea (max 5000 chars). User pastes rough ideas, bullet points, anything.
- **Voice**: Browser recorder using Web Speech API. Shows real-time transcript. User speaks, sees text appear, clicks "Done". Fallback message if browser doesn't support `webkitSpeechRecognition`.
- **File**: Dropzone accepting PDF, DOCX, TXT, MD (max 5MB). Extracts text client-side for TXT/MD, server-side for PDF/DOCX. Shows extracted text for user confirmation.
- **URL**: URL input field. Server fetches and extracts article content. Shows extracted text for confirmation.

Selecting a non-blank option transitions within the same modal to the input form for that source. After entering input, user clicks "Generate" which sends source text + branding context to the API.

**Step 2 - Pick a Hook**

AI returns 4 hook options. Each shows:

- Hook text (1-2 lines)
- Category badge (e.g., "Personal", "Educational")
- Type badge (e.g., "Storytelling", "Actionable")

User selects one via radio buttons. Additional options:

- "Regenerate" button for 4 new hooks
- "Write my own" option with inline text input

**Step 3 - Pick a Variant**

AI generates 2 full post variants using the chosen hook + source material + branding context. Each variant shows:

- Full post text (scrollable, max ~300px height)
- Word count badge
- "Use this" button

User picks one. The selected post is saved as a new draft (with AI-suggested label) and the editor opens with it.

### Components

```
components/dashboard/
  creation-wizard/
    creation-wizard.tsx       # Main modal with step state machine
    source-picker.tsx         # Step 1 - source selection grid
    notes-input.tsx           # Notes textarea input
    voice-input.tsx           # Voice recorder with Web Speech API
    file-input.tsx            # File dropzone with extraction
    url-input.tsx             # URL input with extraction
    hook-picker.tsx           # Step 2 - hook selection
    variant-picker.tsx        # Step 3 - variant selection
```

---

## 2. API Endpoints

### POST /api/generate

Unified generation endpoint for all AI creation and editing actions.

```ts
// Request
{
  action: 'hooks' | 'posts' | 'variation' | 'shorten' | 'lengthen' | 'restyle' | 'apply-suggestion'
  sourceText?: string        // raw input from wizard step 1
  hook?: string              // chosen hook (for 'posts' action)
  postText?: string          // existing post (for editor quick actions)
  tone?: string              // from branding or explicit selection
  style?: string             // for 'restyle' action
  suggestion?: string        // for 'apply-suggestion' action
  brandingContext?: string   // assembled from branding settings
}

// Response
{
  hooks?: Array<{ text: string, category: string, type: string }>  // for 'hooks'
  posts?: Array<{ text: string, wordCount: number, label?: string }>  // for 'posts'
  result?: string  // for single-output actions (variation, shorten, lengthen, restyle, apply-suggestion)
}
```

Uses `generateObject` with Zod schemas. Not streaming - short generations (2-5s).

Rate limits (added to config/ai.ts):

- Generation (wizard): 5/day
- Quick actions (editor): 10/day

### POST /api/extract

Content extraction from files and URLs.

```ts
// Request: FormData with `file` field, OR JSON { url: string }

// Response
{ text: string, title?: string }
```

- PDF: `pdf-parse` (server-side)
- DOCX: `mammoth` (server-side)
- TXT/MD: read as UTF-8 text
- URL: `fetch` + `@mozilla/readability` + `linkedom`

Max file size: 5MB. Max extracted text: 10,000 chars (truncated).

### Enhanced /api/analyze

The existing analyze endpoint stays. The response schema already includes scores, suggestions, strengths, improvements, category, sentiment, tone. No changes needed.

### Enhanced /api/suggestions

Enhance to return richer suggestions:

```ts
// Current response
{ suggestions: string[] }

// Enhanced response
{ suggestions: Array<{ text: string, type: 'content' | 'structure' | 'tone' | 'engagement' }> }
```

The `type` field helps categorize suggestions in the Analyze tab UI.

---

## 3. Editor Enhancements

### Right Panel: Preview + Analyze Tabs (1.3 + 1.4)

The current single-panel preview becomes a tabbed panel:

**Preview tab** - Existing LinkedIn feed preview. No changes.

**Analyze tab** - Shows analysis results. Content:

_Scores section (top):_

- Overall score: circular gauge (0-100), color-coded (red < 40, yellow 40-70, green > 70)
- Sub-scores as horizontal bars: Hook, Readability, CTA, Engagement
- Category badge and sentiment badge

_Suggestions section (middle):_

- 3-5 actionable suggestions from AI
- Each: description text + "Apply" button
- "Apply" calls `/api/generate` with `action: 'apply-suggestion'`, replaces editor content
- Undo via TipTap history (Ctrl+Z)

_Stats section (bottom, all client-side):_

- Character count / Word count
- Readability grade (Flesch-Kincaid, client-side computation)
- Sentence length distribution (tiny/short/medium/long/very long percentages)
- Hashtag count vs recommended (3-5)
- Optimal length indicator (too short < 100 chars, too long > 3000 chars)

Analysis runs on-demand when user switches to the Analyze tab (or clicks "Analyze" in toolbar). Results cache until content changes.

### Quick AI Actions Toolbar (1.5)

Row of action buttons below the editor content area, above the media/share bar:

- **Style** - dropdown with tone options (professional, casual, inspirational, educational, storytelling, humorous). Rewrites post in selected tone.
- **Hook** - opens hook picker (same UI as wizard step 2) for the current post content.
- **Shorter** - makes post more concise
- **Longer** - expands post with more detail
- **Variation** - generates an alternate version of the entire post

Each action calls `/api/generate`, replaces editor content, supports undo.

### Existing AI Chat

The "Generate with AI" sheet stays as-is. It handles free-form "describe what you want to change" conversations. Quick actions handle common one-click cases.

---

## 4. Post Labels (1.6)

### Available Labels

Personal Milestones, Mindset & Motivation, Career Before & After, Tool & Resource Insights, Case Studies, Actionable Guides, Culture Moments, Offer Highlight, Client Success Story, Custom.

### Data Changes

- DB migration: `ALTER TABLE public.drafts ADD COLUMN label text;`
- Add `label` to `DraftManifestEntry` type and Supabase data layer
- Add `label` to draft creation/update functions

### Where Labels Appear

- **Posts table**: new "Label" column with colored badge
- **Editor**: small dropdown in the header area to set/change label
- **Creation wizard**: AI auto-suggests a label in step 3 (variant generation)
- **Sidebar recent drafts**: small label indicator next to title

---

## 5. New Dependencies

- `pdf-parse` - PDF text extraction (server-side)
- `mammoth` - DOCX to text conversion (server-side)
- `linkedom` - DOM implementation for server-side HTML parsing
- `@mozilla/readability` - Article content extraction from HTML

No new client-side dependencies beyond what's already installed.

---

## 6. Branding Context Assembly

All AI generation uses branding context. A utility function `assembleBrandingContext(branding: BrandingData)` produces a string injected into system prompts:

```
You are writing for: [name], [role]
Positioning: [positioning statement]
Expertise: [areas of expertise]
Style: [language], [sentence length], [post length], [emoji frequency]
Do's: [list]
Don'ts: [list]
Footer: [custom footer text]
```

This function lives in `lib/ai-branding.ts` and is called by all generation endpoints.

---

## 7. Component Architecture Summary

```
New files:
  app/api/generate/route.ts              # Unified generation endpoint
  app/api/extract/route.ts               # File/URL content extraction
  lib/ai-branding.ts                     # Branding context assembly
  lib/content-scoring.ts                 # Client-side readability/stats
  components/dashboard/creation-wizard/  # Wizard components (7 files)
  components/dashboard/analyze-panel.tsx  # Analyze tab content
  components/dashboard/ai-actions.tsx     # Quick AI actions toolbar
  components/dashboard/label-picker.tsx   # Label dropdown selector

Modified files:
  app/api/suggestions/route.ts           # Enhanced response shape
  config/ai.ts                           # New rate limits
  lib/supabase/drafts.ts                 # Add label field
  lib/drafts.ts                          # Add label to types
  hooks/use-drafts.ts                    # Support label in mutations
  components/dashboard/dashboard-editor.tsx  # Add tabs, AI actions
  components/dashboard/posts-table.tsx    # Add label column
  components/dashboard/posts-list.tsx     # Add label filter
  components/dashboard/new-post-dialog.tsx  # Replace with wizard
  components/tool/preview/preview-panel.tsx  # Wrap in tab structure
  supabase/migrations/005_add_labels.sql  # Add label column
```
