import { isWebpImage } from './parse-meta'
import type { OgIssue, OgPreviewData } from './types'

const POST_INSPECTOR_URL = 'https://www.linkedin.com/post-inspector/'

interface AnalyzeContext {
    hadAnyOgTags: boolean
}

const SEVERITY_ORDER = { error: 0, warning: 1, ok: 2 } as const

export function analyze(data: OgPreviewData, { hadAnyOgTags }: AnalyzeContext): OgIssue[] {
    const issues: OgIssue[] = []

    // og:title
    if (!data.title) {
        issues.push({
            id: 'og-title-missing',
            severity: 'error',
            title: 'Missing og:title',
            detail: 'LinkedIn shows this as the headline of your link card. Without it, your link may render with no title.',
            fix: '<meta property="og:title" content="Your page title" />',
        })
    } else {
        issues.push({
            id: 'og-title-ok',
            severity: 'ok',
            title: 'og:title found',
            detail: `Your card headline will read "${data.title}".`,
        })
    }

    // og:description
    if (!data.description) {
        issues.push({
            id: 'og-description-missing',
            severity: 'warning',
            title: 'Missing og:description',
            detail: 'A description gives readers context under the headline. LinkedIn may omit it or pull unrelated text without one.',
            fix: '<meta property="og:description" content="A short, compelling summary of your page" />',
        })
    } else {
        const length = data.description.length
        if (length < 50) {
            issues.push({
                id: 'og-description-short',
                severity: 'warning',
                title: 'og:description is very short',
                detail: `Your description is ${length} characters. Aim for 70 to 200 characters so the card has enough context.`,
            })
        } else if (length > 300) {
            issues.push({
                id: 'og-description-long',
                severity: 'warning',
                title: 'og:description is very long',
                detail: `Your description is ${length} characters. LinkedIn truncates long descriptions, so keep the key message under 200 characters.`,
            })
        } else {
            issues.push({
                id: 'og-description-ok',
                severity: 'ok',
                title: 'og:description found',
                detail: 'Your description length looks good for a LinkedIn link card.',
            })
        }
    }

    // og:image
    if (!data.imageUrl) {
        issues.push({
            id: 'og-image-missing',
            severity: 'error',
            title: 'Missing og:image',
            detail: 'Without an image, LinkedIn renders a small text-only card. A 1200x627 image is needed for a rich, eye-catching preview.',
            fix: '<meta property="og:image" content="https://yourdomain.com/preview.jpg" />',
        })
    } else if (isWebpImage(data)) {
        issues.push({
            id: 'og-image-webp',
            severity: 'error',
            title: 'og:image is a WebP file',
            detail: 'LinkedIn does not render WebP images, so your card will appear with no thumbnail. Use JPG or PNG instead.',
            fix: '<meta property="og:image" content="https://yourdomain.com/preview.jpg" />',
        })
    } else {
        issues.push({
            id: 'og-image-ok',
            severity: 'ok',
            title: 'og:image found',
            detail: 'Use a 1200x627 image (1.91:1 ratio) in JPG or PNG. LinkedIn rejects oversized files, so keep it under about 5 MB.',
        })
    }

    // JS-rendered heuristic
    if (!hadAnyOgTags) {
        issues.push({
            id: 'og-tags-not-detected',
            severity: 'warning',
            title: 'No Open Graph tags detected in the raw HTML',
            detail: 'We loaded the page but found no og: or twitter: tags. If your site injects meta tags with JavaScript, LinkedIn will not see them. LinkedIn reads the raw HTML only and does not run JavaScript, so render your Open Graph tags server-side.',
        })
    }

    // Always-on informational item about caching.
    issues.push({
        id: 'cache-info',
        severity: 'ok',
        title: 'LinkedIn caches link previews',
        detail: `LinkedIn caches a link preview for about 7 days. A third-party tool cannot force a refresh. To update it, change the URL (add a query parameter), re-share the link, or use the official LinkedIn Post Inspector at ${POST_INSPECTOR_URL}.`,
    })

    return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
