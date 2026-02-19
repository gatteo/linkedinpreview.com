import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import localFont from 'next/font/local'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from 'sonner'

import { site, siteBaseMetadata } from '@/config/site'
import { cn } from '@/lib/utils'
import { Footer } from '@/components/footer'
import { GTM } from '@/components/gtm'
import { Header } from '@/components/header/header'
import { ProgressProvider } from '@/components/progress-provider'
import { FeedbackFab } from '@/components/feedback/feedback-fab'
import { TallyScript } from '@/components/feedback/tally-script'
import { TailwindIndicator } from '@/components/tailwind-indicator'

import '../styles/globals.css'

const sans = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
})

const cal = localFont({
    src: '../public/fonts/CalSans-SemiBold.woff2',
    variable: '--font-heading',
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
        <html lang='en' className={cn(sans.variable, cal.variable)}>
            <body>
                <ProgressProvider>
                    <Header />
                    <main className='py-16'>{children}</main>
                    <Footer />
                </ProgressProvider>
                <GTM />
                <Toaster />
                <SpeedInsights />
                <TallyScript />
                <FeedbackFab />
                <TailwindIndicator />
            </body>
        </html>
    )
}
