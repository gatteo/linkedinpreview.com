import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
    server: {
        NODE_ENV: z.enum(['development', 'production']),
        LLM_API_KEY: z.string().min(1),
        LLM_MODEL: z.string().optional(),
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
        NEXT_PUBLIC_GTM_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GTM_MEASUREMENT_ID,
        NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        NEXT_PUBLIC_TALLY_FORM_ID: process.env.NEXT_PUBLIC_TALLY_FORM_ID,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
})
