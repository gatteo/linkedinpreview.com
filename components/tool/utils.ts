import runes from 'runes'

import type { FontStyleName } from './extensions/font-style'

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
    exceptions?: Record<string, string>
}

type Appender = {
    character: string
    ignore: Array<string>
}

type TransformKey = string

// The double-struck and fraktur alphabets are not contiguous. A handful of capitals
// were encoded earlier in the Letterlike Symbols block, so the codepoints the modifier
// math lands on for them are unassigned and render as tofu. Substitute them by hand.
// The script and monospace ranges resolve to the bold-script and monospace blocks,
// which are complete, so they need no exceptions.
const DOUBLE_EXCEPTIONS: Record<string, string> = {
    C: 'ℂ',
    H: 'ℍ',
    N: 'ℕ',
    P: 'ℙ',
    Q: 'ℚ',
    R: 'ℝ',
    Z: 'ℤ',
}

const FRAKTUR_EXCEPTIONS: Record<string, string> = {
    C: 'ℭ',
    H: 'ℌ',
    I: 'ℑ',
    R: 'ℜ',
    Z: 'ℨ',
}

// Each transform consists of a modifier for lowercase and a modifier for
// uppercase characters. To go from e.g. A to 𝔸, the character code for A, 65,
// is added to the uppercase modifier for DOUBLE, 0xdcf7, and prefixed with a
// unicode surrogate.
const TRANSFORMS: Record<string, Transform> = {
    DOUBLE: {
        exclusive: true,
        modifier: [0xdcf1, 0xdcf7],
        exceptions: DOUBLE_EXCEPTIONS,
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
        exceptions: FRAKTUR_EXCEPTIONS,
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
    const repeated = UNDERLINE_IGNORE.reduce<string[]>((total, char) => {
        const permutations = Object.keys(TRANSFORMS).map((key) => applyTransform(char, TRANSFORMS[key]))

        return total.concat(permutations)
    }, [])

    return repeated.concat(UNDERLINE_IGNORE)
}

const COMBINED_TRANSFORMS: Record<string, Transform> = {
    BOLDITALIC: {
        exclusive: false,
        modifier: [0xddf5, 0xddfb],
    },
}

// To e.g. underline a character, a
// specific unicode character is appended prior to it.
const APPENDERS: Record<string, Appender> = {
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
 *
 * Precedence: character transforms cannot compose. Unicode has no bold-script or
 * italic-fraktur codepoints, so when an exclusive transform (DOUBLE, SCRIPT, CODE,
 * FRAKTUR) is present on a run it wins and the non-exclusive ones (BOLD, ITALIC)
 * are dropped for that run. Appenders (UNDERLINE, STRIKETHROUGH) are combining
 * characters and still stack on top of any transform.
 */
function retrieveTransforms(styles: TransformKey[]): Array<Transform> {
    const known = styles.filter((style) => TRANSFORMS[style])
    const exclusive = known.find((style) => TRANSFORMS[style].exclusive)

    if (exclusive) {
        return [TRANSFORMS[exclusive]]
    }

    const combined = [...known].sort().join('')

    if (COMBINED_TRANSFORMS[combined]) {
        return [COMBINED_TRANSFORMS[combined]]
    }

    return known.map((s) => TRANSFORMS[s])
}

function retrieveAppenders(styles: string[]): Array<Appender> {
    return styles.map((style) => APPENDERS[style]).filter((a) => a)
}

/**
 * Applies a transform by building characters using
 * a surrogate and a modifier from TRANSFORMS.
 */
function applyTransform(text: string, transform: Transform): string {
    const { modifier, exceptions } = transform

    return runes(text)
        .map((char) => {
            const exception = exceptions?.[char]
            if (exception) return exception

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
    const transforms = retrieveTransforms(style)
    const appenders = retrieveAppenders(style)
    const styledText = transforms.reduce(applyTransform, characters)
    return appenders.reduce(applyAppender, styledText)
}

type Mark = {
    type: string
    attrs?: Record<string, unknown> | null
}

type Node = {
    type: string
    content?: Node[]
    marks?: Mark[]
    text?: string
    attrs?: Record<string, unknown> | null
}

export function processNodes(node: Node): Node {
    // Clone the node to avoid modifying the original object
    const processedNode = { ...node }

    if (node.type === 'text') {
        const mappedMarks = (node.marks || []).reduce<string[]>((acc, mark) => [...acc, mapMarks(mark)], [])

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

// The fontStyle mark carries the variant in an attribute rather than in the mark
// name, so it maps through the attribute value instead of the mark type.
const FONT_STYLE_TRANSFORMS: Record<FontStyleName, TransformKey> = {
    double: 'DOUBLE',
    script: 'SCRIPT',
    code: 'CODE',
    fraktur: 'FRAKTUR',
}

function mapMarks(mark: Mark): TransformKey {
    switch (mark.type) {
        case 'bold':
            return 'BOLD'
        case 'italic':
            return 'ITALIC'
        case 'underline':
            return 'UNDERLINE'
        case 'strike':
            return 'STRIKETHROUGH'
        case 'fontStyle': {
            const style = mark.attrs?.style
            if (typeof style !== 'string') return ''
            return FONT_STYLE_TRANSFORMS[style as FontStyleName] ?? ''
        }
        default:
            return ''
    }
}

// An ordered list numbers from its start attribute, not from 1. TipTap sets it when a list
// is typed as e.g. '5. ' and the copy path sets it on a list sliced out of the middle of a
// longer one, so that a partial copy keeps the numbers the user can see.
function listStart(node: Node): number {
    const start = node.attrs?.start
    return typeof start === 'number' && Number.isFinite(start) ? start : 1
}

function toText(node: Node, parentType = ''): string {
    if (node.type === 'hardBreak') {
        return '\n'
    } else if (node.type === 'text') {
        return node.text || ''
    } else if (node.type === 'bulletList') {
        return node.content?.map((item) => `• ${toText(item, node.type)}`).join('\n') || ''
    } else if (node.type === 'orderedList') {
        const start = listStart(node)
        return node.content?.map((item, index) => `${start + index}. ${toText(item, node.type)}`).join('\n') || ''
    } else if (node.type === 'listItem') {
        return node.content?.map((childNode) => toText(childNode, parentType)).join('') || ''
    } else if (node.content) {
        return node.content.map((childNode) => toText(childNode, node.type)).join('')
    } else {
        return ''
    }
}

type ToPlainTextOptions = {
    // Marks the input as an arbitrary sub-range of a document rather than a whole one.
    // A whole document is trimmed at the edges and reads a paragraph holding only spaces
    // as a blank line. A sub-range does neither: that whitespace is literally what the
    // user dragged over, so it goes on the clipboard verbatim. Only the user's own
    // whitespace ever reaches the edges, because block separators are emitted between
    // blocks, never before the first or after the last.
    range?: boolean
}

export function toPlainText(json: Node[], options: ToPlainTextOptions = {}): string {
    const { range = false } = options
    let plainText = ''

    for (let i = 0; i < json.length; i++) {
        const block = json[i]
        const text = toText(block)
        // A sub-range tests for a paragraph with no content at all. Testing the text for
        // whitespace instead would turn a drag across a run of spaces into two blank lines.
        const isBlankLine = block.type === 'paragraph' && (range ? !block.content?.length : !text.trim())

        if (isBlankLine) {
            plainText += '\n\n'
        } else if (block.type === 'bulletList' || block.type === 'orderedList') {
            // Break a list onto its own line, but only against blocks that are actually
            // there. Emitting the newlines unconditionally synthesized leading/trailing
            // whitespace that the whole-document trim used to hide and that a sub-range
            // copy put straight on the clipboard. Both sides test position rather than
            // what has been emitted so far, because a block that renders as no characters
            // is still a block the list has to be broken away from.
            if (i !== 0) plainText += '\n'
            plainText += text
            if (i !== json.length - 1) plainText += '\n'
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
    const collapsed = plainText.replace(/\n{3,}/g, '\n\n')
    return range ? collapsed : collapsed.trim()
}
