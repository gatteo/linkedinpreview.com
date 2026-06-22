import { env } from '@/env.mjs'
import {
    LINKEDIN_ANALYTICS_SCOPES,
    LINKEDIN_OAUTH,
    linkedInAnalyticsRedirectUri,
    linkedInRedirectUri,
    linkedInScopes,
} from '@/config/linkedin'

// ---------------------------------------------------------------------------
// LinkedIn OAuth 2.0 authorization-code flow.
//
// Note: self-serve apps do NOT receive programmatic refresh tokens (those are
// MDP-partner-only). Tokens last 60 days; renewal means re-running this flow.
// ---------------------------------------------------------------------------

export interface LinkedInTokenResponse {
    access_token: string
    expires_in: number // seconds (~5184000 = 60 days)
    scope?: string
    refresh_token?: string // only for approved MDP partners
    refresh_token_expires_in?: number
}

export interface LinkedInUserInfo {
    sub: string // person id - the URN is urn:li:person:{sub}
    name?: string
    given_name?: string
    family_name?: string
    picture?: string
    email?: string
    email_verified?: boolean
    locale?: string | { country: string; language: string }
}

/** Build the URL that starts the consent flow. `state` is an opaque CSRF token. */
export function buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.LINKEDIN_CLIENT_ID ?? '',
        redirect_uri: linkedInRedirectUri(),
        state,
        scope: linkedInScopes().join(' '),
    })
    return `${LINKEDIN_OAUTH.authorize}?${params.toString()}`
}

/** Exchange an authorization code for an access token. */
export async function exchangeCodeForToken(code: string): Promise<LinkedInTokenResponse> {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: env.LINKEDIN_CLIENT_ID ?? '',
        client_secret: env.LINKEDIN_CLIENT_SECRET ?? '',
        redirect_uri: linkedInRedirectUri(),
    })

    const res = await fetch(LINKEDIN_OAUTH.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    })

    if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`LinkedIn token exchange failed (${res.status}): ${detail}`)
    }
    return (await res.json()) as LinkedInTokenResponse
}

/** Fetch the member's identity via the OpenID Connect userinfo endpoint. */
export async function fetchUserInfo(accessToken: string): Promise<LinkedInUserInfo> {
    const res = await fetch(LINKEDIN_OAUTH.userinfo, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`LinkedIn userinfo failed (${res.status}): ${detail}`)
    }
    return (await res.json()) as LinkedInUserInfo
}

/** The LinkedIn person URN used as the `author` of a post. */
export function personUrn(sub: string): string {
    return `urn:li:person:${sub}`
}

// ---------------------------------------------------------------------------
// Analytics app (App B) OAuth - separate client/redirect/scopes from App A.
// ---------------------------------------------------------------------------

/** Build the App B (analytics) consent URL. `state` is an opaque CSRF token. */
export function buildAnalyticsAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.LINKEDIN_ANALYTICS_CLIENT_ID ?? '',
        redirect_uri: linkedInAnalyticsRedirectUri(),
        state,
        scope: [...LINKEDIN_ANALYTICS_SCOPES].join(' '),
    })
    return `${LINKEDIN_OAUTH.authorize}?${params.toString()}`
}

/** Exchange an App B authorization code for an analytics access token. */
export async function exchangeAnalyticsCodeForToken(code: string): Promise<LinkedInTokenResponse> {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: env.LINKEDIN_ANALYTICS_CLIENT_ID ?? '',
        client_secret: env.LINKEDIN_ANALYTICS_CLIENT_SECRET ?? '',
        redirect_uri: linkedInAnalyticsRedirectUri(),
    })

    const res = await fetch(LINKEDIN_OAUTH.token, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    })

    if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`LinkedIn analytics token exchange failed (${res.status}): ${detail}`)
    }
    return (await res.json()) as LinkedInTokenResponse
}
