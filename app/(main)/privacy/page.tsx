import type { Metadata, ResolvingMetadata } from 'next'
import { absoluteUrl } from '@/utils/urls'

import { Routes } from '@/config/routes'

const title = 'Privacy Policy'
const description = 'How LinkedInPreview.com collects, uses, and protects your data.'

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
            canonical: absoluteUrl(Routes.Privacy),
        },
        openGraph: {
            ...previousOpenGraph,
            url: absoluteUrl(Routes.Privacy),
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

export default function PrivacyPage() {
    return (
        <main>
            <section className='dot-grid'>
                <div className='max-w-content mx-auto flex flex-col items-center px-6 pt-20 pb-16 md:pt-28'>
                    <span className='border-border text-primary shadow-subtle bg-background mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium'>
                        Legal
                    </span>
                    <h1 className='font-heading text-foreground mb-5 text-center text-4xl font-bold tracking-tight md:text-5xl'>
                        Privacy Policy
                    </h1>
                    <p className='text-muted-foreground mx-auto max-w-[540px] text-center text-lg leading-7'>
                        Last updated: September 3, 2026
                    </p>
                </div>
            </section>

            <section className='border-border border-t'>
                <div className='mx-auto max-w-[760px] px-6 py-16'>
                    <div className='prose dark:prose-invert w-full max-w-none'>
                        <p>
                            LinkedInPreview.com (&quot;the Service&quot;) is operated by Matteo Giardino
                            (&quot;we&quot;, &quot;us&quot;). This policy explains what data we collect, why we collect
                            it, and the choices you have. We keep it in plain language on purpose.
                        </p>

                        <h2>The short version</h2>
                        <ul>
                            <li>
                                You can use the free preview tool without creating an account or giving us your name.
                            </li>
                            <li>
                                The dashboard creates an anonymous, pseudonymous account for you automatically. No email
                                or password is required.
                            </li>
                            <li>
                                We collect personal data only when you choose to provide it: an email address, a
                                LinkedIn connection, a LinkedIn profile URL for the audit, or a payment.
                            </li>
                            <li>We do not sell your data. We use a small set of processors, listed below.</li>
                        </ul>

                        <h2>Data we collect</h2>

                        <h3>Anonymous account</h3>
                        <p>
                            When you open the dashboard, we create an anonymous account with a random identifier using
                            Supabase (our database and authentication provider). This account stores the content you
                            create: post drafts, your branding profile, your content strategy, analytics data you
                            import, and your plan/billing status. It is not linked to your name or email unless you
                            later add them.
                        </p>

                        <h3>Email (optional)</h3>
                        <p>
                            You can attach an email address to your account so you do not lose access. You can also
                            voluntarily opt in after copying a post to receive occasional product updates and offers. We
                            record that opt-in with its source, version, and timestamp. We do not send marketing email
                            without your consent.
                        </p>

                        <h3>LinkedIn connection (optional)</h3>
                        <p>
                            If you connect your LinkedIn account, we receive your LinkedIn name, profile picture, and a
                            LinkedIn member identifier through LinkedIn&apos;s official OAuth flow (Sign In with
                            LinkedIn and Share on LinkedIn). We store the access token encrypted (AES-256-GCM) and use
                            it only to publish or schedule posts you explicitly ask us to publish. A separate, optional
                            connection powers post analytics. You can disconnect at any time in Settings, which
                            invalidates the stored token.
                        </p>

                        <h3>Public LinkedIn profile data (audit)</h3>
                        <p>
                            The onboarding audit asks for a LinkedIn profile URL. When you provide one, we fetch
                            publicly available information about that profile (headline, about section, public posts,
                            follower counts) through data providers (Scrapingdog and Bright Data) and analyze it to
                            generate your audit and content plan. We only do this when you request an audit, and the
                            results are stored in your account.
                        </p>

                        <h3>Payments</h3>
                        <p>
                            Payments are processed by Stripe. Your card number never touches our servers. We store your
                            plan, a Stripe customer reference, and subscription status. Stripe&apos;s own privacy policy
                            applies to the payment itself.
                        </p>

                        <h3>Usage analytics</h3>
                        <p>
                            We use PostHog (hosted in the EU) to understand how the product is used: page views, feature
                            events, and, when enabled, session replays in which keyboard input is masked. Analytics are
                            tied to your pseudonymous account identifier, not your name. We also use Google Tag Manager
                            for marketing measurement.
                        </p>

                        <h3>Support and feedback</h3>
                        <p>
                            The in-app support messenger is provided by Featurebase. Conversations are linked to your
                            account identifier (and email, if you have added one) so we can help you. Feedback forms are
                            provided by Tally.
                        </p>

                        <h2>How we use your data</h2>
                        <ul>
                            <li>To provide the Service: storing your drafts, branding, strategy, and settings.</li>
                            <li>
                                To power AI features: the content you write and the inputs you provide (including audit
                                data) are sent to our AI provider to generate and analyze content. We do not use your
                                content to train AI models.
                            </li>
                            <li>To process payments and manage subscriptions.</li>
                            <li>To publish posts to LinkedIn when you ask us to.</li>
                            <li>To improve the product through aggregated, pseudonymous analytics.</li>
                            <li>To respond to support requests.</li>
                        </ul>

                        <h2>Legal bases (GDPR)</h2>
                        <p>
                            We process data to perform our contract with you (providing the Service), on our legitimate
                            interest in improving and securing the Service (analytics, abuse prevention), and on your
                            consent where required. You can withdraw consent at any time.
                        </p>

                        <h2>Processors we use</h2>
                        <ul>
                            <li>Supabase - database, authentication, and storage</li>
                            <li>Vercel - hosting and serverless infrastructure</li>
                            <li>Stripe - payment processing</li>
                            <li>OpenAI - AI content generation and analysis</li>
                            <li>PostHog (EU cloud) - product analytics and session replay</li>
                            <li>Google Tag Manager - marketing measurement</li>
                            <li>Featurebase - support messenger and feedback</li>
                            <li>Tally - feedback forms</li>
                            <li>Scrapingdog and Bright Data - public LinkedIn profile data for the audit</li>
                        </ul>

                        <h2>Cookies and local storage</h2>
                        <p>
                            We use essential cookies to keep you signed in (Supabase session) and local storage for
                            preferences like theme and draft state. Analytics cookies are set only after you accept them
                            in the cookie banner: before that, product analytics run without any identifier stored on
                            your device, Google Tag Manager does not load, and session replay stays off. If you decline,
                            it stays that way.
                        </p>

                        <h2>Data retention and deletion</h2>
                        <p>
                            Your data is kept for as long as your account exists. You can delete all your content at any
                            time with &quot;Reset All Data&quot; in Settings. To delete your account entirely, contact
                            us and we will remove it along with associated data held by our processors, subject to legal
                            retention duties (for example invoices).
                        </p>

                        <h2>Your rights</h2>
                        <p>
                            Under the GDPR you have the right to access, rectify, erase, and port your data, to restrict
                            or object to processing, and to lodge a complaint with your supervisory authority. Contact
                            us and we will respond within 30 days.
                        </p>

                        <h2>Children</h2>
                        <p>The Service is not directed at children under 16.</p>

                        <h2>Changes</h2>
                        <p>
                            We may update this policy as the product evolves. Material changes will be announced in the
                            app or by email if you have provided one.
                        </p>

                        <h2>Contact</h2>
                        <p>
                            Questions about privacy? Reach us through the in-app support messenger or email{' '}
                            <a href='mailto:support@linkedinpreview.com'>support@linkedinpreview.com</a>.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    )
}
