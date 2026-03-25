// ---------------------------------------------------------------------------
// Branding schema
// ---------------------------------------------------------------------------

export interface BrandingProfile {
    /** Profile image as data URL or external URL */
    avatarUrl: string
    /** Full name */
    name: string
    /** Headline / job title shown in LinkedIn preview */
    headline: string
}

export interface BrandingPositioning {
    /** Free-text positioning statement */
    statement: string
}

export type BrandingRole =
    | 'founder'
    | 'freelancer'
    | 'team-lead'
    | 'employee'
    | 'creator'
    | 'consultant'
    | 'agency'
    | ''

export interface BrandingExpertise {
    /** Areas of expertise */
    topics: string[]
}

export interface BrandingWritingStyle {
    /** Post language */
    language: string
    /** Sentence length preference */
    sentenceLength: 'short' | 'standard' | 'long'
    /** Post length preference */
    postLength: 'short' | 'standard' | 'long'
    /** Emoji frequency */
    emojiFrequency: 'none' | 'moderate' | 'a-lot'
}

export interface BrandingFooter {
    /** Whether auto-footer is enabled */
    enabled: boolean
    /** The footer text to append */
    text: string
}

export interface BrandingKnowledgeBase {
    /** Text notes (free-form context) */
    notes: string
}

export interface BrandingDosDonts {
    /** List of things to always do */
    dos: string[]
    /** List of things to never do */
    donts: string[]
}

export interface BrandingInspiration {
    /** Inspirational LinkedIn posts to analyze for writing style */
    posts: string[]
    /** Creators whose writing style inspires you */
    creators: Array<{ name: string; url: string }>
}

export interface BrandingData {
    profile: BrandingProfile
    positioning: BrandingPositioning
    role: BrandingRole
    expertise: BrandingExpertise
    writingStyle: BrandingWritingStyle
    footer: BrandingFooter
    knowledgeBase: BrandingKnowledgeBase
    dosDonts: BrandingDosDonts
    inspiration: BrandingInspiration
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_BRANDING: BrandingData = {
    profile: {
        avatarUrl: '',
        name: '',
        headline: '',
    },
    positioning: {
        statement: '',
    },
    role: '',
    expertise: {
        topics: [],
    },
    writingStyle: {
        language: 'english',
        sentenceLength: 'standard',
        postLength: 'standard',
        emojiFrequency: 'moderate',
    },
    footer: {
        enabled: false,
        text: '',
    },
    knowledgeBase: {
        notes: '',
    },
    dosDonts: {
        dos: [],
        donts: [],
    },
    inspiration: {
        posts: [],
        creators: [],
    },
}
