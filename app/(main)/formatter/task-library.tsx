import Link from 'next/link'

export function FormatterTaskLibrary() {
    return (
        <section
            id='how-it-works'
            aria-labelledby='formatter-tasks-title'
            className='border-border border-t px-6 py-16 md:py-24'>
            <div className='mx-auto max-w-4xl'>
                <h2 id='formatter-tasks-title' className='font-heading text-3xl font-bold tracking-tight sm:text-4xl'>
                    Format a LinkedIn post for the job you need
                </h2>
                <p className='text-muted-foreground mt-4 leading-relaxed'>
                    You do not need a new writing app to clean up a finished draft. Use the editor above to apply
                    emphasis, organize a list and check the resulting feed layout. The examples below show three
                    practical formatting patterns. Use your own words in the editor; these examples do not replace your
                    saved draft.
                </p>

                <div className='mt-10 space-y-12'>
                    <article aria-labelledby='formatter-hook-title' className='space-y-5'>
                        <h3 id='formatter-hook-title' className='font-heading text-2xl font-semibold tracking-tight'>
                            Make one hook or result stand out
                        </h3>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <figure className='border-border rounded-lg border p-5'>
                                <figcaption className='text-muted-foreground mb-3 text-sm font-medium'>
                                    Before: plain-text draft
                                </figcaption>
                                <p className='leading-relaxed'>
                                    We reduced setup time from 40 minutes to 15 minutes.
                                    <br />
                                    Here are the three changes that helped.
                                </p>
                            </figure>
                            <figure className='border-border bg-secondary rounded-lg border p-5'>
                                <figcaption className='text-muted-foreground mb-3 text-sm font-medium'>
                                    After: formatted pattern
                                </figcaption>
                                <p className='leading-relaxed'>
                                    <strong>We reduced setup time from 40 minutes to 15 minutes.</strong>
                                    <br />
                                    Here are the three changes that helped.
                                </p>
                            </figure>
                        </div>
                        <p className='text-muted-foreground leading-relaxed'>
                            In the editor, select only the phrase you want readers to notice, then apply Bold. For this
                            example, emphasize the first sentence rather than the entire post. Preview the result, then
                            use the editor&apos;s copy action when it is ready.
                        </p>
                        <p className='text-muted-foreground leading-relaxed'>
                            Formatted pattern: one emphasized opening sentence, followed by a plain-text explanation on
                            its own line. Keep the result readable even without emphasis. A short hook and ordinary
                            spacing matter more than styling every sentence.
                        </p>
                        <p className='text-muted-foreground leading-relaxed'>
                            Bold and italic output uses Unicode lookalike characters rather than LinkedIn accepting HTML
                            tags. Assistive technology, search and some fonts may handle those characters differently.
                            Keep important names, links and essential information readable in ordinary text where
                            possible.
                        </p>
                        <p>
                            Related guide:{' '}
                            <Link
                                href='/blog/how-to-add-bold-text-to-linkedin-posts'
                                className='text-primary underline underline-offset-4'>
                                How to add bold text to LinkedIn posts
                            </Link>
                        </p>
                    </article>

                    <article aria-labelledby='formatter-list-title' className='border-border space-y-5 border-t pt-10'>
                        <h3 id='formatter-list-title' className='font-heading text-2xl font-semibold tracking-tight'>
                            Turn a dense paragraph into a scan-friendly list
                        </h3>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <figure className='border-border rounded-lg border p-5'>
                                <figcaption className='text-muted-foreground mb-3 text-sm font-medium'>
                                    Before: plain-text draft
                                </figcaption>
                                <p className='leading-relaxed'>
                                    Before sharing the update, check the opening, remove repeated points and read the
                                    closing aloud.
                                </p>
                            </figure>
                            <figure className='border-border bg-secondary rounded-lg border p-5'>
                                <figcaption className='text-muted-foreground mb-3 text-sm font-medium'>
                                    After: formatted pattern
                                </figcaption>
                                <p className='mb-3 leading-relaxed'>Before sharing the update:</p>
                                <ul className='list-disc space-y-2 pl-5 leading-relaxed'>
                                    <li>Check the opening.</li>
                                    <li>Remove repeated points.</li>
                                    <li>Read the closing aloud.</li>
                                </ul>
                            </figure>
                        </div>
                        <p className='text-muted-foreground leading-relaxed'>
                            Split the actions into separate lines in the editor: Check the opening. Remove repeated
                            points. Read the closing aloud.
                        </p>
                        <p className='text-muted-foreground leading-relaxed'>
                            Select those lines and apply a bullet list when order does not matter. Use a numbered list
                            for a sequence someone should follow. Keep each item short enough to read without losing its
                            meaning, and leave supporting context outside the list.
                        </p>
                        <p className='text-muted-foreground leading-relaxed'>
                            Formatted pattern: a short introductory sentence followed by three clearly separated items.
                            Preview the mobile layout to spot long items that wrap awkwardly. Do not rely on indentation
                            from a document editor surviving as-is; inspect the copied result before you publish it
                            yourself.
                        </p>
                        <p>
                            Related guides:{' '}
                            <Link
                                href='/blog/how-to-add-bullet-point-lists-to-linkedin-posts'
                                className='text-primary underline underline-offset-4'>
                                How to add bullet lists
                            </Link>{' '}
                            and{' '}
                            <Link
                                href='/blog/how-to-add-numbered-lists-to-linkedin-posts'
                                className='text-primary underline underline-offset-4'>
                                How to add numbered lists
                            </Link>
                        </p>
                    </article>

                    <article
                        aria-labelledby='formatter-digits-title'
                        className='border-border space-y-5 border-t pt-10'>
                        <h3 id='formatter-digits-title' className='font-heading text-2xl font-semibold tracking-tight'>
                            Check emphasis on dates, amounts and results
                        </h3>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <figure className='border-border rounded-lg border p-5'>
                                <figcaption className='text-muted-foreground mb-3 text-sm font-medium'>
                                    Before: plain-text draft
                                </figcaption>
                                <p className='leading-relaxed'>
                                    2026 plan: 3 experiments, 2 weeks, 1 decision.
                                    <br />
                                    We will share what worked and what did not.
                                </p>
                            </figure>
                            <figure className='border-border bg-secondary rounded-lg border p-5'>
                                <figcaption className='text-muted-foreground mb-3 text-sm font-medium'>
                                    After: formatted pattern
                                </figcaption>
                                <p className='leading-relaxed'>
                                    <strong>2026 plan: 3 experiments, 2 weeks, 1 decision.</strong>
                                    <br />
                                    We will share what worked and what did not.
                                </p>
                            </figure>
                        </div>
                        <p className='text-muted-foreground leading-relaxed'>
                            Select the opening sentence and apply the emphasis you intend to use. Include the digits in
                            your selection. Check both letters and numbers in the preview, then inspect the result
                            produced by the editor&apos;s native copy action. A preview alone does not establish what
                            another application&apos;s paste field will retain.
                        </p>
                        <p className='text-muted-foreground leading-relaxed'>
                            Formatted pattern: a concise result or plan line followed by an ordinary-text explanation.
                            If you use a keycap emoji such as 1️⃣, keep it intact instead of treating its digit as
                            ordinary standalone text.
                        </p>
                        <p className='text-muted-foreground leading-relaxed'>
                            Save styling for the important detail. Long runs of decorative characters can make a post
                            harder to scan, and mixing several styles is rarely needed to explain a result. When in
                            doubt, use plain text with clean spacing.
                        </p>
                        <p>
                            Related guide:{' '}
                            <Link
                                href='/blog/linkedin-posts-text-formatting'
                                className='text-primary underline underline-offset-4'>
                                LinkedIn text formatting guide
                            </Link>
                        </p>
                    </article>
                </div>
            </div>
        </section>
    )
}
