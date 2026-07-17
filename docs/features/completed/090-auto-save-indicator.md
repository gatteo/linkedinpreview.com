# 090 — Auto-Save Indicator

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

## What

- Every edit on the Branding page persists automatically to Supabase in the
  background. After any change, an "All changes saved" indicator with a green
  checkmark fades in for two seconds, then fades out. No explicit save button.

## Why

- Reassures the user that branding edits are stored without a manual save step.

## Acceptance (binary, testable)

- [x] 090-AC-1 The indicator reads "All changes saved" with a green checkmark. _(verified: `components/dashboard/branding/branding-form.tsx:29-31`; `text-green-500` check icon and the label)_
- [x] 090-AC-2 The indicator appears after a change and hides after 2 seconds. _(verified: `components/dashboard/branding/branding-form.tsx:54-62`; `setShowSaved(true)` then `setTimeout(..., 2000)`)_
- [x] 090-AC-3 Every section change triggers a persist call. _(verified: all ten sections call `handleUpdate` at `components/dashboard/branding/branding-form.tsx:77-86`, which calls `updateBranding`)_
- [x] 090-AC-4 Changes are persisted to Supabase automatically (no save button). _(verified: `hooks/use-branding.ts:38-52` upserts on every update; `lib/supabase/branding.ts:48-54` writes to the `branding` table)_
- [x] 090-AC-5 A save failure surfaces an error toast. _(verified: `hooks/use-branding.ts:44-46`)_

## Implementation

- Indicator + timer: `components/dashboard/branding/branding-form.tsx:22-33,49-68`
- Persistence hook: `hooks/use-branding.ts:38-54`
- Supabase upsert: `lib/supabase/branding.ts:48-54`

## Dependencies

- All branding features 080-089 (they share this persistence path).
- Auth provider for `userId`/`supabase` (`components/dashboard/auth-provider`).

## Open questions / known gaps

- The indicator is purely time-based: it shows immediately on edit and hides
  after 2s regardless of whether the background upsert actually succeeded. It
  reflects "change attempted", not confirmed write completion (failures show a
  separate error toast).
