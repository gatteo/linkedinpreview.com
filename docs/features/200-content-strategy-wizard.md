# Feature 200: Content Strategy Wizard

## Goal

Help users define a LinkedIn content strategy so AI can generate more relevant, on-brand content ideas.

## Description

A guided multi-step wizard that walks users through setting up their content strategy: role, goals, target audience, expertise areas, posting frequency, and preferred content formats. The strategy is saved to Supabase and used by AI features to generate personalized post ideas and recommendations.

## Acceptance Criteria

- [x] Multi-step wizard with clear progress indication
- [x] User can set goals, audience, posting frequency, and format preferences
- [x] Strategy is persisted to Supabase
- [x] Strategy can be edited after initial setup
- [x] Wizard is accessible from the dashboard sidebar
- [x] Mobile-responsive layout

## Technical Notes

- New dashboard page at `/dashboard/strategy` or modal wizard triggered from dashboard
- Multi-step form: role (reuse 082), goals (multi-select), audience definition, frequency (posts/week), format mix (from POST_FORMATS)
- Strategy stored in a new Supabase table or as a jsonb column on the branding table
- RLS policy: users can only access their own strategy
- Strategy data consumed by 202 (weekly post ideas) and AI generation prompts
- Consider reusing branding fields where there's overlap (role, expertise)
