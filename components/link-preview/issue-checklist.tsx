'use client'

import { useState } from 'react'
import { Check, CircleCheck, CircleX, Copy, TriangleAlert, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import type { OgIssue, OgIssueSeverity } from '@/lib/link-preview/types'
import { cn } from '@/lib/utils'

const SEVERITY_CONFIG: Record<OgIssueSeverity, { icon: LucideIcon; className: string; label: string }> = {
    error: { icon: CircleX, className: 'text-red-600', label: 'Error' },
    warning: { icon: TriangleAlert, className: 'text-amber-500', label: 'Warning' },
    ok: { icon: CircleCheck, className: 'text-green-600', label: 'OK' },
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
        <div className='border-border mt-2 flex items-start gap-2 rounded-md border bg-neutral-50 p-2'>
            <code className='min-w-0 flex-1 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-neutral-700'>
                {fix}
            </code>
            <button
                type='button'
                onClick={onCopy}
                aria-label='Copy fix to clipboard'
                className='shrink-0 rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-800'>
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
                    <li key={issue.id} className='border-border flex gap-3 rounded-lg border bg-white p-3'>
                        <Icon className={cn('mt-0.5 size-5 shrink-0', config.className)} aria-hidden='true' />
                        <div className='min-w-0 flex-1'>
                            <p className='text-sm font-medium text-neutral-900'>
                                <span className='sr-only'>{config.label}: </span>
                                {issue.title}
                            </p>
                            <p className='mt-0.5 text-sm leading-relaxed text-neutral-500'>{issue.detail}</p>
                            {issue.fix ? <CopyableFix fix={issue.fix} /> : null}
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}
