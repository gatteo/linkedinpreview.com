export const feedbackConfig = {
    forms: {
        postCopy: process.env.NEXT_PUBLIC_TALLY_POSTCOPY_FORM_ID ?? '',
        feedback: process.env.NEXT_PUBLIC_TALLY_FEEDBACK_FORM_ID ?? '',
        helpfulness: process.env.NEXT_PUBLIC_TALLY_HELPFULNESS_FORM_ID ?? '',
    },
    postCopy: {
        /** Delay in ms before showing the popup after a successful copy */
        delayMs: 1500,
        /** Minimum number of copies before showing the popup (skip first-timers) */
        minCopyCount: 2,
        /** Minimum content length to show popup */
        minContentLength: 50,
        /** Cooldown in days after dismissal */
        dismissCooldownDays: 7,
    },
    storage: {
        copyCount: 'fb_copy_count',
        sessionShown: 'fb_session_shown',
        dismissedAt: 'fb_dismissed_at',
        articleVotePrefix: 'fb_article_vote_',
    },
} as const
