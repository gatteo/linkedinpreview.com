# Dashboard Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Comprehensive UI/UX polish of the dashboard - layout, scroll behavior, sidebar, posts, editor, branding, settings, dark mode, tutorial.

**Architecture:** 5 parallel agents grouped by page area. Foundation task (shared PageHeader + layout fix) runs first, then page-specific agents run in parallel, then a final verification pass.

**Tech Stack:** Next.js 16.1, React 19, Tailwind CSS 4, shadcn/ui, TipTap, react-resizable-panels, localStorage for onboarding state.

---

## Parallelism Guide

```
Foundation (Task 1)
  |
  +--> Sidebar Agent (Tasks 2-3)
  +--> Posts Agent (Tasks 4-5)
  +--> Editor Agent (Tasks 6-7)
  +--> Branding Agent (Tasks 8-9)
  +--> General Agent (Tasks 10-12)
  |
  +--> Final: Lint + Build + Verify (Task 13)
```

Foundation must complete first. Then tasks 2-12 run in parallel (grouped by agent). Task 13 runs last.

---

### Task 1: Foundation - PageHeader + Layout Fix + Container Border

**Files:**

- Create: `components/dashboard/page-header.tsx`
- Modify: `app/dashboard/layout.tsx`
- Delete import: `components/dashboard/dashboard-header.tsx` (remove from layout only - keep file for now)

**Step 1: Create shared PageHeader component**

Create `components/dashboard/page-header.tsx`:

```tsx
'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'

interface PageHeaderProps {
    title: string
    children?: React.ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
    return (
        <header className='bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6'>
            <div className='flex items-center gap-2'>
                <SidebarTrigger className='-ml-1 lg:hidden' />
                <h1 className='text-lg font-semibold'>{title}</h1>
            </div>
            {children && <div className='flex items-center gap-2'>{children}</div>}
        </header>
    )
}
```

Note: SidebarTrigger is only visible on mobile (`lg:hidden`) since sidebar is always visible on desktop.

**Step 2: Update dashboard layout**

Modify `app/dashboard/layout.tsx`:

- Remove `DashboardHeader` import and its render inside `SidebarInset`
- Add `border` class to a wrapper around `SidebarInset` content, or modify the outer div
- The `SidebarInset` already gets rounded corners + shadow from the inset variant. Add `border` to it.

The layout `SidebarInset` section becomes:

```tsx
<SidebarInset className='border'>
    <div className='flex flex-1 flex-col overflow-hidden'>{children}</div>
</SidebarInset>
```

Remove the `DashboardHeader` line entirely. Each page will use `PageHeader` directly.

**Step 3: Commit**

```
feat: add shared PageHeader, remove DashboardHeader from layout, add container border
```

---

### Task 2: Sidebar - Logo, Labels, Button, Active State, Icon

**Files:**

- Modify: `components/dashboard/dashboard-sidebar.tsx`

**Step 1: Replace logo**

Line 55: Replace `Icons.linkedinLogo` with an `<Image>` of the actual logo:

```tsx
import Image from 'next/image'
// ...
<Image src='/images/logo-rounded-rectangle.png' alt='LinkedInPreview' width={20} height={20} className='size-5 rounded' />
<span className='text-base font-semibold'>LinkedInPreview</span>
```

Remove `Icons` import if no longer needed.

**Step 2: Gray group labels**

All `SidebarGroupLabel` instances (lines 83, 120, 159) - add `text-muted-foreground` class:

```tsx
<SidebarGroupLabel className='text-muted-foreground'>Posts</SidebarGroupLabel>
```

Apply to: "Posts", "Tools", "Personalization".

**Step 3: Move New Post button inline with Posts label**

Remove the entire "New Post CTA" SidebarGroup (lines 64-79). Replace the Posts `SidebarGroupLabel` with a flex row containing the label and a small "+" button:

```tsx
<SidebarGroup>
    <div className='flex items-center justify-between px-2'>
        <SidebarGroupLabel className='text-muted-foreground p-0'>Posts</SidebarGroupLabel>
        <Button variant='outline' size='icon' className='size-6' onClick={() => setNewPostOpen(true)}>
            <PlusIcon className='size-3.5' />
            <span className='sr-only'>New Post</span>
        </Button>
    </div>
    <SidebarGroupContent>{/* ... existing posts menu items ... */}</SidebarGroupContent>
</SidebarGroup>
```

Import `Button` from `@/components/ui/button`.

**Step 4: Active item background**

The sidebar's `SidebarMenuButton` already supports `isActive` prop which sets `data-[active=true]`. Check `components/ui/sidebar.tsx` to verify it applies `bg-accent`. If not, the `isActive` prop sets `data-active=true`. The default shadcn sidebar styles should handle this. Verify and add if needed:

```tsx
// In SidebarMenuButton, data-[active=true] should have:
'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground'
```

This should already be in the shadcn sidebar primitive. Just confirm it works.

**Step 5: Content Strategy icon**

Line 175: Replace `SlidersHorizontalIcon` with `TargetIcon`:

```tsx
import { ..., TargetIcon } from 'lucide-react'
// ...
<TargetIcon />
<span>Content Strategy</span>
```

Remove `SlidersHorizontalIcon` from imports.

**Step 6: Commit**

```
feat: sidebar - logo, gray labels, inline new post button, target icon
```

---

### Task 3: Sidebar - Getting Started Checklist

**Files:**

- Create: `components/dashboard/getting-started-checklist.tsx`
- Modify: `components/dashboard/dashboard-sidebar.tsx` (SidebarFooter)

**Step 1: Create the Getting Started Checklist component**

Create `components/dashboard/getting-started-checklist.tsx`. Adapt from the tether reference but place it inline in the SidebarFooter (not fixed position):

```tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2Icon, ChevronDownIcon, ChevronUpIcon, CircleIcon, RocketIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const STORAGE_KEY = 'lp-getting-started'

interface ChecklistItem {
    id: string
    label: string
    description: string
    href: string
}

const ITEMS: ChecklistItem[] = [
    {
        id: 'write-post',
        label: 'Write your first post',
        description: 'Create a new post in the editor',
        href: '/dashboard/editor',
    },
    {
        id: 'setup-branding',
        label: 'Set up your branding',
        description: 'Define your voice and style',
        href: '/dashboard/branding',
    },
    {
        id: 'try-suggestions',
        label: 'Try AI suggestions',
        description: 'Get feedback on your writing',
        href: '/dashboard/editor',
    },
    {
        id: 'preview-feed',
        label: 'Preview in realistic feed',
        description: 'See how your post looks on LinkedIn',
        href: '/dashboard/editor',
    },
    {
        id: 'copy-publish',
        label: 'Copy and publish',
        description: 'Copy your post and share it',
        href: '/dashboard/editor',
    },
]

export function GettingStartedChecklist() {
    const [completed, setCompleted] = React.useState<string[]>([])
    const [open, setOpen] = React.useState(true)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                setCompleted(parsed.completed || [])
                if (parsed.dismissed) return // don't show if dismissed
            }
        } catch {}
        setMounted(true)
    }, [])

    React.useEffect(() => {
        if (!mounted) return
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed }))
    }, [completed, mounted])

    if (!mounted) return null

    // Hide if all items completed
    if (completed.length >= ITEMS.length) return null

    const toggle = (id: string) => {
        setCompleted((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
    }

    return (
        <div className='border-t px-3 py-3'>
            <button onClick={() => setOpen(!open)} className='flex w-full items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <RocketIcon className='text-primary size-4' />
                    <span className='text-foreground text-sm font-semibold'>Getting Started</span>
                    <span className='text-muted-foreground text-xs'>
                        {completed.length}/{ITEMS.length}
                    </span>
                </div>
                {open ? (
                    <ChevronDownIcon className='text-muted-foreground size-4' />
                ) : (
                    <ChevronUpIcon className='text-muted-foreground size-4' />
                )}
            </button>

            {/* Progress bar */}
            <div className='bg-muted mt-2 h-1 overflow-hidden rounded-full'>
                <div
                    className='bg-primary h-full rounded-full transition-all duration-300'
                    style={{ width: `${(completed.length / ITEMS.length) * 100}%` }}
                />
            </div>

            {open && (
                <ul className='mt-2 space-y-0.5'>
                    {ITEMS.map((item) => {
                        const done = completed.includes(item.id)
                        return (
                            <li key={item.id} className='flex items-start gap-2 rounded-md p-1.5'>
                                <button onClick={() => toggle(item.id)} className='mt-0.5 shrink-0'>
                                    {done ? (
                                        <CheckCircle2Icon className='text-primary size-4' />
                                    ) : (
                                        <CircleIcon className='text-muted-foreground size-4' />
                                    )}
                                </button>
                                <Link href={item.href} className='group min-w-0'>
                                    <span
                                        className={cn(
                                            'text-sm transition-colors',
                                            done
                                                ? 'text-muted-foreground line-through'
                                                : 'text-foreground group-hover:text-primary',
                                        )}>
                                        {item.label}
                                    </span>
                                    <p className='text-muted-foreground text-xs'>{item.description}</p>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
```

**Step 2: Add to SidebarFooter**

In `dashboard-sidebar.tsx`, replace the empty `<SidebarFooter />` (line 216) with:

```tsx
<SidebarFooter className='p-0'>
    <GettingStartedChecklist />
</SidebarFooter>
```

Import `GettingStartedChecklist` from `@/components/dashboard/getting-started-checklist`.

**Step 3: Commit**

```
feat: add getting started checklist to sidebar footer
```

---

### Task 4: Posts - Rename Label to Format + Table Column Changes

**Files:**

- Modify: `lib/drafts.ts` (rename constants/types)
- Modify: `components/dashboard/posts-table.tsx` (columns)
- Modify: `components/dashboard/label-picker.tsx` (rename to format-picker conceptually, update display text)

**Step 1: Rename POST_LABELS to POST_FORMATS in lib/drafts.ts**

Lines 44-56: Rename the constant and type:

```tsx
export const POST_FORMATS = [
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

export type PostFormat = (typeof POST_FORMATS)[number]
```

Keep `POST_LABELS` as a re-export for backward compat in case anything references it:

```tsx
/** @deprecated Use POST_FORMATS */
export const POST_LABELS = POST_FORMATS
/** @deprecated Use PostFormat */
export type PostLabel = PostFormat
```

**Step 2: Update all consumers of POST_LABELS**

Search and replace `POST_LABELS` -> `POST_FORMATS` and `PostLabel` -> `PostFormat` in:

- `components/dashboard/label-picker.tsx` - update import, update references, rename to display "Format"
- `components/dashboard/posts-list.tsx` - filter label -> "Format"
- `components/dashboard/posts-table.tsx` - column header
- `app/api/generate/route.ts` - the POST_LABELS array (line 49-59)
- `components/dashboard/creation-wizard/variant-picker.tsx` - if referenced

**Step 3: Update posts-table.tsx columns**

In `createColumns()` (lines 150-235):

- **Remove wordCount column** (around line 208-214):
  Delete the entire column definition for `wordCount`.

- **Add score column** after status. For now, show "-" (score fetching will be a future enhancement):

    ```tsx
    {
        accessorKey: 'score',
        header: 'Score',
        cell: () => <span className='text-muted-foreground'>-</span>,
        size: 60,
    },
    ```

- **Shrink format column** - add `size: 140` to the label/format column definition.

- **Fix actions column alignment** - the actions DropdownMenuTrigger button:
    ```tsx
    <Button variant='outline' size='icon' className='size-8'>
        <MoreHorizontalIcon className='size-4' />
    </Button>
    ```
    And align the cell right: `cell: ({ row }) => <div className='flex justify-end'>...</div>`

**Step 4: Commit**

```
feat: rename label to format, update table columns
```

---

### Task 5: Posts - Filters, Status Tabs, Title Dedup

**Files:**

- Modify: `components/dashboard/posts-list.tsx`
- Modify: `app/dashboard/page.tsx`

**Step 1: Add PageHeader to posts page**

In `app/dashboard/page.tsx`, wrap PostsList with a scroll container and add the header. The page file becomes:

```tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { Skeleton } from '@/components/ui/skeleton'
import { PostsList } from '@/components/dashboard/posts-list'

export const metadata: Metadata = { title: 'Posts - LinkedInPreview.com' }

function PostsPageSkeleton() {
    return (
        <div className='flex flex-1 flex-col overflow-y-auto p-4 lg:p-6'>
            <div className='space-y-4'>
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-12 w-full' />
                ))}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<PostsPageSkeleton />}>
            <PostsList />
        </Suspense>
    )
}
```

**Step 2: Update PostsList - remove duplicate title, add PageHeader**

In `posts-list.tsx`:

- Import `PageHeader` from `@/components/dashboard/page-header`
- Remove the h1 "Posts" header section
- Add `PageHeader` as the first child with "New Post" button in the right slot
- Wrap the content below header in `div.flex-1.overflow-y-auto`
- The "New Post" button in the header triggers the wizard

Structure:

```tsx
export function PostsList() {
    // ... existing state/hooks ...

    return (
        <>
            <PageHeader title='Posts'>
                <Button size='sm' onClick={() => setNewPostOpen(true)}>
                    <PlusIcon className='size-4' />
                    New Post
                </Button>
            </PageHeader>

            <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6'>
                {/* Filters row */}
                <div className='flex flex-wrap items-center gap-2'>
                    {/* Status tabs - use Tabs from shadcn */}
                    <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                        <TabsList variant='outline'>
                            {STATUS_FILTERS.map((s) => (
                                <TabsTrigger key={s.value} value={s.value}>
                                    {s.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    {/* Format filter */}
                    <Select
                        value={filterLabel ?? '__all__'}
                        onValueChange={(v) => setFilterLabel(v === '__all__' ? null : v)}>
                        <SelectTrigger className='h-9 w-[160px]'>
                            <SelectValue placeholder='Format' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='__all__' className='px-3 py-2'>
                                All formats
                            </SelectItem>
                            {POST_FORMATS.map((f) => (
                                <SelectItem key={f} value={f} className='px-3 py-2'>
                                    {f}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Search */}
                    <Input
                        placeholder='Search posts...'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='h-9 w-[200px]'
                    />
                </div>

                {/* Table / Empty / Loading */}
                {isLoading ? (
                    <PostsListSkeleton />
                ) : filteredDrafts.length === 0 ? (
                    <EmptyState hasFilter={hasActiveFilter} />
                ) : (
                    <PostsTable data={filteredDrafts} onDuplicate={handleDuplicate} onDelete={handleDelete} />
                )}
            </div>

            <CreationWizard open={newPostOpen} onOpenChange={setNewPostOpen} />
        </>
    )
}
```

Import Tabs/TabsList/TabsTrigger from shadcn. Use the `variant='outline'` variant for TabsList if available, or style it to look like outlined tabs with shared background (check shadcn Tabs docs).

**Step 3: Fix filter item padding**

In the format Select, ensure each `SelectItem` has `className='px-3 py-2'` for proper padding.

**Step 4: Commit**

```
feat: posts - PageHeader, status tabs, filter fixes, remove duplicate title
```

---

### Task 6: Editor - Remove Label Bar + Copy Action + Header

**Files:**

- Modify: `components/dashboard/dashboard-editor.tsx`
- Modify: `app/dashboard/editor/page.tsx`

**Step 1: Add PageHeader to editor page**

In `app/dashboard/editor/page.tsx`:

```tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'

import { DashboardEditor, EditorLoading } from '@/components/dashboard/dashboard-editor'

export const metadata: Metadata = { title: 'Editor - LinkedInPreview.com' }

export default function EditorPage() {
    return (
        <Suspense fallback={<EditorLoading />}>
            <DashboardEditor />
        </Suspense>
    )
}
```

The PageHeader for the editor will be rendered inside `DashboardEditor` itself (since it needs access to state for the copy button).

**Step 2: Update DashboardEditor**

In `dashboard-editor.tsx`:

- Import `PageHeader` from `@/components/dashboard/page-header`
- Remove the label meta bar (the `div` with LabelPicker, around lines 201-210)
- Remove `LabelPicker` import, `currentLabel` memo, `handleLabelChange`
- Add `PageHeader` as the first element in the return, with "Copy Text" button:

```tsx
const handleCopyText = React.useCallback(async () => {
    const text = contentText
    if (!text) return
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
}, [contentText])

// In return:
return (
    <>
        <PageHeader title='Editor'>
            <Button size='sm' onClick={handleCopyText} disabled={!contentText}>
                <CopyIcon className='size-4' />
                Copy Text
            </Button>
        </PageHeader>
        <div className='bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
            {/* mobile tab bar */}
            {/* desktop: Group with panels */}
            {/* mobile: single tab view */}
        </div>
    </>
)
```

Import `CopyIcon` from lucide-react, `toast` from sonner, `Button` from ui.

**Step 3: Commit**

```
feat: editor - remove label bar, add copy text to header
```

---

### Task 7: Editor - Preview Panel Cleanup

**Files:**

- Modify: `components/tool/preview/preview-panel.tsx`
- Modify: `components/tool/preview/preview-header.tsx` (may delete or gut)
- Modify: `components/dashboard/dashboard-editor.tsx` (RightTabBar height)

**Step 1: Remove PreviewHeader, replace with compact size switcher**

In `preview-panel.tsx`, remove the `PreviewHeader` component render. Replace it with a compact size switcher bar directly above the preview card:

```tsx
function PreviewPanelContent({ content, media, onOpenFeedPreview, hasContent }: PreviewPanelProps) {
    const { screenSize, setScreenSize } = useScreenSize()
    const containerWidth: Record<string, string> = {
        mobile: 'w-[320px]',
        tablet: 'w-[480px]',
        desktop: 'w-[555px]',
    }

    const sizes = ['mobile', 'tablet', 'desktop'] as const
    const sizeIcons = {
        mobile: SmartphoneIcon,
        tablet: TabletIcon,
        desktop: MonitorIcon,
    }

    return (
        <div className='flex h-full flex-col'>
            {/* Compact controls bar */}
            <div className='flex shrink-0 items-center justify-between px-4 py-2'>
                <div className='flex items-center gap-1'>
                    {sizes.map((size) => {
                        const Icon = sizeIcons[size]
                        return (
                            <button
                                key={size}
                                onClick={() => setScreenSize(size)}
                                className={cn(
                                    'rounded-md p-1.5 transition-colors',
                                    screenSize === size
                                        ? 'bg-accent text-foreground'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}>
                                <Icon className='size-4' />
                            </button>
                        )
                    })}
                </div>
                {hasContent && onOpenFeedPreview && (
                    <Button variant='outline' size='sm' className='h-7 text-xs' onClick={onOpenFeedPreview}>
                        <ExternalLinkIcon className='size-3' />
                        Open in feed
                    </Button>
                )}
            </div>

            {/* Preview area */}
            <div className='flex flex-1 flex-col items-center overflow-auto bg-neutral-50 py-5 dark:bg-neutral-900'>
                <div className={cn('mx-auto transition-all duration-300', containerWidth[screenSize])}>
                    <PostCard content={content} media={media} />
                </div>
            </div>
        </div>
    )
}
```

Import: `SmartphoneIcon`, `TabletIcon`, `MonitorIcon`, `ExternalLinkIcon` from lucide; `Button` from ui.

Remove the `PreviewHeader` import and usage.

**Step 2: Match RightTabBar height to editor toolbar**

In `dashboard-editor.tsx`, the `RightTabBar` buttons should match the editor toolbar height. The editor toolbar is about `h-10` (40px). Ensure the RightTabBar container has the same height. Adjust the buttons to `h-10`:

```tsx
function RightTabBar({ tab, onTabChange }: { tab: RightTab; onTabChange: (t: RightTab) => void }) {
    return <div className='border-border flex h-10 shrink-0 border-b'>{/* tab buttons */}</div>
}
```

**Step 3: Commit**

```
feat: editor - remove preview header, compact size switcher, feed preview chip
```

---

### Task 8: Branding - Layout, Half-Width, Growing Lists, Tooltips

**Files:**

- Modify: `components/dashboard/branding-form.tsx`
- Modify: `app/dashboard/branding/page.tsx`

**Step 1: Add PageHeader + scroll wrapper to branding page**

In `app/dashboard/branding/page.tsx`:

```tsx
import type { Metadata } from 'next'

import { BrandingForm } from '@/components/dashboard/branding-form'
import { PageHeader } from '@/components/dashboard/page-header'

export const metadata: Metadata = { title: 'Branding - LinkedInPreview.com' }

export default function BrandingPage() {
    return (
        <>
            <PageHeader title='Branding' />
            <div className='flex-1 overflow-y-auto'>
                <BrandingForm />
            </div>
        </>
    )
}
```

**Step 2: Update BrandingForm layout**

In `branding-form.tsx`:

- Remove the h1 header (since PageHeader handles it). Keep the `SaveIndicator`.
- Change `mx-auto max-w-2xl` to just `max-w-2xl` (left-align, no centering)
- The save indicator can go in the PageHeader as a children slot in future, but for now just keep it above the form sections.

Layout becomes:

```tsx
<div className='max-w-2xl space-y-6 p-4 lg:p-6'>
    <SaveIndicator visible={showSaved} />
    <ProfileSection ... />
    {/* etc */}
</div>
```

**Step 3: Half-width fields**

In `ProfileSection`: Full name input gets `max-w-sm`:

```tsx
<Input value={branding.profile.name} ... className='max-w-sm' />
```

In `RoleSection`: Select trigger gets `max-w-sm`:

```tsx
<Select ...>
    <SelectTrigger className='max-w-sm'>
```

In `WritingStyleSection`: Language select gets `max-w-sm`:

```tsx
<Select ...>
    <SelectTrigger className='max-w-sm'>
```

**Step 4: Expertise section - growing list with input-with-button**

Replace the fixed 4 inputs with a growing list pattern. Replace `ExpertiseSection` entirely:

```tsx
function ExpertiseSection({ branding, onUpdate }: SectionProps) {
    const [input, setInput] = React.useState('')
    const topics = branding.expertise.topics.filter(Boolean)

    const addTopic = () => {
        const trimmed = input.trim()
        if (!trimmed) return
        onUpdate({ expertise: { topics: [...topics, trimmed] as any } })
        setInput('')
    }

    const removeTopic = (index: number) => {
        const updated = topics.filter((_, i) => i !== index)
        onUpdate({ expertise: { topics: updated as any } })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Areas of Expertise</CardTitle>
                <CardDescription>Topics you write about on LinkedIn</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
                {topics.map((topic, i) => (
                    <div key={i} className='flex items-center gap-2 rounded-md border px-3 py-2'>
                        <span className='flex-1 text-sm'>{topic}</span>
                        <Button variant='ghost' size='icon' className='size-7' onClick={() => removeTopic(i)}>
                            <Trash2Icon className='size-3.5' />
                        </Button>
                    </div>
                ))}
                <div className='flex gap-0'>
                    <Input
                        placeholder='Add a topic...'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                        className='rounded-r-none'
                    />
                    <Button
                        variant='outline'
                        onClick={addTopic}
                        disabled={!input.trim()}
                        className='rounded-l-none border-l-0'>
                        <PlusIcon className='size-4' />
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
```

Note: The `BrandingExpertise` type uses `topics: [string, string, string, string]` (4-tuple). We need to update `lib/branding.ts` to use `topics: string[]` instead. Change in Task 9.

**Step 5: Language select with flag emojis**

In `WritingStyleSection`, update the language options:

```tsx
const LANGUAGES = [
    { value: 'english', label: 'English', flag: 'us' },
    { value: 'german', label: 'German', flag: 'de' },
    { value: 'french', label: 'French', flag: 'fr' },
    { value: 'spanish', label: 'Spanish', flag: 'es' },
    { value: 'italian', label: 'Italian', flag: 'it' },
    { value: 'portuguese', label: 'Portuguese', flag: 'pt' },
    { value: 'dutch', label: 'Dutch', flag: 'nl' },
] as const
```

For flag display, use the flag emoji technique (regional indicator symbols):

```tsx
function flagEmoji(code: string): string {
    return code
        .toUpperCase()
        .split('')
        .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
        .join('')
}
```

Then in the select items:

```tsx
<SelectItem key={lang.value} value={lang.value}>
    <span className='mr-2'>{flagEmoji(lang.flag)}</span>
    {lang.label}
</SelectItem>
```

**Step 6: Rounded border selector groups + info tooltips**

For each ToggleGroup (sentence length, post length, emoji frequency):

1. Add `className='gap-0'` to `ToggleGroup` and `className='rounded-none border first:rounded-l-md last:rounded-r-md'` to each `ToggleGroupItem`.

2. Add info tooltip next to each label. Import `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` from `@/components/ui/tooltip` and `InfoIcon` from lucide:

```tsx
<div className='flex items-center gap-1.5'>
    <Label>Sentence Length</Label>
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <InfoIcon className='text-muted-foreground size-3.5' />
            </TooltipTrigger>
            <TooltipContent side='top' className='max-w-xs'>
                <p>
                    Control the average length of each sentence. Short creates punchy, concise lines while Long uses a
                    more academic, detailed writing style.
                </p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
</div>
```

Tooltips for each:

- Sentence length: "Control the average length of each sentence. Short creates punchy, concise lines while Long uses a more academic, detailed writing style."
- Post length: "Set the target length for your posts. Short posts are under 500 characters, Standard is 500-1500, Long is 1500+."
- Emoji frequency: "How often emojis appear in your posts. None keeps it clean, Moderate adds occasional emphasis, A lot uses them liberally."

**Step 7: Footer toggle fix**

In `FooterSection`, verify the Switch has proper `checked` and `onCheckedChange`:

```tsx
<Switch
    checked={branding.footer.enabled}
    onCheckedChange={(checked) => onUpdate({ footer: { ...branding.footer, enabled: checked } })}
/>
```

The issue is likely that `onUpdate` only sends a partial and the spread loses the `text` field. Make sure the entire footer object is spread.

**Step 8: Dos/Donts with input-with-button pattern**

Update `DosDontsSection` to use the same input-with-button pattern as expertise:

```tsx
<div className='flex gap-0'>
    <Input
        placeholder='Add a do...'
        value={doInput}
        onChange={(e) => setDoInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDo())}
        className='rounded-r-none'
    />
    <Button variant='outline' onClick={addDo} disabled={!doInput.trim()} className='rounded-l-none border-l-0'>
        <PlusIcon className='size-4' />
        Add
    </Button>
</div>
```

Same for don'ts.

**Step 9: Commit**

```
feat: branding - layout, half-width, growing lists, flags, tooltips, toggle fix
```

---

### Task 9: Branding - Inspiration Sections + Data Model

**Files:**

- Modify: `lib/branding.ts` (data model)
- Modify: `components/dashboard/branding-form.tsx` (new sections)
- Modify: `lib/supabase/branding.ts` (if branding CRUD needs updates)
- Modify: `hooks/use-branding.ts` (if defaults need updating)

**Step 1: Update BrandingData type**

In `lib/branding.ts`:

1. Change `BrandingExpertise.topics` from `[string, string, string, string]` to `string[]`
2. Add new interfaces and fields:

```tsx
export interface BrandingExpertise {
    topics: string[]
}

export interface BrandingInspiration {
    posts: string[]
    creators: Array<{ name: string; url: string }>
}

export interface BrandingData {
    profile: BrandingProfile
    positioning: BrandingPositioning
    role: BrandingRole
    expertise: BrandingExpertise
    writingStyle: BrandingWritingStyle
    footer: BrandingFooter
    knowledgeBase: BrandingKnowledgeBase
    dosDonts: BrandingDosDonts
    inspiration: BrandingInspiration
}
```

3. Update `DEFAULT_BRANDING`:

```tsx
export const DEFAULT_BRANDING: BrandingData = {
    // ... existing defaults ...
    expertise: { topics: [] },
    inspiration: { posts: [], creators: [] },
}
```

**Step 2: Add Inspirational Posts section**

In `branding-form.tsx`, add after `KnowledgeBaseSection`:

```tsx
function InspirationPostsSection({ branding, onUpdate }: SectionProps) {
    const [input, setInput] = React.useState('')
    const posts = branding.inspiration?.posts ?? []

    const addPost = () => {
        const trimmed = input.trim()
        if (!trimmed) return
        onUpdate({ inspiration: { ...branding.inspiration, posts: [...posts, trimmed] } })
        setInput('')
    }

    const removePost = (index: number) => {
        onUpdate({ inspiration: { ...branding.inspiration, posts: posts.filter((_, i) => i !== index) } })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inspirational Posts</CardTitle>
                <CardDescription>Paste LinkedIn posts you admire - we will analyze the writing style</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
                {posts.map((post, i) => (
                    <div key={i} className='relative rounded-md border p-3'>
                        <p className='line-clamp-3 pr-8 text-sm'>{post}</p>
                        <Button
                            variant='ghost'
                            size='icon'
                            className='absolute top-2 right-2 size-7'
                            onClick={() => removePost(i)}>
                            <Trash2Icon className='size-3.5' />
                        </Button>
                    </div>
                ))}
                <div className='flex gap-0'>
                    <Textarea
                        placeholder='Paste a LinkedIn post...'
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className='min-h-20 rounded-r-none'
                    />
                    <Button
                        variant='outline'
                        onClick={addPost}
                        disabled={!input.trim()}
                        className='h-auto rounded-l-none border-l-0'>
                        <PlusIcon className='size-4' />
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
```

**Step 3: Add Inspirational Creators section**

```tsx
function InspirationCreatorsSection({ branding, onUpdate }: SectionProps) {
    const [name, setName] = React.useState('')
    const [url, setUrl] = React.useState('')
    const creators = branding.inspiration?.creators ?? []

    const addCreator = () => {
        const trimmedName = name.trim()
        if (!trimmedName) return
        onUpdate({
            inspiration: {
                ...branding.inspiration,
                creators: [...creators, { name: trimmedName, url: url.trim() }],
            },
        })
        setName('')
        setUrl('')
    }

    const removeCreator = (index: number) => {
        onUpdate({
            inspiration: {
                ...branding.inspiration,
                creators: creators.filter((_, i) => i !== index),
            },
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Inspirational Creators</CardTitle>
                <CardDescription>Creators whose writing style inspires you</CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
                {creators.map((creator, i) => (
                    <div key={i} className='flex items-center gap-2 rounded-md border px-3 py-2'>
                        <span className='flex-1 text-sm'>{creator.name}</span>
                        {creator.url && (
                            <a
                                href={creator.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-muted-foreground text-xs hover:underline'>
                                Profile
                            </a>
                        )}
                        <Button variant='ghost' size='icon' className='size-7' onClick={() => removeCreator(i)}>
                            <Trash2Icon className='size-3.5' />
                        </Button>
                    </div>
                ))}
                <div className='flex gap-2'>
                    <Input
                        placeholder='Creator name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCreator())}
                        className='flex-1'
                    />
                    <Input
                        placeholder='LinkedIn URL (optional)'
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCreator())}
                        className='flex-1'
                    />
                    <Button variant='outline' onClick={addCreator} disabled={!name.trim()}>
                        <PlusIcon className='size-4' />
                        Add
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
```

**Step 4: Render new sections in BrandingForm**

After `DosDontsSection`, add:

```tsx
<InspirationPostsSection branding={branding} onUpdate={handleUpdate} />
<InspirationCreatorsSection branding={branding} onUpdate={handleUpdate} />
```

**Step 5: Commit**

```
feat: branding - add inspiration sections and update data model
```

---

### Task 10: General - Settings Layout + Dark Mode

**Files:**

- Modify: `components/dashboard/settings-form.tsx`
- Modify: `app/dashboard/settings/page.tsx`
- Modify: `styles/globals.css`

**Step 1: Add PageHeader + scroll wrapper to settings page**

In `app/dashboard/settings/page.tsx`:

```tsx
import type { Metadata } from 'next'

import { PageHeader } from '@/components/dashboard/page-header'
import { SettingsForm } from '@/components/dashboard/settings-form'

export const metadata: Metadata = { title: 'Settings - LinkedInPreview.com' }

export default function SettingsPage() {
    return (
        <>
            <PageHeader title='Settings' />
            <div className='flex-1 overflow-y-auto'>
                <SettingsForm />
            </div>
        </>
    )
}
```

**Step 2: Update SettingsForm layout**

In `settings-form.tsx`:

- Remove the h1/description header (PageHeader handles title)
- Add `max-w-2xl` to the wrapper to match branding
- Keep the description as subtitle text under the form:

```tsx
<div className='max-w-2xl space-y-6 p-4 lg:p-6'>
    <p className='text-muted-foreground text-sm'>Manage your preferences and account data.</p>
    {/* Cards ... */}
</div>
```

**Step 3: Dark mode primary button fix**

In `styles/globals.css`, find the `.dark` section (around line 148-185) and adjust the primary color variables:

The current primary in light mode is `oklch(0.546 0.13 242.3)` (LinkedIn blue). In dark mode, use a less saturated, lighter variant:

```css
.dark {
    /* ... existing dark vars ... */
    --primary: oklch(0.65 0.15 242.3);
    --primary-foreground: oklch(0.98 0 0);
}
```

This makes the primary button slightly lighter and less intense in dark mode, with white text.

**Step 4: Dark mode audit - editor text**

In `styles/globals.css`, add TipTap dark mode fix for text visibility:

```css
.dark .tiptap {
    color: var(--foreground);
}

.dark .ProseMirror {
    color: var(--foreground);
}
```

Also check the preview area bg. In the preview panel, `bg-neutral-50` should have a dark mode equivalent. In `preview-panel.tsx`, add `dark:bg-neutral-900` (already noted in Task 7 code).

**Step 5: Commit**

```
feat: settings layout, dark mode primary button, editor text fix
```

---

### Task 11: General - Tutorial Carousel

**Files:**

- Create: `components/dashboard/tutorial-dialog.tsx`
- Modify: `app/dashboard/layout.tsx` (render tutorial)

**Step 1: Create tutorial dialog component**

Create `components/dashboard/tutorial-dialog.tsx`:

```tsx
'use client'

import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const STORAGE_KEY = 'lp-tutorial-seen'

interface Slide {
    title: string
    description: string
    videoPlaceholder: string
}

const SLIDES: Slide[] = [
    {
        title: 'Welcome to LinkedInPreview',
        description: 'Your all-in-one tool for creating, previewing, and perfecting LinkedIn posts before publishing.',
        videoPlaceholder: 'Welcome overview video',
    },
    {
        title: 'Create Posts',
        description:
            'Use the AI-powered wizard to generate posts from notes, voice, files, or URLs. Choose from multiple hooks and variants.',
        videoPlaceholder: 'Post creation demo video',
    },
    {
        title: 'Brand Your Voice',
        description:
            'Set up your personal branding - define your writing style, tone, and expertise so AI generates content that sounds like you.',
        videoPlaceholder: 'Branding setup demo video',
    },
    {
        title: 'Analyze & Improve',
        description:
            'Get instant feedback on your posts with AI-powered scoring, readability analysis, and actionable suggestions.',
        videoPlaceholder: 'Analysis demo video',
    },
]

export function TutorialDialog() {
    const [open, setOpen] = React.useState(false)
    const [current, setCurrent] = React.useState(0)

    React.useEffect(() => {
        try {
            const seen = localStorage.getItem(STORAGE_KEY)
            if (!seen) {
                setOpen(true)
            }
        } catch {}
    }, [])

    const handleClose = () => {
        setOpen(false)
        try {
            localStorage.setItem(STORAGE_KEY, 'true')
        } catch {}
    }

    const slide = SLIDES[current]

    return (
        <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
            <DialogContent className='max-w-2xl gap-0 overflow-hidden p-0'>
                <DialogTitle className='sr-only'>Tutorial</DialogTitle>

                {/* Video placeholder */}
                <div className='bg-muted flex aspect-video w-full items-center justify-center'>
                    <p className='text-muted-foreground text-sm'>{slide.videoPlaceholder}</p>
                </div>

                {/* Content */}
                <div className='space-y-4 p-6'>
                    <div>
                        <h2 className='text-xl font-semibold'>{slide.title}</h2>
                        <p className='text-muted-foreground mt-1 text-sm'>{slide.description}</p>
                    </div>

                    {/* Navigation */}
                    <div className='flex items-center justify-between'>
                        <div className='flex gap-1.5'>
                            {SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={cn(
                                        'size-2 rounded-full transition-colors',
                                        i === current ? 'bg-primary' : 'bg-muted-foreground/30',
                                    )}
                                />
                            ))}
                        </div>
                        <div className='flex items-center gap-2'>
                            {current > 0 && (
                                <Button variant='outline' size='sm' onClick={() => setCurrent(current - 1)}>
                                    <ChevronLeftIcon className='size-4' />
                                    Back
                                </Button>
                            )}
                            {current < SLIDES.length - 1 ? (
                                <Button size='sm' onClick={() => setCurrent(current + 1)}>
                                    Next
                                    <ChevronRightIcon className='size-4' />
                                </Button>
                            ) : (
                                <Button size='sm' onClick={handleClose}>
                                    Get Started
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
```

**Step 2: Render in dashboard layout**

In `app/dashboard/layout.tsx`, import and render `TutorialDialog` inside the `AuthGate` but outside the `SidebarProvider`:

```tsx
import { TutorialDialog } from '@/components/dashboard/tutorial-dialog'

// Inside the return, after </SidebarProvider> but still inside AuthGate:

;<TutorialDialog />
```

**Step 3: Commit**

```
feat: add tutorial carousel dialog for first-time dashboard visitors
```

---

### Task 12: Dark Mode Audit + Consistency Pass

**Files:**

- Various - audit and fix dark mode issues across all dashboard components

**Step 1: Audit dark mode across all dashboard pages**

Check and fix:

- Editor text color in TipTap (covered in Task 10)
- Preview panel background (`bg-neutral-50 dark:bg-neutral-900`)
- Card borders visible in both modes
- Badge variants readable in dark mode
- ToggleGroup items visible in dark mode
- Select dropdown items have proper contrast
- Label/format color dots visible in both modes
- Getting started checklist colors

**Step 2: Verify consistent layout patterns**

All pages should follow:

```
<PageHeader title="..."> ... actions ... </PageHeader>
<div className="flex-1 overflow-y-auto">
    <div className="max-w-2xl space-y-6 p-4 lg:p-6"> (for form pages)
    OR
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6"> (for list pages)
</div>
```

Editor is the exception (viewport-filling with resizable panels).

**Step 3: Commit**

```
chore: dark mode fixes and layout consistency pass
```

---

### Task 13: Final - Lint, Build, Type-Check, Verify

**Files:** None (verification only)

**Step 1: Run lint:fix**

```bash
pnpm lint:fix
```

Expected: 0 errors (warnings OK).

**Step 2: Run type-check**

```bash
pnpm type-check
```

Expected: Only pre-existing errors in `icon.tsx`, `mdx/pre.tsx`, `tool/utils.ts`.

**Step 3: Run build**

```bash
pnpm clean && pnpm build
```

Expected: Build succeeds, all routes generated.

**Step 4: Commit any fixes**

```
chore: lint and build fixes for dashboard polish
```
