import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ThemeProvider } from 'next-themes'

import { site, siteBaseMetadata } from '@/config/site'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConsentBanner } from '@/components/consent-banner'
import { GTM } from '@/components/gtm'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { PostHogPageView } from '@/components/tracking/posthog-page-view'

import '@/styles/fonts.css'
import '../styles/globals.css'

const cal = localFont({
    src: '../public/fonts/CalSans-SemiBold.woff2',
    variable: '--font-cal',
})

export const metadata: Metadata = {
    ...siteBaseMetadata,
    metadataBase: new URL(site.url),
    title: {
        template: `%s | ${site.title}`,
        default: site.title,
    },
}

export const viewport: Viewport = {
    themeColor: [
        {
            media: '(prefers-color-scheme: light)',
            color: '#ffffff',
        },
        {
            media: '(prefers-color-scheme: dark)',
            color: '#000000',
        },
    ],
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang='en' className={cal.variable} suppressHydrationWarning>
            <head>
                <link
                    rel='preload'
                    href='/fonts/google/inter-latin.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    href='/fonts/google/bricolagegrotesque-latin.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                />
                <link
                    rel='preload'
                    href='/fonts/google/jetbrainsmono-latin.woff2'
                    as='font'
                    type='font/woff2'
                    crossOrigin='anonymous'
                />
            </head>
            <body>
                <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
                    <TooltipProvider>{children}</TooltipProvider>
                </ThemeProvider>
                <Suspense fallback={null}>
                    <PostHogPageView />
                </Suspense>
                <GTM />
                <Suspense fallback={null}>
                    <ConsentBanner />
                </Suspense>
                <SpeedInsights />
                <TailwindIndicator />
            </body>
        </html>
    )
}
