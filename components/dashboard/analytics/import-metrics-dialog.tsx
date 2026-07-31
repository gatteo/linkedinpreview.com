'use client'

import * as React from 'react'
import { ExternalLinkIcon, FileUpIcon, Loader2Icon } from 'lucide-react'
import posthog from 'posthog-js'
import { toast } from 'sonner'

import { parseLinkedInCsv, planCsvImport, type CsvImportResult, type CsvImportRow } from '@/lib/analytics/csv'
import type { DraftManifestEntry } from '@/lib/drafts'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type ImportMetricsDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    drafts: DraftManifestEntry[]
    onImport: (rows: CsvImportRow[]) => Promise<{ saved: number; created: number }>
}

const STEPS = [
    {
        title: 'Export your history from LinkedIn',
        detail: 'Go to LinkedIn > Analytics > Post analytics, then use Export in the top right to download it.',
    },
    {
        title: 'Save the "Top posts" sheet as CSV',
        detail: 'The export is a spreadsheet with several tabs. Open the "Top posts" one and save/export just that sheet as a CSV file.',
    },
    {
        title: 'Upload it below',
        detail: 'We fill in impressions and engagement for every post we can match or recognize.',
    },
]

export function ImportMetricsDialog({ open, onOpenChange, drafts, onImport }: ImportMetricsDialogProps) {
    const [result, setResult] = React.useState<CsvImportResult | null>(null)
    const [importing, setImporting] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Clear the staged result when the dialog closes.
    React.useEffect(() => {
        if (!open) setResult(null)
    }, [open])

    const handleFile = async (file: File) => {
        try {
            const text = await file.text()
            const rows = parseLinkedInCsv(text)
            if (rows.length === 0) {
                toast.error('Could not read that file. Make sure it is the "Top posts" sheet saved as CSV.')
                setResult(null)
                return
            }
            setResult(planCsvImport(rows, drafts))
        } catch {
            toast.error('Failed to read the file')
        } finally {
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleImport = async () => {
        if (!result) return
        const rows: CsvImportRow[] = [...result.matched, ...result.newPosts]
        if (rows.length === 0) return
        setImporting(true)
        try {
            const { saved, created } = await onImport(rows)
            posthog?.capture('csv_history_imported', {
                matched: result.matched.length,
                created,
                skipped: result.skippedCount,
            })
            const parts = [
                created > 0 ? `${created} new post${created === 1 ? '' : 's'}` : null,
                `${saved} post${saved === 1 ? '' : 's'} with metrics`,
            ].filter(Boolean)
            toast.success(`Imported ${parts.join(', ')}`)
            onOpenChange(false)
        } finally {
            setImporting(false)
        }
    }

    const totalToImport = result ? result.matched.length + result.newPosts.length : 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Import your LinkedIn history</DialogTitle>
                    <DialogDescription>
                        A one-time backfill of your existing LinkedIn posts. Posts you publish or schedule through this
                        app are tracked automatically going forward.
                    </DialogDescription>
                </DialogHeader>

                <input
                    ref={inputRef}
                    type='file'
                    accept='.csv,text/csv'
                    className='hidden'
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void handleFile(file)
                    }}
                />

                {result ? (
                    <div className='space-y-3 text-sm'>
                        <div className='border-border rounded-lg border p-3'>
                            <p>
                                <span className='font-semibold'>{totalToImport}</span> of {result.totalRows} rows are
                                ready to import
                                {result.newPosts.length > 0 && (
                                    <>
                                        {' '}
                                        (<span className='font-semibold'>{result.newPosts.length}</span> new)
                                    </>
                                )}
                                .
                            </p>
                            {result.skippedCount > 0 && (
                                <p className='text-muted-foreground mt-1 text-xs'>
                                    {result.skippedCount} row{result.skippedCount === 1 ? '' : 's'} had no metrics to
                                    import and were skipped.
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        <ol className='space-y-3'>
                            {STEPS.map((step, i) => (
                                <li key={step.title} className='flex gap-3'>
                                    <span className='bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold'>
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className='text-sm font-medium'>{step.title}</p>
                                        <p className='text-muted-foreground text-xs'>{step.detail}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <a
                            href='https://www.linkedin.com/analytics/creator/content/'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline'>
                            Open LinkedIn post analytics
                            <ExternalLinkIcon className='size-3' />
                        </a>
                        <button
                            type='button'
                            onClick={() => inputRef.current?.click()}
                            className='border-border hover:bg-muted/50 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors'>
                            <FileUpIcon className='text-muted-foreground size-6' />
                            <span className='text-sm font-medium'>Choose a CSV file</span>
                            <span className='text-muted-foreground text-xs'>The "Top posts" sheet, saved as CSV</span>
                        </button>
                    </div>
                )}

                <DialogFooter className='gap-2'>
                    <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={importing}>
                        Cancel
                    </Button>
                    {result && (
                        <Button type='button' onClick={handleImport} disabled={importing || totalToImport === 0}>
                            {importing ? <Loader2Icon className='size-4 animate-spin' /> : `Import ${totalToImport}`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
