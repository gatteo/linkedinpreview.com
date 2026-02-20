import { Toaster } from 'sonner'

import { FeedbackFab } from '@/components/feedback/feedback-fab'
import { TallyScript } from '@/components/feedback/tally-script'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header/header'
import { ProgressProvider } from '@/components/progress-provider'

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <ProgressProvider>
                <Header />
                <main className='py-16'>{children}</main>
                <Footer />
            </ProgressProvider>
            <Toaster />
            <TallyScript />
            <FeedbackFab />
        </>
    )
}
