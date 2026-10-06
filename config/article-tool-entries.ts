type ArticleToolEntry = {
    pathname: string
    cardTitle: string
    buttonText: string
    supportingCopy: string
}

export const ARTICLE_TOOL_ENTRIES: readonly ArticleToolEntry[] = [
    {
        pathname: '/blog/where-are-linkedin-drafts-saved',
        cardTitle: 'Never Lose Another Draft',
        buttonText: 'Work on my recovered draft',
        supportingCopy:
            'Have your draft text? Paste it here to format and preview it. This editor cannot retrieve drafts from LinkedIn.',
    },
    {
        pathname: '/blog/linkedin-post-length-guide-2026',
        cardTitle: 'Preview Your Post Length Before Publishing',
        buttonText: 'Check my draft length',
        supportingCopy: 'Paste your draft, check its character count, and preview the mobile layout before copying.',
    },
    {
        pathname: '/blog/how-to-write-open-to-work-linkedin-post',
        cardTitle: 'Preview Your Open to Work Post',
        buttonText: 'Edit my announcement',
        supportingCopy:
            'Paste your own announcement or a template you chose, replace the placeholders, and preview the spacing.',
    },
    {
        pathname: '/blog/how-to-draft-linkedin-posts',
        cardTitle: 'Free LinkedIn Post Preview Tool',
        buttonText: 'Draft and preview here',
        supportingCopy:
            'Write or paste your post, check its layout, then copy it or intentionally carry it into the full editor.',
    },
]

export function articleToolEntry(pathname: string | null, cardTitle: string) {
    return ARTICLE_TOOL_ENTRIES.find((entry) => entry.pathname === pathname && entry.cardTitle === cardTitle)
}
