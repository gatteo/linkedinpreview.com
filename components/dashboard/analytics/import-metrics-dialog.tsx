'use client'

import * as React from 'react'
import { FileUpIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { matchCsvToDrafts, parseLinkedInCsv, type CsvImportResult } from '@/lib/analytics/csv'
import type { MetricValues } from '@/lib/analytics/metrics'
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
    onImport: (rows: { draftId: string; values: MetricValues }[]) => Promise<number>
}

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
                toast.error('Could not read that file. Export your post analytics as CSV from LinkedIn.')
                setResult(null)
                return
            }
            setResult(matchCsvToDrafts(rows, drafts))
        } catch {
            toast.error('Failed to read the file')
        } finally {
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleImport = async () => {
        if (!result || result.matched.length === 0) return
        setImporting(true)
        try {
            const saved = await onImport(result.matched.map((m) => ({ draftId: m.draftId, values: m.values })))
            toast.success(`Imported metrics for ${saved} post${saved === 1 ? '' : 's'}`)
            onOpenChange(false)
        } finally {
            setImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>Import from LinkedIn</DialogTitle>
                    <DialogDescription>
                        In LinkedIn, open a post’s analytics and use Export to download a CSV, then upload it here. Rows
                        are matched to posts you published through this app by their LinkedIn URL.
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
                                <span className='font-semibold'>{result.matched.length}</span> of {result.totalRows}{' '}
                                rows matched a published post.
                            </p>
                            {result.unmatchedCount > 0 && (
                                <p className='text-muted-foreground mt-1 text-xs'>
                                    {result.unmatchedCount} row{result.unmatchedCount === 1 ? '' : 's'} didn’t match
                                    (posts not published through this app can’t be matched automatically).
                                </p>
                            )}
                        </div>
                        {result.matched.length > 0 && (
                            <ul className='max-h-40 space-y-1 overflow-y-auto'>
                                {result.matched.map((m) => (
                                    <li key={m.draftId} className='text-muted-foreground truncate text-xs'>
                                        {m.title}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <button
                        type='button'
                        onClick={() => inputRef.current?.click()}
                        className='border-border hover:bg-muted/50 flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors'>
                        <FileUpIcon className='text-muted-foreground size-6' />
                        <span className='text-sm font-medium'>Choose a CSV file</span>
                        <span className='text-muted-foreground text-xs'>LinkedIn post analytics export</span>
                    </button>
                )}

                <DialogFooter className='gap-2'>
                    <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={importing}>
                        Cancel
                    </Button>
                    {result && (
                        <Button
                            type='button'
                            onClick={handleImport}
                            disabled={importing || result.matched.length === 0}>
                            {importing ? (
                                <Loader2Icon className='size-4 animate-spin' />
                            ) : (
                                `Import ${result.matched.length}`
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
