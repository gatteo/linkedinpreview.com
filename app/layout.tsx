import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { SpeedInsights } from '@vercel/speed-insights/next'

import { site, siteBaseMetadata } from '@/config/site'
import { cn } from '@/lib/utils'
import { TooltipProvider } from '@/components/ui/tooltip'
import { GTM } from '@/components/gtm'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { PostHogPageView } from '@/components/tracking/posthog-page-view'

import '../styles/globals.css'

const sans = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    variable: '--font-bricolage',
})

const mono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    variable: '--font-jetbrains',
})

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
        <html
            lang='en'
            className={cn(sans.variable, bricolage.variable, mono.variable, cal.variable)}
            suppressHydrationWarning>
            <body>
                <TooltipProvider>{children}</TooltipProvider>
                <Suspense fallback={null}>
                    <PostHogPageView />
                </Suspense>
                <GTM />
                <SpeedInsights />
                <TailwindIndicator />
            </body>
        </html>
    )
}
