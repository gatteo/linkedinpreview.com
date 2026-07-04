import { env } from '@/env.mjs'
import { LINKEDIN_ANALYTICS_ENV_VARS, LINKEDIN_ENV_VARS } from '@/config/linkedin'
import { STRIPE_ENV_VARS } from '@/lib/stripe'

// Dev-only boot audit. Every integration key in env.mjs is .optional(), so a
// missing key silently disables its feature. On dev boot we log the full picture
// once, per feature, so contributors know exactly what to add to .env before they
// go clicking around. Never runs in production.

type EnvVar = keyof typeof env

const FEATURES: { label: string; vars: readonly EnvVar[] }[] = [
    { label: 'LinkedIn publishing', vars: LINKEDIN_ENV_VARS },
    { label: 'LinkedIn analytics (App B)', vars: LINKEDIN_ANALYTICS_ENV_VARS },
    { label: 'Stripe billing', vars: STRIPE_ENV_VARS },
    { label: 'Cron (scheduled publish / analytics sync)', vars: ['CRON_SECRET'] },
    {
        label: 'Onboarding profile enrichment',
        vars: ['SCRAPINGDOG_API_KEY', 'BRIGHTDATA_API_KEY', 'BRIGHTDATA_LINKEDIN_DATASET_ID'],
    },
    { label: 'Cross-user writes (cron / Stripe webhook)', vars: ['SUPABASE_SERVICE_ROLE_KEY'] },
]

/** Log the optional env vars each feature is missing. Dev-only, safe to call once. */
export function warnMissingOptionalEnv(): void {
    if (process.env.NODE_ENV !== 'development') return

    const lines = FEATURES.map((feature) => {
        const missing = feature.vars.filter((name) => !env[name])
        return missing.length ? `  - ${feature.label}: set ${missing.join(', ')}` : null
    }).filter(Boolean)

    if (lines.length === 0) return

    console.warn(
        ['[env] Some optional integrations are disabled - features using them will be inert:', ...lines].join('\n'),
    )
}
