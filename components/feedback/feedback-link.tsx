'use client'

import { feedbackConfig } from '@/config/feedback'

export function FeedbackLink() {
    const formId = feedbackConfig.formId

    if (!formId) return null

    const handleClick = () => {
        window.Tally?.openPopup(formId, {
            hiddenFields: {
                source: 'footer',
                pageUrl: window.location.href,
            },
        })
    }

    return (
        <button
            onClick={handleClick}
            className='text-muted-foreground hover:text-foreground text-start text-sm transition-colors'>
            Share Feedback
        </button>
    )
}
