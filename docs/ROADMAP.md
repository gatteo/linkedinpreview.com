# Roadmap

## Principles

- Foundation first (dashboard shell, auth, persistence), then content creation features, then platform features
- Each wave produces a deployable increment
- Later waves can be re-scoped without affecting earlier ones
- Core features stay free and login-free; login only for LinkedIn API features (Wave 4+)

---

## Wave 0: Dashboard Foundation & Branding - COMPLETE

### Goal

Transform from a single-page tool into a proper app with dashboard, multi-draft management, branding settings, and Supabase persistence.

### Features

| ID      | Feature Spec                               | Status | Notes                                                                                   |
| ------- | ------------------------------------------ | ------ | --------------------------------------------------------------------------------------- |
| 060     | App shell with sidebar navigation          | Done   | shadcn SidebarProvider, inset variant                                                   |
| 028     | Homepage quick-start tool                  | Done   | Stays as-is; dashboard is the full-featured app                                         |
| 062     | Multi-draft management                     | Done   | Statuses: draft / scheduled / published                                                 |
| 064     | Draft labels                               | Done   | Content format categorization                                                           |
| 080-090 | Branding page                              | Done   | Profile, positioning, role, expertise, writing style, footer, knowledge base, dos/donts |
| 100     | Settings page                              | Done   | Theme toggle, reset all data                                                            |
| 061     | Supabase anonymous auth                    | Done   | Anonymous session on first visit, RLS-protected tables                                  |
| 030-034 | AI chat, generation, analysis, suggestions | Done   | Pre-existing; now integrated with dashboard                                             |

### Dependencies

None - this was the first wave.

---

## Wave 1: Smart Content Creation - COMPLETE

### Goal

Make post creation intelligent with AI that knows your brand, suggests hooks, scores content in real-time, and can generate posts from any input type.

### Features

| ID      | Feature Spec                        | Status  | Notes                                                                   |
| ------- | ----------------------------------- | ------- | ----------------------------------------------------------------------- |
| 038-040 | AI post generation from any source  | Done    | Notes, voice (Web Speech API), file (PDF/DOCX/TXT/MD), URL extraction   |
| 035     | AI hook suggestions                 | Done    | 4 personalized hooks per post via creation wizard + editor quick action |
| 050-056 | Content scoring panel               | Done    | Readability, writing flow, hashtags, length                             |
| 034     | Smart suggestions                   | Done    | AI-driven inline improvement suggestions                                |
| 032     | Quick AI actions                    | Done    | Shorten, lengthen, variation, restyle                                   |
| 064     | Post labels with AI auto-suggestion | Partial | AI auto-suggests at wizard time; manual label picker not in editor UI   |

### Dependencies

Wave 0 complete.

---

## Wave 2: Content Strategy - COMPLETE

### Goal

Help users build and follow a LinkedIn content strategy with goals, audience, posting frequency, and format mix.

### Features

| ID  | Feature Spec                   | Status | Notes                                                |
| --- | ------------------------------ | ------ | ---------------------------------------------------- |
| 200 | Content strategy wizard        | Done   | Role, goals, audience, expertise, frequency, formats |
| 201 | Content strategy dashboard     | Done   | Monthly progress tracking                            |
| 202 | Weekly AI-generated post ideas | Done   | Based on strategy + branding                         |

### Dependencies

Wave 0 (branding) + Wave 1 (post labels).

---

## Wave 3: Carousel & Visual Content

### Goal

Add a carousel/document creator for high-engagement visual LinkedIn content.

### Features

| ID  | Feature Spec          | Notes                                                  |
| --- | --------------------- | ------------------------------------------------------ |
| 210 | Carousel slide editor | Real-time preview alongside post preview               |
| 211 | Carousel templates    | 10+ templates                                          |
| 210 | Design controls       | Colors, fonts, branding applied from branding settings |
| 212 | Export                | PDF / PNG / ZIP                                        |

### Dependencies

Wave 0 (dashboard exists). Can run in parallel with Wave 1 and Wave 2.

---

## Wave 4: Scheduling & Publishing

### Goal

Close the biggest feature gap - direct LinkedIn scheduling and publishing. This is where login becomes necessary.

### Features

| ID  | Feature Spec                      | Notes                                                           |
| --- | --------------------------------- | --------------------------------------------------------------- |
| 220 | LinkedIn OAuth integration        | Login required; replaces anonymous auth for scheduling features |
| 221 | One-click publish to LinkedIn     | Post directly from the editor                                   |
| 222 | Post scheduling                   | Timezone support                                                |
| 223 | Content calendar                  | Month and week views                                            |
| 224 | Best time to post recommendations | Based on LinkedIn engagement data                               |

### Dependencies

Wave 0 + Wave 1. LinkedIn API approval must be applied for during Wave 2.

---

## Wave 5: Analytics & Insights

### Goal

Deep LinkedIn performance insights without expensive tools.

### Features

| ID  | Feature Spec | Notes                                                                                                            |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| 230 | Analytics    | Post performance, engagement trends, content insights (top formats, best hooks, optimal length), reach in editor |

### Dependencies

Wave 4 (requires LinkedIn API access).

---

## Wave 6: Advanced & Scale

### Goal

Polish, extend, and prepare for growth beyond solo creators.

### Features

| ID  | Feature Spec        | Notes                                                      |
| --- | ------------------- | ---------------------------------------------------------- |
| 240 | Team collaboration  | Shared drafts, comment/review workflow                     |
| 241 | Chrome extension    | Write and preview from anywhere                            |
| 242 | Content repurposing | Turn a post into a carousel, thread, or newsletter section |
| 244 | Integrations        | Notion, Slack, Zapier                                      |
| 243 | Inspiration library | Curated high-performing posts by format                    |

### Dependencies

All previous waves.

---

## SEO Pages - Parallel Track

### Goal

Public-facing content pages for organic traffic. Can ship alongside any wave.

### Features

| ID  | Feature Spec             | Notes                   |
| --- | ------------------------ | ----------------------- |
| 007 | Hook template library    | `/templates/hooks`      |
| 008 | CTA template library     | `/templates/ctas`       |
| 009 | Post structure templates | `/templates/structures` |

### Dependencies

None.

---

## Backlog / Future

| Idea                                  | Why Deferred                                    | Revisit When                               |
| ------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Mobile native app                     | Web-first approach, no demand signal yet        | After Wave 5, if user requests justify it  |
| Multi-platform posting (X, Instagram) | LinkedIn focus is the differentiator            | After Wave 5, based on user demand         |
| Paid tier / premium features          | Free-first positioning is competitive advantage | Only if server costs require it            |
| Real-time collaboration               | Complexity outweighs benefit for solo creators  | After team features (Wave 6) are validated |
| CRM / contact management              | Out of product scope                            | Never - not our product                    |
