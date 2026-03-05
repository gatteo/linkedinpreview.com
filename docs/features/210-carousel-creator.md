# Feature 210: Carousel Creator

## Goal

Enable users to create high-engagement LinkedIn carousel (document) posts with a visual slide editor.

## Description

A slide-based editor for creating LinkedIn carousel posts. Users add/remove/reorder slides, edit text and layout per slide, and see a real-time preview of how the carousel will look on LinkedIn. Carousels are stored as drafts alongside regular posts. The editor supports branding colors and fonts from the user's branding settings.

## Acceptance Criteria

- [ ] User can create a new carousel from the dashboard
- [ ] Slide editor supports adding, removing, and reordering slides
- [ ] Each slide has editable text content and layout options
- [ ] Real-time preview shows how the carousel looks on LinkedIn
- [ ] Branding colors and fonts are applied from settings
- [ ] Carousels are saved to Supabase as drafts
- [ ] Mobile-responsive editor layout

## Technical Notes

- New editor mode or page within the dashboard (could be a tab in `/dashboard/editor` or a separate route)
- Slide data model: array of slides, each with `{ id, content (rich text or structured blocks), layout, background }`
- Carousel stored in the drafts table with a `type: 'carousel'` field or a separate table
- Canvas rendering: consider html2canvas, dom-to-image, or a canvas-based approach for export
- Preview: render slides as they would appear in LinkedIn's document viewer
- Design controls (colors, fonts) pull from branding settings (080-090)
- Must support both creating new carousels and editing existing ones
- Client-heavy component - dynamically import with `ssr: false`
