'use client'

import type { BrandingRole } from '@/lib/branding'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RoleStepProps = {
    value: BrandingRole
    onChange: (value: BrandingRole) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES: { value: BrandingRole; label: string }[] = [
    { value: 'founder', label: 'Founder / C-Level' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'team-lead', label: 'Team Lead' },
    { value: 'employee', label: 'Employee' },
    { value: 'creator', label: 'Creator' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'agency', label: 'Agency' },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoleStep({ value, onChange }: RoleStepProps) {
    return (
        <div className='flex w-full flex-col gap-2'>
            {ROLES.map((role) => (
                <button
                    key={role.value}
                    type='button'
                    onClick={() => onChange(role.value)}
                    className={cn(
                        'w-full rounded-lg border px-5 py-3.5 text-left text-sm font-medium transition-all',
                        value === role.value
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border bg-muted/30 text-foreground hover:border-border/80 hover:bg-muted/50',
                    )}>
                    {role.label}
                </button>
            ))}
        </div>
    )
}
