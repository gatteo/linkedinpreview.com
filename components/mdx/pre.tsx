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
        <figure className='not-prose group relative my-6 overflow-hidden rounded-lg border bg-secondary/50 text-sm'>
            {title ? (
                <div className='flex flex-row items-center gap-2 border-b bg-muted py-2 pl-4 pr-2'>
                    {lang && <div className='text-muted-foreground'>{getLanguageIcon(lang)}</div>}
                    <figcaption className='flex-1 truncate text-muted-foreground'>{title}</figcaption>
                    <CopyButton text={text} />
                </div>
            ) : (
                <CopyButton className='absolute right-3 top-3 z-10' text={text} />
            )}

            <pre ref={textInput} className={cn('py-4 overflow-scroll', className)} {...rest}>
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
