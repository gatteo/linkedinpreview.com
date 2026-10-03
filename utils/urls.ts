import { UtmMediums } from '@/types/urls'
import { site } from '@/config/site'
import { UtmSource } from '@/config/urls'

export function absoluteUrl(url: string) {
    if (url.startsWith('/')) url = url.slice(1)
    return `${site.url}/${url}`
}

export function UtmUrl(
    url: string,
    {
        source = UtmSource,
        medium,
        content,
    }: {
        source?: string
        medium?: UtmMediums
        content?: string
    },
) {
    const params = new URLSearchParams({ utm_source: source })
    if (medium) params.append('utm_medium', medium)
    if (content) params.append('utm_content', content)

    const fragmentIndex = url.indexOf('#')
    const urlWithoutFragment = fragmentIndex === -1 ? url : url.slice(0, fragmentIndex)
    const fragment = fragmentIndex === -1 ? '' : url.slice(fragmentIndex)
    const separator = urlWithoutFragment.includes('?')
        ? urlWithoutFragment.endsWith('?') || urlWithoutFragment.endsWith('&')
            ? ''
            : '&'
        : '?'

    return `${urlWithoutFragment}${separator}${params.toString()}${fragment}`
}
