import { z } from 'zod'

import { ENTRY_SOURCES } from '@/config/entry-sources'

export const bodySchema = z.object({
    plan: z.enum(['monthly', 'lifetime']),
    // Which surface started the purchase - drives the hosted-checkout return
    // URL so the right surface resumes after the redirect.
    source: z.enum(['onboarding', 'upgrade']).default('upgrade'),
    entrySource: z.enum([...ENTRY_SOURCES, 'direct']).default('direct'),
    exposureId: z.string().uuid().optional(),
    eligibilityAt: z.string().datetime().optional(),
    cohortId: z.literal('exp10_draft_first_v1').optional(),
    assignedVariant: z.literal('draft_first').optional(),
    offerVersion: z.literal('existing_offer').optional(),
})
