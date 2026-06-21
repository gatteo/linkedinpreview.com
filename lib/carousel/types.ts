// ---------------------------------------------------------------------------
// Carousel document schema
//
// The single source of truth that drives the editor, slide thumbnails, AI
// generation, and export. A CarouselDocument is stored in the existing
// `drafts.content` jsonb column and discriminated from a plain text post by its
// `kind: 'carousel'` field, so carousels and posts share one table.
//
// Geometry is expressed in canvas-space pixels (the artboard is a fixed
// 1080x1350 / 1080x1080 / 1920x1080 box). Colors and fonts are referenced via
// theme *tokens* resolved at render time (see ./theme.ts) so re-theming an
// entire deck - or applying a user's brand kit - is a single store edit, and
// AI-generated decks are automatically on-brand.
// ---------------------------------------------------------------------------

export type CanvasRatio = '4:5' | '1:1' | '16:9'

export type CanvasSize = {
    ratio: CanvasRatio
    width: number
    height: number
}

/** Fixed artboard sizes. We render/export at 2x these for crisp text. */
export const CANVAS_SIZES: Record<CanvasRatio, CanvasSize> = {
    '4:5': { ratio: '4:5', width: 1080, height: 1350 },
    '1:1': { ratio: '1:1', width: 1080, height: 1080 },
    '16:9': { ratio: '16:9', width: 1920, height: 1080 },
}

export const CANVAS_RATIOS: { value: CanvasRatio; label: string; hint: string }[] = [
    { value: '4:5', label: 'Portrait', hint: '1080 x 1350 - best for mobile feed' },
    { value: '1:1', label: 'Square', hint: '1080 x 1080 - safe everywhere' },
    { value: '16:9', label: 'Landscape', hint: '1920 x 1080 - data-heavy decks' },
]

/** Pixel padding kept clear of slide edges (~8% of 1080), enforced softly. */
export const SAFE_MARGIN = 88

/** Role drives the default layout a template/AI uses and the deck structure. */
export type SlideRole = 'hook' | 'body' | 'cta' | 'validator'

// ---------------------------------------------------------------------------
// Theme token references (resolved by ./theme.ts at render time)
// ---------------------------------------------------------------------------

export type ColorToken = 'bg' | 'surface' | 'text' | 'muted' | 'accent' | 'accentText' | 'border'
export type FontToken = 'heading' | 'body'

/** Per-deck overrides layered on top of the chosen theme. */
export type ThemeOverrides = {
    colors?: Partial<Record<ColorToken, string>>
    headingFont?: string
    bodyFont?: string
    radius?: number
}

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------

export type ElementType = 'text' | 'image' | 'shape' | 'icon'

export type ElementBase = {
    id: string
    type: ElementType
    /** Top-left x in canvas-space px. */
    x: number
    y: number
    width: number
    height: number
    /** Degrees, clockwise. */
    rotation: number
    /** 0..1 */
    opacity: number
    zIndex: number
    locked?: boolean
}

export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

export type TextElement = ElementBase & {
    type: 'text'
    /** Plain-text mirror used for stats, AI context, and accessibility. */
    text: string
    /** TipTap JSON fragment carrying the rich content actually rendered. */
    html: unknown
    fontToken: FontToken
    fontSize: number
    fontWeight: number
    lineHeight: number
    letterSpacing: number
    align: TextAlign
    valign: VerticalAlign
    colorToken: ColorToken
    /** Explicit hex override; when set it wins over `colorToken`. */
    color?: string
    /** 'shrink' auto-reduces font size so text never overflows its box. */
    autoFit: 'shrink' | 'none'
}

export type ImageFit = 'cover' | 'contain'

export type ImageElement = ElementBase & {
    type: 'image'
    src: string
    fit: ImageFit
    radius: number
    alt: string
}

export type ShapeKind = 'rect' | 'ellipse' | 'line'

export type ShapeElement = ElementBase & {
    type: 'shape'
    shape: ShapeKind
    fillToken?: ColorToken
    fill?: string
    stroke?: string
    strokeWidth: number
    radius: number
}

export type IconElement = ElementBase & {
    type: 'icon'
    /** Lucide icon name (kebab or pascal accepted; resolved in the renderer). */
    name: string
    colorToken: ColorToken
    color?: string
    strokeWidth: number
}

export type CarouselElement = TextElement | ImageElement | ShapeElement | IconElement

// ---------------------------------------------------------------------------
// Slides & document
// ---------------------------------------------------------------------------

export type SlideBackground =
    | { type: 'token'; token: ColorToken }
    | { type: 'color'; value: string }
    | { type: 'gradient'; value: string }
    | { type: 'image'; src: string; fit: ImageFit; overlay?: string }

export type Slide = {
    id: string
    role: SlideRole
    background: SlideBackground
    /** Slides sharing a value form one continuous (panoramic) background. */
    panoramaGroup?: string
    elements: CarouselElement[]
}

/** Persistent, theme-aware branding strip rendered on every slide. */
export type BrandChrome = {
    footer: boolean
    pageNumbers: boolean
    swipeCue: boolean
    avatarUrl: string
    name: string
    handle: string
}

export type CarouselDocument = {
    kind: 'carousel'
    version: 1
    canvas: CanvasSize
    themeId: string
    themeOverrides?: ThemeOverrides
    brandChrome: BrandChrome
    slides: Slide[]
}

export const CAROUSEL_VERSION = 1 as const

/** Practical slide-count guardrails (soft-warned, never hard-blocked). */
export const SLIDE_LIMITS = { min: 2, sweetSpot: 10, softMax: 15, hardMax: 20 } as const

/** Minimum legible body size on a 1080-wide canvas (soft-warned). */
export const MIN_BODY_FONT = 24

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isCarouselDocument(value: unknown): value is CarouselDocument {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as { kind?: unknown }).kind === 'carousel' &&
        Array.isArray((value as { slides?: unknown }).slides)
    )
}

export function isTextElement(el: CarouselElement): el is TextElement {
    return el.type === 'text'
}
export function isImageElement(el: CarouselElement): el is ImageElement {
    return el.type === 'image'
}
export function isShapeElement(el: CarouselElement): el is ShapeElement {
    return el.type === 'shape'
}
export function isIconElement(el: CarouselElement): el is IconElement {
    return el.type === 'icon'
}
