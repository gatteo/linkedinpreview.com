'use client'

import * as React from 'react'
import { AnimatePresence } from 'framer-motion'

import { OB_ROLE_ICONS, personaReaction } from '@/config/onboarding-flow'
import { NICHE_OPTIONS, ROLE_LABELS, type Role } from '@/config/onboarding-personalization'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { track } from '../ai'
import { useOnboarding } from '../context'
import { iconFor } from '../icons'
import { Chip, CTA, FieldLabel, H1, Reaction } from '../primitives'

// ---------------------------------------------------------------------------
// 05 · Persona (rail 2/5) - role + niche. The profile inference is surfaced as
// a "Suggested" hint, not a pre-selection: the user confirms with a tap, so the
// reaction insight only appears once they actually engage.
// ---------------------------------------------------------------------------

const ROLES = Object.keys(ROLE_LABELS) as Role[]

export function PersonaStep() {
    const { answers, update, goNext } = useOnboarding()
    const role = answers.role
    const niche = answers.niche ?? ''
    // The inferred niche can be any phrase ("B2B SaaS growth"); surface it as a
    // pickable option so the pre-fill is visible instead of silently dropped.
    const options = niche && !NICHE_OPTIONS.includes(niche) ? [niche, ...NICHE_OPTIONS] : NICHE_OPTIONS
    // Until the user picks, the inferred values stay a suggestion: nothing reads
    // as already-chosen and the reaction holds back.
    const [touched, setTouched] = React.useState(false)

    // Snapshot the inference at mount (the pre-touch values ARE the inference)
    // so the "Suggested" tags survive a later, different selection without
    // relabeling it as suggested.
    const [inferred] = React.useState(() => ({ role: answers.role, niche: answers.niche ?? '' }))

    const canContinue = touched && !!role && !!niche.trim()

    return (
        <div className='flex flex-col'>
            <H1 className='mb-5'>What best describes you?</H1>
            <div className='mb-4 flex flex-wrap gap-2'>
                {ROLES.map((r) => (
                    <Chip
                        key={r}
                        icon={iconFor(OB_ROLE_ICONS[r])}
                        selected={touched && role === r}
                        badge={!!inferred.role && inferred.role === r ? 'Suggested' : undefined}
                        onClick={() => {
                            setTouched(true)
                            update({ role: r })
                            track('onb_persona_role', { role: r })
                        }}>
                        {ROLE_LABELS[r]}
                    </Chip>
                ))}
            </div>
            <FieldLabel>Your niche</FieldLabel>
            <Select
                value={touched ? niche || undefined : undefined}
                onValueChange={(v) => {
                    setTouched(true)
                    update({ niche: v })
                    track('onb_persona_niche', { niche: v })
                }}>
                <SelectTrigger className='w-full data-[size=default]:h-11' aria-label='Your niche'>
                    <SelectValue placeholder={niche ? `Suggested: ${niche}` : 'Choose your niche'} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((n) => (
                        <SelectItem
                            key={n}
                            value={n}
                            trailing={
                                !!inferred.niche && n === inferred.niche ? (
                                    <span className='border-primary/30 ml-auto inline-flex items-center rounded-full border bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] px-2 py-[1px] text-[10.5px] font-semibold text-[var(--orange-400)]'>
                                        Suggested
                                    </span>
                                ) : undefined
                            }>
                            {n}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className='mt-5'>
                <AnimatePresence initial={false}>
                    {canContinue && (
                        <Reaction
                            key={`${role}-${niche}`}
                            reaction={personaReaction(ROLE_LABELS[role as Role], niche)}
                        />
                    )}
                </AnimatePresence>
            </div>
            <CTA onClick={goNext} disabled={!canContinue}>
                Continue
            </CTA>
        </div>
    )
}
