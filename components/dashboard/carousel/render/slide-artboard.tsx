'use client'

// ---------------------------------------------------------------------------
// SlideArtboard renders one slide at exact canvas-space pixels (1080x1350 etc.)
// - background, elements (z-ordered), and the optional branding chrome. It is
// the single rendering unit shared by the editor canvas (wrapped in a display
// scaler with an interaction overlay) and the export pipeline (rasterized at
// 2x). Inline styles are the documented slide-renderer exception.
// ---------------------------------------------------------------------------
import * as React from 'react'

import { carouselFontVars } from '@/lib/carousel/fonts'
import { type ResolvedTheme } from '@/lib/carousel/theme'
import { SAFE_MARGIN, type CarouselDocument, type Slide, type SlideBackground } from '@/lib/carousel/types'

import { IconElementView, ImageElementView, ShapeElementView, TextElementView } from './slide-elements'

type Props = {
    slide: Slide
    doc: CarouselDocument
    theme: ResolvedTheme
    index: number
    total: number
    /** Editor overlay (selection handles etc.) layered above the elements. */
    children?: React.ReactNode
}

function isDarkBackground(bg: SlideBackground, theme: ResolvedTheme): boolean {
    if (bg.type === 'gradient' || bg.type === 'image') return true
    if (bg.type === 'token') return theme.isDark || bg.token === 'accent'
    return theme.isDark
}

function backgroundStyle(bg: SlideBackground, theme: ResolvedTheme): React.CSSProperties {
    switch (bg.type) {
        case 'token':
            return { background: theme.colors[bg.token] }
        case 'color':
            return { background: bg.value }
        case 'gradient':
            return { background: bg.value === 'hero' ? theme.heroGradient : bg.value }
        case 'image':
            return { backgroundImage: `url(${bg.src})`, backgroundSize: bg.fit, backgroundPosition: 'center' }
    }
}

export function SlideArtboard({ slide, doc, theme, index, total, children }: Props) {
    const { width, height } = doc.canvas
    const elements = [...slide.elements].sort((a, b) => a.zIndex - b.zIndex)
    const onDark = isDarkBackground(slide.background, theme)
    const chromeColor = onDark ? 'rgba(255,255,255,0.92)' : theme.colors.text
    const chromeMuted = onDark ? 'rgba(255,255,255,0.66)' : theme.colors.muted
    const chrome = doc.brandChrome

    return (
        <div
            data-slide-artboard
            className={carouselFontVars}
            style={{
                position: 'relative',
                width,
                height,
                overflow: 'hidden',
                fontFamily: theme.fonts.body,
                ...backgroundStyle(slide.background, theme),
            }}>
            {slide.background.type === 'image' && slide.background.overlay ? (
                <div style={{ position: 'absolute', inset: 0, background: slide.background.overlay }} />
            ) : null}

            {elements.map((el) => {
                switch (el.type) {
                    case 'text':
                        return <TextElementView key={el.id} el={el} theme={theme} />
                    case 'image':
                        return <ImageElementView key={el.id} el={el} />
                    case 'shape':
                        return <ShapeElementView key={el.id} el={el} theme={theme} />
                    case 'icon':
                        return <IconElementView key={el.id} el={el} theme={theme} />
                    default:
                        return null
                }
            })}

            {/* Branding chrome */}
            {chrome.footer && (chrome.name || chrome.avatarUrl) ? (
                <div
                    style={{
                        position: 'absolute',
                        left: SAFE_MARGIN,
                        bottom: 44,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 18,
                    }}>
                    {chrome.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={chrome.avatarUrl}
                            alt=''
                            crossOrigin='anonymous'
                            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : null}
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        {chrome.name ? (
                            <span style={{ color: chromeColor, fontSize: 28, fontWeight: 700 }}>{chrome.name}</span>
                        ) : null}
                        {chrome.handle ? (
                            <span style={{ color: chromeMuted, fontSize: 24 }}>{chrome.handle}</span>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {chrome.pageNumbers ? (
                <div
                    style={{
                        position: 'absolute',
                        right: SAFE_MARGIN,
                        bottom: 48,
                        color: chromeMuted,
                        fontSize: 24,
                        fontWeight: 600,
                        letterSpacing: 1,
                    }}>
                    {index + 1} / {total}
                </div>
            ) : null}

            {chrome.swipeCue && index < total - 1 ? (
                <div
                    style={{
                        position: 'absolute',
                        right: SAFE_MARGIN,
                        top: SAFE_MARGIN,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 20px',
                        borderRadius: 999,
                        background: onDark ? 'rgba(255,255,255,0.16)' : theme.colors.surface,
                        color: chromeColor,
                        fontSize: 22,
                        fontWeight: 600,
                    }}>
                    Swipe
                    <span style={{ fontSize: 26, lineHeight: 1 }}>&rarr;</span>
                </div>
            ) : null}

            {children}
        </div>
    )
}
