import React from 'react'

import { cn } from '@/lib/utils'
import { AspectRatio } from '@/components/ui/aspect-ratio'

type VideoProps = {
    src: string
    width: number
    height: number
} & React.ComponentPropsWithoutRef<'video'>

export const Video = (props: VideoProps) => {
    const { src, width, height, controls = true, className, ...rest } = props

    return (
        <AspectRatio ratio={16 / 9}>
            <video
                className={cn('object-fit my-4 rounded-lg shadow-lg', className)}
                loop
                muted
                src={src}
                controls={controls}
                width={width}
                height={height}
                {...rest}
            />
        </AspectRatio>
    )
}
