import { Element, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

type Image = {
    type: string
    src: string
}

export const rehypeGridImages: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'element', (node, index, parent) => {
            if (
                node.tagName === 'div' &&
                Array.isArray(node.properties.className) &&
                node.properties.className.includes('image-gallery-embed')
            ) {
                const dataAttrs = node.properties['dataAttrs'] as string
                const galleryData = JSON.parse(dataAttrs)

                const images: Image[] = galleryData.gallery.images.map((image: Image) => ({
                    type: image.type,
                    src: image.src,
                }))

                const grid = {
                    type: 'element',
                    tagName: 'div',
                    properties: { className: 'grid grid-cols-3 gap-4' },
                    children: images.map((image) => ({
                        type: 'element',
                        tagName: 'img',
                        properties: {
                            src: image.src,
                            alt: galleryData.caption,
                            className: 'col-span-1 rounded-md aspect-square object-cover',
                        },
                        children: [],
                    })),
                } as Element

                parent?.children.splice(index ?? 0, 1, grid)
            }
        })
    }
}
