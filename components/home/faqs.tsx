import { type FAQPage, type WithContext } from 'schema-dts'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'

const FAQList = [
    {
        question: 'What is LinkedInPreview.com?',
        answer: 'LinkedInPreview.com is a free online tool that allows you to write, format, and preview your LinkedIn posts before publishing them. This ensures your posts look professional and engaging on all devices.',
    },
    {
        question: 'How does the LinkedIn Preview Tool improve my LinkedIn posts?',
        answer: 'By using LinkedInPreview.com, you can apply advanced formatting options like bold, italics, and lists, and see exactly how your post will look on different devices. This helps you make necessary adjustments to ensure maximum readability and impact.',
    },
    {
        question: 'Is LinkedInPreview.com free to use?',
        answer: 'Yes, LinkedInPreview.com is completely free to use. We provide full functionality without any fees, making it accessible for individuals and businesses alike.',
    },
    {
        question: 'Do I need to install any software to use LinkedInPreview.com?',
        answer: "No, LinkedInPreview.com is a web-based tool, so there's no need to install any software. Just visit our website from any browser, and start creating your posts right away.",
    },
    {
        question: 'Can I see how my LinkedIn post will look on mobile devices?',
        answer: 'Absolutely! LinkedInPreview.com allows you to preview your LinkedIn post as it will appear on mobile, tablet, and desktop devices, helping you optimize your content for all viewing platforms.',
    },
    {
        question: 'How can formatting help my LinkedIn posts perform better?',
        answer: 'Well-formatted posts are more appealing and easier to read, which can lead to higher engagement rates. Using formatting tools like those provided by LinkedInPreview.com can help highlight important information and organize your content effectively.',
    },
    {
        question: 'Why should I preview my LinkedIn post before publishing?',
        answer: 'Previewing your post helps catch errors, adjust formatting, and ensure the content looks good on all devices. This step can greatly enhance the professionalism of your posts and increase viewer engagement.',
    },
    {
        question: 'How do I use LinkedInPreview.com to format my LinkedIn posts?',
        answer: 'Simply type or paste your content into the editor on LinkedInPreview.com, use the formatting tools to style your text, and use the preview function to check the appearance on different devices before publishing.',
    },
    {
        question: 'What are the main features of LinkedInPreview.com?',
        answer: 'LinkedInPreview.com offers features like real-time multi-device previews, rich text formatting options such as bold, italic, underline, bullet points, and numbered lists, all aimed at enhancing the quality and effectiveness of your LinkedIn posts.',
    },
    {
        question: 'How can I ensure my LinkedIn posts are engaging?',
        answer: 'To create engaging posts, focus on clear, impactful content. Use formatting tools to make important text stand out, structure your content with lists, and always preview your posts to ensure they look perfect across all platforms.',
    },
    {
        question: 'Can I embed the LinkedIn preview tool on my own website?',
        answer: 'Yes! You can embed the LinkedInPreview.com tool on your website using a simple iframe code snippet. The embed includes auto-resize support so it fits seamlessly into your page. Visit the Embed section on our homepage to copy the code and see a live preview.',
    },
]

export function FAQs() {
    const faqSchema: WithContext<FAQPage> = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': FAQList.map((faq) => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer,
            },
        })),
    }

    return (
        <section id='faqs' className='border-t border-border'>
            <div className='mx-auto max-w-content px-6 py-20 md:py-28'>
                <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

                <div className='flex flex-col gap-12 md:flex-row'>
                    {/* Left heading */}
                    <div className='md:w-1/3'>
                        <h2 className='mb-4 font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl'>
                            Frequently asked questions
                        </h2>
                        <p className='text-lg leading-7 text-neutral-500'>
                            Find answers to common questions about LinkedInPreview.com.
                        </p>
                    </div>

                    {/* Right accordion */}
                    <div className='md:w-2/3'>
                        <Accordion type='multiple'>
                            {FAQList.map((faq) => (
                                <AccordionItem key={faq.question} value={faq.question} className='border-border'>
                                    <AccordionTrigger className='gap-4 text-start text-base font-medium text-neutral-900 hover:no-underline'>
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className='text-sm leading-relaxed text-neutral-500'>
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    )
}
