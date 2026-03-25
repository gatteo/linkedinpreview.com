# LinkedInPreview.com

The most powerful, free LinkedIn content creation and preview tool. No signup required.

## Documents

| #   | Document                               | Description                                                 |
| --- | -------------------------------------- | ----------------------------------------------------------- |
| 1   | [PRODUCT.md](./PRODUCT.md)             | Vision, target users, features, user flows                  |
| 2   | [TECH_STACK.md](./TECH_STACK.md)       | Technology choices, packages, services                      |
| 3   | [ARCHITECTURE.md](./ARCHITECTURE.md)   | System design, data models, APIs, auth                      |
| 4   | [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Visual identity, colors, typography, components             |
| 5   | [ROADMAP.md](./ROADMAP.md)             | Implementation waves with scope and acceptance criteria     |
| 6   | [CONVENTIONS.md](./CONVENTIONS.md)     | Coding standards, patterns, rules for the implementer       |
| -   | [features/](./features/)               | Individual feature specs (see `000-TEMPLATE.md` for format) |

## Reading Order Per Wave

| Wave                              | Read these docs                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Wave 1: Smart Content Creation    | PRODUCT (features + user flows), TECH_STACK (AI packages), ARCHITECTURE (API routes + rate limits), CONVENTIONS (full), feature specs for Wave 1 |
| Wave 2: Content Strategy          | ROADMAP (wave 2), PRODUCT (planned features), feature specs for Wave 2                                                                           |
| Wave 3: Carousel & Visual Content | ROADMAP (wave 3), DESIGN_SYSTEM (components), feature specs for Wave 3                                                                           |
| Wave 4: Scheduling & Publishing   | ROADMAP (wave 4), ARCHITECTURE (auth + data models), feature specs for Wave 4                                                                    |
| Wave 5+: Analytics & Beyond       | ROADMAP (waves 5-6), feature specs as needed                                                                                                     |
| SEO Pages: Templates              | ROADMAP (SEO parallel track), DESIGN_SYSTEM (typography + layout), feature specs                                                                 |

## Key Constraints

- **SEO is the primary traffic source.** Organic search on Google drives the majority of users. Every new feature, page, or architectural change must preserve or improve SEO positioning. Never break existing URLs, always generate proper metadata, and keep Core Web Vitals healthy.
- Must be fully responsive (mobile-first, 375px minimum)
- Core editor must work without any login or signup
- All user data persisted via Supabase anonymous auth (no email required)
- No paid tier - all features are free
- No em dashes in copy/text - use single hyphens
- TypeScript strict mode, `pnpm type-check` must pass before merging
- Tailwind CSS v4 only (no tailwind.config.ts, all config in globals.css)

## Glossary

| Term            | Definition                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| Draft           | A LinkedIn post in progress, stored as TipTap JSON in the `drafts` table                                              |
| Branding        | User profile, positioning, writing style, and AI context preferences stored in a single jsonb column                  |
| Feed preview    | A simulated LinkedIn feed showing the user's post in context with placeholder posts - unique to this product          |
| Anonymous auth  | Supabase `signInAnonymously` - creates a persistent user identity without email, password, or any visible signup flow |
| Content scoring | Client-side analysis of a post's readability, sentence flow, hashtag count, and length (no API calls)                 |
| Quick actions   | One-click AI transformations: shorten, lengthen, create variation, restyle                                            |
| Wave            | A self-contained increment of the product roadmap, each producing a deployable release                                |
| Hook            | The opening line(s) of a LinkedIn post designed to stop the scroll and compel reading                                 |
| CTA             | Call-to-action - the closing line(s) of a post that prompt the reader to take an action                               |
