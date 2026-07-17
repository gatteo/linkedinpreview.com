// ---------------------------------------------------------------------------
// Strategy dashboard metrics (pure helpers)
// ---------------------------------------------------------------------------

export type HeatmapCell = {
    // Local-midnight epoch ms for the day this cell represents
    date: number
    count: number
}

// Number of weeks (7-day columns) shown in the rolling contribution grid
export const HEATMAP_WEEKS = 26

// Intensity bucket for a day's post count -> Tailwind background class
export const getIntensityClass = (count: number): string => {
    if (count === 0) return 'bg-muted'
    if (count === 1) return 'bg-green-200 dark:bg-green-900'
    if (count === 2) return 'bg-green-400 dark:bg-green-700'
    return 'bg-green-600 dark:bg-green-500'
}

// Local midnight for the day containing the given time
const startOfDay = (time: number): Date => {
    const d = new Date(time)
    d.setHours(0, 0, 0, 0)
    return d
}

// Monday-based start of the week containing the given time (00:00 local)
const startOfWeekMonday = (time: number): Date => {
    const d = startOfDay(time)
    const dow = d.getDay() // 0=Sun..6=Sat
    const diff = (dow + 6) % 7 // days since Monday
    d.setDate(d.getDate() - diff)
    return d
}

/**
 * Build a rolling, GitHub-style contribution grid covering the last `weeks`
 * calendar weeks (Monday-aligned). Returns one column per week, oldest first,
 * each column holding 7 day cells (Mon..Sun). The newest week (containing
 * `now`) is the last column.
 */
export const buildHeatmapColumns = (createdAts: number[], weeks = HEATMAP_WEEKS, now = Date.now()): HeatmapCell[][] => {
    const countByDay = new Map<number, number>()
    for (const time of createdAts) {
        const key = startOfDay(time).getTime()
        countByDay.set(key, (countByDay.get(key) ?? 0) + 1)
    }

    const gridStart = startOfWeekMonday(now)
    gridStart.setDate(gridStart.getDate() - (weeks - 1) * 7)

    const columns: HeatmapCell[][] = []
    for (let w = 0; w < weeks; w++) {
        const column: HeatmapCell[] = []
        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(gridStart)
            cellDate.setDate(gridStart.getDate() + w * 7 + d)
            const key = cellDate.getTime()
            column.push({ date: key, count: countByDay.get(key) ?? 0 })
        }
        columns.push(column)
    }

    return columns
}

/**
 * Current weekly posting streak (Monday-aligned weeks).
 *
 * Counts consecutive calendar weeks, walking backward, in which at least one
 * post was created. The current (in-progress) week is tolerated: if it has no
 * posts yet, counting starts from the most recent week that does have a post,
 * but only when that week is the current week or the immediately previous week.
 * If the most recent posting week is older than that, the streak has gone cold
 * and is 0.
 */
export const computeWeeklyStreak = (createdAts: number[], now = Date.now()): number => {
    if (createdAts.length === 0) return 0

    const activeWeeks = new Set<number>()
    for (const time of createdAts) {
        activeWeeks.add(startOfWeekMonday(time).getTime())
    }

    // Step back exactly one Monday-aligned week using calendar arithmetic so
    // the result stays on the local-midnight grid the `activeWeeks` keys use
    // (raw ms stepping drifts across DST transitions). Mirrors the
    // setDate-based stepping in `buildHeatmapColumns`.
    const previousWeekStartFrom = (weekStart: number): number => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() - 7)
        return startOfWeekMonday(d.getTime()).getTime()
    }

    const currentWeekStart = startOfWeekMonday(now).getTime()
    const previousWeekStart = previousWeekStartFrom(currentWeekStart)

    // Find the most recent week (current or previous) that has a post.
    let cursor: number
    if (activeWeeks.has(currentWeekStart)) {
        cursor = currentWeekStart
    } else if (activeWeeks.has(previousWeekStart)) {
        cursor = previousWeekStart
    } else {
        return 0
    }

    let streak = 0
    while (activeWeeks.has(cursor)) {
        streak++
        cursor = previousWeekStartFrom(cursor)
    }

    return streak
}
