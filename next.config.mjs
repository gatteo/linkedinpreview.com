import './env.mjs'

// SEO consolidation: 301 redirects from pruned/duplicate posts to the strongest
// surviving page. Sources are removed from contents/; these preserve their link
// equity and keep old URLs from 404ing. See seo-audit/TASKS.md (TASK-01, TASK-04).
const seoRedirects = [
    // Duplicate CTA page: the thin one was indexed instead of the strong canonical.
    ['/blog/linkedin-cta-examples', '/blog/linkedin-call-to-action-examples'],
    // Template stub.
    ['/blog/example', '/blog'],
    // Tool-intent posts -> the actual tool pages.
    ['/blog/best-linkedin-post-formatters', '/formatter'],
    ['/blog/linkedin-post-formatter', '/formatter'],
    ['/blog/best-free-linkedin-editor', '/'],
    ['/blog/best-linkedin-post-analyzer-tools', '/'],
    ['/blog/can-you-preview-linkedin-post', '/'],
    ['/blog/linkedin-post-mockup', '/'],
    ['/blog/linkedin-post-simulator', '/'],
    ['/blog/free-linkedin-post-maker', '/'],
    ['/blog/text-to-linkedin-post', '/'],
    // Formatting near-duplicates -> the proven formatting hubs.
    ['/blog/linkedin-post-format', '/blog/linkedin-posts-text-formatting'],
    ['/blog/how-to-change-font-on-linkedin', '/blog/linkedin-posts-text-formatting'],
    ['/blog/how-to-bold-text-linkedin', '/blog/how-to-add-bold-text-to-linkedin-posts'],
    ['/blog/how-to-italicize-text-linkedin', '/blog/how-to-add-italics-text-to-linkedin-posts'],
    ['/blog/can-you-italicize-on-linkedin', '/blog/how-to-add-italics-text-to-linkedin-posts'],
    // Superseded -2026 / -free twins and topical duplicates.
    ['/blog/how-to-create-a-linkedin-post', '/blog/how-to-write-linkedin-post'],
    ['/blog/how-to-schedule-linkedin-posts', '/blog/how-to-schedule-linkedin-posts-free'],
    ['/blog/linkedin-polls-best-practices', '/blog/linkedin-polls-best-practices-2026'],
    ['/blog/linkedin-content-calendar', '/blog/linkedin-content-calendar-2026'],
    ['/blog/linkedin-company-page-vs-personal-profile', '/blog/linkedin-company-page-vs-personal-profile-2026'],
    ['/blog/how-to-write-linkedin-about-section', '/blog/linkedin-about-section-2026'],
    ['/blog/linkedin-headline-optimization', '/blog/linkedin-headline-formulas'],
    ['/blog/how-to-increase-linkedin-engagement', '/blog/linkedin-engagement-strategies-2026'],
    ['/blog/linkedin-video-posts', '/blog/linkedin-video-strategy-2026'],
    // Informational failures -> closest surviving hub.
    ['/blog/best-times-to-post-on-linkedin', '/blog/linkedin-posting-best-practices'],
    ['/blog/linkedin-post-mistakes-to-avoid', '/blog/linkedin-posting-best-practices'],
    ['/blog/linkedin-posting-frequency', '/blog/linkedin-posting-best-practices'],
    ['/blog/how-to-use-linkedin-effectively', '/blog/linkedin-posting-best-practices'],
    ['/blog/how-to-embed-linkedin-preview-tool-on-your-website', '/blog/how-to-embed-linkedin-post-on-website'],
    ['/blog/how-to-embed-linkedin-profile-on-website', '/blog/how-to-embed-linkedin-post-on-website'],
    ['/blog/linkedin-hook-examples', '/blog/linkedin-call-to-action-examples'],
    ['/blog/what-to-post-on-linkedin', '/blog/linkedin-content-strategy-2026'],
    ['/blog/best-linkedin-post-examples', '/blog/linkedin-post-ideas-for-b2b'],
    ['/blog/linkedin-post-templates', '/blog/linkedin-post-ideas-for-b2b'],
    ['/blog/linkedin-post-length', '/blog/linkedin-see-more-cutoff-2026'],
    ['/blog/linkedin-engagement-rate', '/blog/linkedin-analytics-guide'],
    ['/blog/linkedin-saves', '/blog/linkedin-analytics-guide'],
    ['/blog/linkedin-growth-strategy', '/blog/how-to-build-a-linkedin-audience-from-zero'],
    ['/blog/linkedin-personal-branding', '/blog/linkedin-profile-optimization-complete-guide'],
    ['/blog/linkedin-creator-mode', '/blog/linkedin-profile-optimization-complete-guide'],
    ['/blog/linkedin-featured-section', '/blog/linkedin-profile-optimization-complete-guide'],
    ['/blog/linkedin-thought-leadership', '/blog/how-to-become-linkedin-top-voice'],
    ['/blog/how-to-share-achievements-on-linkedin', '/blog/how-to-announce-a-promotion-on-linkedin'],
    ['/blog/linkedin-company-page-banner', '/blog/linkedin-background-photo-size'],
    ['/blog/linkedin-image-sizes-guide', '/blog/linkedin-background-photo-size'],
    ['/blog/linkedin-link-preview', '/blog/how-to-post-a-link-on-linkedin'],
    ['/blog/how-to-repost-on-linkedin', '/blog'],
]

/** @type {import('next').NextConfig} */
const nextConfig = {
    poweredByHeader: false,

    async redirects() {
        return seoRedirects.map(([source, destination]) => ({ source, destination, permanent: true }))
    },

    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                ],
            },
            {
                source: '/images/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
        ]
    },

    // PostHog reverse proxy configuration
    async rewrites() {
        return [
            {
                source: '/ingest/static/:path*',
                destination: 'https://eu-assets.i.posthog.com/static/:path*',
            },
            {
                source: '/ingest/:path*',
                destination: 'https://eu.i.posthog.com/:path*',
            },
        ]
    },
    // This is required to support PostHog trailing slash API requests
    skipTrailingSlashRedirect: true,

    typescript: {
        // !!! Warning: Dangerously allow production builds to successfully complete even if your project has type errors.
        ignoreBuildErrors: true,
    },

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'substackcdn.com',
            },
            {
                protocol: 'https',
                hostname: 'substack-post-media.s3.amazonaws.com',
            },
        ],
    },

    // Next.js 16 uses Turbopack by default; empty config opts in explicitly.
    turbopack: {},

    // Webpack fallback config - used when building with --webpack flag.
    // Required for contentlayer's ESM/CJS interop.
    webpack: (config) => {
        config.infrastructureLogging = {
            level: 'error',
        }
        config.module?.rules?.push({
            test: /\.m?js$/,
            type: 'javascript/auto',
            resolve: { fullySpecified: false },
        })
        return config
    },
}

export default nextConfig
