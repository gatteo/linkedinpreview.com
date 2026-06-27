export interface OgPreviewData {
    requestedUrl: string
    finalUrl: string
    title?: string
    description?: string
    imageUrl?: string
    imageType?: string
    siteName?: string
    faviconUrl?: string
}

export type OgIssueSeverity = 'error' | 'warning' | 'ok'

export interface OgIssue {
    id: string
    severity: OgIssueSeverity
    title: string
    detail: string
    fix?: string
}

export interface LinkPreviewResult {
    data: OgPreviewData
    issues: OgIssue[]
}
