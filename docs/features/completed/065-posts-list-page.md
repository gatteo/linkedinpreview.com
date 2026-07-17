# 065 — Posts List Page

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- The dashboard home (`/dashboard`) lists all posts in a TanStack React Table with columns for
  title, format label, status badge, and last-modified (relative time), plus a per-row actions
  dropdown (edit, duplicate, delete). Users can search posts by title, filter by status and by
  format, page through results, and see a friendly empty state with a New Post call to action when
  there are no posts.

## Why

- A single sortable, filterable inventory of posts is the user's hub for managing their content
  and jumping into the editor.

## Acceptance (binary, testable)

- [x] 065-AC-1 The list is rendered with TanStack `useReactTable`. _(verified: `components/dashboard/posts-table.tsx:250-265`)_
- [x] 065-AC-2 Columns include title, format label, status badge, and modified (relative) date. _(verified: `components/dashboard/posts-table.tsx:166-217`; relative date via `lib/format-date.ts`)_
- [x] 065-AC-3 Each row has an actions dropdown with Edit, Duplicate, Delete. _(verified: `components/dashboard/posts-table.tsx:80-104`)_
- [x] 065-AC-4 Posts can be searched by title. _(verified: `components/dashboard/posts-list.tsx:110-113`)_
- [x] 065-AC-5 Posts can be filtered by status and by format. _(verified: `components/dashboard/posts-list.tsx:102-108`)_
- [x] 065-AC-6 The table paginates (page size 10, prev/next controls). _(verified: `components/dashboard/posts-table.tsx:264` page size, `:363-389` controls)_
- [x] 065-AC-7 An empty state shows a New Post CTA when there are no posts. _(verified: `components/dashboard/posts-list.tsx:50-62`, rendered at `:203-204`)_

## Implementation

- Page: `app/dashboard/page.tsx` renders `PostsList` inside Suspense.
- Container with filters/search/empty-state: `components/dashboard/posts-list.tsx:91-213`.
- Table (columns, actions, pagination, bulk delete): `components/dashboard/posts-table.tsx`.
- Relative date helper: `lib/format-date.ts`.

## Dependencies

- 062 Multi-Draft Management, 063 Post Statuses, 064 Post Format Labels (column data sources).
- 067 New Post Creation Wizard (the New Post CTA opens it).

## Open questions / known gaps

- The table also includes a "Score" column that always renders "-" (`components/dashboard/posts-table.tsx:204-209`), a placeholder not part of the documented columns.
- A row-selection / bulk-delete affordance exists (`components/dashboard/posts-table.tsx:142-165`, `:271-307`) beyond the documented scope.
