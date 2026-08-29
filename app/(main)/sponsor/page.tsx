import type { Metadata } from 'next'
import Link from 'next/link'
import { absoluteUrl } from '@/utils/urls'
import { ArrowRight, Copy, Mail, Monitor, Users } from 'lucide-react'

import { Routes } from '@/config/routes'
import { site } from '@/config/site'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrackClick } from '@/components/tracking/track-click'

const title = 'Sponsor LinkedInPreview.com'
const description =
    'Reach people actively formatting and previewing professional posts. One sponsor slot is available at a time.'
const sponsorEmail = 'support@linkedinpreview.com'

export const metadata: Metadata = {
    title,
    description,
    alternates: {
        canonical: absoluteUrl(Routes.Sponsor),
    },
    openGraph: {
        title,
        description,
        url: absoluteUrl(Routes.Sponsor),
        siteName: site.title,
    },
}

const audienceStats = [
    {
        icon: Users,
        value: '4,210',
        label: 'unique users in the last 7 days',
    },
    {
        icon: Copy,
        value: '2,581',
        label: 'posts copied in the last 7 days',
    },
    {
        icon: Monitor,
        value: '1',
        label: 'exclusive sponsor per booking',
    },
]

export default function SponsorPage() {
    const emailHref = `mailto:${sponsorEmail}?subject=LinkedInPreview.com%20sponsorship`

    return (
        <div>
            <section className='dot-grid border-border border-b'>
                <div className='max-w-content mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24'>
                    <Badge variant='outline' className='text-primary bg-background mb-5'>
                        Sponsorship
                    </Badge>
                    <div className='grid items-end gap-10 lg:grid-cols-[3fr_2fr]'>
                        <div>
                            <h1 className='font-heading text-foreground max-w-3xl text-4xl font-bold tracking-tight text-balance md:text-6xl'>
                                Reach people while they prepare their next post.
                            </h1>
                            <p className='text-muted-foreground mt-6 max-w-2xl text-lg leading-8'>
                                LinkedInPreview.com is a free formatter and preview tool for people publishing
                                professional content. Sponsor the next step after they finish preparing a post.
                            </p>
                        </div>
                        <Card className='shadow-elevated bg-card rounded-xl'>
                            <CardHeader>
                                <CardTitle className='text-xl'>One clear placement</CardTitle>
                                <CardDescription>
                                    A single sponsor is shown at a time. No rotating ads or competing placements.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className='text-muted-foreground space-y-3 text-sm leading-6'>
                                    <li>Homepage placement beneath the free editor</li>
                                    <li>Matching placement on blog pages</li>
                                    <li>Simple click reporting after the campaign</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            <section className='border-border border-b'>
                <div className='max-w-content mx-auto grid border-x sm:grid-cols-3'>
                    {audienceStats.map((stat) => {
                        const Icon = stat.icon

                        return (
                            <div
                                key={stat.label}
                                className='border-border border-b p-7 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0'>
                                <Icon className='text-primary mb-4 size-5' aria-hidden='true' />
                                <p className='text-foreground text-3xl font-semibold tracking-tight'>{stat.value}</p>
                                <p className='text-muted-foreground mt-1 text-sm'>{stat.label}</p>
                            </div>
                        )
                    })}
                </div>
                <p className='text-muted-foreground max-w-content mx-auto px-6 py-4 text-xs'>
                    Audience figures are a PostHog 7-day snapshot taken 29 August 2026.
                </p>
            </section>

            <section className='max-w-content mx-auto px-6 py-16 md:py-24'>
                <div className='mx-auto max-w-3xl text-center'>
                    <p className='text-primary text-sm font-semibold tracking-wider uppercase'>Simple terms</p>
                    <h2 className='font-heading text-foreground mt-3 text-3xl font-bold tracking-tight md:text-4xl'>
                        Test the audience before committing.
                    </h2>
                    <p className='text-muted-foreground mt-4 text-base leading-7'>
                        Start with a one-week test, then continue only if the placement fits your product and audience.
                    </p>
                </div>

                <div className='mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2'>
                    <Card className='rounded-xl'>
                        <CardHeader>
                            <CardTitle>One-week test</CardTitle>
                            <CardDescription>For a focused launch or audience-fit check.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className='text-foreground text-4xl font-semibold tracking-tight'>$150</p>
                            <p className='text-muted-foreground mt-3 text-sm'>One exclusive placement for 7 days.</p>
                        </CardContent>
                    </Card>
                    <Card className='border-primary shadow-subtle rounded-xl'>
                        <CardHeader>
                            <CardTitle>Monthly sponsorship</CardTitle>
                            <CardDescription>For tools with a useful next step for creators.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className='text-foreground text-4xl font-semibold tracking-tight'>$400</p>
                            <p className='text-muted-foreground mt-3 text-sm'>One exclusive placement for 30 days.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className='border-border bg-muted/30 mx-auto mt-10 max-w-3xl rounded-xl border p-7 md:flex md:items-center md:justify-between md:gap-8'>
                    <div>
                        <h2 className='text-foreground text-lg font-semibold'>Want to check availability?</h2>
                        <p className='text-muted-foreground mt-1 text-sm leading-6'>
                            Email your company, product, preferred dates, and destination URL. We will confirm fit and
                            availability before any commitment.
                        </p>
                    </div>
                    <TrackClick
                        event='sponsor_inquiry_clicked'
                        properties={{ source: 'sponsor_page', method: 'email' }}>
                        <Button asChild className='mt-5 shrink-0 rounded-lg md:mt-0'>
                            <a href={emailHref}>
                                Email about sponsorship
                                <ArrowRight className='size-4' aria-hidden='true' />
                            </a>
                        </Button>
                    </TrackClick>
                </div>

                <TrackClick
                    event='sponsor_inquiry_clicked'
                    properties={{ source: 'sponsor_page', method: 'email_text' }}>
                    <a
                        href={emailHref}
                        className='text-muted-foreground hover:text-foreground mx-auto mt-5 flex w-fit items-center gap-2 text-sm underline underline-offset-4'>
                        <Mail className='size-4' aria-hidden='true' />
                        {sponsorEmail}
                    </a>
                </TrackClick>
            </section>

            <section className='border-border border-t'>
                <div className='max-w-content mx-auto px-6 py-12 text-center'>
                    <p className='text-muted-foreground text-sm'>Looking for the formatter instead?</p>
                    <Link
                        href={Routes.Tool}
                        className='text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline'>
                        Try the free post formatter
                        <ArrowRight className='size-4' aria-hidden='true' />
                    </Link>
                </div>
            </section>
        </div>
    )
}
