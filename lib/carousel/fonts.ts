// ---------------------------------------------------------------------------
// Carousel fonts
//
// Loaded through next/font/google so they are self-hosted (same-origin) at
// build time. Same-origin matters twice over: it keeps the editor fast and it
// lets the export pipeline (modern-screenshot getFontEmbedCSS) inline the
// @font-face rules without tripping cross-origin/tainted-canvas errors.
//
// Every theme's font pairing resolves to one of the CSS variables below, and
// the editor root applies `carouselFontVars` so the variables are in scope for
// both the on-screen artboard and the off-screen export clone.
// ---------------------------------------------------------------------------

import { Bebas_Neue, DM_Sans, Inter, Montserrat, Playfair_Display, Space_Grotesk } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
    variable: '--cf-inter',
    weight: ['400', '500', '600', '700'],
    display: 'swap',
})
const montserrat = Montserrat({
    subsets: ['latin'],
    variable: '--cf-montserrat',
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
})
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--cf-dm-sans', weight: ['400', '500', '700'], display: 'swap' })
const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--cf-space-grotesk',
    weight: ['400', '500', '600', '700'],
    display: 'swap',
})
const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--cf-playfair',
    weight: ['400', '600', '700', '800'],
    display: 'swap',
})
const bebas = Bebas_Neue({ subsets: ['latin'], variable: '--cf-bebas', weight: ['400'], display: 'swap' })

/** Apply on the editor + export-clone root so every font variable resolves. */
export const carouselFontVars = [
    inter.variable,
    montserrat.variable,
    dmSans.variable,
    spaceGrotesk.variable,
    playfair.variable,
    bebas.variable,
].join(' ')

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
