import { AnimateIn } from '../ui/animate-in'
import { Section, SectionHead } from './_shared'

const STEPS = [
    {
        title: 'Write or paste your content',
        description: 'Start by typing or pasting your text into the editor. This is where you craft your post.',
    },
    {
        title: 'Make it look good',
        description:
            'Use the formatting tools to add style. Make words bold, italic, or add lists to organize your points.',
    },
    {
        title: 'Check how it looks',
        description:
            'See how your post will look on phones and desktops. Watch where LinkedIn truncates with “see more” so your hook stays visible.',
    },
    {
        title: 'Copy and publish',
        description: 'When it looks good, hit “Copy Text”. Then head to LinkedIn, paste, and share it with confidence.',
    },
]

export function HowToUse() {
    return (
        <Section id='how-it-works' innerClassName='scroll-mt-[var(--header-height)] pt-16'>
            <AnimateIn className='mb-9'>
                <SectionHead
                    eyebrow='How it works'
                    title='How to use the LinkedIn Preview tool'
                    sub='Just follow these simple steps to make your LinkedIn post look great.'
                />
            </AnimateIn>
            <AnimateIn>
                <div className='border-border -mx-7 grid border-t md:grid-cols-[2fr_3fr]'>
                    <div>
                        {STEPS.map((step, i) => (
                            <div
                                key={step.title}
                                className={i < STEPS.length - 1 ? 'border-border border-b px-7 py-6.5' : 'px-7 py-6.5'}>
                                <p className='tracking-label font-mono text-[11px] font-medium text-[color:color-mix(in_oklch,var(--orange-600)_80%,transparent)] uppercase'>
                                    Step {i + 1}
                                </p>
                                <h3 className='font-heading mt-1.5 mb-1 text-[17px] font-semibold tracking-[-0.01em]'>
                                    {step.title}
                                </h3>
                                <p className='text-muted-foreground text-sm leading-relaxed'>{step.description}</p>
                            </div>
                        ))}
                    </div>
                    <div className='border-border bg-secondary relative flex items-center p-7 max-md:border-t md:border-l'>
                        <div className='dot-grid pointer-events-none absolute inset-0 opacity-50' />
                        <figure className='sticker relative m-0 w-full' style={{ aspectRatio: '16 / 10' }}>
                            <video
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload='metadata'
                                poster='/images/home/screen-rec-poster.jpg'
                                className='block size-full object-cover'>
                                <source src='/images/home/screen-rec.mp4' type='video/mp4' />
                            </video>
                            <figcaption className='absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[oklch(0.16_0.03_222_/_0.86)] via-[oklch(0.16_0.03_222_/_0.35)] to-transparent p-5 pt-16 text-[oklch(0.98_0.01_90)]'>
                                <p className='tracking-label font-mono text-[11px] font-medium text-[color:var(--orange-200)] uppercase'>
                                    Live demo
                                </p>
                                <p className='font-heading mt-1.5 text-lg font-semibold tracking-[-0.01em]'>
                                    Watch a post take shape
                                </p>
                                <p className='mt-1 text-[13px] leading-snug text-white/70'>
                                    From blank cursor to a feed-ready draft in under a minute.
                                </p>
                            </figcaption>
                        </figure>
                    </div>
                </div>
            </AnimateIn>
        </Section>
    )
}
