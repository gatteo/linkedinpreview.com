import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { processNodes, toPlainText } from '../utils'

interface ContentSectionProps {
    content: string
}

export function renderWithHashtags(text: string): React.ReactNode {
    const parts = text.split(/(#[\w\u00C0-\u024F]+)/g)
    if (parts.length === 1) return text
    return parts.map((part, i) =>
        /^#[\w\u00C0-\u024F]+$/.test(part) ? (
            // eslint-disable-next-line react/no-array-index-key -- static list derived from text, never reordered
            <span key={i} className='font-semibold text-[#0a66c2]'>
                {part}
            </span>
        ) : (
            part
        ),
    )
}

export const ContentSection: React.FC<ContentSectionProps> = ({ content }) => {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showMoreButton, setShowMoreButton] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    const processedContent = useMemo(() => {
        if (!content) return ''
        // @ts-ignore-next-line
        return toPlainText(processNodes(content).content)
    }, [content])

    const checkContentOverflow = useCallback(() => {
        setTimeout(() => {
            const contentElement = contentRef.current
            if (contentElement) {
                const lineHeight = Number.parseInt(window.getComputedStyle(contentElement).lineHeight)
                const maxHeight = lineHeight * 3
                setShowMoreButton(contentElement.scrollHeight > maxHeight)
            }
        }, 0)
    }, [])

    useEffect(() => {
        if (processedContent) {
            checkContentOverflow()
        }
    }, [processedContent, checkContentOverflow])

    if (!processedContent) {
        return (
            <div className='mt-5 whitespace-pre-line text-sm'>
                {'Start writing and your post will appear here..\nYou can add images, links, '}
                <span className='font-semibold text-[#0a66c2]'>#hashtags</span>
                {' and emojis 🤩'}
            </div>
        )
    }

    return (
        <div className='relative mt-5'>
            <div
                ref={contentRef}
                className={cn('relative whitespace-pre-line text-sm', !isExpanded && 'line-clamp-3 overflow-hidden')}>
                {renderWithHashtags(processedContent)}
            </div>
            {showMoreButton && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        'text-sm font-semibold text-gray-500 hover:text-gray-700',
                        isExpanded ? 'mt-2' : 'absolute bottom-0 right-0 bg-white pl-1',
                    )}>
                    {isExpanded ? '...less' : '...more'}
                </button>
            )}
        </div>
    )
}
