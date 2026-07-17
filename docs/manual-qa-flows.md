# Manual QA - Go-Live Flow Tests

A hands-on checklist to verify each shipped feature works end to end with real data. Organized by macro flow. Not exhaustive: each flow lists what to test, how to test it, and the expected outcome. Mark PASS / FAIL / BLOCKED as you go.

## Pre-flight (do this first)

Several flows silently disable themselves when their env vars are missing. Confirm these are set in the environment you're testing, or the relevant flows will not appear:

- AI features: `LLM_API_KEY` (required, app won't boot without it)
- Publishing: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_TOKEN_ENC_KEY`
- Scheduling / account switch / webhooks: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_LIFETIME`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Analytics sync (optional): `LINKEDIN_ANALYTICS_CLIENT_ID/SECRET`
- Onboarding enrichment (optional, two tiers): `SCRAPINGDOG_API_KEY` (fast Mirror fetch; without it the
  direct JSON-LD fetch works locally but is usually blocked on Vercel) and `BRIGHTDATA_API_KEY` (rich
  async scrape powering the insight cards). Migration `020_onboarding_sessions.sql` must be applied.

Notes: the dashboard uses anonymous Supabase auth, so there is no login screen. To re-run onboarding from scratch, use Settings -> Reset All Data.

---

## Flow 1: Onboarding (URL path with the full enrichment pipeline)

What to test: a brand-new user pastes their profile URL, the fast fetch personalizes the Mirror, the background rich scrape (42-60s) lands during the question steps, and the pre-offer insight cards show real, honest numbers from their posts.

How to test:

1. Start a fresh session (new browser profile, or Settings -> Reset All Data), then open `/dashboard`.
2. The onboarding modal should auto-open and be non-dismissable.
3. At the Connect step, paste a real public profile URL with posts (e.g. an active creator) and "Continue with URL".
4. Mirror: the "Reading your profile..." theater resolves to the filled mirror sentence (with `SCRAPINGDOG_API_KEY` set; without it locally the JSON-LD fetch should still work from a residential IP).
5. Walk goal -> voice (check the "From your profile, you sound ..." line) -> cadence (an observed-rhythm banner should fade in if the scrape already landed) -> reinforce (real follower count when available).
6. Building: one task should read "Reading your last N posts" when the scrape landed; the step may hold a few extra seconds if it hasn't.
7. Insights: three cards - topic mix with per-category counts, the missing category, the cadence gap (observed vs chosen). Verify every number is plausible against the profile's actual posts.
8. Preview: the header should name the gap ("You're light on ... posts") and the sub should say "Written in your voice" (style references were used).
9. Offer: an insight echo line appears above the plans; pick a plan or "Continue on the free plan".
10. Click "Open my first post" on the final step.
11. In Supabase, check `public.onboarding_sessions` has your row with fast_profile, rich_posts, insights, answers, completed_at.

Expected outcome: no screen ever dead-ends; the insight numbers match the real profile; finishing closes the modal, deep-links to `/dashboard/editor?draft=...`, and that draft exists in your posts list. Reloading `/dashboard` does not reopen onboarding.

Edge checks:

- Reload mid-flow right after the Mirror: the flow resumes at the same step and the insight cards still arrive (polling resumes from localStorage state).
- Profile with no recent posts: insights degrade to the profile/benchmark variants with no fabricated user numbers; the cadence banner says posts weren't found.
- OAuth path: "Connect LinkedIn" round-trip resumes at the Mirror; the connected screen offers an optional URL field to also analyze posts.
- No scraper keys at all + skip URL: manual form path; insights render the benchmark variant; the offer still works.

---

## Flow 2: Connect LinkedIn + publish now

What to test: connecting an account and publishing a post to a real LinkedIn profile.

How to test:

1. Go to `/dashboard/settings` -> LinkedIn card -> "Connect LinkedIn" and complete OAuth.
2. Confirm the card now shows avatar, name, and "Connected - expires {date}".
3. Open any draft in `/dashboard/editor`, write some content.
4. Click "Publish" -> confirm "Publish to LinkedIn now?" naming your account -> "Publish now".

Expected outcome: connect shows a success toast; publishing shows "Published to LinkedIn" with a "View" action, and the control changes to a "View on LinkedIn" link. Open that link and verify the post is actually live on your LinkedIn. Test with an image/video attached too, since those use a separate upload path.

Edge check: with an expired token, publishing should prompt you to reconnect in Settings (not silently fail).

---

## Flow 3: Schedule a post + calendar

What to test: scheduling a post for the future and having the cron actually publish it, plus rescheduling on the calendar.

How to test:

1. In `/dashboard/editor`, click the chevron next to "Publish" -> "Schedule for later".
2. Pick a near-future time (or a "Suggested times" chip) -> "Schedule".
3. Go to `/dashboard/calendar`, confirm the post appears on the right day with the scheduled color.
4. Drag the post chip to a different day to reschedule.
5. To verify end-to-end publishing, schedule one post ~2 minutes out and wait (the cron runs every minute).

Expected outcome: "Scheduled for {date}" toast; the post shows on the calendar; drag shows "Rescheduled to {date}"; published posts refuse to move and past dates are rejected. After the scheduled time passes, the post should auto-publish to LinkedIn and flip to the published state.

---

## Flow 4: Carousel create with AI + export

What to test: generating a carousel from AI and exporting a usable file.

How to test:

1. Go to `/dashboard/carousel` -> "New carousel" (or "Start with AI").
2. In the editor toolbar, click "AI".
3. Try each input tab: Topic, Paste text, From URL. Pick a Format and set the slide count slider.
4. Click "Generate carousel".
5. Edit a slide (add text/image), then click "Export" and try both "PDF document" and "Images (ZIP)".

Expected outcome: a real multi-slide deck loads with a "Generated a N-slide carousel" toast; edits persist; export downloads a real PDF and a ZIP of PNGs. Hitting the daily limit should show a limit toast, not an error.

---

## Flow 5: Free tool / editor + AI writing

What to test: the core writing experience and all AI rewrite actions work on real LLM output.

How to test:

1. On the home page `/`, type in the editor and confirm the live LinkedIn preview updates.
2. Click "Generate with AI": enter a topic, pick a tone, "Generate". Refine via chat, then "Open in editor".
3. In `/dashboard/editor`, use the AI Actions bar: Style, Hook, Shorter, Longer, Variation.
4. Switch to the Analyze tab and click "Analyze"; apply a suggestion.
5. Use the sidebar "New" creation wizard: pick a source (notes/url/file), generate hooks, pick one, generate variants, open a variant.

Expected outcome: preview mirrors formatting; AI generate streams a real post; each rewrite action visibly changes the text; Analyze returns a score plus applicable suggestions; the wizard produces real hooks and variants and opens the chosen one in the editor.

---

## Flow 6: Branding

What to test: branding edits persist to the backend.

How to test:

1. Go to `/dashboard/branding`.
2. Edit fields across a few sections (Profile, Positioning, Writing Style, Dos & Don'ts, Inspiration).
3. Watch for the "All changes saved" indicator, then reload the page.

Expected outcome: there is no save button (autosave); after reload all edits are still there. Bonus: generate a post afterward and confirm the branding voice is reflected.

---

## Flow 7: Content strategy

What to test: the strategy wizard saves a real strategy and the ideas generator produces real ideas.

How to test:

1. Go to `/dashboard/strategy`. If empty, click "Create new strategy".
2. Complete the 7-step wizard (role, goals, audience, expertise topics, frequency, positioning, formats) -> "Save & Finish Strategy".
3. On the populated dashboard, open the Ideas section -> "Generate Ideas".
4. Dismiss one idea, then "Regenerate Ideas".

Expected outcome: the wizard closes and the dashboard populates with your inputs; Progress/heatmap reflects your real drafts history; Generate Ideas returns real idea cards (format tag + title + description); dismiss and regenerate both work.

---

## Flow 8: Analytics

What to test: analytics is backed by real data (LinkedIn import, CSV, or manual), and AI insights are real.

How to test:

1. Go to `/dashboard/analytics`. Until you have published posts you'll see the empty state.
2. If LinkedIn analytics is configured: "Connect for analytics" (OAuth) then "Sync from LinkedIn".
3. Or "Import CSV": upload a LinkedIn analytics CSV, review the "N matched" preview, "Import N".
4. Or in the Posts Performance table, click "Add"/"Edit" on a row and enter metrics manually.
5. Once you have 3+ published posts, open AI Insights -> "Generate insights".

Expected outcome: KPIs and charts populate from real posts/metrics (no fabricated numbers); import toasts report the real count imported; each post row shows a source badge (Manual/Imported/Synced); AI insights returns a headline + 4 insight cards + a "next post" recommendation.

---

## Flow 9: Billing / upgrade

What to test: the upgrade path runs real Stripe checkout and unlocks Pro.

How to test:

1. As a free user, click "Upgrade" in the sidebar (or trigger it by hitting an AI daily cap).
2. In the dialog, pick Lifetime or Monthly; the embedded Stripe checkout should render inline.
3. Complete a test purchase (use Stripe test cards in a test environment).

Expected outcome: real Stripe checkout appears; on success you see "You're on Pro" and the dialog closes; the "Upgrade" item disappears from the sidebar and AI limits increase. If Stripe is unconfigured, it should degrade gracefully to a "Checkout is not available right now" message rather than erroring.

---

## Flow 10: Settings

What to test: appearance, LinkedIn management, and data reset.

How to test:

1. Go to `/dashboard/settings`.
2. Toggle theme Light / Dark / System.
3. Use the LinkedIn card to Disconnect (and Reconnect).
4. Danger Zone -> "Reset All Data" -> confirm "Delete Everything".

Expected outcome: theme changes apply immediately; disconnect clears the connection; reset wipes drafts/branding/analyses/strategy, reloads, and shows "All data has been deleted" (this also re-triggers onboarding on next dashboard load).

---

## Known non-features (should NOT block a pass)

- Creation wizard "Audio / video (coming soon)" upload option is intentionally disabled.
- Sidebar "Inspiration" item shows a "Soon" badge and is disabled.
- `/dash-example` is leftover demo scaffolding with fake data. It should be deleted before go-live and is not a feature to test.
- `config/pricing.ts` founding-window date, refund days, and competitor price range are placeholders to confirm before public launch.
