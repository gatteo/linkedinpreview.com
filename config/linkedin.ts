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
    // Member post analytics (Community Management API, launched mid-2025). Returns
    // impressions/reach/reactions/comments/reshares/etc. for the authenticated
    // member's own posts. Gated behind r_member_postAnalytics (see LINKEDIN_SCOPES).
    memberPostAnalytics: 'https://api.linkedin.com/rest/memberCreatorPostAnalytics',
} as const

/**
 * The `Linkedin-Version` header value (YYYYMM). Bump monthly to stay current;
 * the endpoints and request shapes are stable across versions.
 */
export const LINKEDIN_API_VERSION = '202606'

export const LINKEDIN_RESTLI_VERSION = '2.0.0'

/**
 * Base scopes. `openid profile email` come from the "Sign In with LinkedIn using
 * OpenID Connect" product; `w_member_social` from the "Share on LinkedIn" product.
 */
export const LINKEDIN_SCOPES = ['openid', 'profile', 'email', 'w_member_social'] as const

/**
 * Read scope for member post analytics. Part of the Community Management API,
 * which requires LinkedIn approval (registered legal entity + verified company
 * page). Only requested when analytics sync is enabled - see `linkedInScopes()`.
 */
export const LINKEDIN_ANALYTICS_SCOPE = 'r_member_postAnalytics' as const

/**
 * Whether the analytics sync is opted in. Off by default: the dashboard works
 * from manually entered / CSV-imported metrics until a member's app has been
 * granted the Community Management API and this flag is set.
 */
export function isLinkedInAnalyticsEnabled(): boolean {
    return env.LINKEDIN_ANALYTICS_ENABLED === 'true' || env.LINKEDIN_ANALYTICS_ENABLED === '1'
}

/**
 * The OAuth scopes to request. Adds the analytics read scope only when sync is
 * enabled, so the existing connect flow is unaffected for self-serve apps that
 * lack Community Management API access.
 */
export function linkedInScopes(): string[] {
    return isLinkedInAnalyticsEnabled() ? [...LINKEDIN_SCOPES, LINKEDIN_ANALYTICS_SCOPE] : [...LINKEDIN_SCOPES]
}

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

/** Max published posts the analytics sync refreshes per run. */
export const LINKEDIN_ANALYTICS_SYNC_BATCH = 50

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
