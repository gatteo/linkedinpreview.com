'use client'

import * as React from 'react'

const DESKTOP_BREAKPOINT = 768

export function useIsDesktop() {
    const [isDesktop, setIsDesktop] = React.useState(false)

    React.useEffect(() => {
        const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
        const onChange = () => setIsDesktop(mql.matches)
        onChange()
        mql.addEventListener('change', onChange)
        return () => mql.removeEventListener('change', onChange)
    }, [])

    return isDesktop
}
