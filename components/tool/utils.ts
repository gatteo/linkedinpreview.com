import runes from 'runes'

const MIN_LOWER = 'a'.charCodeAt(0)
const MAX_LOWER = 'z'.charCodeAt(0)
const MIN_UPPER = 'A'.charCodeAt(0)
const MAX_UPPER = 'Z'.charCodeAt(0)

const isLower = (code: number) => code >= MIN_LOWER && code <= MAX_LOWER
const isCapital = (code: number) => code >= MIN_UPPER && code <= MAX_UPPER

// A styled unicode character is built up of
// two UTF-16 code points, where the first is a surrogate.
const SURROGATE = 0xd835

type Transform = {
    exclusive: boolean
    modifier: [number, number]
}

type Appender = {
    character: string
    ignore: Array<string>
}

type Transforms = keyof typeof TRANSFORMS

// Each transform consists of a modifier for lowercase and a modifier for
// uppercase characters. To go from e.g. A to 𝔸, the character code for A, 65,
// is added to the uppercase modifier for DOUBLE, 0xdcf7, and prefixed with a
// unicode surrogate.
const TRANSFORMS = {
    DOUBLE: {
        exclusive: true,
        modifier: [0xdcf1, 0xdcf7],
    },
    SCRIPT: {
        exclusive: true,
        modifier: [0xdc89, 0xdc8f],
    },
    CODE: {
        exclusive: true,
        modifier: [0xde29, 0xde2f],
    },
    FRAKTUR: {
        exclusive: true,
        modifier: [0xdcbd, 0xdcc3],
    },
    BOLD: {
        exclusive: false,
        modifier: [0xdd8d, 0xdd93],
    },
    ITALIC: {
        exclusive: false,
        modifier: [0xddc1, 0xddc7],
    },
}

// Ignore lower hanging characters:
const UNDERLINE_IGNORE = ['g', 'j', 'p', 'q', 'y']

// Repeat UNDERLINE_IGNORE for all transforms.
function buildUnderlineIgnore() {
    const repeated = UNDERLINE_IGNORE.reduce((total, char) => {
        const permutations = Object.keys(TRANSFORMS).map((key) => applyTransform(char, TRANSFORMS[key]))

        return total.concat(permutations)
    }, [])

    // Include the regular characters as well:
    return repeated.concat(UNDERLINE_IGNORE)
}

const COMBINED_TRANSFORMS = {
    BOLDITALIC: {
        modifier: [0xddf5, 0xddfb],
    },
}

// To e.g. underline a character, a
// specific unicode character is appended prior to it.
const APPENDERS = {
    UNDERLINE: {
        character: '̲',
        ignore: buildUnderlineIgnore(),
    },
    STRIKETHROUGH: {
        character: '̶',
        ignore: [],
    },
}

/**
 * Turns e.g., BOLD and ITALIC into BOLDITALIC.
 */
function retrieveTransforms(styles: Transforms[]): Array<Transform> {
    const combined = styles
        .filter((style) => TRANSFORMS[style])
        .sort()
        .join('')

    if (COMBINED_TRANSFORMS[combined]) {
        return [COMBINED_TRANSFORMS[combined]]
    }

    return styles.map((s) => TRANSFORMS[s]).filter((t) => t)
}

function retrieveAppenders(styles: string[]): Array<Appender> {
    return styles.map((style) => APPENDERS[style]).filter((a) => a)
}

/**
 * Applies a transform by building characters using
 * a surrogate and a modifier from TRANSFORMS.
 */
function applyTransform(text: string, transform: Transform): string {
    const { modifier } = transform

    return runes(text)
        .map((char) => {
            const code = char.charCodeAt(0)
            if (isCapital(code) || isLower(code)) {
                const mod = isCapital(code) ? modifier[1] : modifier[0]
                return String.fromCharCode(SURROGATE, mod + code)
            }

            return char
        })
        .join('')
}

/**
 * Styles text using appenders by prepending each
 * character with the given appendChar.
 */
function applyAppender(text: string, appender: Appender): string {
    return runes(text).reduce((str, char) => {
        if (appender.ignore.includes(char)) {
            return str + char
        }

        return str + char + appender.character
    }, '')
}

/**
 * Applies a list of styles to the given characters.
 */
export function applyStyles(characters: string, style: string[]): string {
    const transforms = retrieveTransforms(style as Transforms[])
    const appenders = retrieveAppenders(style)
    const styledText = transforms.reduce(applyTransform, characters)
    return appenders.reduce(applyAppender, styledText)
}

export function applyStylesJSON(obj: any) {
    if (obj.content) {
        obj.content.forEach((item) => {
            // const mappedMarks = item.marks.reduce((mark) => mapMarks(mark.type))

            item.content.forEach(() => {
                if (textItem.text) {
                    textItem.text = textItem.text.toUpperCase()
                }
            })

            if (item.marks && item.marks.some((mark) => mark.type === 'bold')) {
                // If the field has bold mark, transform the text to uppercase
            }
            // Recursively process nested content
            processJSON(item)
        })
    }
}

interface Node {
    type: string
    content?: Node[]
    marks?: { type: string }[]
    text?: string
}

export function processNodes(node: Node): Node {
    // Clone the node to avoid modifying the original object
    const processedNode = { ...node }

    if (node.type === 'text') {
        const mappedMarks = (node.marks || []).reduce((acc, mark) => [...acc, mapMarks(mark.type)], [])

        const styledText = applyStyles(node.text || '', mappedMarks)

        // Update the text property of the cloned node
        processedNode.marks = []
        processedNode.text = styledText
    } else if (node.content) {
        // If the node has children (i.e., it's a parent node), recursively process its children
        processedNode.content = node.content.map((childNode) => processNodes(childNode))
    }

    return processedNode
}

function mapMarks(style: string) {
    switch (style) {
        case 'bold':
            return 'BOLD'
        case 'italic':
            return 'ITALIC'
        case 'underline':
            return 'UNDERLINE'
        case 'strike':
            return 'STRIKETHROUGH'
        default:
            return ''
    }
}

function toText(node: Node, parentType = ''): string {
    if (node.type === 'hardBreak') {
        return '\n'
    } else if (node.type === 'text') {
        return node.text || ''
    } else if (node.type === 'bulletList') {
        return node.content?.map((item) => `• ${toText(item, node.type)}`).join('\n') || ''
    } else if (node.type === 'orderedList') {
        return node.content?.map((item, index) => `${index + 1}. ${toText(item, node.type)}`).join('\n') || ''
    } else if (node.type === 'listItem') {
        return node.content?.map((childNode) => toText(childNode, parentType)).join('') || ''
    } else if (node.content) {
        return node.content.map((childNode) => toText(childNode, node.type)).join('')
    } else {
        return ''
    }
}

export function toPlainText(json: Node[]): string {
    let plainText = ''

    for (let i = 0; i < json.length; i++) {
        const block = json[i]
        const text = toText(block)

        if (block.type === 'paragraph' && !text.trim()) {
            plainText += '\n\n'
        } else if (block.type === 'bulletList' || block.type === 'orderedList') {
            // Ensure list starts on a new line
            plainText = plainText + '\n' + text + '\n'
        } else {
            if (
                i !== json.length - 1 &&
                (json[i + 1].type === 'paragraph' ||
                    json[i + 1].type === 'bulletList' ||
                    json[i + 1].type === 'orderedList') &&
                json[i + 1].content?.some((item) => item.type === 'text')
            ) {
                plainText += text + '\n'
            } else {
                plainText += text
            }
        }
    }
    return plainText.replace(/\n{3,}/g, '\n\n').trim()
}
