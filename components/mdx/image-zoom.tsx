'use client'

import * as React from 'react'
import Zoom from 'react-medium-image-zoom'

import '@/styles/image-zoom.css'
import 'react-medium-image-zoom/dist/styles.css'

type ImageZoomProps = {
    children: React.ReactNode
} & React.ComponentPropsWithoutRef<typeof Zoom>

export const ImageZoom = (props: ImageZoomProps) => {
    const { children, ...rest } = props

    return (
        <Zoom zoomMargin={40} {...rest}>
            {children}
        </Zoom>
    )
}
