# Dashboard Polish - Design Document

Date: 2026-03-03
Branch: `feat/dashboard-overhaul`

## Overview

Comprehensive UI/UX polish pass across the entire dashboard. Addresses layout consistency, scroll behavior, sidebar refinements, dark mode issues, and page-specific improvements across Posts, Editor, Branding, and Settings.

---

## 1. Layout & Scrolling Fix + Consistent Page Structure

### Problem

When scrolling on branding/posts/settings pages, the entire page scrolls including the sidebar. Only the editor properly fills the viewport. Pages lack consistent header patterns.

### Solution

- Remove the current `DashboardHeader` from the layout
- Each page owns its own header via a shared `PageHeader` component
- Page content wraps in `div.flex-1.overflow-y-auto` so content scrolls independently of the sidebar
- `SidebarInset` gets `border` class alongside existing shadow for a visible container boundary
- `SidebarTrigger` removed from headers (sidebar is always visible on desktop, offcanvas on mobile via the rail)

### Shared `PageHeader` Component

```tsx
// components/dashboard/page-header.tsx
interface PageHeaderProps {
    title: string
    children?: React.ReactNode // right-side actions
}

export function PageHeader({ title, children }: PageHeaderProps) {
    return (
        <header className='bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6'>
            <h1 className='text-lg font-semibold'>{title}</h1>
            {children && <div className='flex items-center gap-2'>{children}</div>}
        </header>
    )
}
```

### Layout Changes (`app/dashboard/layout.tsx`)

- Remove `DashboardHeader` import and render
- The children wrapper becomes: `<div className="flex flex-1 flex-col overflow-hidden">{children}</div>` (unchanged - each page manages scroll internally)
- Add `border` to `SidebarInset` via a wrapper or className override

---

## 2. Sidebar

### 2.1 Logo

Replace LinkedIn icon with the actual site logo from `/public/logo.svg` or the favicon. Use the "LP" branded icon.

### 2.2 Group Labels

Change sidebar group label text from white/primary to `text-muted-foreground` (gray).

### 2.3 New Post Button

- Remove the standalone "New Post" group at the top of the sidebar
- Add a small outlined "+" button inline with the "Posts" group label, right-justified
- This button triggers the CreationWizard dialog

### 2.4 Active Item State

Active sidebar items get `bg-accent` subtle background highlight, not just text color change.

### 2.5 Content Strategy Icon

Replace current icon with `TargetIcon` from lucide-react (target/bullseye).

### 2.6 Getting Started Checklist

- Placed in `SidebarFooter`
- Collapsible panel with progress bar
- 5 steps:
    1. Write your first post (links to `/dashboard/editor`)
    2. Set up your branding (links to `/dashboard/branding`)
    3. Try AI suggestions (links to `/dashboard/editor`)
    4. Preview in realistic feed
    5. Copy and publish
- Persisted in localStorage (`lp-getting-started`)
- Shows completed count / total
- Each item has checkbox, label, optional link

### 2.7 Remove CreationWizard from Sidebar

CreationWizard only lives on the Posts page, triggered by the page header button or the sidebar "+" button.

---

## 3. Posts Page

### 3.1 Rename "label" to "post format"

- Display text changes: "Label" -> "Format" / "Post Format" everywhere in UI
- `POST_LABELS` constant renamed to `POST_FORMATS`, `PostLabel` type renamed to `PostFormat`
- DB column stays `label` (no migration needed), mapping happens at display layer
- Filter dropdown label: "Format"

### 3.2 Table Column Changes

- Remove "Words" column
- Add "Score" column showing last analysis score (fetch from `post_analyses` table or show "-")
- Shrink "Format" column width (currently wider than needed)

### 3.3 Actions Column

- Dot menu button: aligned right with consistent padding on all sides
- Use `variant="outline"` on the dropdown trigger button

### 3.4 Filter Improvements

- Format filter dropdown: add `py-1 px-2` padding inside each item
- Search input and filter dropdown: match heights (both `h-9`)
- Status filter: Convert to shadcn `Tabs` component with outlined tab style (shared background)

### 3.5 Remove Duplicate Title

- Remove the `h1 "Posts"` inside `PostsList` - the `PageHeader` in the page file handles this
- "New Post" button moves to `PageHeader`'s right slot

---

## 4. Editor Page

### 4.1 Remove Label Selector

Remove the "Label" meta bar above the editor panels entirely.

### 4.2 Copy Text Action

Add "Copy Text" button to the page header's right slot (primary action). This copies the editor's plain text content to clipboard.

### 4.3 Preview/Analyze Header Height

Match the tab bar height to the editor's toolbar height so they align visually across the resize handle.

### 4.4 Remove Preview Sub-Header

Remove `PreviewHeader` component (the bar with "Post Preview" title and "Open realistic preview" link).

### 4.5 Screen Size Switcher

- Small icon-only tab buttons (MonitorIcon, TabletIcon, SmartphoneIcon)
- Placed directly above the preview card, right-aligned or centered
- Compact: just icons, no text labels

### 4.6 Feed Preview Button

- Small chip/button "Open in feed" with ExternalLinkIcon
- Replaces the "See in realistic LinkedIn feed" text link that was in the old preview footer

---

## 5. Branding Page

### 5.1 Layout

- Left-align content: remove `mx-auto`, keep `max-w-2xl`
- Half-width fields: Full name input, Role selector, Language select all get `max-w-sm` or `w-1/2`

### 5.2 Expertise Section - Growing List

- Replace the fixed 4 inputs with a dynamic growing list (same pattern as dos/donts)
- Input with "Add" button inside it on the right (shadcn button-group / input-with-button pattern)
- User types, clicks Add (or presses Enter), item appears in list above
- Each item has delete button
- Starts empty, grows as user adds items

### 5.3 Language Select with Flags

- Add flag emoji prefix to each language option in the select dropdown
- E.g., "English" -> "US English", "DE German", etc.

### 5.4 Selector Groups (Sentence Length, Post Length, Emoji Frequency)

- `ToggleGroup` items get rounded border styling (card-like, `rounded-md border`)
- Each group label gets an info icon (`InfoIcon` from lucide) that shows a `Tooltip` on hover
- Tooltip content examples:
    - Sentence length: "Control the average length of each sentence. Short creates punchy, concise lines while Long uses a more academic, detailed writing style."
    - Post length: "Set the target length for your posts. Short posts are under 500 characters, Standard is 500-1500, Long is 1500+."
    - Emoji frequency: "How often emojis appear in your posts. None keeps it clean, Moderate adds occasional emphasis, A lot uses them liberally."

### 5.5 Footer Toggle Fix

Debug the `Switch` component not toggling. Likely needs explicit `checked` + `onCheckedChange` props properly wired to branding state.

### 5.6 Dos/Donts - Input with Button Pattern

Match the expertise section pattern: input with "Add" button inside it on the right.

### 5.7 New Sections

**Inspirational Posts**

- New Card section after KnowledgeBase
- Growing list of textareas (each for pasting a full post)
- Input-with-button to add new entry, each entry shows in a bordered card with delete button
- Data model: `inspirationalPosts: string[]` added to `BrandingData`

**Inspirational Creators**

- New Card section after Inspirational Posts
- Growing list of name + LinkedIn URL input rows
- Each row: name input + URL input + delete button
- Input-with-button to add (enters name, clicks add, row appears)
- Data model: `inspirationalCreators: Array<{ name: string; url: string }>` added to `BrandingData`

---

## 6. Settings Page

- Add `mx-auto max-w-2xl` wrapper to match branding layout
- Use the shared `PageHeader` component
- Same padding pattern as branding (`p-4 lg:p-6`)

---

## 7. General / Cross-Cutting

### 7.1 Dark Mode Primary Button

- Adjust primary color in dark mode: less saturated, slightly lighter blue
- Override via CSS variables in `styles/globals.css` dark variant
- Text stays white/near-white for contrast

### 7.2 Dark Mode Audit

- Editor text must be visible in dark mode (TipTap prose text color)
- Card borders, input borders, toggle states all reviewed
- Badge variants checked for contrast

### 7.3 Tutorial Carousel

- Multi-step dialog shown on first dashboard visit
- 4 slides: "Welcome", "Create Posts", "Brand Your Voice", "Analyze & Improve"
- Each slide: video placeholder (aspect-video, muted bg) + title + description
- Navigation: dots indicator + Previous/Next buttons
- Persisted in localStorage (`lp-tutorial-seen`)
- Component: `components/dashboard/tutorial-dialog.tsx`
- Rendered in dashboard layout, gated by localStorage check

### 7.4 Container Border

- Add `border` class to `SidebarInset` component rendering
- Provides clear visual boundary alongside existing shadow

---

## Data Model Changes

### BrandingData (lib/branding.ts)

Add:

```ts
inspirationalPosts: string[]
inspirationalCreators: Array<{ name: string; url: string }>
```

With defaults: `inspirationalPosts: []`, `inspirationalCreators: []`

### Display Rename

- `POST_LABELS` -> `POST_FORMATS` (constant name)
- `PostLabel` -> `PostFormat` (type name)
- All UI references: "Label" -> "Format"
- DB column unchanged: `label`

---

## Agent Grouping for Implementation

| Agent              | Files Owned                                                                                    | Key Changes                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **sidebar-agent**  | `dashboard-sidebar.tsx`, new `getting-started-checklist.tsx`                                   | Logo, labels, button, active state, icon, checklist, remove wizard              |
| **posts-agent**    | `posts-list.tsx`, `posts-table.tsx`, `lib/drafts.ts`                                           | Rename label->format, columns, filters, tabs, title dedup                       |
| **editor-agent**   | `dashboard-editor.tsx`, `preview-panel.tsx`, `preview-header.tsx`                              | Remove label bar, copy action, header alignment, preview cleanup                |
| **branding-agent** | `branding-form.tsx`, `lib/branding.ts`                                                         | Layout, half-width, growing lists, tooltips, toggle fix, inspiration sections   |
| **general-agent**  | `layout.tsx`, `page-header.tsx`, `settings-form.tsx`, `globals.css`, new `tutorial-dialog.tsx` | Layout/scroll fix, header pattern, settings layout, dark mode, tutorial, border |
