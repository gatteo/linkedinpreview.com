import { AnimateIn } from '../ui/animate-in'

const Steps = [
    {
        title: 'Write or Paste your Content',
        description: 'Start by typing or pasting your text into our editor. This is where you craft your post.',
    },
    {
        title: 'Make It Look Good',
        description:
            'Use our easy tools to add style to your post. You can make words bold, italic, or add lists to organize your points better.',
    },
    {
        title: 'Check How It Looks',
        description:
            'See how your post will look on phones, tablets, and computers. Pay special attention to where LinkedIn truncates with "see more" to ensure your hook is visible.',
    },
    {
        title: 'Copy and Publish!',
        description:
            'When everything looks good, click the "copy text" button. Then go to LinkedIn, paste your post, and share it with confidence!',
    },
]

export function HowToUse() {
    return (
        <section id='how-it-works' className='dot-grid border-t border-border'>
            <div className='px-6 py-20 md:py-28'>
                {/* Left-aligned header */}
                <AnimateIn className='mb-12'>
                    <h2 className='font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                        How to use the tool
                    </h2>
                    <p className='mt-3 max-w-[500px] text-lg text-neutral-500'>
                        Just follow these simple steps to make your LinkedIn post look great.
                    </p>
                </AnimateIn>

                <div className='flex flex-col gap-16 md:flex-row'>
                    {/* Left timeline */}
                    <AnimateIn from='left' className='md:w-5/12'>
                        <div className='relative border-l-2 border-border pl-8'>
                            {Steps.map((step, index) => (
                                <div key={step.title} className='relative pb-10 last:pb-0'>
                                    {/* Circle */}
                                    <div
                                        className='absolute flex size-3 items-center justify-center rounded-full border-2 border-primary bg-white'
                                        style={{ left: 'calc(-2rem - 7px)' }}
                                    />
                                    <span className='mb-1 block text-xs font-semibold uppercase tracking-wider text-primary/70'>
                                        Step {index + 1}
                                    </span>
                                    <h3 className='mb-1 text-base font-semibold text-neutral-900'>{step.title}</h3>
                                    <p className='text-sm leading-relaxed text-neutral-500'>{step.description}</p>
                                </div>
                            ))}
                        </div>
                    </AnimateIn>

                    {/* Right video */}
                    <AnimateIn from='right' className='flex items-center md:w-7/12'>
                        <div className='w-full overflow-hidden rounded-2xl border border-border bg-white shadow-hero'>
                            <div className='p-4'>
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className='w-full rounded-xl border border-border shadow-elevated'>
                                    <source src='/images/home/screen-rec.mov' />
                                </video>
                            </div>
                        </div>
                    </AnimateIn>
                </div>
            </div>
        </section>
    )
}
