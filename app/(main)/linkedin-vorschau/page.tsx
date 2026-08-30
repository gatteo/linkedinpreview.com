import { type Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl } from '@/utils/urls'
import { ArrowDown } from 'lucide-react'
import { type FAQPage, type SoftwareApplication, type WithContext } from 'schema-dts'

import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { SOCIAL_PROOF } from '@/config/social-proof'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { AnimateIn } from '@/components/ui/animate-in'
import { Button } from '@/components/ui/button'
import { DotBackground } from '@/components/ui/dot-background'
import { StarRating } from '@/components/home/star-rating'
import { Icon, Icons } from '@/components/icon'
import { Tool } from '@/components/tool/tool'

export const metadata: Metadata = {
    title: { absolute: 'LinkedIn Post Vorschau - Beitrag formatieren und ansehen' },
    description:
        'Kostenlose LinkedIn Post Vorschau: Formatiere deinen Beitrag mit Fett, Kursiv und Listen und sieh die Vorschau für Mobil und Desktop - ohne Anmeldung.',
    alternates: {
        canonical: absoluteUrl(Routes.Vorschau),
        languages: {
            'de-DE': absoluteUrl(Routes.Vorschau),
            'en': site.url,
            'x-default': site.url,
        },
    },
    openGraph: {
        title: 'LinkedIn Post Vorschau - Beitrag formatieren und ansehen',
        description:
            'Kostenlose LinkedIn Post Vorschau: Formatiere deinen Beitrag mit Fett, Kursiv und Listen und sieh die Vorschau für Mobil und Desktop - ohne Anmeldung.',
        url: absoluteUrl(Routes.Vorschau),
        locale: 'de_DE',
    },
}

const VorschauSteps = [
    {
        title: 'Text schreiben oder einfügen',
        description:
            'Tippe deinen LinkedIn Beitrag direkt in den Editor oder füge bestehenden Text ein. Hier entsteht dein Post.',
    },
    {
        title: 'Beitrag formatieren',
        description:
            'Markiere Wörter und mache sie fett oder kursiv, ergänze Aufzählungen oder nummerierte Listen und strukturiere deinen Beitrag klar und übersichtlich.',
    },
    {
        title: 'Live-Vorschau prüfen',
        description:
            'Sieh sofort, wie dein Beitrag auf Mobil, Tablet und Desktop aussieht. Achte besonders auf den Punkt, an dem LinkedIn mit "mehr anzeigen" kürzt, damit dein Hook sichtbar bleibt.',
    },
    {
        title: 'Kopieren und veröffentlichen',
        description:
            'Wenn alles passt, kopiere den formatierten Text mit einem Klick, füge ihn auf LinkedIn ein und veröffentliche deinen Beitrag mit gutem Gefühl.',
    },
]

const VorschauFeatures = [
    {
        icon: 'mobile',
        title: 'Vorschau für Mobil',
        body: 'Sieh, wie dein LinkedIn Beitrag auf dem Smartphone aussieht - dort lesen die meisten Nutzer ihren Feed.',
    },
    {
        icon: 'desktop',
        title: 'Vorschau für Desktop',
        body: 'Prüfe das Erscheinungsbild deines Beitrags auf dem Desktop, damit er auch auf großen Bildschirmen professionell wirkt.',
    },
    {
        icon: 'tablet',
        title: 'Vorschau für Tablet',
        body: 'Kontrolliere die Darstellung auf dem Tablet, damit dein Beitrag auf jedem Gerät sauber und ansprechend erscheint.',
    },
    {
        icon: 'bold',
        title: 'Fett und Kursiv',
        body: 'Hebe wichtige Aussagen mit Fettschrift hervor oder betone Begriffe kursiv - direkt im Editor, ohne Umwege.',
    },
    {
        icon: 'bulletList',
        title: 'Listen und Aufzählungen',
        body: 'Strukturiere deinen Beitrag mit Aufzählungen oder nummerierten Listen, damit er leichter zu lesen ist.',
    },
    {
        icon: 'formatting',
        title: 'Zeichenzähler',
        body: 'Behalte die Zeichenanzahl im Blick und finde die ideale Länge, bevor LinkedIn deinen Text mit "mehr anzeigen" kürzt.',
    },
]

const row1 = VorschauFeatures.slice(0, 3)
const row2 = VorschauFeatures.slice(3, 6)

const VorschauDifferentiators = [
    {
        icon: 'italic',
        title: 'Fett- und Kursivschrift mit Umlauten',
        body: 'Die Fett- und Kursivformatierung nutzt spezielle Unicode-Zeichen, weil LinkedIn keine echte Formatierung in Beiträgen unterstützt. Für die Buchstaben ä, ö, ü und ß gibt es jedoch keine fetten oder kursiven Unicode-Varianten. Diese Zeichen bleiben deshalb in normaler Schrift, während der restliche Text formatiert wird. Das ist eine echte Einschränkung von Unicode und kein Fehler des Tools - so weißt du vorher genau, was dich erwartet.',
    },
    {
        icon: 'checkCircle',
        title: 'Datenschutz: Verarbeitung im Browser',
        body: 'Deine Texte verlassen deinen Browser nicht. Die LinkedIn Post Vorschau läuft vollständig lokal auf deinem Gerät - es wird nichts an einen Server gesendet oder gespeichert. Das macht das Tool datenschutzfreundlich und DSGVO-konform.',
    },
]

const VorschauFAQList = [
    {
        question: 'Ist die LinkedIn Post Vorschau kostenlos?',
        answer: 'Ja, die LinkedIn Post Vorschau ist vollständig kostenlos. Es gibt keine versteckten Kosten, kein Abo und keine Begrenzung - öffne einfach die Seite und leg los.',
    },
    {
        question: 'Brauche ich ein Konto?',
        answer: 'Nein. Du brauchst weder ein Konto noch eine Anmeldung. Das Tool funktioniert sofort im Browser, ganz ohne Registrierung.',
    },
    {
        question: 'Kann ich meinen Beitrag für Mobil und Desktop in der Vorschau sehen?',
        answer: 'Ja. Die Vorschau zeigt deinen LinkedIn Beitrag genau so, wie er auf Smartphone, Tablet und Desktop erscheint. So erkennst du, ob dein Hook über der "mehr anzeigen"-Grenze sichtbar bleibt.',
    },
    {
        question: 'Wie formatiere ich einen LinkedIn Beitrag fett oder kursiv?',
        answer: 'Markiere den gewünschten Text im Editor und wähle Fett oder Kursiv. Das Tool wandelt die Buchstaben in passende Unicode-Zeichen um, die LinkedIn als normalen Text akzeptiert - so bleibt die Formatierung beim Einfügen erhalten.',
    },
    {
        question: 'Funktioniert die Fettschrift mit Umlauten?',
        answer: 'Größtenteils ja, aber mit einer Ausnahme: Für die Zeichen ä, ö, ü und ß gibt es keine fetten oder kursiven Unicode-Varianten. Diese Buchstaben bleiben in normaler Schrift, der restliche Text wird wie gewohnt formatiert.',
    },
    {
        question: 'Werden meine Daten gespeichert?',
        answer: 'Nein. Die Verarbeitung findet vollständig in deinem Browser statt. Dein Text wird nicht an einen Server gesendet und nicht gespeichert - die Vorschau ist datenschutzfreundlich und DSGVO-konform.',
    },
]

function VorschauHero() {
    return (
        <DotBackground className='overflow-hidden'>
            <div className='mx-auto flex flex-col items-center px-6 py-20 md:pt-28'>
                <AnimateIn delay={0}>
                    <p className='border-border shadow-subtle bg-background text-muted-foreground mb-6 flex items-center gap-2 rounded-full border px-4 py-1 text-xs sm:text-sm'>
                        Kostenlos - keine Anmeldung nötig
                    </p>
                </AnimateIn>

                <AnimateIn delay={0.1}>
                    <h1 className='font-heading text-foreground mb-5 text-center text-5xl font-bold tracking-[-0.02em] text-balance md:text-6xl lg:text-7xl'>
                        LinkedIn Post Vorschau
                    </h1>
                </AnimateIn>

                <AnimateIn delay={0.2}>
                    <p className='text-muted-foreground mx-auto mb-8 max-w-[560px] text-center text-lg leading-7 md:text-xl md:leading-8'>
                        Der kostenlose Editor, um deinen LinkedIn Beitrag zu formatieren und die Vorschau für Mobil und
                        Desktop zu sehen - bevor du ihn veröffentlichst.
                    </p>
                </AnimateIn>

                <AnimateIn delay={0.3}>
                    <div className='bg-secondary mb-8 flex items-center gap-2 rounded-full px-4 py-2'>
                        <StarRating />
                        <span className='text-muted-foreground text-xs font-medium sm:text-sm'>
                            Von tausenden LinkedIn-Creators genutzt
                        </span>
                    </div>
                </AnimateIn>

                <AnimateIn delay={0.4}>
                    <Button asChild size='lg' className='rounded-lg'>
                        <Link href='#tool'>
                            Vorschau öffnen
                            <ArrowDown className='animate-bounce-down ml-0.5 size-4' />
                        </Link>
                    </Button>
                </AnimateIn>
            </div>
        </DotBackground>
    )
}

function HowItWorksSection() {
    return (
        <section id='how-it-works' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-6 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>So geht es</p>
                    <h2 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
                        So funktioniert die LinkedIn Post Vorschau
                    </h2>
                    <p className='text-muted-foreground mt-3 max-w-lg text-base'>
                        In vier einfachen Schritten zum fertig formatierten Beitrag.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top'>
                        {VorschauSteps.map((step, index) => (
                            <div
                                key={step.title}
                                className={index < VorschauSteps.length - 1 ? 'dash-bottom p-6' : 'p-6'}>
                                <span className='text-primary/70 mb-1 block text-xs font-semibold tracking-wider uppercase'>
                                    Schritt {index + 1}
                                </span>
                                <h3 className='text-foreground mb-1 text-base font-semibold'>{step.title}</h3>
                                <p className='text-muted-foreground max-w-2xl text-sm leading-relaxed'>
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}

function FeatureCell({ feature, showLeft }: { feature: (typeof VorschauFeatures)[number]; showLeft?: boolean }) {
    return (
        <div className={showLeft ? 'dash-left relative p-6' : 'relative p-6'}>
            <Icon
                name={feature.icon as keyof typeof Icons}
                className='bg-primary/10 text-primary mb-4 size-8 rounded-lg p-1.5'
                aria-hidden='true'
            />
            <h3 className='text-foreground mb-2 text-base font-semibold'>{feature.title}</h3>
            <p className='text-muted-foreground text-sm leading-relaxed'>{feature.body}</p>
        </div>
    )
}

function VorschauFeaturesSection() {
    return (
        <section id='features' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-6 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>
                        Alles für deinen Beitrag
                    </p>
                    <h2 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
                        Funktionen der LinkedIn Beitrag Vorschau
                    </h2>
                    <p className='text-muted-foreground mt-3 max-w-lg text-base'>
                        Vom Formatieren bis zur Echtzeit-Vorschau - alles, was du für einen überzeugenden LinkedIn
                        Beitrag brauchst.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top'>
                        <div className='dash-bottom grid md:grid-cols-3'>
                            {row1.map((feature, i) => (
                                <FeatureCell key={feature.title} feature={feature} showLeft={i > 0} />
                            ))}
                        </div>
                        <div className='grid md:grid-cols-3'>
                            {row2.map((feature, i) => (
                                <FeatureCell key={feature.title} feature={feature} showLeft={i > 0} />
                            ))}
                        </div>
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}

function BesonderheitenSection() {
    return (
        <section id='besonderheiten' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <AnimateIn className='mb-6 px-6'>
                    <p className='text-primary mb-2 text-sm font-semibold tracking-wider uppercase'>Gut zu wissen</p>
                    <h2 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
                        Besonderheiten und ehrliche Hinweise
                    </h2>
                    <p className='text-muted-foreground mt-3 max-w-lg text-base'>
                        Zwei Dinge, die du über die Formatierung und den Datenschutz wissen solltest.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top grid md:grid-cols-2'>
                        {VorschauDifferentiators.map((item, i) => (
                            <div key={item.title} className={i > 0 ? 'dash-left p-6' : 'p-6'}>
                                <Icon
                                    name={item.icon as keyof typeof Icons}
                                    className='bg-primary/10 text-primary mb-4 size-8 rounded-lg p-1.5'
                                    aria-hidden='true'
                                />
                                <h3 className='text-foreground mb-2 text-base font-semibold'>{item.title}</h3>
                                <p className='text-muted-foreground text-sm leading-relaxed'>{item.body}</p>
                            </div>
                        ))}
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}

function VorschauFAQSection() {
    const faqSchema: WithContext<FAQPage> = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': VorschauFAQList.map((faq) => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer,
            },
        })),
    }

    return (
        <section id='faqs' className='border-border border-t'>
            <div className='pt-20 md:pt-24'>
                <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

                <AnimateIn className='mb-6 px-6'>
                    <h2 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl'>
                        Häufige Fragen
                    </h2>
                    <p className='text-muted-foreground mt-3 max-w-lg text-base'>
                        Antworten rund um die LinkedIn Post Vorschau.
                    </p>
                </AnimateIn>

                <AnimateIn>
                    <div className='dash-top grid lg:grid-cols-[5fr_3fr]'>
                        <div className='dash-right p-6'>
                            <Accordion type='multiple'>
                                {VorschauFAQList.map((faq) => (
                                    <AccordionItem key={faq.question} value={faq.question} className='border-border'>
                                        <AccordionTrigger className='text-foreground gap-4 text-start text-base font-medium hover:no-underline'>
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className='text-muted-foreground text-sm leading-relaxed'>
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>

                        <div className='dash-left relative hidden lg:block'>
                            <div
                                className='text-border pointer-events-none absolute inset-0'
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(125deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)',
                                }}
                            />
                        </div>
                    </div>
                </AnimateIn>
            </div>
        </section>
    )
}

function VorschauCta() {
    return (
        <section className='border-border border-t'>
            <DotBackground className='overflow-hidden'>
                <div className='mx-auto flex flex-col items-center px-6 py-20 text-center'>
                    <AnimateIn>
                        <h2 className='font-heading text-foreground mb-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl'>
                            Erstelle deinen perfekten LinkedIn Beitrag
                        </h2>
                    </AnimateIn>

                    <AnimateIn delay={0.1}>
                        <p className='text-muted-foreground mx-auto mb-8 max-w-[480px] text-base leading-7'>
                            Schreibe, formatiere und sieh die Vorschau deines Beitrags - kostenlos und ganz ohne
                            Anmeldung.
                        </p>
                    </AnimateIn>

                    <AnimateIn delay={0.2}>
                        <Button asChild size='lg' className='rounded-lg'>
                            <Link href='#tool'>
                                Jetzt Vorschau öffnen
                                <ArrowDown className='animate-bounce-down ml-0.5 size-4' />
                            </Link>
                        </Button>
                    </AnimateIn>

                    <AnimateIn delay={0.3}>
                        <div className='mt-6 flex items-center gap-2'>
                            <span className='text-muted-foreground text-sm font-medium'>{SOCIAL_PROOF.rating}/5</span>
                            <StarRating />
                            <span className='text-muted-foreground text-sm'>aus {SOCIAL_PROOF.count} Bewertungen</span>
                        </div>
                    </AnimateIn>
                </div>
            </DotBackground>
        </section>
    )
}

export default function LinkedInVorschauPage() {
    const softwareSchema: WithContext<SoftwareApplication> = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'LinkedIn Post Vorschau',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web Browser',
        'url': `${site.url}/linkedin-vorschau#tool`,
        'inLanguage': 'de-DE',
        'description':
            'Kostenlose LinkedIn Post Vorschau. Formatiere deinen Beitrag mit Fett, Kursiv und Listen und sieh die Vorschau für Mobil und Desktop, bevor du ihn veröffentlichst. Ohne Anmeldung.',
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'EUR',
        },
        'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': SOCIAL_PROOF.rating,
            'bestRating': '5',
            'worstRating': '1',
            'ratingCount': Number(SOCIAL_PROOF.count.replace(/,/g, '')),
        },
        'featureList': [
            'Fett-, Kursiv-, Unterstreichungs- und Durchstreichungsformatierung',
            'Aufzählungen und nummerierte Listen',
            'Echtzeit-Vorschau des LinkedIn Beitrags',
            'Vorschau für Mobil, Tablet und Desktop',
            'Zeichenzähler',
            'Kostenlos, ohne Anmeldung',
        ],
        'screenshot': `${site.url}/images/og/og.png`,
        'provider': {
            '@type': 'Organization',
            'name': 'LinkedIn Post Preview',
            'url': site.url,
        },
    }

    return (
        <>
            <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

            <div className='max-w-content border-border mx-auto border-x'>
                <VorschauHero />
                <Tool />
                <HowItWorksSection />
            </div>

            <div className='max-w-content border-border mx-auto border-x'>
                <VorschauFeaturesSection />
                <BesonderheitenSection />
                <VorschauFAQSection />
                <VorschauCta />
            </div>
        </>
    )
}
