import { AI_ERROR_CODES } from '@/config/ai'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

import { urlBodySchema } from './route.schema'
import { extractFromFile, extractFromUrl } from './route.utils'

export const maxDuration = 30

export async function POST(request: Request) {
    // Auth: validate the anonymous session
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return Response.json({ error: 'Authentication required', code: AI_ERROR_CODES.AUTH_REQUIRED }, { status: 401 })
    }

    // Rate limit: 10 extractions per day
    const rateLimit = await checkRateLimit(supabase, 'quickAction')
    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: 'Daily extraction limit reached',
                code: AI_ERROR_CODES.RATE_LIMITED,
                action: 'quickAction',
                resetAt: rateLimit.resetAt,
                remaining: rateLimit.remaining,
            },
            { status: 429 },
        )
    }

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
        let formData: FormData
        try {
            formData = await request.formData()
        } catch {
            return Response.json({ error: 'Invalid form data', code: AI_ERROR_CODES.INVALID_INPUT }, { status: 400 })
        }

        const file = formData.get('file')
        if (!(file instanceof File)) {
            return Response.json({ error: 'Missing file field', code: AI_ERROR_CODES.INVALID_INPUT }, { status: 400 })
        }

        try {
            const result = await extractFromFile(file)
            return Response.json(result)
        } catch (err) {
            console.error('File extraction failed:', err)
            return Response.json(
                { error: 'Failed to extract file content', code: 'EXTRACTION_FAILED' },
                { status: 422 },
            )
        }
    }

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return Response.json({ error: 'Invalid JSON body', code: AI_ERROR_CODES.INVALID_INPUT }, { status: 400 })
    }

    const parsed = urlBodySchema.safeParse(body)
    if (!parsed.success) {
        return Response.json(
            { error: parsed.error.issues[0]?.message ?? 'Invalid input', code: AI_ERROR_CODES.INVALID_INPUT },
            { status: 400 },
        )
    }

    try {
        const result = await extractFromUrl(parsed.data.url)
        return Response.json(result)
    } catch (err) {
        console.error('URL extraction failed:', err)
        return Response.json({ error: 'Failed to extract URL content', code: 'EXTRACTION_FAILED' }, { status: 422 })
    }
}
