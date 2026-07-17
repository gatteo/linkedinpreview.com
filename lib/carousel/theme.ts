// ---------------------------------------------------------------------------
// Carousel theme system
//
// Three-tier design tokens (primitive hex -> semantic token -> resolved theme).
// Colors are concrete hex (never the app's oklch CSS vars) so the export
// pipeline reproduces them exactly regardless of renderer. Elements and slide
// backgrounds reference semantic tokens (ColorToken / FontToken); the resolver
// turns a themeId + optional per-deck overrides into concrete CSS values.
// ---------------------------------------------------------------------------

import { type ColorToken, type FontToken, type ThemeOverrides } from '@/lib/carousel/types'

import { FONT_PAIRINGS, getFontStack } from './fonts'

export type Theme = {
    id: string
    name: string
    category: 'Professional' | 'Minimal' | 'Bold' | 'Editorial' | 'Playful'
    isDark: boolean
    fontPairingId: string
    radius: number
    colors: Record<ColorToken, string>
    /** A tasteful gradient built from the theme accent, for hook backgrounds. */
    heroGradient: string
}

export type ResolvedTheme = {
    id: string
    isDark: boolean
    radius: number
    colors: Record<ColorToken, string>
    fonts: Record<FontToken, string>
    headingFamilyId: string
    bodyFamilyId: string
    heroGradient: string
}

export const THEMES: Theme[] = [
    {
        id: 'linkedin-light',
        name: 'LinkedIn',
        category: 'Professional',
        isDark: false,
        fontPairingId: 'montserrat-inter',
        radius: 24,
        colors: {
            bg: '#FFFFFF',
            surface: '#F3F6F8',
            text: '#1B1F23',
            muted: '#56687A',
            accent: '#0A66C2',
            accentText: '#FFFFFF',
            border: '#E3E9EF',
        },
        heroGradient: 'linear-gradient(135deg, #0A66C2 0%, #004182 100%)',
    },
    {
        id: 'linkedin-dark',
        name: 'LinkedIn Dark',
        category: 'Professional',
        isDark: true,
        fontPairingId: 'montserrat-inter',
        radius: 24,
        colors: {
            bg: '#0A1F33',
            surface: '#12304D',
            text: '#F2F7FC',
            muted: '#9DB4CC',
            accent: '#4DA3FF',
            accentText: '#04121F',
            border: '#1C3A5C',
        },
        heroGradient: 'linear-gradient(135deg, #12304D 0%, #0A1F33 100%)',
    },
    {
        id: 'mono-light',
        name: 'Mono',
        category: 'Minimal',
        isDark: false,
        fontPairingId: 'space-inter',
        radius: 16,
        colors: {
            bg: '#FFFFFF',
            surface: '#F5F5F5',
            text: '#0A0A0A',
            muted: '#6B6B6B',
            accent: '#0A0A0A',
            accentText: '#FFFFFF',
            border: '#E5E5E5',
        },
        heroGradient: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
    },
    {
        id: 'mono-dark',
        name: 'Mono Dark',
        category: 'Minimal',
        isDark: true,
        fontPairingId: 'space-inter',
        radius: 16,
        colors: {
            bg: '#0B0B0C',
            surface: '#18181B',
            text: '#FAFAFA',
            muted: '#A1A1AA',
            accent: '#FAFAFA',
            accentText: '#0B0B0C',
            border: '#27272A',
        },
        heroGradient: 'linear-gradient(135deg, #27272A 0%, #0B0B0C 100%)',
    },
    {
        id: 'midnight',
        name: 'Midnight',
        category: 'Professional',
        isDark: true,
        fontPairingId: 'space-inter',
        radius: 16,
        colors: {
            bg: '#0D1117',
            surface: '#161B22',
            text: '#E6EDF3',
            muted: '#8B949E',
            accent: '#58A6FF',
            accentText: '#0D1117',
            border: '#21262D',
        },
        heroGradient: 'linear-gradient(135deg, #1F6FEB 0%, #0D1117 100%)',
    },
    {
        id: 'editorial',
        name: 'Editorial',
        category: 'Editorial',
        isDark: false,
        fontPairingId: 'playfair-inter',
        radius: 8,
        colors: {
            bg: '#FBF7F0',
            surface: '#F3EBDD',
            text: '#2A2520',
            muted: '#7A6F60',
            accent: '#B4541E',
            accentText: '#FBF7F0',
            border: '#E6DBC9',
        },
        heroGradient: 'linear-gradient(135deg, #C76B33 0%, #B4541E 100%)',
    },
    {
        id: 'bold-brand',
        name: 'Bold',
        category: 'Bold',
        isDark: true,
        fontPairingId: 'bebas-dmsans',
        radius: 20,
        colors: {
            bg: '#111111',
            surface: '#1E1E1E',
            text: '#FFFFFF',
            muted: '#B0B0B0',
            accent: '#FFE34D',
            accentText: '#111111',
            border: '#2C2C2C',
        },
        heroGradient: 'linear-gradient(135deg, #FFE34D 0%, #FF9E3D 100%)',
    },
    {
        id: 'sunset',
        name: 'Sunset',
        category: 'Bold',
        isDark: true,
        fontPairingId: 'montserrat-inter',
        radius: 28,
        colors: {
            bg: '#2A1A2E',
            surface: '#3D2740',
            text: '#FFF1F2',
            muted: '#D8B4C8',
            accent: '#FF7A59',
            accentText: '#2A1A2E',
            border: '#4A3050',
        },
        heroGradient: 'linear-gradient(135deg, #FF7A59 0%, #C04A8C 100%)',
    },
    {
        id: 'forest',
        name: 'Forest',
        category: 'Professional',
        isDark: false,
        fontPairingId: 'montserrat-inter',
        radius: 20,
        colors: {
            bg: '#FFFFFF',
            surface: '#F0F5F1',
            text: '#14241B',
            muted: '#5B6F63',
            accent: '#1E7A4D',
            accentText: '#FFFFFF',
            border: '#DCE8E0',
        },
        heroGradient: 'linear-gradient(135deg, #1E7A4D 0%, #0E4D2F 100%)',
    },
    {
        id: 'slate',
        name: 'Slate',
        category: 'Professional',
        isDark: false,
        fontPairingId: 'space-inter',
        radius: 18,
        colors: {
            bg: '#F8FAFC',
            surface: '#EEF2F6',
            text: '#0F172A',
            muted: '#64748B',
            accent: '#3B5BDB',
            accentText: '#FFFFFF',
            border: '#DDE3EA',
        },
        heroGradient: 'linear-gradient(135deg, #3B5BDB 0%, #1E2A6B 100%)',
    },
    {
        id: 'pop',
        name: 'Pop',
        category: 'Playful',
        isDark: false,
        fontPairingId: 'montserrat-inter',
        radius: 28,
        colors: {
            bg: '#FDF2F8',
            surface: '#FFFFFF',
            text: '#1A1A2E',
            muted: '#6D6D87',
            accent: '#E11D74',
            accentText: '#FFFFFF',
            border: '#F3D6E6',
        },
        heroGradient: 'linear-gradient(135deg, #E11D74 0%, #7C3AED 100%)',
    },
]

export const DEFAULT_THEME_ID = 'linkedin-light'

const THEME_MAP: Record<string, Theme> = Object.fromEntries(THEMES.map((t) => [t.id, t]))

export function getTheme(themeId: string): Theme {
    return THEME_MAP[themeId] ?? THEME_MAP[DEFAULT_THEME_ID]
}

/** Merge a base theme with per-deck overrides into concrete CSS values. */
export function resolveTheme(themeId: string, overrides?: ThemeOverrides): ResolvedTheme {
    const base = getTheme(themeId)
    const pairing = FONT_PAIRINGS[base.fontPairingId] ?? FONT_PAIRINGS['montserrat-inter']
    const headingFamilyId = overrides?.headingFont ?? pairing.headingFamily
    const bodyFamilyId = overrides?.bodyFont ?? pairing.bodyFamily

    return {
        id: base.id,
        isDark: base.isDark,
        radius: overrides?.radius ?? base.radius,
        colors: { ...base.colors, ...overrides?.colors },
        fonts: { heading: getFontStack(headingFamilyId), body: getFontStack(bodyFamilyId) },
        headingFamilyId,
        bodyFamilyId,
        heroGradient: base.heroGradient,
    }
}

/** Resolve a color token (an explicit hex override always wins). */
export function resolveColor(theme: ResolvedTheme, token: ColorToken | undefined, explicit?: string): string {
    if (explicit) return explicit
    if (token) return theme.colors[token]
    return theme.colors.text
}
