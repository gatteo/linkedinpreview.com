import { lookup } from 'node:dns/promises'

import { LinkPreviewError } from './errors'

// IPv4 ranges that must never be fetched (private, loopback, link-local,
// shared, documentation, benchmarking, multicast, reserved, broadcast).
const IPV4_RANGES: Array<[string, number]> = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10],
    ['127.0.0.0', 8],
    ['169.254.0.0', 16],
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4],
    ['240.0.0.0', 4],
]

function parseIpv4(ip: string): number[] | null {
    const parts = ip.split('.')
    if (parts.length !== 4) return null
    const octets: number[] = []
    for (const part of parts) {
        if (!/^\d{1,3}$/.test(part)) return null
        const n = Number(part)
        if (n < 0 || n > 255) return null
        octets.push(n)
    }
    return octets
}

function ipv4ToInt(octets: number[]): number {
    return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
}

function inCidr(ipInt: number, network: string, prefix: number): boolean {
    const netOctets = parseIpv4(network)
    if (!netOctets) return false
    const netInt = ipv4ToInt(netOctets)
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    return (ipInt & mask) >>> 0 === (netInt & mask) >>> 0
}

function isPrivateIpv4(octets: number[]): boolean {
    const ipInt = ipv4ToInt(octets)
    return IPV4_RANGES.some(([network, prefix]) => inCidr(ipInt, network, prefix))
}

// Expand an IPv6 string into 8 16-bit groups, handling '::' compression and a
// trailing embedded IPv4 (e.g. ::ffff:1.2.3.4). Returns null if unparseable.
function expandIpv6(ip: string): number[] | null {
    let s = ip
    const zone = s.indexOf('%')
    if (zone !== -1) s = s.slice(0, zone)

    // Replace a trailing dotted-quad with two hextets.
    const v4match = s.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
    if (v4match) {
        const v4 = parseIpv4(v4match[1])
        if (!v4) return null
        const h1 = ((v4[0] << 8) | v4[1]).toString(16)
        const h2 = ((v4[2] << 8) | v4[3]).toString(16)
        s = s.slice(0, s.length - v4match[1].length) + h1 + ':' + h2
    }

    const halves = s.split('::')
    if (halves.length > 2) return null

    const parseGroups = (part: string): number[] | null => {
        if (part === '') return []
        const groups = part.split(':')
        const out: number[] = []
        for (const g of groups) {
            if (g === '' || g.length > 4 || !/^[0-9a-fA-F]+$/.test(g)) return null
            out.push(parseInt(g, 16))
        }
        return out
    }

    if (halves.length === 2) {
        const head = parseGroups(halves[0])
        const tail = parseGroups(halves[1])
        if (head === null || tail === null) return null
        const missing = 8 - head.length - tail.length
        if (missing < 0) return null
        return [...head, ...new Array<number>(missing).fill(0), ...tail]
    }

    const all = parseGroups(s)
    if (all === null || all.length !== 8) return null
    return all
}

function isPrivateIpv6(groups: number[]): boolean {
    // IPv4-mapped (::ffff:a.b.c.d) - unwrap and re-check as IPv4.
    if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
        const v4 = [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff]
        return isPrivateIpv4(v4)
    }

    // :: (unspecified)
    if (groups.every((g) => g === 0)) return true
    // ::1 (loopback)
    if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true
    // fc00::/7 (unique local)
    if ((groups[0] & 0xfe00) === 0xfc00) return true
    // fe80::/10 (link-local)
    if ((groups[0] & 0xffc0) === 0xfe80) return true
    // ff00::/8 (multicast)
    if ((groups[0] & 0xff00) === 0xff00) return true
    // 2001:db8::/32 (documentation)
    if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true

    return false
}

function stripBrackets(host: string): string {
    return host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
}

function looksLikeIpv4(host: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
}

export function isPrivateOrReservedIp(ip: string): boolean {
    const host = stripBrackets(ip.trim())

    if (host.includes(':')) {
        const groups = expandIpv6(host)
        if (!groups) return true // unparseable IPv6 - treat as unsafe
        return isPrivateIpv6(groups)
    }

    const octets = parseIpv4(host)
    if (!octets) return false // not an IP literal - hostname checks handle it
    return isPrivateIpv4(octets)
}

export function validateUrl(raw: string): URL {
    let url: URL
    try {
        url = new URL(raw.trim())
    } catch {
        throw new LinkPreviewError('invalid-url', 'That does not look like a valid URL.')
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new LinkPreviewError('invalid-url', 'Only http and https URLs are supported.')
    }

    return url
}

const BLOCKED_HOSTNAMES = new Set(['localhost', 'metadata.google.internal'])
const BLOCKED_SUFFIXES = ['.local', '.internal', '.lan']

export function assertHostAllowed(hostname: string): void {
    const host = stripBrackets(hostname.trim().toLowerCase())

    if (!host) {
        throw new LinkPreviewError('blocked', 'This URL points to a host we cannot reach.')
    }

    if (BLOCKED_HOSTNAMES.has(host) || BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
        throw new LinkPreviewError('blocked', 'This URL points to an internal host and cannot be checked.')
    }

    // IP literals are validated directly (covers the cloud metadata IP too).
    if (host.includes(':') || looksLikeIpv4(host)) {
        if (isPrivateOrReservedIp(host)) {
            throw new LinkPreviewError('blocked', 'This URL points to a private or reserved IP and cannot be checked.')
        }
    }
}

// Resolve the hostname and reject if ANY resolved address is private or
// reserved. This mitigates DNS rebinding where a public name maps to an
// internal IP.
export async function resolveAndCheck(hostname: string): Promise<void> {
    const host = stripBrackets(hostname.trim())

    let addresses: { address: string }[]
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
        // Bound the resolver: the fetch AbortController does not cover this lookup,
        // so a hanging resolver could blow the request budget without this race.
        const timeout = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('lookup-timeout')), 5000)
        })
        addresses = await Promise.race([lookup(host, { all: true }), timeout])
    } catch {
        throw new LinkPreviewError('fetch-failed', 'Could not resolve that domain.')
    } finally {
        if (timer) clearTimeout(timer)
    }

    if (addresses.length === 0) {
        throw new LinkPreviewError('fetch-failed', 'Could not resolve that domain.')
    }

    for (const { address } of addresses) {
        if (isPrivateOrReservedIp(address)) {
            throw new LinkPreviewError(
                'blocked',
                'This URL resolves to a private or reserved IP and cannot be checked.',
            )
        }
    }
}
