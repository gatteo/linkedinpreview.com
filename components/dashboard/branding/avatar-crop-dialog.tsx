'use client'

import * as React from 'react'

import { clamp, coverScale, cropToDataUrl, loadImage, maxOffset, type CropTransform } from '@/lib/image-crop'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

type AvatarCropDialogProps = {
    open: boolean
    src: string | null
    onCancel: () => void
    onCrop: (dataUrl: string) => void
}

const VIEWPORT_SIZE = 256
const MIN_ZOOM = 1
const MAX_ZOOM = 3

export function AvatarCropDialog({ open, src, onCancel, onCrop }: AvatarCropDialogProps) {
    const [image, setImage] = React.useState<HTMLImageElement | null>(null)
    const [zoom, setZoom] = React.useState(1)
    const [offset, setOffset] = React.useState({ x: 0, y: 0 })
    const dragRef = React.useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)

    // Hold the latest onCancel so the image-load effect keys only on [open, src]
    // and a parent re-render (fresh inline closure) cannot reset the crop framing.
    const onCancelRef = React.useRef(onCancel)
    React.useEffect(() => {
        onCancelRef.current = onCancel
    }, [onCancel])

    React.useEffect(() => {
        if (!open || !src) {
            setImage(null)
            return
        }
        let cancelled = false
        loadImage(src)
            .then((img) => {
                if (cancelled) return
                setImage(img)
                setZoom(1)
                setOffset({ x: 0, y: 0 })
            })
            .catch(() => {
                if (!cancelled) onCancelRef.current()
            })
        return () => {
            cancelled = true
        }
    }, [open, src])

    const clampOffset = React.useCallback(
        (next: { x: number; y: number }, nextZoom: number) => {
            if (!image) return next
            const limit = maxOffset(image, VIEWPORT_SIZE, nextZoom)
            return { x: clamp(next.x, limit.x), y: clamp(next.y, limit.y) }
        },
        [image],
    )

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!image) return
        e.currentTarget.setPointerCapture(e.pointerId)
        dragRef.current = { startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y }
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current
        if (!drag) return
        const next = { x: drag.originX + (e.clientX - drag.startX), y: drag.originY + (e.clientY - drag.startY) }
        setOffset(clampOffset(next, zoom))
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.releasePointerCapture(e.pointerId)
        dragRef.current = null
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!image) return
        const step = e.shiftKey ? 20 : 5
        let dx = 0
        let dy = 0
        if (e.key === 'ArrowLeft') dx = -step
        else if (e.key === 'ArrowRight') dx = step
        else if (e.key === 'ArrowUp') dy = -step
        else if (e.key === 'ArrowDown') dy = step
        else return
        e.preventDefault()
        setOffset((current) => clampOffset({ x: current.x + dx, y: current.y + dy }, zoom))
    }

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nextZoom = Number(e.target.value)
        setZoom(nextZoom)
        setOffset((current) => clampOffset(current, nextZoom))
    }

    const handleApply = () => {
        if (!image) return
        const transform: CropTransform = { zoom, offsetX: offset.x, offsetY: offset.y }
        onCrop(cropToDataUrl(image, VIEWPORT_SIZE, transform))
    }

    const backgroundStyle = image
        ? {
              backgroundImage: `url(${image.src})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: `${image.naturalWidth * coverScale(image, VIEWPORT_SIZE) * zoom}px ${
                  image.naturalHeight * coverScale(image, VIEWPORT_SIZE) * zoom
              }px`,
              backgroundPosition: `calc(50% + ${offset.x}px) calc(50% + ${offset.y}px)`,
          }
        : undefined

    return (
        <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adjust photo</DialogTitle>
                    <DialogDescription>Drag to reposition and zoom to frame your avatar.</DialogDescription>
                </DialogHeader>

                <div className='flex flex-col items-center gap-4'>
                    <div
                        className='focus-visible:ring-ring relative size-64 cursor-grab touch-none overflow-hidden rounded-full bg-neutral-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:cursor-grabbing'
                        style={backgroundStyle}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        role='img'
                        aria-label='Avatar crop preview. Use arrow keys to reposition.'
                    />
                    <div className='flex w-full max-w-xs items-center gap-3'>
                        <Label htmlFor='avatar-zoom' className='text-xs'>
                            Zoom
                        </Label>
                        <input
                            id='avatar-zoom'
                            type='range'
                            min={MIN_ZOOM}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={zoom}
                            onChange={handleZoomChange}
                            className='flex-1'
                            aria-label='Zoom level'
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleApply} disabled={!image}>
                        Save photo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
