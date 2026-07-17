import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export default function EmbedLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ThemeProvider attribute='class' forcedTheme='light'>
            <div className='flex min-h-screen flex-col'>{children}</div>
            <Toaster />
        </ThemeProvider>
    )
}
