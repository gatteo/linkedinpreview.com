'use client'

import Script from 'next/script'

import { env } from '@/env.mjs'

export function GTM() {
    return (
        <>
            <noscript>
                <iframe
                    title='google-tag-manager'
                    src={`https://www.googletagmanager.com/ns.html?id=${env.NEXT_PUBLIC_GTM_MEASUREMENT_ID}`}
                    height='0'
                    width='0'
                    style={{ display: 'none', visibility: 'hidden' }}
                />
            </noscript>

            <Script id='google-tag-manager' strategy='afterInteractive'>
                {`
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${env.NEXT_PUBLIC_GTM_MEASUREMENT_ID}');
                `}
            </Script>
        </>
    )
}
