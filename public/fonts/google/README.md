# Existing Google font assets

These unmodified WOFF2 files preserve the application's existing Inter, Bricolage Grotesque and JetBrains Mono typography. `sources.json` records every original Google CSS request, exact Next 16.1.6 user agent, font source URL, SHA256, byte size, weight/style/subset and pinned Google Fonts license source. Each downloaded font matched the previously successful application's built font bytes. OFL files are included unchanged.

`styles/fonts.css` retains all original Unicode-range face declarations, variable weight ranges, Bricolage stretch, normal styles, `swap` display and the original Arial fallback metrics. `app/layout.tsx` preloads only the same Latin assets and retains the existing CalSans `next/font/local` call. The public asset paths avoid runtime CDN requests and the Next Google import-map parser.

A direct `next/font/local` multi-source replacement cannot express different Unicode ranges and preload settings per source. It also calculates different fallback metrics. Keeping the exact stylesheet is smaller than separate local-font calls for every subset plus custom fallbacks. Do not refresh versions, convert bytes, remove non-Latin coverage or change these metrics in an unrelated build fix.

Verification: `node --test tests/font-assets.test.mjs`, then the prescribed type-check, lint, clean and production build. The test labels the original LIN-194 query shape as offline evidence, not a new outage or execution of the Rust parser. Successful real builds and absence of Google-font imports establish application parser bypass. The original cache-versus-response trigger remains unknown. Independent native typography/editor/clipboard acceptance and exact-head CI/preview are still required.

No package, build-command, bundler or deployment configuration changes are part of this correction. No new analytics or conversion claim. Before merge, withdraw the isolated branch. After shipment, independently review a revert of the actual isolated squash through the normal release gates.
