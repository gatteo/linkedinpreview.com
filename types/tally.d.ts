interface TallyPopupOptions {
    formId: string
    popup?: {
        width?: number
        emoji?: {
            text: string
            animation:
                | 'none'
                | 'wave'
                | 'tada'
                | 'heart-beat'
                | 'spin'
                | 'flash'
                | 'bounce'
                | 'rubber-band'
                | 'head-shake'
        }
    }
    hiddenFields?: Record<string, string>
    onOpen?: () => void
    onClose?: () => void
    onPageView?: (page: number) => void
    onSubmit?: (payload: { respondentId: string; fields: Record<string, unknown>; submissionId: string }) => void
}

interface TallyGlobal {
    openPopup: (formId: string, options?: Omit<TallyPopupOptions, 'formId'>) => void
    closePopup: (formId: string) => void
}

interface Window {
    Tally?: TallyGlobal
}
