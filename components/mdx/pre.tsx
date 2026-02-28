'use client'

import * as React from 'react'
import { SiJavascript, SiReact, SiTypescript } from '@icons-pack/react-simple-icons'
import { CheckIcon, CopyIcon, FileIcon, TerminalIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'

import { Button, ButtonProps } from '../ui/button'

type PreProps = {
    'data-lang'?: string
} & React.ComponentPropsWithoutRef<'pre'>
type CopyButtonProps = {
    text: string
} & ButtonProps

const getLanguageIcon = (lang: string): React.ReactNode => {
    switch (lang) {
        case 'js': {
            return <SiJavascript className='size-3.5' />
        }

        case 'ts': {
            return <SiTypescript className='size-3.5' />
        }

        case 'jsx':
        case 'tsx': {
            return <SiReact className='size-3.5' />
        }

        case 'bash':
        case 'sh':
        case 'shell':
        case 'zsh': {
            return <TerminalIcon className='size-3.5' />
        }

        default: {
            return <FileIcon className='size-3.5' />
        }
    }
}

export const Pre = (props: PreProps) => {
    const { children, className, title, 'data-lang': lang, ...rest } = props

    const textInput = React.useRef<HTMLPreElement>(null)
    const [text, setText] = React.useState<string>('')

    React.useEffect(() => {
        if (textInput.current) {
            setText(textInput.current.textContent ?? '')
        }
    }, [])

    return (
        <figure className='not-prose group border-border bg-secondary/50 relative my-6 overflow-hidden rounded-xl border text-sm'>
            {title ? (
                <div className='border-border bg-muted flex flex-row items-center gap-2 border-b py-2 pr-2 pl-4'>
                    {lang && <div className='text-muted-foreground'>{getLanguageIcon(lang)}</div>}
                    <figcaption className='text-muted-foreground flex-1 truncate'>{title}</figcaption>
                    <CopyButton text={text} />
                </div>
            ) : (
                <CopyButton className='absolute top-3 right-3 z-10' text={text} />
            )}

            <pre ref={textInput} className={cn('overflow-scroll py-4', className)} {...rest}>
                {children}
            </pre>
        </figure>
    )
}

const CopyButton = (props: CopyButtonProps) => {
    const { text, className, ...rest } = props
    const [copy, isCopied] = useCopyToClipboard()

    return (
        <Button
            className={cn('size-8 p-0 opacity-0 transition-opacity group-hover:opacity-100', className)}
            variant='outline'
            onClick={() => copy({ text })}
            type='button'
            aria-label='Copy code to clipboard'
            {...rest}>
            {isCopied ? <CheckIcon className='size-4' /> : <CopyIcon className='size-4' />}
        </Button>
    )
}
