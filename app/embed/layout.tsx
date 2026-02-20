import { Toaster } from 'sonner'

export default function EmbedLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <div className='flex min-h-screen flex-col'>{children}</div>
            <Toaster />
        </>
    )
}
