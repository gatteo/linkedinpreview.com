'use client'

import * as React from 'react'

// Radix's Dialog/AlertDialog/Sheet primitives all mark <body> with
// `data-scroll-locked` while a modal is open (and drop its pointer-events to
// none). Global fixed overlays that live outside any dialog's tree - the
// consent banner, floating widgets - can watch this to step aside instead of
// rendering on top of (and, since they inherit pointer-events: none from
// body, going dead underneath) a modal that has no idea they exist.
export function useModalOpen() {
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const check = () => setOpen(document.body.hasAttribute('data-scroll-locked'))
        check()
        const observer = new MutationObserver(check)
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] })
        return () => observer.disconnect()
    }, [])

    return open
}
