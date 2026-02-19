'use client'

import Script from 'next/script'

export function TallyScript() {
    return <Script src='https://tally.so/widgets/embed.js' strategy='lazyOnload' />
}
