import type { Metadata } from 'next'

import { CarouselGallery } from '@/components/dashboard/carousel/carousel-gallery'

export const metadata: Metadata = {
    title: 'Carousels - LinkedInPreview.com',
}

export default function CarouselPage() {
    return <CarouselGallery />
}
