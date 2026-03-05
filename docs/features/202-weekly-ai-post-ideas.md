# Feature 202: Weekly AI Post Ideas

## Goal

Remove the blank-page problem by giving users AI-generated post ideas tailored to their strategy and brand.

## Description

Each week, AI generates a set of post ideas based on the user's content strategy (200) and branding settings. Ideas include a suggested topic, format label, and a one-line hook. Users can click an idea to start a new draft pre-filled with the hook, or dismiss ideas they're not interested in.

## Acceptance Criteria

- [x] AI generates 5-7 post ideas per week
- [x] Ideas reflect the user's strategy, branding, and recent posting history
- [x] User can click an idea to create a new draft with the hook pre-filled
- [x] User can dismiss ideas
- [x] Ideas refresh weekly
- [x] Handles case where no strategy is set up (prompt to complete wizard)

## Technical Notes

- Ideas generated via `/api/generate` with a new action (e.g. `ideas`) or a dedicated endpoint
- Input context: strategy (goals, audience, format targets), branding (positioning, expertise, style), recent drafts (to avoid repetition)
- Output: array of 5-7 ideas, each with `{ topic, format, hook, reasoning }`
- Ideas stored in Supabase (new table or jsonb on strategy) with a weekly timestamp
- Generate on-demand when user visits the ideas section, cached for the week
- Rate limit: counts as a wizard action or has its own limit
- UI: card list on the strategy dashboard or a dedicated section
