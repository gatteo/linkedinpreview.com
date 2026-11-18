import { carouselFontPreloads } from '@/lib/carousel/fonts'

import '@/styles/carousel-fonts.css'

export default function CarouselLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {carouselFontPreloads.map((href) => (
                <link key={href} rel='preload' href={href} as='font' type='font/woff2' crossOrigin='anonymous' />
            ))}
            {children}
        </>
    )
}
