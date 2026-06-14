# 060 — Dashboard Shell

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- The dashboard wraps every authenticated page in a persistent shell: a collapsible left
  sidebar (built on shadcn `SidebarProvider` with the `inset` variant) plus an inset content
  area. The sidebar lists recent posts, tools, personalization links, and bottom navigation. It
  can be toggled with Cmd+B (Ctrl+B on Windows). On mobile it becomes an offcanvas sheet. The
  whole shell is centered in a `max-w-[1500px]` wrapper.

## Why

- A consistent navigation chrome lets users move between posts, editor, branding, strategy, and
  settings without losing context, and keeps the workspace usable on both desktop and mobile.

## Acceptance (binary, testable)

- [x] 060-AC-1 The shell uses shadcn `SidebarProvider` and `SidebarInset` to lay out the sidebar and content. _(verified: `app/dashboard/layout.tsx:30-44`)_
- [x] 060-AC-2 The sidebar is rendered with the `inset` variant. _(verified: `app/dashboard/layout.tsx:39`)_
- [x] 060-AC-3 The sidebar is collapsible (default `offcanvas`) via the shadcn Sidebar component. _(verified: `components/ui/sidebar.tsx:140`)_
- [x] 060-AC-4 Cmd+B / Ctrl+B toggles the sidebar. _(verified: `components/ui/sidebar.tsx:88-90` with shortcut constant at `components/ui/sidebar.tsx:22`)_
- [x] 060-AC-5 On mobile the sidebar renders as an offcanvas Sheet. _(verified: `components/ui/sidebar.tsx:165-184`)_
- [x] 060-AC-6 The shell is centered inside a `max-w-[1500px]` wrapper. _(verified: `app/dashboard/layout.tsx:29`)_

## Implementation

- `app/dashboard/layout.tsx:24-54` composes `ThemeProvider` > `AuthProvider` > `AuthGate` > max-width wrapper > `SidebarProvider` > `DashboardSidebar` + `SidebarInset`.
- `components/dashboard/dashboard-sidebar.tsx:41-230` builds the sidebar groups (Posts, Tools, Personalization, bottom nav).
- `components/ui/sidebar.tsx` provides the shadcn primitives: keyboard shortcut (`:22`, `:88`), mobile Sheet (`:165`), collapsible offcanvas (`:140`, `:192-216`).

## Dependencies

- 061 Anonymous Auth (AuthProvider/AuthGate gate the shell).
- 069 Dark Mode (ThemeProvider wraps the shell).
- See [ARCHITECTURE.md](../../ARCHITECTURE.md) for the dashboard layout structure.

## Open questions / known gaps

- Several sidebar tools (Carousel, Calendar, Analytics, Inspiration) are disabled placeholders marked "Soon" (`components/dashboard/dashboard-sidebar.tsx:124-151`); they are intentionally not part of this shell feature.
