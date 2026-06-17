import { Buffer } from 'node:buffer'

import { LINKEDIN_API, LINKEDIN_API_VERSION, LINKEDIN_RESTLI_VERSION } from '@/config/linkedin'

// ---------------------------------------------------------------------------
// LinkedIn Posts API (POST /rest/posts) + media upload (Images/Videos API).
// Verified mid-2026 against Microsoft Learn. The deprecated /v2/ugcPosts is NOT used.
// ---------------------------------------------------------------------------

export class LinkedInApiError extends Error {
    status: number
    body: string
    constructor(message: string, status: number, body: string) {
        super(message)
        this.name = 'LinkedInApiError'
        this.status = status
        this.body = body
    }
}

type Media = { type: 'image' | 'video'; src: string }

function baseHeaders(accessToken: string): Record<string, string> {
    return {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_API_VERSION,
        'X-Restli-Protocol-Version': LINKEDIN_RESTLI_VERSION,
    }
}

/** Resolve a draft media `src` (data URL or remote URL) to bytes + content type. */
async function resolveMediaBytes(src: string): Promise<{ bytes: Buffer; contentType: string }> {
    if (src.startsWith('data:')) {
        const match = /^data:([^;]+);base64,(.*)$/s.exec(src)
        if (!match) throw new Error('Unsupported data URL for media')
        return { bytes: Buffer.from(match[2], 'base64'), contentType: match[1] }
    }
    const res = await fetch(src)
    if (!res.ok) throw new Error(`Failed to fetch media (${res.status})`)
    const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
    return { bytes: Buffer.from(await res.arrayBuffer()), contentType }
}

/** Upload an image and return its asset URN (urn:li:image:...). */
async function uploadImage(accessToken: string, ownerUrn: string, src: string): Promise<string> {
    const init = await fetch(`${LINKEDIN_API.images}?action=initializeUpload`, {
        method: 'POST',
        headers: { ...baseHeaders(accessToken), 'Content-Type': 'application/json' },
        body: JSON.stringify({ initializeUploadRequest: { owner: ownerUrn } }),
    })
    if (!init.ok) {
        throw new LinkedInApiError('Image initializeUpload failed', init.status, await init.text().catch(() => ''))
    }
    const { value } = (await init.json()) as { value: { uploadUrl: string; image: string } }

    const { bytes } = await resolveMediaBytes(src)
    const put = await fetch(value.uploadUrl, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: bytes,
    })
    if (!put.ok) {
        throw new LinkedInApiError('Image byte upload failed', put.status, await put.text().catch(() => ''))
    }
    return value.image
}

/** Upload a video via the multipart flow and return its asset URN (urn:li:video:...). */
async function uploadVideo(accessToken: string, ownerUrn: string, src: string): Promise<string> {
    const { bytes } = await resolveMediaBytes(src)

    const init = await fetch(`${LINKEDIN_API.videos}?action=initializeUpload`, {
        method: 'POST',
        headers: { ...baseHeaders(accessToken), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            initializeUploadRequest: {
                owner: ownerUrn,
                fileSizeBytes: bytes.length,
                uploadCaptions: false,
                uploadThumbnail: false,
            },
        }),
    })
    if (!init.ok) {
        throw new LinkedInApiError('Video initializeUpload failed', init.status, await init.text().catch(() => ''))
    }
    const { value } = (await init.json()) as {
        value: {
            video: string
            uploadToken: string
            uploadInstructions: { uploadUrl: string; firstByte: number; lastByte: number }[]
        }
    }

    const uploadedPartIds: string[] = []
    for (const instruction of value.uploadInstructions) {
        const part = bytes.subarray(instruction.firstByte, instruction.lastByte + 1)
        const put = await fetch(instruction.uploadUrl, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/octet-stream' },
            body: part,
        })
        if (!put.ok) {
            throw new LinkedInApiError('Video part upload failed', put.status, await put.text().catch(() => ''))
        }
        const etag = put.headers.get('etag')
        if (!etag) throw new Error('Missing ETag on video part upload')
        uploadedPartIds.push(etag)
    }

    const finalize = await fetch(`${LINKEDIN_API.videos}?action=finalizeUpload`, {
        method: 'POST',
        headers: { ...baseHeaders(accessToken), 'Content-Type': 'application/json' },
        body: JSON.stringify({
            finalizeUploadRequest: { video: value.video, uploadToken: value.uploadToken, uploadedPartIds },
        }),
    })
    if (!finalize.ok) {
        throw new LinkedInApiError(
            'Video finalizeUpload failed',
            finalize.status,
            await finalize.text().catch(() => ''),
        )
    }
    return value.video
}

/** Public feed URL for a created post URN. */
export function postUrlFromUrn(urn: string): string {
    return `https://www.linkedin.com/feed/update/${urn}`
}

/**
 * Publish a post to the member's profile. Uploads media first when present, then
 * creates the post. Returns the post URN and its public URL.
 */
export async function publishMemberPost(opts: {
    accessToken: string
    authorUrn: string
    commentary: string
    media?: Media | null
    altText?: string
}): Promise<{ postUrn: string; postUrl: string }> {
    const { accessToken, authorUrn, commentary, media } = opts

    let content: Record<string, unknown> | undefined
    if (media) {
        const id =
            media.type === 'image'
                ? await uploadImage(accessToken, authorUrn, media.src)
                : await uploadVideo(accessToken, authorUrn, media.src)
        content = { media: { id, ...(opts.altText ? { altText: opts.altText } : {}) } }
    }

    const body: Record<string, unknown> = {
        author: authorUrn,
        commentary,
        visibility: 'PUBLIC',
        distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
    }
    if (content) body.content = content

    const res = await fetch(LINKEDIN_API.posts, {
        method: 'POST',
        headers: { ...baseHeaders(accessToken), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    if (!res.ok) {
        throw new LinkedInApiError('Post creation failed', res.status, await res.text().catch(() => ''))
    }

    // The created post URN is returned in the x-restli-id response header. Treat a
    // missing URN as a failure rather than recording a phantom success (which would
    // break the "View on LinkedIn" link and the cron's idempotency guard).
    const postUrn = res.headers.get('x-restli-id')
    if (!postUrn) {
        throw new LinkedInApiError('Post created but no URN returned', res.status, await res.text().catch(() => ''))
    }
    return { postUrn, postUrl: postUrlFromUrn(postUrn) }
}
