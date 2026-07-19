import { Mark, mergeAttributes } from '@tiptap/react'

export type FontStyleName = 'double' | 'script' | 'code' | 'fraktur'

const FONT_STYLE_NAMES: readonly FontStyleName[] = ['double', 'script', 'code', 'fraktur']

const DEFAULT_FONT_STYLE: FontStyleName = 'double'

function isFontStyleName(value: unknown): value is FontStyleName {
    return typeof value === 'string' && (FONT_STYLE_NAMES as readonly string[]).includes(value)
}

// The Commands interface is declared in @tiptap/core, which pnpm's strict linker does
// not expose at the project root. @tiptap/react re-exports it, so the augmentation is
// declared against @tiptap/react and still merges into the same interface.
declare module '@tiptap/react' {
    interface Commands<ReturnType> {
        fontStyle: {
            setFontStyle: (style: FontStyleName) => ReturnType
            unsetFontStyle: () => ReturnType
            toggleFontStyle: (style: FontStyleName) => ReturnType
        }
    }
}

export interface FontStyleOptions {
    HTMLAttributes: Record<string, unknown>
}

// The mark only records intent. The glyph substitution happens in the Unicode
// transform layer (components/tool/utils.ts) at serialization time, so the editor
// affordance for a styled run lives in styles/globals.css under [data-font-style].
export const FontStyle = Mark.create<FontStyleOptions>({
    name: 'fontStyle',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    addAttributes() {
        return {
            style: {
                default: DEFAULT_FONT_STYLE,
                parseHTML: (element) => {
                    const value = element.getAttribute('data-font-style')
                    return isFontStyleName(value) ? value : DEFAULT_FONT_STYLE
                },
                renderHTML: (attributes) => {
                    if (!isFontStyleName(attributes.style)) return {}
                    return { 'data-font-style': attributes.style }
                },
            },
        }
    },

    parseHTML() {
        return [{ tag: 'span[data-font-style]' }]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
    },

    addCommands() {
        return {
            setFontStyle:
                (style) =>
                ({ commands }) => {
                    if (!isFontStyleName(style)) return false
                    return commands.setMark(this.name, { style })
                },

            unsetFontStyle:
                () =>
                ({ commands }) =>
                    commands.unsetMark(this.name),

            toggleFontStyle:
                (style) =>
                ({ commands, editor }) => {
                    if (!isFontStyleName(style)) return false
                    if (editor.isActive(this.name, { style })) return commands.unsetMark(this.name)
                    return commands.setMark(this.name, { style })
                },
        }
    },
})
