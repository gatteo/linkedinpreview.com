<p align="center">
  <img alt="LinkedIn Preview - write, format, preview, and publish better LinkedIn posts" src="https://linkedinpreview.com/images/og/og.png">
</p>

<h1 align="center">LinkedIn Preview</h1>

<p align="center">
  The most powerful free LinkedIn content tool: write, format, preview, audit, schedule, and publish better LinkedIn posts - no signup required.
</p>

<p align="center">
  <a href="https://linkedinpreview.com"><strong>linkedinpreview.com</strong></a> ·
  <a href="https://linkedinpreview.com/blog">Blog</a> ·
  <a href="https://linkedinpreview.com/changelog">Changelog</a>
</p>

<p align="center">
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-black">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61dafb">
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind-4-38bdf8">
</p>

## What is this?

LinkedIn's native editor gives you no preview, no drafts, no formatting, and no feedback. LinkedIn Preview fixes all of that - and has grown from a formatting tool into a full, open-source LinkedIn content platform. The core editor stays free and login-free forever: accounts are anonymous by default, and you can bind an email or connect LinkedIn whenever you want cross-device sync, scheduling, and one-click publishing.

## ✨ Features

### ✍️ Editor & live preview (free, no login)

- Rich text editor with Unicode **bold**, _italic_, underline, strikethrough, bullet and numbered lists
- Pixel-accurate live preview on mobile, tablet, and desktop widths - including the "see more" truncation exactly where LinkedIn cuts it
- Realistic feed preview: see your post surrounded by feed posts, like it will actually appear
- Image and video upload, copy-to-clipboard in LinkedIn-ready format, shareable draft URLs
- Embeddable widget variant for third-party sites

### 🤖 AI writing tools

- Generate posts from a topic, your notes, your voice (audio), a file, or any URL
- AI chat assistant, quick actions (shorten, lengthen, variations), hook generation, and inline suggestions
- AI post analysis with quality scores, plus client-side scoring: readability, sentence flow, length status, character/word/line/hashtag/emoji counts
- Branding-aware generation: your positioning, expertise, writing style, dos and don'ts, and knowledge base are injected into every prompt

### 🔍 LinkedIn audit & personalized plan

- Connect your profile (OAuth, URL, or just your name) and get a real audit of your recent posts: content mix, hooks, CTAs, engagement by category, topics you cover, and the gaps that matter for your goal
- Every number is measured server-side from scraped data - the AI only labels, it never invents metrics
- The audit feeds a personalized content plan with pillar post ideas generated in your voice

### 🗂 Dashboard & workflow

- Multi-draft management with statuses, format labels, filtering, and 2-second auto-save (Supabase-backed)
- Post scheduling, content calendar, best-time-to-post, and one-click publishing via LinkedIn OAuth
- Carousel creator: drag-and-drop slide editor with 14 templates, 11 themes, AI generation, and watermark-free PDF/PNG export
- Content strategy wizard with weekly AI post ideas
- LinkedIn analytics import and performance insights
- Light/dark mode, anonymous-first auth with optional email (OTP) or LinkedIn account binding

### 🌐 Public site & SEO

- MDX blog, changelog, and comparison pages via Contentlayer
- SEO infrastructure: metadata, JSON-LD, sitemap, RSS feed, llms.txt
- Lighthouse score near 100

## 💫 Tech stack

- ⚡️ Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict
- 🎨 Tailwind CSS 4 + shadcn/ui + Radix UI + Framer Motion
- 📝 TipTap rich text editor · MDX + Contentlayer for content
- 🗄 Supabase (anonymous-first auth, Postgres with RLS)
- 🧠 Vercel AI SDK v6 for all AI endpoints
- 💳 Stripe (hosted checkout, monthly and lifetime plans)
- 📊 PostHog (EU, reverse-proxied) + server-side event capture
- 🛡 t3-env validated environment, ESLint 9 flat config, Prettier, Husky
- ▲ Deployed on Vercel

## 🔨 Requirements

- Node `20.x` or newer (`<25`)
- pnpm `9.x`

## 👋 Getting started

```bash
git clone https://github.com/gatteo/linkedinpreview.com.git
cd linkedinpreview.com
pnpm install
cp .env.example .env   # fill in the required values
pnpm dev
```

The app runs at `localhost:3000`. Useful scripts:

| Command           | What it does                               |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Contentlayer + Next dev server (Turbopack) |
| `pnpm build`      | Production build (contentlayer, then next) |
| `pnpm lint`       | ESLint                                     |
| `pnpm type-check` | TypeScript check                           |
| `pnpm format`     | Prettier                                   |

## 📜 Documentation

The `docs/` folder is kept in sync with the code:

- **[PRODUCT.md](docs/PRODUCT.md)** - every feature with its spec and honest status
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - system architecture, tech decisions, build pipeline
- **[CHANGELOG.md](docs/CHANGELOG.md)** - dated engineering history

## Author

[@gatteo](https://github.com/gatteo)

## 🪪 License

This project is open source and available under the [MIT License](LICENSE).

<hr>
<p align="center">
Made with ❤️ in Turin, Italy
</p>
