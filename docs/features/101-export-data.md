# Feature 101: Export Data

## Goal

Let users download a backup of all their data so they never lose their work.

## Description

A button on the Settings page that exports all user data (posts, branding, settings) as a single JSON file. The export includes all drafts with their content, metadata, and labels, plus the full branding configuration. Downloaded as a timestamped `.json` file.

## Acceptance Criteria

- [ ] Export button is visible on the Settings page
- [ ] Clicking export downloads a JSON file with all drafts and branding data
- [ ] Export file includes a version number for future migration compatibility
- [ ] Loading state shown while fetching data
- [ ] Toast confirmation on successful export
- [ ] Error toast if export fails

## Technical Notes

- Client-side export: fetch all data from Supabase, serialize to JSON, trigger browser download
- Use `useAuth()` to get the Supabase client and userId
- Fetch drafts via `lib/supabase/drafts.ts` and branding via `lib/supabase/branding.ts`
- Export format: `{ version: 1, exportedAt: ISO string, drafts: Draft[], branding: BrandingData }`
- File name: `linkedinpreview-export-YYYY-MM-DD.json`
- Button in the Settings page (100) below the theme selector
- No server-side route needed - all data is already accessible client-side via RLS
