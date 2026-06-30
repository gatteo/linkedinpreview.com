# 082 — Role Selection

> Status: SHIPPED · Area: Branding · Last verified: 2026-06-14

## What

- A single-select dropdown on the Branding page where the user picks one role
  from a fixed list. The selected role persists to the branding record and is
  passed to AI generation as part of the assembled branding context.

## Why

- The role lets the AI tailor tone and topic choices to the user's professional
  context (a founder versus an employee versus an agency).

## Acceptance (binary, testable)

- [x] 082-AC-1 Role is a single-select control (not multi-select). _(verified: `components/dashboard/branding/role-section.tsx:25-36` uses a single-value Select)_
- [x] 082-AC-2 The options are exactly Founder/C-Level, Freelancer, Team Lead, Employee, Creator, Consultant, Agency. _(verified: `components/dashboard/branding/role-section.tsx:7-15`)_
- [x] 082-AC-3 The selected role persists to `branding.role`. _(verified: `components/dashboard/branding/role-section.tsx:25`, schema at `lib/branding.ts:19-27`)_
- [x] 082-AC-4 The role is included in the AI branding context. _(verified: `lib/ai-branding.ts:13-15` pushes `Role: ...`)_

## Implementation

- UI and option list: `components/dashboard/branding/role-section.tsx`
- Schema type `BrandingRole`: `lib/branding.ts:19-27`
- AI bridge: `lib/ai-branding.ts:13-15`

## Dependencies

- 037 branding-aware AI.

## Open questions / known gaps

- Role is stored as a slug (e.g. `founder`) and the raw slug, not the human
  label, is what reaches the AI context.
