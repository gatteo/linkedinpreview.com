import type { BrandingData } from '@/lib/branding'

export function assembleBrandingContext(branding: BrandingData): string {
    const lines: string[] = []

    // Author info
    if (branding.profile.name) {
        lines.push(`Author: ${branding.profile.name}`)
    }
    if (branding.profile.headline) {
        lines.push(`Headline: ${branding.profile.headline}`)
    }
    if (branding.role) {
        lines.push(`Role: ${branding.role}`)
    }

    // Positioning
    if (branding.positioning.statement) {
        lines.push(`Positioning: ${branding.positioning.statement}`)
    }

    // Expertise topics
    const topics = branding.expertise.topics.filter(Boolean)
    if (topics.length > 0) {
        lines.push(`Expertise: ${topics.join(', ')}`)
    }

    // Writing style
    const style = branding.writingStyle
    lines.push(`Language: ${style.language}`)
    lines.push(`Sentence length: ${style.sentenceLength}`)
    lines.push(`Post length: ${style.postLength}`)
    lines.push(`Emoji frequency: ${style.emojiFrequency}`)

    // Dos
    const dos = branding.dosDonts.dos.filter(Boolean)
    if (dos.length > 0) {
        lines.push(`Always do: ${dos.join('; ')}`)
    }

    // Donts
    const donts = branding.dosDonts.donts.filter(Boolean)
    if (donts.length > 0) {
        lines.push(`Never do: ${donts.join('; ')}`)
    }

    // Footer
    if (branding.footer.enabled && branding.footer.text) {
        lines.push(`Append this footer to every post: ${branding.footer.text}`)
    }

    // Knowledge base
    if (branding.knowledgeBase.notes) {
        lines.push(`Additional context: ${branding.knowledgeBase.notes}`)
    }

    return lines.join('\n')
}
