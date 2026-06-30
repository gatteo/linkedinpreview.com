import { z } from 'zod'

export const bodySchema = z.object({
    name: z.string().max(200).optional(),
    headline: z.string().max(500).optional(),
    vanityUrl: z.string().max(300).optional(),
    profileUrl: z.string().max(300).optional(),
    welcomeGoal: z
        .enum(['revenue-growth', 'company-awareness', 'career-opportunities', 'employer-branding', 'media-pr'])
        .optional(),
})

export const enrichSchema = z.object({
    role: z.enum(['founder', 'freelancer', 'team-lead', 'employee', 'creator', 'consultant', 'agency']),
    niche: z.string(),
    primaryAudience: z.enum([
        'new-clients',
        'existing-clients',
        'talents',
        'partners',
        'investors',
        'colleagues',
        'potential-employers',
    ]),
    toneSummary: z.string(),
    opportunityLine: z.string(),
    confidence: z.number().min(0).max(1),
})
