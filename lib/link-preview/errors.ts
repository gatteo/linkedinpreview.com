export type LinkPreviewErrorCode = 'invalid-url' | 'blocked' | 'timeout' | 'too-large' | 'fetch-failed'

// User-facing error for the link preview pipeline. The route maps `code` to an
// HTTP status. Messages are safe to show to users and never leak internal
// addresses or DNS resolution details.
export class LinkPreviewError extends Error {
    code: LinkPreviewErrorCode

    constructor(code: LinkPreviewErrorCode, message: string) {
        super(message)
        this.name = 'LinkPreviewError'
        this.code = code
    }
}
