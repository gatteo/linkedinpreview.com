# 069 — Dark Mode

> Status: SHIPPED · Area: Dashboard · Last verified: 2026-06-14

## What

- The dashboard supports light, dark, and system themes via `next-themes`. The theme provider is
  scoped to the dashboard only, so the public homepage always renders light. Users pick their
  preference from the appearance selector in dashboard settings.

## Why

- Dark mode is a comfort and accessibility expectation for a tool people use for long writing
  sessions, while keeping the marketing site visually consistent.

## Acceptance (binary, testable)

- [x] 069-AC-1 Theming uses `next-themes` with a class attribute, system default, and system support. _(verified: `app/dashboard/layout.tsx:26` `<ThemeProvider attribute='class' defaultTheme='system' enableSystem>`)_
- [x] 069-AC-2 The theme provider is scoped to the dashboard layout only. _(verified: `ThemeProvider` is in `app/dashboard/layout.tsx:26`; the root `app/layout.tsx` has no ThemeProvider, so the homepage is not themed)_
- [x] 069-AC-3 Light, dark, and system options are selectable. _(verified: `components/dashboard/settings-form.tsx:23-27` THEME_OPTIONS)_
- [x] 069-AC-4 The selector lives in dashboard settings. _(verified: `components/dashboard/settings-form.tsx:60-81` Appearance card; rendered via `app/dashboard/settings/page.tsx`)_

## Implementation

- Provider scope: `app/dashboard/layout.tsx:26` (root `app/layout.tsx` deliberately omits it).
- Theme selector: `components/dashboard/settings-form.tsx:23-81` using `useTheme()`.

## Dependencies

- 060 Dashboard Shell, 100 Theme Selector (the settings control), 103 Reset All Data (shares the settings page).

## Open questions / known gaps

- None observed.
