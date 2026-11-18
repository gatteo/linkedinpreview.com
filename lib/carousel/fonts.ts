// ---------------------------------------------------------------------------
// Carousel fonts
//
// Exact upstream font assets are self-hosted by the carousel layout.
// Same-origin matters twice over: it keeps the editor fast and it
// lets the export pipeline (modern-screenshot getFontEmbedCSS) inline the
// @font-face rules without tripping cross-origin/tainted-canvas errors.
//
// Every theme's font pairing resolves to one of the CSS variables below, and
// the editor root applies `carouselFontVars` so the variables are in scope for
// both the on-screen artboard and the off-screen export clone.
// ---------------------------------------------------------------------------

/** Apply on the editor + export-clone root so every font variable resolves. */
export const carouselFontVars = 'carousel-fonts'

export const carouselFontPreloads = [
    '/fonts/carousel/inter-latin.woff2',
    '/fonts/carousel/montserrat-latin.woff2',
    '/fonts/carousel/dmsans-latin.woff2',
    '/fonts/carousel/spacegrotesk-latin.woff2',
    '/fonts/carousel/playfairdisplay-latin.woff2',
    '/fonts/carousel/bebasneue-latin.woff2',
]

const SANS_FALLBACK = `system-ui, -apple-system, 'Segoe UI', sans-serif`
const SERIF_FALLBACK = `Georgia, 'Times New Roman', serif`

export type FontFamily = {
    id: string
    label: string
    /** CSS font-family value (includes a safe fallback stack). */
    stack: string
    kind: 'sans' | 'serif' | 'display'
}

export const FONT_FAMILIES: Record<string, FontFamily> = {
    inter: { id: 'inter', label: 'Inter', stack: `var(--cf-inter), ${SANS_FALLBACK}`, kind: 'sans' },
    montserrat: {
        id: 'montserrat',
        label: 'Montserrat',
        stack: `var(--cf-montserrat), ${SANS_FALLBACK}`,
        kind: 'sans',
    },
    dmSans: { id: 'dmSans', label: 'DM Sans', stack: `var(--cf-dm-sans), ${SANS_FALLBACK}`, kind: 'sans' },
    spaceGrotesk: {
        id: 'spaceGrotesk',
        label: 'Space Grotesk',
        stack: `var(--cf-space-grotesk), ${SANS_FALLBACK}`,
        kind: 'sans',
    },
    playfair: {
        id: 'playfair',
        label: 'Playfair Display',
        stack: `var(--cf-playfair), ${SERIF_FALLBACK}`,
        kind: 'serif',
    },
    bebas: { id: 'bebas', label: 'Bebas Neue', stack: `var(--cf-bebas), ${SANS_FALLBACK}`, kind: 'display' },
}

export type FontPairing = {
    id: string
    label: string
    headingFamily: string
    bodyFamily: string
}

export const FONT_PAIRINGS: Record<string, FontPairing> = {
    'montserrat-inter': {
        id: 'montserrat-inter',
        label: 'Montserrat + Inter',
        headingFamily: 'montserrat',
        bodyFamily: 'inter',
    },
    'bebas-dmsans': { id: 'bebas-dmsans', label: 'Bebas Neue + DM Sans', headingFamily: 'bebas', bodyFamily: 'dmSans' },
    'space-inter': {
        id: 'space-inter',
        label: 'Space Grotesk + Inter',
        headingFamily: 'spaceGrotesk',
        bodyFamily: 'inter',
    },
    'playfair-inter': {
        id: 'playfair-inter',
        label: 'Playfair + Inter',
        headingFamily: 'playfair',
        bodyFamily: 'inter',
    },
    'inter-inter': { id: 'inter-inter', label: 'Inter', headingFamily: 'inter', bodyFamily: 'inter' },
}

export const FONT_PAIRING_LIST = Object.values(FONT_PAIRINGS)

export function getFontStack(familyId: string): string {
    return FONT_FAMILIES[familyId]?.stack ?? FONT_FAMILIES.inter.stack
}
