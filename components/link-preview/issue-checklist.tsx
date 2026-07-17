'use client'

import { useState } from 'react'
import { Check, CircleCheck, CircleX, Copy, TriangleAlert, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { OgIssue, OgIssueSeverity } from '@/lib/link-preview/types'
import { cn } from '@/lib/utils'

const SEVERITY_CONFIG: Record<OgIssueSeverity, { icon: LucideIcon; className: string; label: string }> = {
    error: { icon: CircleX, className: 'text-error', label: 'Error' },
    warning: { icon: TriangleAlert, className: 'text-warning', label: 'Warning' },
    ok: { icon: CircleCheck, className: 'text-success', label: 'OK' },
}

function CopyableFix({ fix }: { fix: string }) {
    const [copied, setCopied] = useState(false)

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(fix)
            setCopied(true)
            toast.success('Copied')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Could not copy to clipboard')
        }
    }

    return (
        <div className='border-border bg-secondary mt-2 flex items-start gap-2 rounded-md border p-2'>
            <code className='text-muted-foreground min-w-0 flex-1 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap'>
                {fix}
            </code>
            <button
                type='button'
                onClick={onCopy}
                aria-label='Copy fix to clipboard'
                className='text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0 rounded p-1 transition-colors'>
                {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
            </button>
        </div>
    )
}

export function IssueChecklist({ issues }: { issues: OgIssue[] }) {
    if (issues.length === 0) return null

    return (
        <ul className='flex flex-col gap-3'>
            {issues.map((issue) => {
                const config = SEVERITY_CONFIG[issue.severity]
                const Icon = config.icon
                return (
                    <li key={issue.id} className='border-border bg-card flex gap-3 rounded-lg border p-3'>
                        <Icon className={cn('mt-0.5 size-5 shrink-0', config.className)} aria-hidden='true' />
                        <div className='min-w-0 flex-1'>
                            <p className='text-foreground text-sm font-medium'>
                                <span className='sr-only'>{config.label}: </span>
                                {issue.title}
                            </p>
                            <p className='text-muted-foreground mt-0.5 text-sm leading-relaxed'>{issue.detail}</p>
                            {issue.fix ? <CopyableFix fix={issue.fix} /> : null}
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
