import { Element, Root } from 'hast'
import { select } from 'hast-util-select'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

export const rehypeRoundedImages: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'element', (node, index, parent) => {
            if (
                node.tagName === 'div' &&
                Array.isArray(node.properties.className) && // Check if className is an array
                node.properties.className.includes('captioned-image-container') &&
                node.children &&
                node.children.length > 0 &&
                (node.children[0] as Element).tagName === 'figure' &&
                (node.children[0] as Element).children &&
                (node.children[0] as Element).children.length > 0 &&
                ((node.children[0] as Element).children[0] as Element).tagName === 'a'
            ) {
                const image = select('img', node.children[0])
                const figcaption = select('figcaption', node.children[0])

                const figure = {
                    type: 'element',
                    tagName: 'figure',
                    properties: {},
                    children: [],
                } as Element

                if (image) {
                    image.properties.className = 'rounded-md'
                    figure.children.push(image)
                }

                if (figcaption) {
                    figure.children.push(figcaption)
                }

                parent?.children.splice(index ?? 0, 1, figure)
            }
        })
    }
}
