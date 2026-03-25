# Feature 243: Inspiration Library

## Goal

Give users a curated collection of high-performing LinkedIn posts to learn from and draw inspiration.

## Description

A browsable library of curated, high-performing LinkedIn posts organized by format (storytelling, listicle, case study, etc.). Each entry shows the post content, format label, and what makes it effective (hook analysis, structure breakdown). Users can use a post as a template to start a new draft.

## Acceptance Criteria

- [ ] Library shows curated high-performing posts
- [ ] Posts are categorized by format
- [ ] Each post includes analysis of what makes it effective
- [ ] User can filter/browse by category
- [ ] "Use as template" creates a new draft with the structure pre-filled
- [ ] Library is regularly updated with new examples

## Technical Notes

- Data source: curated static dataset (not scraped - manually selected and anonymized or attributed)
- Stored as a static config file or MDX content
- Browseable UI with format/category filters
- Each entry: `{ id, content, format, analysis, author (optional attribution) }`
- "Use as template" CTA creates a new draft with the post structure (not the content) pre-filled
- Could be a dashboard page or a public SEO page (evaluate which drives more value)
- If public, needs full SEO metadata
