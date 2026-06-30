// ---------------------------------------------------------------------------
// Client-side export. Each slide is rendered off-screen with the SAME
// SlideArtboard used in the editor (so what you see is what you ship), then
// rasterized at 2x with modern-screenshot (foreignObject => the real browser
// paints webfonts/emoji/gradients). PNGs are assembled into a flattened
// multi-page PDF (pdf-lib) at the exact LinkedIn pixel size, and/or zipped
// (fflate). All in-browser: zero server cost.
// ---------------------------------------------------------------------------

import { createElement } from 'react'
import { zipSync } from 'fflate'
import { domToPng } from 'modern-screenshot'
import { PDFDocument } from 'pdf-lib'
import { createRoot } from 'react-dom/client'

import { resolveTheme } from '@/lib/carousel/theme'
import { type CarouselDocument } from '@/lib/carousel/types'
import { SlideArtboard } from '@/components/dashboard/carousel/render/slide-artboard'

import { carouselFontVars } from './fonts'

const EXPORT_SCALE = 2

export type ExportFormat = 'pdf' | 'images'

type Progress = (done: number, total: number) => void

function wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
}

function nextFrame(): Promise<void> {
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
}

async function waitForAssets(host: HTMLElement): Promise<void> {
    if (document.fonts?.ready) await document.fonts.ready
    await nextFrame()
    const imgs = Array.from(host.querySelectorAll('img'))
    await Promise.all(
        imgs.map((img) =>
            img.complete
                ? Promise.resolve()
                : new Promise<void>((res) => {
                      img.onload = () => res()
                      img.onerror = () => res()
                  }),
        ),
    )
    // One more frame for the text auto-fit layout effects to settle.
    await nextFrame()
    await wait(30)
}

/** Render every slide off-screen and rasterize each to a PNG data URL. */
export async function renderSlidesToPngs(doc: CarouselDocument, onProgress?: Progress): Promise<string[]> {
    const theme = resolveTheme(doc.themeId, doc.themeOverrides)
    const { width, height } = doc.canvas

    const host = document.createElement('div')
    host.className = carouselFontVars
    // Off-screen but fully opaque (opacity:0 would propagate to the clone).
    host.style.cssText = 'position:fixed; left:-100000px; top:0; margin:0; padding:0; pointer-events:none;'
    document.body.appendChild(host)

    const refs: (HTMLDivElement | null)[] = []
    const root = createRoot(host)
    root.render(
        createElement(
            'div',
            null,
            doc.slides.map((slide, i) =>
                createElement(
                    'div',
                    {
                        key: slide.id,
                        ref: (el: HTMLDivElement | null) => {
                            refs[i] = el
                        },
                        style: { width, height, position: 'relative' },
                    },
                    createElement(SlideArtboard, { slide, doc, theme, index: i, total: doc.slides.length }),
                ),
            ),
        ),
    )

    try {
        await waitForAssets(host)
        const pngs: string[] = []
        for (let i = 0; i < doc.slides.length; i += 1) {
            const node = refs[i]
            if (!node) continue
            const png = await domToPng(node, { scale: EXPORT_SCALE, width, height, backgroundColor: theme.colors.bg })
            pngs.push(png)
            onProgress?.(i + 1, doc.slides.length)
        }
        return pngs
    } finally {
        root.unmount()
        host.remove()
    }
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1] ?? ''
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
    return bytes
}

export async function buildPdf(doc: CarouselDocument, pngs: string[]): Promise<Uint8Array> {
    const pdf = await PDFDocument.create()
    const { width, height } = doc.canvas
    for (const png of pngs) {
        const image = await pdf.embedPng(png)
        const page = pdf.addPage([width, height])
        page.drawImage(image, { x: 0, y: 0, width, height })
    }
    return pdf.save()
}

export function buildZip(pngs: string[], pdfBytes?: Uint8Array): Uint8Array {
    const files: Record<string, Uint8Array> = {}
    pngs.forEach((png, i) => {
        files[`slide-${String(i + 1).padStart(2, '0')}.png`] = dataUrlToBytes(png)
    })
    if (pdfBytes) files['carousel.pdf'] = pdfBytes
    return zipSync(files, { level: 6 })
}

export function downloadBlob(data: Uint8Array | Blob, filename: string, mime: string): void {
    const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Orchestrate a full export and trigger the download. */
export async function exportCarousel(
    doc: CarouselDocument,
    format: ExportFormat,
    filename: string,
    onProgress?: Progress,
): Promise<void> {
    const pngs = await renderSlidesToPngs(doc, onProgress)
    if (pngs.length === 0) throw new Error('Nothing to export')

    if (format === 'pdf') {
        const pdf = await buildPdf(doc, pngs)
        downloadBlob(pdf, `${filename}.pdf`, 'application/pdf')
        return
    }
    const pdf = await buildPdf(doc, pngs)
    const zip = buildZip(pngs, pdf)
    downloadBlob(zip, `${filename}.zip`, 'application/zip')
}
