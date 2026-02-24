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
            className='text-start text-sm text-neutral-500 transition-colors hover:text-neutral-900'>
            Share Feedback
        </button>
    )
}
