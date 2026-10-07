'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'

import { withEntrySource } from '@/config/entry-sources'
import { OB_EXPERIMENTS } from '@/config/onboarding-experiments'
import { Routes } from '@/config/routes'
import {
    enrollHeaderEntry,
    HEADER_ENTRY_FLAG,
    headerEntryProperties,
    type HeaderAssignment,
} from '@/lib/header-entry-experiment'
import { readObExperimentVariant, useObExperiment } from '@/hooks/use-ob-experiment'
import { Button } from '@/components/ui/button'

function PlanLink({ label, assignment }: { label: string; assignment?: HeaderAssignment }) {
    return (
        <span className='contents'>
            <Button asChild size='lg' className='hidden md:flex'>
                <Link
                    href={withEntrySource(Routes.Dashboard, 'navbar')}
                    data-daily-test={assignment?.enrollment.testId}
                    data-daily-variant={assignment?.renderedVariant}
                    onClick={() => {
                        posthog?.capture('cta_button_clicked', { button_name: 'create_plan', source: 'navbar' })
                        if (assignment) {
                            posthog?.capture(
                                'daily_test_action',
                                headerEntryProperties(assignment.enrollment, assignment.renderedVariant),
                            )
                        }
                    }}>
                    {label}
                </Link>
            </Button>
        </span>
    )
}

function AssignedPlanLink({ assignment }: { assignment: HeaderAssignment }) {
    const copy = useObExperiment(HEADER_ENTRY_FLAG, assignment.renderedVariant)
    const [safeControl, setSafeControl] = useState(false)
    const exposed = useRef<string | null>(null)
    const renderedVariant = safeControl ? 'control' : assignment.renderedVariant

    useEffect(() => {
        const unsubscribe = posthog?.onFeatureFlags?.(() => {
            const value = readObExperimentVariant(HEADER_ENTRY_FLAG)
            if (value !== 'control' && value !== 'pro') setSafeControl(true)
        })
        return () => unsubscribe?.()
    }, [])

    useEffect(() => {
        if (exposed.current === renderedVariant) return
        exposed.current = renderedVariant
        posthog?.capture('daily_test_exposed', headerEntryProperties(assignment.enrollment, renderedVariant))
    }, [assignment, renderedVariant])

    return (
        <PlanLink
            label={safeControl ? OB_EXPERIMENTS[HEADER_ENTRY_FLAG].control.label : copy.label}
            assignment={{ ...assignment, renderedVariant }}
        />
    )
}

function EligibleHeaderPlanCta() {
    const [assignment, setAssignment] = useState<HeaderAssignment | null>(null)

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 768px)')
        const enroll = () => {
            if (!desktop.matches) {
                setAssignment(null)
                return
            }
            const state = enrollHeaderEntry({
                storage: {
                    getItem: (key) => localStorage.getItem(key),
                    setItem: (key, value) => localStorage.setItem(key, value),
                },
                readVariant: () => readObExperimentVariant(HEADER_ENTRY_FLAG),
                capture: (event, properties) => posthog?.capture(event, properties),
                releaseSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unavailable',
                createId: () => crypto.randomUUID(),
                now: () => new Date().toISOString(),
            })
            if (state) {
                posthog?.register({
                    daily_test_id: state.enrollment.testId,
                    daily_test_enrollment_id: state.enrollment.enrollmentId,
                    daily_test_variant: state.enrollment.variant,
                    daily_test_assignment_version: state.enrollment.assignmentVersion,
                })
            }
            setAssignment(state)
        }
        enroll()
        desktop.addEventListener('change', enroll)
        return () => desktop.removeEventListener('change', enroll)
    }, [])

    return assignment ? (
        <AssignedPlanLink assignment={assignment} />
    ) : (
        <PlanLink label={OB_EXPERIMENTS[HEADER_ENTRY_FLAG].control.label} />
    )
}

export function HeaderPlanCta() {
    const pathname = usePathname()
    if (pathname !== '/') return <PlanLink label={OB_EXPERIMENTS[HEADER_ENTRY_FLAG].control.label} />
    return <EligibleHeaderPlanCta />
}
