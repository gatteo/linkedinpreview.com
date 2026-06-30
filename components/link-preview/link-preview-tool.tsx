'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, ExternalLink, Loader2, Search } from 'lucide-react'
import posthog from 'posthog-js'

import { ApiRoutes } from '@/config/routes'
import type { LinkPreviewResult } from '@/lib/link-preview/types'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IssueChecklist } from '@/components/link-preview/issue-checklist'
import { LinkCard } from '@/components/link-preview/link-card'

const POST_INSPECTOR_URL = 'https://www.linkedin.com/post-inspector/'

function hostOf(url: string): string {
    try {
        return new URL(url).hostname
    } catch {
        return 'unknown'
    }
}

function looksLikeUrl(value: string): boolean {
    const trimmed = value.trim()
    if (!trimmed) return false
    // Accept bare domains too - we normalize to https before sending.
    return /^(https?:\/\/)?[^\s.]+\.[^\s]+$/i.test(trimmed)
}

function normalizeUrl(value: string): string {
    const trimmed = value.trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
}

export function LinkPreviewTool() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<LinkPreviewResult | null>(null)

    const runPreview = async () => {
        if (loading) return

        if (!looksLikeUrl(url)) {
            setError('Please enter a valid URL, for example https://example.com.')
            return
        }

        const target = normalizeUrl(url)
        setLoading(true)
        setError(null)
        posthog?.capture('link_preview_checked', { host: hostOf(target) })

        try {
            const response = await fetch(ApiRoutes.LinkPreview, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: target }),
            })

            const payload = await response.json()

            if (!response.ok) {
                const message = payload?.error ?? 'We could not analyze that link.'
                setError(message)
                setResult(null)
                posthog?.capture('link_preview_failed', { host: hostOf(target), status: response.status })
                return
            }

            setResult(payload as LinkPreviewResult)
        } catch (err) {
            posthog?.captureException(err)
            setError('Something went wrong. Please try again.')
            setResult(null)
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = (event: FormEvent) => {
        event.preventDefault()
        void runPreview()
    }

    return (
        <div id='tool' className='border-border scroll-mt-24 border-t px-6 py-12 md:py-16'>
            <div className='mx-auto max-w-3xl'>
                <form onSubmit={onSubmit} noValidate className='flex flex-col gap-3 sm:flex-row'>
                    <div className='relative flex-1'>
                        <Search className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2' />
                        <Input
                            type='url'
                            inputMode='url'
                            autoComplete='url'
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder='https://example.com/your-page'
                            aria-label='URL to preview'
                            aria-invalid={Boolean(error)}
                            className='h-11 pl-9 text-base'
                        />
                    </div>
                    <Button type='submit' size='lg' disabled={loading} className='rounded-lg'>
                        {loading ? (
                            <>
                                <Loader2 className='size-4 animate-spin' />
                                Checking
                            </>
                        ) : (
                            <>
                                Preview
                                <ArrowRight className='size-4' />
                            </>
                        )}
                    </Button>
                </form>

                {error ? (
                    <Alert variant='destructive' className='mt-4'>
                        <AlertTitle>Could not preview this link</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : null}
            </div>

            {result ? (
                <div className='mx-auto mt-10 max-w-5xl'>
                    <div className='grid gap-8 lg:grid-cols-2'>
                        <Preview label='Desktop' data={result.data} variant='desktop' />
                        <Preview label='Mobile' data={result.data} variant='mobile' />
                    </div>

                    <div className='mt-10'>
                        <h2 className='font-heading text-foreground mb-4 text-lg font-semibold tracking-tight'>
                            Open Graph checklist
                        </h2>
                        <IssueChecklist issues={result.issues} />
                    </div>

                    <CacheCallout className='mt-8' />
                </div>
            ) : (
                <div className='mx-auto mt-8 max-w-3xl'>
                    <CacheCallout />
                </div>
            )}
        </div>
    )
}

function Preview({
    label,
    data,
    variant,
}: {
    label: string
    data: LinkPreviewResult['data']
    variant: 'desktop' | 'mobile'
}) {
    return (
        <div className='flex flex-col items-center gap-3'>
            <p className='tracking-label text-muted-foreground font-mono text-xs font-medium uppercase'>{label}</p>
            <div className='bg-secondary flex w-full justify-center rounded-xl p-6'>
                <LinkCard data={data} variant={variant} />
            </div>
        </div>
    )
}

function CacheCallout({ className }: { className?: string }) {
    return (
        <div className={cn('border-border bg-secondary rounded-lg border p-4', className)}>
            <p className='text-muted-foreground text-sm'>
                LinkedIn caches link previews for about 7 days, and no third-party tool can force a refresh. To update a
                cached preview, edit your Open Graph tags, then re-share the link or run it through LinkedIn&apos;s
                official tool.
            </p>
            <a
                href={POST_INSPECTOR_URL}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline'>
                Open LinkedIn Post Inspector
                <ExternalLink className='size-3.5' />
            </a>
        </div>
    )
}
