'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckIcon, Loader2Icon, PencilIcon } from 'lucide-react'

import { TONE_OPTIONS, type Tone } from '@/config/ai'
import { getRoleContent, resolveRole, toneFromSummary, type Role } from '@/config/onboarding-personalization'
import { EASE_OUT, fadeUp, staggerContainer, staggerItem } from '@/lib/motion'
import { STRATEGY_AUDIENCES, type StrategyAudience } from '@/lib/strategy'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

import { enrichProfile, track } from '../ai'
import { useOnboarding } from '../context'

const ROLE_LABELS: Record<Role, string> = {
    'founder': 'Founder',
    'freelancer': 'Freelancer',
    'team-lead': 'Team lead',
    'employee': 'Employee',
    'creator': 'Creator',
    'consultant': 'Consultant',
    'agency': 'Agency owner',
}

const ROLES = Object.keys(ROLE_LABELS) as Role[]

const CONFIDENCE_FLOOR = 0.35

const READING_LINES = ['Spotting your niche', 'Reading your voice', 'Mapping your audience']

type Field = 'role' | 'niche' | 'audience' | 'tone' | null

function audienceLabel(value: StrategyAudience | undefined): string {
    return STRATEGY_AUDIENCES.find((a) => a.value === value)?.label ?? 'your audience'
}

export function MirrorStep() {
    const { answers, update } = useOnboarding()
    const [phase, setPhase] = React.useState<'reading' | 'ready'>(
        answers.enrichConfidence !== undefined ? 'ready' : 'reading',
    )
    const [editing, setEditing] = React.useState<Field>(null)
    const ranRef = React.useRef(false)

    React.useEffect(() => {
        if (ranRef.current || answers.enrichConfidence !== undefined) return
        ranRef.current = true
        track('onb_mirror_view')

        let cancelled = false
        const minTheater = new Promise((r) => setTimeout(r, 2400))

        Promise.all([
            enrichProfile({
                name: answers.profile.name || undefined,
                headline: answers.profile.headline || undefined,
                profileUrl: answers.profileUrl || undefined,
                welcomeGoal: answers.primaryGoal,
            }),
            minTheater,
        ]).then(([result]) => {
            if (cancelled) return
            const role = resolveRole(result?.role)
            const primaryAudience = result?.primaryAudience
            const nextAudience =
                primaryAudience && !answers.audience.includes(primaryAudience)
                    ? [primaryAudience, ...answers.audience].slice(0, 3)
                    : answers.audience
            update({
                role,
                niche: result?.niche || answers.niche || '',
                audience: nextAudience,
                toneSummary: result?.toneSummary || answers.toneSummary || '',
                tone: answers.tone ?? toneFromSummary(result?.toneSummary),
                opportunityLine: result?.opportunityLine || getRoleContent(role).mirrorOpportunity,
                enrichConfidence: result?.confidence ?? 0,
            })
            setPhase('ready')
        })

        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (phase === 'reading') {
        return (
            <div className='flex flex-col items-center gap-6 py-6'>
                <Loader2Icon className='text-primary size-8 animate-spin' />
                <h2 className='font-heading text-xl tracking-tight'>Reading your profile...</h2>
                <ul className='flex w-full max-w-xs flex-col gap-2.5'>
                    {READING_LINES.map((line, i) => (
                        <ReadingLine key={line} label={line} delay={0.4 + i * 0.6} />
                    ))}
                </ul>
            </div>
        )
    }

    const role = resolveRole(answers.role)
    const lowConfidence = (answers.enrichConfidence ?? 0) < CONFIDENCE_FLOOR
    const tone: Tone = answers.tone ?? toneFromSummary(answers.toneSummary)
    const opportunity = answers.opportunityLine || getRoleContent(role).mirrorOpportunity

    const editChip = (field: Exclude<Field, null>) => {
        setEditing((cur) => (cur === field ? null : field))
        track('onb_mirror_edit', { field })
    }

    if (lowConfidence) {
        return (
            <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-5'>
                <motion.div variants={staggerItem} className='flex flex-col gap-1 text-center'>
                    <h2 className='font-heading text-xl tracking-tight'>Tell us who you are</h2>
                    <p className='text-muted-foreground text-sm'>So everything we build sounds right for you.</p>
                </motion.div>
                <motion.div variants={staggerItem}>
                    <RolePicker value={role} onChange={(r) => update({ role: r })} />
                </motion.div>
                <motion.div variants={staggerItem} className='flex flex-col gap-1.5'>
                    <p className='text-foreground text-sm font-medium'>Your niche</p>
                    <Input
                        value={answers.niche ?? ''}
                        onChange={(e) => update({ niche: e.target.value })}
                        placeholder='e.g. B2B SaaS growth'
                    />
                </motion.div>
            </motion.div>
        )
    }

    return (
        <motion.div variants={staggerContainer} initial='hidden' animate='visible' className='flex flex-col gap-5'>
            <motion.div variants={fadeUp} className='flex flex-col gap-1'>
                <p className='text-muted-foreground text-sm'>Here&apos;s how we see you</p>
                <p className='text-foreground text-lg leading-relaxed text-pretty'>
                    You&apos;re a <Chip onClick={() => editChip('role')}>{ROLE_LABELS[role]}</Chip>
                    {answers.niche ? (
                        <>
                            {' '}
                            in <Chip onClick={() => editChip('niche')}>{answers.niche}</Chip>
                        </>
                    ) : (
                        <>
                            {' '}
                            <Chip onClick={() => editChip('niche')}>add your niche</Chip>
                        </>
                    )}
                    , writing mostly for{' '}
                    <Chip onClick={() => editChip('audience')}>{audienceLabel(answers.audience[0])}</Chip>. Your style
                    reads{' '}
                    <Chip onClick={() => editChip('tone')}>{TONE_OPTIONS.find((t) => t.value === tone)?.label}</Chip>.
                </p>
            </motion.div>

            <motion.div variants={staggerItem} className='border-primary/20 bg-primary/5 rounded-xl border p-3.5'>
                <p className='text-foreground text-sm'>
                    <span className='font-semibold'>Your biggest opportunity:</span> {opportunity}
                </p>
            </motion.div>

            <AnimatePresence initial={false}>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: EASE_OUT }}
                        className='overflow-hidden'>
                        <div className='border-border bg-muted/30 flex flex-col gap-2 rounded-xl border p-3.5'>
                            {editing === 'role' && <RolePicker value={role} onChange={(r) => update({ role: r })} />}
                            {editing === 'niche' && (
                                <Input
                                    value={answers.niche ?? ''}
                                    onChange={(e) => update({ niche: e.target.value })}
                                    placeholder='e.g. B2B SaaS growth'
                                    autoFocus
                                />
                            )}
                            {editing === 'audience' && (
                                <ChipRow
                                    options={STRATEGY_AUDIENCES.map((a) => ({ value: a.value, label: a.label }))}
                                    value={answers.audience[0]}
                                    onChange={(v) =>
                                        update({
                                            audience: [
                                                v as StrategyAudience,
                                                ...answers.audience.filter((a) => a !== v),
                                            ].slice(0, 3),
                                        })
                                    }
                                />
                            )}
                            {editing === 'tone' && (
                                <ChipRow
                                    options={TONE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                                    value={tone}
                                    onChange={(v) => update({ tone: v as Tone })}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className='text-muted-foreground flex items-center justify-center gap-1.5 text-xs'>
                <PencilIcon className='size-3' />
                Tap anything to adjust
            </p>
        </motion.div>
    )
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type='button'
            onClick={onClick}
            className='border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 mx-0.5 inline-flex rounded-md border px-1.5 py-0.5 text-base font-semibold transition-colors'>
            {children}
        </button>
    )
}

function ChipRow({
    options,
    value,
    onChange,
}: {
    options: { value: string; label: string }[]
    value: string | undefined
    onChange: (value: string) => void
}) {
    return (
        <div className='flex flex-wrap gap-2'>
            {options.map((o) => (
                <button
                    key={o.value}
                    type='button'
                    onClick={() => onChange(o.value)}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        value === o.value
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:bg-muted/50',
                    )}>
                    {o.label}
                </button>
            ))}
        </div>
    )
}

function RolePicker({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
    return (
        <div className='flex flex-wrap gap-2'>
            {ROLES.map((r) => (
                <button
                    key={r}
                    type='button'
                    onClick={() => onChange(r)}
                    className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        value === r
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:bg-muted/50',
                    )}>
                    {ROLE_LABELS[r]}
                </button>
            ))}
        </div>
    )
}

function ReadingLine({ label, delay }: { label: string; delay: number }) {
    const [done, setDone] = React.useState(false)
    React.useEffect(() => {
        const t = setTimeout(() => setDone(true), delay * 1000)
        return () => clearTimeout(t)
    }, [delay])
    return (
        <li
            className={cn(
                'flex items-center gap-3 text-sm transition-colors',
                done ? 'text-foreground' : 'text-muted-foreground/60',
            )}>
            <span className='flex size-5 shrink-0 items-center justify-center'>
                {done ? (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                        className='bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full'>
                        <CheckIcon className='size-3' />
                    </motion.span>
                ) : (
                    <Loader2Icon className='text-primary size-4 animate-spin' />
                )}
            </span>
            {label}
        </li>
    )
}
