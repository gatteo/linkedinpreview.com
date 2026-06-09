import { type BrandingData } from '@/lib/branding'

export type SectionProps = {
    branding: BrandingData
    onUpdate: (updates: Partial<BrandingData>) => void
}
