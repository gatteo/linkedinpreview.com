# Feature 241: Chrome Extension

## Goal

Let users preview and format LinkedIn posts directly from LinkedIn.com without switching tabs.

## Description

A Chrome extension that adds a preview overlay on LinkedIn.com. Users can format text with Unicode styles, see a live preview of their post, and save posts from their feed to the LinkedInPreview dashboard for inspiration. Quick access to the full editor via the extension popup.

## Acceptance Criteria

- [ ] Extension installs from Chrome Web Store
- [ ] Preview overlay appears when composing a post on LinkedIn
- [ ] Unicode formatting toolbar is available in the overlay
- [ ] Users can save posts from their feed to the dashboard
- [ ] Extension syncs with the user's Supabase account
- [ ] Popup provides quick access to the full editor

## Technical Notes

- Chrome Extension Manifest V3
- Content script injected on linkedin.com pages
- Preview overlay: renders the same preview component used in the web app
- Communication with the web app: use extension messaging to sync drafts with Supabase
- Auth: extension authenticates with the same Supabase session (share cookies or use a token)
- Popup UI: quick formatting toolbar, link to full editor
- Feed saving: detect post content on LinkedIn feed, save to drafts as "inspiration"
- Consider Firefox extension support as a follow-up
