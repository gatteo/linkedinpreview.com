// ---------------------------------------------------------------------------
// Best time to post on LinkedIn - non-personalized v1 recommender.
//
// Data-backed general guidance (Buffer / Sprout Social, 2026): weekday
// afternoons/evenings (3-8pm) drive the most engagement; Wed > Thu > Fri are the
// strongest days, Mon/Tue the weakest. Phase 2 (personalized from a member's own
// performance data) depends on Wave 5 analytics.
// ---------------------------------------------------------------------------

/** Day index follows JS `Date.getDay()` - Sunday = 0 ... Saturday = 6. */
export interface BestTimeSlot {
    day: number
    hour: number // local hour, 24h
    tier: 'best' | 'good'
}

export const BEST_TIME_SLOTS: BestTimeSlot[] = [
    { day: 3, hour: 16, tier: 'best' }, // Wed 4pm - highest overall
    { day: 5, hour: 15, tier: 'best' }, // Fri 3pm
    { day: 5, hour: 16, tier: 'best' }, // Fri 4pm
    { day: 3, hour: 15, tier: 'good' }, // Wed 3pm
    { day: 4, hour: 17, tier: 'good' }, // Thu 5pm
    { day: 2, hour: 16, tier: 'good' }, // Tue 4pm
    { day: 4, hour: 9, tier: 'good' }, //  Thu 9am
]

export const BEST_TIME_SUMMARY =
    'Weekday afternoons (3-8pm) see the most engagement. Best days: Wednesday, Thursday, Friday.'

/** True when a given local time falls in the high-engagement window (weekday 3-8pm). */
export function isPreferredTime(date: Date): boolean {
    const day = date.getDay()
    const hour = date.getHours()
    return day >= 1 && day <= 5 && hour >= 15 && hour < 20
}

/**
 * Return the next `count` recommended posting times after `from`, soonest first.
 * Times are produced in the runtime's local timezone.
 */
export function suggestNextSlots(from: Date, count = 3): { date: Date; tier: 'best' | 'good' }[] {
    const results: { date: Date; tier: 'best' | 'good' }[] = []
    for (let offset = 0; offset <= 14 && results.length < count * 4; offset++) {
        const day = new Date(from)
        day.setDate(from.getDate() + offset)
        for (const slot of BEST_TIME_SLOTS) {
            if (day.getDay() !== slot.day) continue
            const candidate = new Date(day)
            candidate.setHours(slot.hour, 0, 0, 0)
            if (candidate.getTime() > from.getTime()) {
                results.push({ date: candidate, tier: slot.tier })
            }
        }
    }
    return results.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, count)
}
