// ---------------------------------------------------------------------------
// Square avatar cropping helpers (canvas-based, no dependency)
// ---------------------------------------------------------------------------

export type CropTransform = {
    /** Zoom factor applied on top of the cover-fit scale (>= 1). */
    zoom: number
    /** Horizontal offset of the image center from the viewport center, in viewport pixels. */
    offsetX: number
    /** Vertical offset of the image center from the viewport center, in viewport pixels. */
    offsetY: number
}

const OUTPUT_SIZE = 256

export const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })

export const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = src
    })

// Smallest scale that still covers the square viewport for a given image.
export const coverScale = (image: HTMLImageElement, viewportSize: number): number => {
    const base = Math.min(image.naturalWidth, image.naturalHeight)
    if (base === 0) return 1
    return viewportSize / base
}

// Max pan offset (each axis) that keeps the zoomed image covering the viewport.
export const maxOffset = (image: HTMLImageElement, viewportSize: number, zoom: number) => {
    const scale = coverScale(image, viewportSize) * zoom
    return {
        x: Math.max(0, (image.naturalWidth * scale - viewportSize) / 2),
        y: Math.max(0, (image.naturalHeight * scale - viewportSize) / 2),
    }
}

export const clamp = (value: number, limit: number): number => Math.min(limit, Math.max(-limit, value))

// Render the visible square region of the transformed image to a data URL.
export const cropToDataUrl = (image: HTMLImageElement, viewportSize: number, transform: CropTransform): string => {
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const ctx = canvas.getContext('2d')
    if (!ctx) return image.src

    const scale = coverScale(image, viewportSize) * transform.zoom
    const scaledWidth = image.naturalWidth * scale
    const scaledHeight = image.naturalHeight * scale

    // Top-left of the scaled image relative to the viewport top-left.
    const drawX = (viewportSize - scaledWidth) / 2 + transform.offsetX
    const drawY = (viewportSize - scaledHeight) / 2 + transform.offsetY

    // Map viewport coordinates onto the output canvas.
    const ratio = OUTPUT_SIZE / viewportSize
    ctx.drawImage(image, drawX * ratio, drawY * ratio, scaledWidth * ratio, scaledHeight * ratio)

    return canvas.toDataURL('image/png')
}
