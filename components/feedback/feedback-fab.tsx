'use client'

import { MessageSquarePlus } from 'lucide-react'
import posthog from 'posthog-js'

import { feedbackConfig } from '@/config/feedback'

export function FeedbackFab() {
    const formId = feedbackConfig.formId

    if (!formId) return null

    const handleClick = () => {
        posthog.capture('feedback_button_clicked', {
            source: 'fab',
            page_url: window.location.href,
        })

        window.Tally?.openPopup(formId, {
            hiddenFields: {
                source: 'fab',
                pageUrl: window.location.href,
            },
        })
    }

    return (
        <button
            onClick={handleClick}
            className='fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary p-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 sm:px-4'
            aria-label='Send feedback'>
            <MessageSquarePlus className='size-5' />
            <span className='hidden sm:inline'>Feedback</span>
        </button>
    )
}
