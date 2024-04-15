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
            'When everything looks good, click the “copy text” button. Then go to LinkedIn, paste your post, and share it with confidence!',
    },
]

export function HowToUse() {
    return (
        <section id='reason' className='container max-w-6xl py-16 md:py-24'>
            <div className='flex flex-col gap-16'>
                <div className='mx-auto max-w-2xl space-y-6 md:text-center'>
                    <h2 className='text-balance font-heading text-2xl sm:text-4xl md:text-5xl'>
                        How to Use{' '}
                        <span className='bg-gradient-to-b from-primary/60 to-primary bg-clip-text text-transparent'>
                            LinkedIn Preview{' '}
                        </span>
                        Tool{' '}
                    </h2>

                    <p className='mx-auto max-w-[700px] text-balance text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                        Just follow these simple steps to make your LinkedIn post look great
                    </p>
                </div>

                <div className='flex flex-wrap items-center'>
                    <div className='w-full pr-6 md:w-5/12'>
                        <ol className='relative border-s'>
                            {Steps.map((step, index) => (
                                <li key={step.title} className='mb-10 ms-4'>
                                    <time className='mb-1 text-sm font-medium leading-none text-muted-foreground'>
                                        Step {index + 1}
                                    </time>
                                    <div className='absolute -start-1.5 mt-1.5 size-3 rounded-full border border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700'></div>
                                    <h3 className='font-heading text-lg/relaxed font-semibold'>{step.title}</h3>
                                    <p className='text-sm font-normal text-muted-foreground'>{step.description}</p>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className='w-full pt-24 md:w-7/12 md:pt-0'>
                        <video
                            autoPlay
                            loop
                            muted
                            style={{
                                transform: 'scale(1) perspective(1040px) rotateY(-11deg) rotateX(2deg) rotate(2deg)',
                            }}
                            className='over m-auto rounded-lg border shadow-xl md:max-h-[400px] md:object-cover md:object-left'>
                            <source src='/images/home/screen-rec.mov' className='rounded-lg' />
                        </video>
                    </div>
                </div>
            </div>
        </section>
    )
}
