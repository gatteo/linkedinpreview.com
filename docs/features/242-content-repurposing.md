# Feature 242: Content Repurposing

## Goal

Help users get more value from their content by converting posts into other formats.

## Description

AI-powered conversion of existing LinkedIn posts into other content formats: carousels (using 210), Twitter/X threads, newsletter sections, or blog outlines. Users select a post and choose a target format. AI restructures the content to fit the new format.

## Acceptance Criteria

- [ ] User can select "Repurpose" from a post's actions
- [ ] At least 3 target formats available (carousel, thread, newsletter)
- [ ] AI converts the content to the selected format
- [ ] Carousel output opens in the carousel editor
- [ ] Other formats create new drafts
- [ ] Original post is preserved (not modified)

## Technical Notes

- UI: "Repurpose" action in the post actions dropdown or editor toolbar
- Format options: carousel slides, thread (multi-part), newsletter section, blog outline
- AI conversion via `/api/generate` with a new action (e.g. `repurpose`) and target format parameter
- Carousel output feeds into the carousel editor (210)
- Thread output creates multiple linked text blocks
- Input: existing draft content + branding context
- Rate limit: counts as a quick action (10/day)
