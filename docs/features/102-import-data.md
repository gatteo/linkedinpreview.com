# Feature 102: Import Data

## Goal

Let users restore their data from a previously exported JSON backup.

## Description

A button on the Settings page that lets users upload a JSON export file (from 101) and restore their drafts and branding data. Includes a confirmation dialog before overwriting existing data. Supports the export format version for forward compatibility.

## Acceptance Criteria

- [ ] Import button is visible on the Settings page
- [ ] Clicking import opens a file picker for JSON files
- [ ] Invalid files show a descriptive error toast
- [ ] Confirmation dialog shown before overwriting data
- [ ] Drafts and branding are restored from the file
- [ ] Toast confirmation on successful import
- [ ] Existing data is replaced (not merged)

## Technical Notes

- Client-side import: file input, parse JSON, validate schema, upsert to Supabase
- Validate the export file against the expected schema (version, drafts array, branding object)
- Use Zod for schema validation of the import file
- Confirmation dialog: "This will replace all your current data. Are you sure?"
- Upsert drafts and branding via existing Supabase CRUD functions
- Handle version migration if format changes in the future
- Button in the Settings page (100) next to the export button
