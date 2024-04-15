import { Icon, Icons } from '../icon'
import { Card, CardDescription, CardTitle } from '../ui/card'

const AllFeatures = [
    {
        icon: 'mobile',
        title: 'Preview on Mobile',
        body: 'See how your LinkedIn Post will look on mobile devices, ensuring optimal readability and impact.',
    },
    {
        icon: 'desktop',
        title: 'Preview on Desktop',
        body: "Check your Linkedin Post's appearance on desktop to make sure it looks professional and engaging on larger screens.",
    },
    {
        icon: 'tablet',
        title: 'Preview on Tablet',
        body: 'Preview your LinkedIn Post on tablets to ensure a visually appealing presentation across all device types.',
    },
    {
        icon: 'bold',
        title: 'Bold Formatting',
        body: 'Add bold formatting to your Likedin Post to emphasize key points and make important text stand out.',
    },
    {
        icon: 'strikethrough',
        title: 'Strikethrough Formatting',
        body: 'Use strikethrough formatting on your LinkedIn Post to cross out text, adding a layer of clarity.',
    },
    {
        icon: 'underline',
        title: 'Underline Formatting',
        body: 'You can use underline formatting to highlight important information and draw the reader’s eye.',
    },
    {
        icon: 'italic',
        title: 'Italic Formatting',
        body: 'Add italics to your LinkedIn Post to emphasize quotes, technical terms, or to differentiate certain words and phrases.',
    },
    {
        icon: 'bulletList',
        title: 'Bullet Point List',
        body: 'Organize your Linkedin Post information clearly with bullet points, making your posts easier to read and more effective.',
    },
    {
        icon: 'numberedList',
        title: 'Numbered List',
        body: 'Use numbered lists to structure your Linkedin Post content logically, making complex information more accessible and understandable.',
    },
]

export function Features() {
    return (
        <section className='w-full bg-muted py-12 md:py-16 lg:py-24'>
            <div className='container flex max-w-6xl flex-col gap-16 '>
                <div className='space-y-6 text-center'>
                    <h2 className='font-heading text-2xl sm:text-4xl md:text-5xl'>All the Features you Need</h2>
                    <p className='mx-auto max-w-[600px] text-balance text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                        From formatting options to real-time previews, this tool has everything you need to create
                        perfect LinkedIn posts.
                    </p>
                </div>
                <div className='grid justify-center gap-4 sm:grid-cols-2 md:grid-cols-3'>
                    {AllFeatures.map((feature) => (
                        <Card key={feature.title} className='group relative transition hover:z-[1] hover:shadow-2xl'>
                            <div className='relative space-y-4 p-6 py-8'>
                                <Icon
                                    name={feature.icon as keyof typeof Icons}
                                    className='size-9 rounded-md bg-primary/10 p-1.5 text-primary'
                                    aria-hidden='true'
                                />
                                <CardTitle className='font-heading text-xl tracking-wide'>{feature.title}</CardTitle>
                                <CardDescription className='text-md mt-2'>{feature.body}</CardDescription>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
