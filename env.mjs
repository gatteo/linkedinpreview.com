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
        // Wave 5 analytics: opt-in to pulling member post analytics from the
        // memberCreatorPostAnalytics API. Requires LinkedIn Community Management
        // API approval + the `r_member_postAnalytics` scope. Left unset, the
        // analytics sync stays inert and the dashboard relies on manual/CSV entry.
        LINKEDIN_ANALYTICS_ENABLED: z.string().optional(),
        // Supabase service-role key - used ONLY by the cron publisher to read due
        // posts and tokens across users (no user session). Never exposed to the client.
        SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    },
    client: {
        NEXT_PUBLIC_GTM_MEASUREMENT_ID: z.string().min(1),
        NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
        NEXT_PUBLIC_TALLY_FORM_ID: z.string().optional(),
        NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
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
        LINKEDIN_ANALYTICS_ENABLED: process.env.LINKEDIN_ANALYTICS_ENABLED,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_GTM_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GTM_MEASUREMENT_ID,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_TALLY_FORM_ID: process.env.NEXT_PUBLIC_TALLY_FORM_ID,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
})
