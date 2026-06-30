'use client'

import * as React from 'react'
import {
    BugIcon,
    CheckCircle2Icon,
    EraserIcon,
    PlayIcon,
    RotateCcwIcon,
    Trash2Icon,
    XIcon,
    type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { upsertBranding } from '@/lib/supabase/branding'
import { upsertStrategy } from '@/lib/supabase/strategy'
import { cn } from '@/lib/utils'
import { useBranding } from '@/hooks/use-branding'
import { usePlan } from '@/hooks/use-plan'
import { useStrategy } from '@/hooks/use-strategy'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/components/dashboard/auth-provider'
import { emitOnboardingDebug } from '@/components/dashboard/onboarding/debug-events'

// ---------------------------------------------------------------------------
// Dashboard debug menu (dev only)
//
// A floating, always-on-top panel for testing dashboard/onboarding state:
// open/close/restart the onboarding modal, mark it complete, or wipe the
// anonymous user entirely and start fresh. Gated to NODE_ENV === 'development'
// at the mount site (layout) and again here, so it never ships to production.
// ---------------------------------------------------------------------------

const LP_PREFIX = 'lp-'

function clearLpLocalStorage() {
    try {
        Object.keys(localStorage)
            .filter((k) => k.startsWith(LP_PREFIX))
            .forEach((k) => localStorage.removeItem(k))
    } catch {}
}

export function DashboardDebugMenu() {
    const { userId, supabase, isReady } = useAuth()
    const { branding } = useBranding()
    const { strategy } = useStrategy()
    const { plan } = usePlan()
    const [open, setOpen] = React.useState(false)
    const [busy, setBusy] = React.useState(false)

    if (process.env.NODE_ENV !== 'development') return null

    const run = async (label: string, fn: () => Promise<void> | void) => {
        if (busy) return
        setBusy(true)
        try {
            await fn()
        } catch (err) {
            console.error(`[debug] ${label} failed`, err)
            toast.error(`${label} failed`)
        } finally {
            setBusy(false)
        }
    }

    const openOnboarding = () => {
        emitOnboardingDebug('open')
        setOpen(false)
    }

    const closeOnboarding = () => {
        emitOnboardingDebug('close')
        setOpen(false)
    }

    const restartOnboarding = () =>
        run('Restart onboarding', async () => {
            if (!userId) {
                toast.error('No session yet')
                return
            }
            await upsertBranding(supabase, userId, {
                ...branding,
                role: '',
                meta: { ...branding.meta, onboardedAt: null },
            })
            await upsertStrategy(supabase, userId, { ...strategy, completedAt: null })
            try {
                localStorage.removeItem('lp-onboarding-state')
            } catch {}
            window.location.reload()
        })

    const markComplete = () =>
        run('Mark onboarding complete', async () => {
            if (!userId) {
                toast.error('No session yet')
                return
            }
            await upsertBranding(supabase, userId, {
                ...branding,
                meta: { ...branding.meta, onboardedAt: new Date().toISOString() },
            })
            try {
                localStorage.removeItem('lp-onboarding-state')
            } catch {}
            emitOnboardingDebug('close')
            toast.success('Onboarding marked complete')
            setOpen(false)
        })

    const clearEverything = () =>
        run('Clear everything', async () => {
            const ok = window.confirm(
                'Delete ALL your data (branding, strategy, drafts, billing, metrics), sign out, and start a brand-new anonymous user?\n\nThis cannot be undone.',
            )
            if (!ok) return
            if (userId) {
                await Promise.allSettled([
                    supabase.from('drafts').delete().eq('user_id', userId),
                    supabase.from('branding').delete().eq('user_id', userId),
                    supabase.from('strategy').delete().eq('user_id', userId),
                    supabase.from('billing').delete().eq('user_id', userId),
                    supabase.from('post_metrics').delete().eq('user_id', userId),
                ])
            }
            clearLpLocalStorage()
            try {
                await supabase.auth.signOut()
            } catch {}
            window.location.reload()
        })

    const clearLocalOnly = () =>
        run('Clear local storage', () => {
            clearLpLocalStorage()
            window.location.reload()
        })

    return (
        <div className='pointer-events-auto fixed right-4 bottom-4 z-[120] flex flex-col items-end gap-2'>
            {open && (
                <div className='bg-popover text-popover-foreground border-border w-72 overflow-hidden rounded-xl border shadow-xl'>
                    <div className='border-border flex items-center justify-between border-b px-3 py-2'>
                        <span className='font-mono text-[11px] font-semibold tracking-wide uppercase'>Debug menu</span>
                        <button
                            type='button'
                            onClick={() => setOpen(false)}
                            className='text-muted-foreground hover:text-foreground'>
                            <XIcon className='size-4' />
                        </button>
                    </div>

                    <div className='text-muted-foreground space-y-0.5 px-3 py-2 font-mono text-[10.5px]'>
                        <div className='truncate'>user: {isReady ? (userId ?? 'none') : 'loading...'}</div>
                        <div>
                            plan: {plan} · onboarded: {branding.meta.onboardedAt ? 'yes' : 'no'}
                        </div>
                    </div>

                    <Separator />
                    <Section label='Onboarding'>
                        <Item icon={PlayIcon} onClick={openOnboarding}>
                            Open onboarding
                        </Item>
                        <Item icon={XIcon} onClick={closeOnboarding}>
                            Close onboarding
                        </Item>
                        <Item icon={RotateCcwIcon} onClick={restartOnboarding} disabled={busy}>
                            Restart (keep account)
                        </Item>
                        <Item icon={CheckCircle2Icon} onClick={markComplete} disabled={busy}>
                            Mark complete
                        </Item>
                    </Section>

                    <Separator />
                    <Section label='Reset'>
                        <Item icon={Trash2Icon} onClick={clearEverything} disabled={busy} destructive>
                            Clear everything & restart
                        </Item>
                        <Item icon={EraserIcon} onClick={clearLocalOnly} disabled={busy}>
                            Clear local storage
                        </Item>
                    </Section>
                </div>
            )}

            <button
                type='button'
                onClick={() => setOpen((v) => !v)}
                title='Debug menu'
                className={cn(
                    'flex size-10 items-center justify-center rounded-full border shadow-lg transition-colors',
                    open
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground',
                )}>
                <BugIcon className='size-4.5' />
            </button>
        </div>
    )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className='p-1'>
            <p className='text-muted-foreground px-2 pt-1 pb-0.5 font-mono text-[10px] tracking-wide uppercase'>
                {label}
            </p>
            {children}
        </div>
    )
}

function Item({
    icon: Icon,
    onClick,
    children,
    disabled,
    destructive,
}: {
    icon: LucideIcon
    onClick: () => void
    children: React.ReactNode
    disabled?: boolean
    destructive?: boolean
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-50',
                destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-muted/60',
            )}>
            <Icon className='size-4 shrink-0' />
            {children}
        </button>
    )
}
