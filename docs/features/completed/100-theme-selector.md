# 100 — Theme Selector

> Status: SHIPPED · Area: Settings · Last verified: 2026-06-14

## What

- The settings Appearance card offers three icon buttons (Light, Dark, System), each with its own
  icon. The active option is highlighted, and the choice is applied and persisted through
  `next-themes`.

## Why

- A clear, one-click theme control lets users match the dashboard to their environment and have
  that preference remembered across visits.

## Acceptance (binary, testable)

- [x] 100-AC-1 Three options are offered: Light, Dark, System. _(verified: `components/dashboard/settings-form.tsx:23-27`)_
- [x] 100-AC-2 Each option has its own icon (Sun/Moon/Monitor). _(verified: `components/dashboard/settings-form.tsx:23-27`, `:4` imports)_
- [x] 100-AC-3 The active theme is visually highlighted. _(verified: `components/dashboard/settings-form.tsx:71` variant switches on `theme === value`)_
- [x] 100-AC-4 Selecting an option applies and persists it via `next-themes` `setTheme`. _(verified: `components/dashboard/settings-form.tsx:31` `useTheme`, `:73` `setTheme(value)`)_

## Implementation

- Selector buttons: `components/dashboard/settings-form.tsx:66-80`.
- Persistence handled by the `next-themes` provider in `app/dashboard/layout.tsx:26`.

## Dependencies

- 069 Dark Mode (the underlying theming system and provider scope).

## Open questions / known gaps

- None observed.
