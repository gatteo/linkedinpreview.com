import { env } from '@/env.mjs'
import { site } from '@/config/site'

// ---------------------------------------------------------------------------
// LinkedIn API constants (verified mid-2026 against Microsoft Learn docs)
// ---------------------------------------------------------------------------

/** OAuth 2.0 authorization-code-flow endpoints. */
export const LINKEDIN_OAUTH = {
    authorize: 'https://www.linkedin.com/oauth/v2/authorization',
    token: 'https://www.linkedin.com/oauth/v2/accessToken',
    userinfo: 'https://api.linkedin.com/v2/userinfo',
} as const

/** Versioned REST API base. The Posts API replaces the deprecated /v2/ugcPosts. */
export const LINKEDIN_API = {
    posts: 'https://api.linkedin.com/rest/posts',
    images: 'https://api.linkedin.com/rest/images',
    videos: 'https://api.linkedin.com/rest/videos',
} as const

/**
 * The `Linkedin-Version` header value (YYYYMM). Bump monthly to stay current;
 * the endpoints and request shapes are stable across versions.
 */
export const LINKEDIN_API_VERSION = '202606'

export const LINKEDIN_RESTLI_VERSION = '2.0.0'

/**
 * Scopes. `openid profile email` come from the "Sign In with LinkedIn using
 * OpenID Connect" product; `w_member_social` from the "Share on LinkedIn" product.
 */
export const LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'w_member_social'] as const

/** LinkedIn post character limit. */
export const LINKEDIN_MAX_POST_CHARS = 3000

/**
 * Access tokens live 60 days. Programmatic refresh tokens are MDP-partner-only,
 * so self-serve apps cannot silently refresh - the member must reconnect. We warn
 * a few days before expiry so a scheduled post never fires against a dead token.
 */
export const LINKEDIN_TOKEN_EXPIRY_WARNING_DAYS = 7

/** How many times the cron retries a transient publish failure before giving up. */
export const LINKEDIN_MAX_PUBLISH_ATTEMPTS = 5

/** Max scheduled posts the cron claims per run. */
export const LINKEDIN_CRON_BATCH = 25

export const LINKEDIN_ERROR_CODES = {
    NOT_CONFIGURED: 'LINKEDIN_NOT_CONFIGURED',
    NOT_CONNECTED: 'LINKEDIN_NOT_CONNECTED',
    TOKEN_EXPIRED: 'LINKEDIN_TOKEN_EXPIRED',
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    INVALID_INPUT: 'INVALID_INPUT',
    PUBLISH_FAILED: 'LINKEDIN_PUBLISH_FAILED',
    RATE_LIMITED: 'LINKEDIN_RATE_LIMITED',
} as const

/**
 * Whether the LinkedIn integration is configured on the server. When false, the
 * UI presents the feature as unavailable rather than offering a broken connect flow.
 */
export function isLinkedInConfigured(): boolean {
    return Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET && env.LINKEDIN_TOKEN_ENC_KEY)
}

/** The exact redirect URI registered on the LinkedIn app. */
export function linkedInRedirectUri(): string {
    // Use `||` so an empty-string env value falls back to the default.
    return env.LINKEDIN_REDIRECT_URI || `${site.url}/api/linkedin/callback`
}
