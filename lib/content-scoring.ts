export interface ContentStats {
    charCount: number
    wordCount: number
    sentenceCount: number
    readabilityGrade: number
    readabilityLabel: string
    sentenceDistribution: {
        tiny: number
        short: number
        medium: number
        long: number
        veryLong: number
    }
    hashtagCount: number
    recommendedHashtags: string
    lengthStatus: 'too_short' | 'optimal' | 'too_long'
    lineCount: number
    emojiCount: number
}

function countSyllables(word: string): number {
    const lower = word.toLowerCase().replace(/[^a-z]/g, '')
    if (lower.length === 0) return 0
    const groups = lower.match(/[aeiouy]+/g) ?? []
    let count = groups.length
    if (lower.endsWith('e') && count > 1) {
        count -= 1
    }
    return Math.max(1, count)
}

export function computeContentStats(text: string): ContentStats {
    const charCount = text.length

    // Words
    const words = text.trim().length === 0 ? [] : text.trim().split(/\s+/).filter(Boolean)
    const wordCount = words.length

    // Sentences
    const rawSentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0)
    const sentenceCount = wordCount > 0 ? Math.max(1, rawSentences.length) : 0

    // Syllables
    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

    // Flesch-Kincaid grade level
    let readabilityGrade = 0
    if (wordCount > 0 && sentenceCount > 0) {
        const raw = 0.39 * (wordCount / sentenceCount) + 11.8 * (totalSyllables / wordCount) - 15.59
        readabilityGrade = Math.round(Math.min(20, Math.max(0, raw)) * 10) / 10
    }

    // Readability label
    let readabilityLabel: string
    if (readabilityGrade < 6) {
        readabilityLabel = 'Easy'
    } else if (readabilityGrade <= 10) {
        readabilityLabel = 'Standard'
    } else {
        readabilityLabel = 'Complex'
    }

    // Sentence distribution
    const distribution = { tiny: 0, short: 0, medium: 0, long: 0, veryLong: 0 }
    if (sentenceCount > 0) {
        const sentences = wordCount > 0 ? (rawSentences.length > 0 ? rawSentences : [text]) : []
        for (const sentence of sentences) {
            const wc = sentence.trim().split(/\s+/).filter(Boolean).length
            if (wc <= 5) distribution.tiny++
            else if (wc <= 10) distribution.short++
            else if (wc <= 20) distribution.medium++
            else if (wc <= 30) distribution.long++
            else distribution.veryLong++
        }
        const total = sentences.length
        distribution.tiny = Math.round((distribution.tiny / total) * 1000) / 10
        distribution.short = Math.round((distribution.short / total) * 1000) / 10
        distribution.medium = Math.round((distribution.medium / total) * 1000) / 10
        distribution.long = Math.round((distribution.long / total) * 1000) / 10
        distribution.veryLong = Math.round((distribution.veryLong / total) * 1000) / 10
    }

    // Hashtags
    const hashtagMatches = text.match(/(?:^|\s)#\w+/g) ?? []
    const hashtagCount = hashtagMatches.length

    // Length status
    let lengthStatus: 'too_short' | 'optimal' | 'too_long'
    if (charCount < 100) {
        lengthStatus = 'too_short'
    } else if (charCount > 3000) {
        lengthStatus = 'too_long'
    } else {
        lengthStatus = 'optimal'
    }

    // Line count (non-empty lines)
    const lineCount = text.split('\n').filter((l) => l.trim().length > 0).length

    // Emoji count
    const emojiMatches =
        text.match(
            /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu,
        ) ?? []
    const emojiCount = emojiMatches.length

    return {
        charCount,
        wordCount,
        sentenceCount,
        readabilityGrade,
        readabilityLabel,
        sentenceDistribution: distribution,
        hashtagCount,
        recommendedHashtags: '3-5 recommended',
        lengthStatus,
        lineCount,
        emojiCount,
    }
}
