// ---------------------------------------------------------------------------
// Client-side image import: read a File, downscale to a max dimension, and
// return a data URL. Downscaling keeps the carousel draft (stored as JSON in
// drafts.content) from ballooning with full-resolution uploads, and inlining as
// a data URL keeps export same-origin (no tainted-canvas failures).
// ---------------------------------------------------------------------------

const MAX_DIM = 1600
const JPEG_QUALITY = 0.9

export async function fileToScaledDataUrl(file: File, maxDim = MAX_DIM): Promise<string> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
    })

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('Could not load image'))
        el.src = dataUrl
    })

    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    if (scale >= 1 && file.size < 600_000) return dataUrl

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    return canvas.toDataURL(type, JPEG_QUALITY)
}
