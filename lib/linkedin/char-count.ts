/**
 * LinkedIn counts user-perceived characters (grapheme clusters), not UTF-16 code units.
 *
 * Counting rule:
 * - One grapheme cluster counts as 1, no matter how many code points it spans. A skin-tone
 *   emoji, a flag, or a ZWJ family sequence is 1 character, not the 2-11 that String.length
 *   reports.
 * - The same rule covers the astral-plane characters the editor emits for bold and italic
 *   text: each styled letter is 2 UTF-16 units but a single grapheme, so it counts as 1.
 * - Newlines count as 1 each, exactly as they appear in the string handed in.
 *
 * The caller must pass the exact string that gets copied to the clipboard, otherwise the
 * counter and the clipboard disagree even with correct grapheme counting.
 */

export const LINKEDIN_CHAR_LIMIT = 3000

type GraphemeSegmenter = {
    segment: (input: string) => Iterable<unknown>
}

let cachedSegmenter: GraphemeSegmenter | null | undefined

function getSegmenter(): GraphemeSegmenter | null {
    if (cachedSegmenter !== undefined) {
        return cachedSegmenter
    }

    try {
        cachedSegmenter =
            typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
                ? new Intl.Segmenter('en', { granularity: 'grapheme' })
                : null
    } catch {
        cachedSegmenter = null
    }

    return cachedSegmenter
}

export function countPostCharacters(text: string): number {
    if (!text) {
        return 0
    }

    const segmenter = getSegmenter()

    if (segmenter) {
        try {
            let count = 0
            for (const _grapheme of segmenter.segment(text)) {
                count++
            }
            return count
        } catch {
            // Fall through to the code point count below.
        }
    }

    try {
        return Array.from(text).length
    } catch {
        return text.length
    }
}
