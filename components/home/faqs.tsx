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
]

export function FAQs() {
    return (
        <section id='faqs' className='container max-w-6xl py-16 md:py-24'>
            <div className='space-y-6'>
                <div className='space-y-4'>
                    <h2 className='font-heading text-2xl sm:text-4xl md:text-5xl'>Frequently Asked Questions</h2>
                    <p className='text-balance text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                        Find answers to common questions about LinkedInPreview.com and how it can help you create better
                        LinkedIn posts.
                    </p>
                </div>

                <Accordion type='multiple'>
                    {FAQList.map((faq) => (
                        <AccordionItem key={faq.question} value={faq.question}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}
