import type { Metadata, ResolvingMetadata } from 'next'
import { absoluteUrl } from '@/utils/urls'

import { Routes } from '@/config/routes'

const title = 'Terms of Service'
const description = 'The terms that govern your use of LinkedInPreview.com.'

type Props = {
    params: Record<string, never>
}

export async function generateMetadata(_: Props, parent: ResolvingMetadata): Promise<Metadata> {
    const previousOpenGraph = (await parent)?.openGraph ?? {}
    const previousTwitter = (await parent)?.twitter ?? {}

    return {
        title,
        description,
        alternates: {
            canonical: absoluteUrl(Routes.Terms),
        },
        openGraph: {
            ...previousOpenGraph,
            url: absoluteUrl(Routes.Terms),
            title,
            description,
        },
        twitter: {
            ...previousTwitter,
            title,
            description,
        },
    }
}

export default function TermsPage() {
    return (
        <main>
            <section className='dot-grid'>
                <div className='max-w-content mx-auto flex flex-col items-center px-6 pt-20 pb-16 md:pt-28'>
                    <span className='border-border text-primary shadow-subtle bg-background mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium'>
                        Legal
                    </span>
                    <h1 className='font-heading text-foreground mb-5 text-center text-4xl font-bold tracking-tight md:text-5xl'>
                        Terms of Service
                    </h1>
                    <p className='text-muted-foreground mx-auto max-w-[540px] text-center text-lg leading-7'>
                        Last updated: July 17, 2026
                    </p>
                </div>
            </section>

            <section className='border-border border-t'>
                <div className='mx-auto max-w-[760px] px-6 py-16'>
                    <div className='prose dark:prose-invert w-full max-w-none'>
                        <p>
                            These terms are an agreement between you and Matteo Giardino, the operator of
                            LinkedInPreview.com (&quot;the Service&quot;). By using the Service you agree to them. If
                            you do not agree, please do not use the Service.
                        </p>

                        <h2>1. The Service</h2>
                        <p>
                            LinkedInPreview.com is a tool for writing, formatting, and previewing LinkedIn posts, with
                            an optional dashboard that adds AI-assisted content creation, a personal branding profile, a
                            content strategy and audit, scheduling, publishing, and analytics features. The free preview
                            tool works without an account.
                        </p>

                        <h2>2. Accounts</h2>
                        <p>
                            The dashboard creates an anonymous account for you automatically. You can attach an email
                            address or a LinkedIn login to keep access to it across devices. You are responsible for
                            activity on your account and for keeping access to your device secure. Without an attached
                            email or LinkedIn login, clearing your browser data may permanently sever access to your
                            account.
                        </p>

                        <h2>3. Plans, billing, and refunds</h2>
                        <ul>
                            <li>
                                <strong>Free plan</strong>: the core editor and preview features, free forever.
                            </li>
                            <li>
                                <strong>Pro</strong>: $11.99 per month, billed monthly through Stripe. Renews
                                automatically until cancelled. Cancel any time from Settings; access continues until the
                                end of the paid period.
                            </li>
                            <li>
                                <strong>Lifetime</strong>: a one-time payment of $39.99 for access to the paid features
                                for the lifetime of the product. AI features remain subject to fair-use limits.
                            </li>
                        </ul>
                        <p>
                            <strong>7-day money-back guarantee</strong>: if you are not happy with a purchase, contact
                            us within 7 days of your first payment and we will refund it in full. Prices may change for
                            new purchases; active subscriptions are notified in advance of any price change.
                        </p>

                        <h2>4. Your content</h2>
                        <p>
                            Everything you write stays yours. You grant us the limited license needed to store and
                            process your content to provide the Service (for example saving drafts, running AI analysis
                            you request, or publishing a post to LinkedIn on your instruction). We do not use your
                            content to train AI models and we do not publish anything without your explicit action.
                        </p>

                        <h2>5. AI features</h2>
                        <p>
                            AI-generated content can be inaccurate or incomplete. Review everything before publishing;
                            you are solely responsible for the content you post. AI features are subject to rate limits
                            designed to keep the Service fast and affordable for everyone.
                        </p>

                        <h2>6. LinkedIn</h2>
                        <p>
                            LinkedInPreview.com is an independent product. It is not affiliated with, endorsed by, or
                            sponsored by LinkedIn Corporation. Publishing and scheduling use LinkedIn&apos;s official
                            API with an account you explicitly connect. The profile audit processes publicly available
                            profile data at your request. You are responsible for complying with LinkedIn&apos;s own
                            terms when using content created with the Service.
                        </p>

                        <h2>7. Acceptable use</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>use the Service for unlawful purposes or to create unlawful content;</li>
                            <li>abuse, overload, or attempt to disrupt the Service or its AI limits;</li>
                            <li>resell or provide the paid features to third parties as your own service;</li>
                            <li>use the audit on profiles other than your own or without authorization.</li>
                        </ul>

                        <h2>8. Availability and warranty</h2>
                        <p>
                            The Service is provided &quot;as is&quot; without warranties of any kind. We work hard to
                            keep it fast and reliable, but we do not guarantee uninterrupted availability, and features
                            that depend on third parties (LinkedIn, AI providers, payment processing) may change or
                            become unavailable.
                        </p>

                        <h2>9. Liability</h2>
                        <p>
                            To the maximum extent permitted by law, our total liability for any claim arising from the
                            Service is limited to the amount you paid us in the 12 months before the claim. Nothing in
                            these terms limits liability that cannot be limited by law, and consumers keep all mandatory
                            protections of their country of residence.
                        </p>

                        <h2>10. Termination</h2>
                        <p>
                            You can stop using the Service and delete your data at any time. We may suspend or terminate
                            accounts that violate these terms. On termination, sections that by their nature should
                            survive (your content ownership, liability limits) survive.
                        </p>

                        <h2>11. Changes</h2>
                        <p>
                            We may update these terms as the product evolves. Material changes will be announced in the
                            app or by email if you have provided one. Continued use after a change means you accept the
                            updated terms.
                        </p>

                        <h2>12. Governing law</h2>
                        <p>
                            These terms are governed by Italian law. If you are a consumer, you also benefit from any
                            mandatory provisions of the law of your country of residence.
                        </p>

                        <h2>Contact</h2>
                        <p>
                            Questions about these terms? Reach us through the in-app support messenger or email{' '}
                            <a href='mailto:support@linkedinpreview.com'>support@linkedinpreview.com</a>.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
