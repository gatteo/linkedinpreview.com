import { FAQs } from '@/components/home/faqs'
import { Features } from '@/components/home/features'
import { Hero } from '@/components/home/hero'
import { HowToUse } from '@/components/home/how-to-use'
import { MainFeatures } from '@/components/home/main-features'
import { OpenSource } from '@/components/home/opensource'
import { Reason } from '@/components/home/reason'
import { Tool } from '@/components/tool/tool'

export default function Page() {
    return (
        <>
            <Hero />
            <Tool />
            <HowToUse />
            <MainFeatures />
            <OpenSource />
            <Reason />
            <Features />
            <FAQs />
        </>
    )
}
