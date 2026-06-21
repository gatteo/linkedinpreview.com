// ---------------------------------------------------------------------------
// Content DNA - the correlation engine that relates content features to actual
// engagement. For each feature dimension (media, length, hashtags, hook style,
// format, posting day...) it buckets the member's published posts, measures the
// average engagement per bucket, and computes each bucket's "lift" versus the
// member's overall baseline. The strongest signals become the "what drives YOUR
// engagement" drivers - the differentiating insight competitors don't surface.
// ---------------------------------------------------------------------------

import type { PublishedPost } from './aggregate'
import type { PostFeatures } from './content-features'

export interface Driver {
    dimension: string
    bucket: string
    /** Fraction above/below baseline, e.g. 0.47 = +47%, -0.3 = -30%. */
    lift: number
    avgEngagement: number
    sampleSize: number
    direction: 'up' | 'down'
    /** A short, plain-language takeaway for this driver. */
    insight: string
}

export interface ContentDnaResult {
    baselineAvgEngagement: number
    /** Published posts that have engagement data (the analyzable sample). */
    sampleSize: number
    hasEnoughData: boolean
    /** Significant drivers, strongest absolute lift first. */
    drivers: Driver[]
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Minimum posts (with engagement) before correlations are trustworthy enough to show.
const MIN_SAMPLE = 4
// A bucket needs at least this many posts to be considered.
const MIN_BUCKET = 2
// Only surface drivers whose effect is at least this large.
const MIN_LIFT = 0.15

type Dimension = {
    name: string
    /** Returns the bucket label for a post, or null to exclude it from this dimension. */
    bucket: (f: PostFeatures) => string | null
}

const DIMENSIONS: Dimension[] = [
    { name: 'Media', bucket: (f) => (f.hasMedia ? 'With image or video' : 'Text-only') },
    {
        name: 'Length',
        bucket: (f) =>
            f.charCount < 300
                ? 'Short (under 300 chars)'
                : f.charCount < 800
                  ? 'Medium (300-800)'
                  : f.charCount < 1500
                    ? 'Long (800-1500)'
                    : 'Very long (1500+)',
    },
    {
        name: 'Hashtags',
        bucket: (f) => (f.hashtagCount === 0 ? 'No hashtags' : f.hashtagCount <= 3 ? '1-3 hashtags' : '4+ hashtags'),
    },
    { name: 'Emojis', bucket: (f) => (f.emojiCount === 0 ? 'No emojis' : 'Uses emojis') },
    { name: 'Hook', bucket: (f) => (f.startsWithQuestion ? 'Opens with a question' : 'Opens with a statement') },
    { name: 'Structure', bucket: (f) => (f.hasList ? 'Uses a list' : 'No list') },
    { name: 'Format', bucket: (f) => f.format },
    { name: 'Posting day', bucket: (f) => `${DAY_NAMES[f.dayOfWeek]}s` },
]

export function analyzeContentDna(posts: PublishedPost[], featuresById: Map<string, PostFeatures>): ContentDnaResult {
    // Only posts with both engagement data and extracted features are analyzable.
    const sample = posts
        .filter((p) => p.engagement !== null)
        .map((p) => ({ engagement: p.engagement as number, features: featuresById.get(p.entry.id) }))
        .filter((x): x is { engagement: number; features: PostFeatures } => x.features !== undefined)

    const sampleSize = sample.length
    const baseline = sampleSize > 0 ? sample.reduce((s, x) => s + x.engagement, 0) / sampleSize : 0

    if (sampleSize < MIN_SAMPLE || baseline <= 0) {
        return { baselineAvgEngagement: baseline, sampleSize, hasEnoughData: false, drivers: [] }
    }

    const drivers: Driver[] = []

    for (const dim of DIMENSIONS) {
        const byBucket = new Map<string, number[]>()
        for (const x of sample) {
            const label = dim.bucket(x.features)
            if (label === null) continue
            const list = byBucket.get(label) ?? []
            list.push(x.engagement)
            byBucket.set(label, list)
        }

        // A single-bucket dimension carries no comparative signal - skip it.
        if (byBucket.size < 2) continue

        for (const [bucket, values] of byBucket) {
            if (values.length < MIN_BUCKET) continue
            const avg = values.reduce((s, v) => s + v, 0) / values.length
            const lift = avg / baseline - 1
            if (Math.abs(lift) < MIN_LIFT) continue
            const direction = lift >= 0 ? 'up' : 'down'
            drivers.push({
                dimension: dim.name,
                bucket,
                lift,
                avgEngagement: avg,
                sampleSize: values.length,
                direction,
                insight: buildInsight(dim.name, bucket, lift),
            })
        }
    }

    // Strongest effects first; keep the dashboard focused on the top signals.
    drivers.sort((a, b) => Math.abs(b.lift) - Math.abs(a.lift))

    return { baselineAvgEngagement: baseline, sampleSize, hasEnoughData: true, drivers: drivers.slice(0, 8) }
}

function buildInsight(dimension: string, bucket: string, lift: number): string {
    const pct = `${lift >= 0 ? '+' : ''}${Math.round(lift * 100)}%`
    const verb = lift >= 0 ? 'outperform' : 'underperform'
    return `${bucket} ${verb} your average by ${pct}.`
}
