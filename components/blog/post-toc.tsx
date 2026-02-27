'use client'

import * as React from 'react'

import { TOC } from '@/types/blog'
import { cn } from '@/lib/utils'
import { useScrollspy } from '@/hooks/use-scrollspy'

type TableOfContentsProps = {
    toc: TOC[]
}

type Section = {
    item: TOC
    children: TOC[]
}

/** Group flat ToC into sections: each top-level item with its nested children. */
function groupSections(toc: TOC[]): Section[] {
    const minDepth = Math.min(...toc.map((t) => t.depth))
    const sections: Section[] = []

    for (const item of toc) {
        if (item.depth === minDepth) {
            sections.push({ item, children: [] })
        } else if (sections.length > 0) {
            sections[sections.length - 1].children.push(item)
        }
    }

    return sections
}

const TableOfContents = (props: TableOfContentsProps) => {
    const { toc } = props
    const activeId = useScrollspy(
        toc.map((item) => item.url),
        { rootMargin: '0% 0% -80% 0%' },
    )

    const sections = React.useMemo(() => groupSections(toc), [toc])
    const minDepth = Math.min(...toc.map((t) => t.depth))

    /** Find which section the active item belongs to. */
    const activeSectionUrl = React.useMemo(() => {
        for (const section of sections) {
            if (section.item.url === activeId) return section.item.url
            if (section.children.some((c) => c.url === activeId)) return section.item.url
        }
        return null
    }, [sections, activeId])

    return (
        <nav aria-label='Table of contents'>
            <div className='text-muted-foreground/70 mb-3 text-xs font-medium tracking-wider uppercase'>
                On this page
            </div>
            <div>
                {sections.map((section) => {
                    const { item, children } = section
                    const isExpanded = activeSectionUrl === item.url

                    return (
                        <div key={item.url}>
                            <a
                                href={`#${item.url}`}
                                className={cn(
                                    'text-muted-foreground/80 hover:text-foreground block truncate border-l-2 py-1 pr-2.5 text-[13px] leading-snug transition-colors',
                                    item.url === activeId
                                        ? 'border-foreground text-foreground font-medium'
                                        : 'border-transparent',
                                )}
                                title={item.title}
                                style={{
                                    paddingLeft: (item.depth - minDepth) * 16 + 8,
                                }}>
                                {item.title}
                            </a>
                            {children.length > 0 && (
                                <div
                                    className='grid transition-[grid-template-rows] duration-200 ease-in-out'
                                    style={{
                                        gridTemplateRows: isExpanded ? '1fr' : '0fr',
                                    }}>
                                    <div className='overflow-hidden'>
                                        {children.map((child) => (
                                            <a
                                                key={child.url}
                                                href={`#${child.url}`}
                                                className={cn(
                                                    'text-muted-foreground/80 hover:text-foreground block truncate border-l-2 py-1 pr-2.5 text-[13px] leading-snug transition-colors',
                                                    child.url === activeId
                                                        ? 'border-foreground text-foreground font-medium'
                                                        : 'border-transparent',
                                                )}
                                                title={child.title}
                                                style={{
                                                    paddingLeft: (child.depth - minDepth) * 16 + 8,
                                                }}>
                                                {child.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </nav>
    )
}

export default TableOfContents
