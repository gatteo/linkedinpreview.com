import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']),
        LLM_API_KEY: z.string().min(1),
        LLM_MODEL: z.string().optional(),
        // LinkedIn integration (Wave 4). All optional: when blank the publishing
        // and scheduling features stay inert (mirrors the GTM/Tally pattern).
        LINKEDIN_CLIENT_ID: z.string().optional(),
        LINKEDIN_CLIENT_SECRET: z.string().optional(),
        // Optional override for the OAuth redirect URI. Defaults to
        // `${site.url}/api/linkedin/callback` when unset.
        LINKEDIN_REDIRECT_URI: z.string().optional(),
        // 64-char hex string (32 bytes) - the AES-256-GCM key that encrypts
        // LinkedIn OAuth tokens at rest. Required for the integration to work.
        // (Format validated at runtime in lib/linkedin/crypto.ts.)
        LINKEDIN_TOKEN_ENC_KEY: z.string().optional(),
        // Shared secret Vercel Cron sends as the Authorization header.
        CRON_SECRET: z.string().optional(),
        // Optional: a scraping/residential-proxy API that returns a target URL's
        // raw HTML, used to fetch public LinkedIn profiles reliably from
        // datacenter IPs (which LinkedIn blocks). When unset, the onboarding
        // profile fetch falls back to a direct request (works from residential
        // IPs / local dev). Called as `${URL}?url=<target>` with the optional
        // KEY as a Bearer token. See lib/linkedin/public-profile.ts.
        LINKEDIN_SCRAPE_API_URL: z.string().optional(),
        LINKEDIN_SCRAPE_API_KEY: z.string().optional(),
        // Wave 5 analytics: the SEPARATE LinkedIn app (App B) for the Community
        // Management API. LinkedIn requires that API to be the only product on an
        // app, so member post analytics cannot share App A (Sign In + Share). All
        // optional: when unset, the analytics sync/import stay inert and the
        // dashboard relies on manual/CSV entry. Reuses LINKEDIN_TOKEN_ENC_KEY to
        // encrypt App B tokens at rest.
        LINKEDIN_ANALYTICS_CLIENT_ID: z.string().optional(),
        LINKEDIN_ANALYTICS_CLIENT_SECRET: z.string().optional(),
        // Optional override; defaults to `${site.url}/api/linkedin/analytics/callback`.
        LINKEDIN_ANALYTICS_REDIRECT_URI: z.string().optional(),
        // Supabase service-role key - used by the cron publisher AND the Stripe
        // webhook to write across users (no user session). Never exposed to the client.
        SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
        // Stripe billing. All optional: when blank, checkout/webhook stay inert and
        // the offer screen falls back to "Continue on the free plan" (mirrors the
        // LinkedIn pattern). Fill these in once the Stripe account is set up.
        STRIPE_SECRET_KEY: z.string().optional(),
        STRIPE_WEBHOOK_SECRET: z.string().optional(),
        // Stripe Price IDs created in the Stripe dashboard for each plan.
        STRIPE_PRICE_MONTHLY: z.string().optional(),
        STRIPE_PRICE_LIFETIME: z.string().optional(),
    },
    client: {
        NEXT_PUBLIC_GTM_MEASUREMENT_ID: z.string().min(1),
        NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
        NEXT_PUBLIC_TALLY_FORM_ID: z.string().optional(),
        NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
        // Stripe publishable key for Embedded Checkout. Optional until billing is live.
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    },
    runtimeEnv: {
        NODE_ENV: process.env.NODE_ENV,
        LLM_API_KEY: process.env.LLM_API_KEY,
        LLM_MODEL: process.env.LLM_MODEL,
        LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
        LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
        LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI,
        LINKEDIN_TOKEN_ENC_KEY: process.env.LINKEDIN_TOKEN_ENC_KEY,
        CRON_SECRET: process.env.CRON_SECRET,
        LINKEDIN_SCRAPE_API_URL: process.env.LINKEDIN_SCRAPE_API_URL,
        LINKEDIN_SCRAPE_API_KEY: process.env.LINKEDIN_SCRAPE_API_KEY,
        LINKEDIN_ANALYTICS_CLIENT_ID: process.env.LINKEDIN_ANALYTICS_CLIENT_ID,
        LINKEDIN_ANALYTICS_CLIENT_SECRET: process.env.LINKEDIN_ANALYTICS_CLIENT_SECRET,
        LINKEDIN_ANALYTICS_REDIRECT_URI: process.env.LINKEDIN_ANALYTICS_REDIRECT_URI,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
        STRIPE_PRICE_LIFETIME: process.env.STRIPE_PRICE_LIFETIME,
        NEXT_PUBLIC_GTM_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GTM_MEASUREMENT_ID,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_TALLY_FORM_ID: process.env.NEXT_PUBLIC_TALLY_FORM_ID,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
})
