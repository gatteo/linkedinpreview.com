/**
 * Encode/decode TipTap JSON for sharing via URL.
 *
 * Pipeline: JSON → deflate-raw compress → base64url
 */

export async function encodeDraft(content: any): Promise<string | null> {
    try {
        const json = JSON.stringify(content)
        const bytes = new TextEncoder().encode(json)

        const cs = new CompressionStream('deflate-raw')
        const writer = cs.writable.getWriter()
        writer.write(bytes)
        writer.close()

        const compressed = await new Response(cs.readable).arrayBuffer()
        // base64url: standard base64 with +→- /→_ and no padding
        const base64 = btoa(String.fromCharCode(...new Uint8Array(compressed)))
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    } catch {
        return null
    }
}

export async function decodeDraft(encoded: string): Promise<any | null> {
    try {
        // Restore standard base64 from base64url
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
        // Re-add padding
        while (base64.length % 4) base64 += '='

        const binary = atob(base64)
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))

        const ds = new DecompressionStream('deflate-raw')
        const writer = ds.writable.getWriter()
        writer.write(bytes)
        writer.close()

        const decompressed = await new Response(ds.readable).arrayBuffer()
        const json = new TextDecoder().decode(decompressed)
        return JSON.parse(json)
    } catch {
        return null
    }
}
