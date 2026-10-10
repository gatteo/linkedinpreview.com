import { z } from 'zod'

import { ENTRY_SOURCES } from '@/config/entry-sources'

const monthlyOfferSchema = z.object({
    enrollmentId: z.string().uuid(),
    cohortId: z.literal('exp9_monthly_first_v2'),
    assignedVariant: z.literal('monthly_first'),
    eligibilityAt: z.string().datetime(),
    offerVersion: z.literal('monthly_first_v2'),
    entrySource: z.enum([...ENTRY_SOURCES, 'direct']),
    billingState: z.enum(['free', 'paid', 'unknown']),
    releaseSha: z.union([z.string().regex(/^[0-9a-f]{40}$/), z.literal('unavailable')]),
})

export const bodySchema = z
    .object({
        plan: z.enum(['monthly', 'lifetime']),
        // Which surface started the purchase - drives the hosted-checkout return
        // URL so the right surface resumes after the redirect.
        source: z.enum(['onboarding', 'upgrade', 'visitor_job']).default('upgrade'),
        entrySource: z.enum([...ENTRY_SOURCES, 'direct']).default('direct'),
        exposureId: z.string().uuid().optional(),
        eligibilityAt: z.string().datetime().optional(),
        cohortId: z.literal('exp10_draft_first_v1').optional(),
        assignedVariant: z.literal('draft_first').optional(),
        offerVersion: z.literal('existing_offer').optional(),
        monthlyOffer: monthlyOfferSchema.optional(),
        jobOffer: z
            .object({
                enrollmentId: z.string().uuid(),
                eligibilityAt: z.string().datetime(),
                userId: z.string().uuid(),
                releaseSha: z.union([z.string().regex(/^[0-9a-f]{40}$/), z.literal('unavailable')]),
                version: z.literal('visitor_writing_v1'),
                historicalOverlap: z.literal('unknown'),
            })
            .optional(),
    })
    .superRefine((body, ctx) => {
        if (body.source === 'visitor_job') {
            if (!body.jobOffer || body.monthlyOffer || body.exposureId || body.cohortId) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Isolated job attribution required' })
            }
        } else if (body.jobOffer) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Unexpected job attribution' })
        }
    })
