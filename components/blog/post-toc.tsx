'use client'

import * as React from 'react'

import { TOC } from '@/types/blog'
import { cn } from '@/lib/utils'
import { useScrollspy } from '@/hooks/use-scrollspy'

type TableOfContentsProps = {
    toc: TOC[]
}

const TableOfContents = (props: TableOfContentsProps) => {
    const { toc } = props
    const activeId = useScrollspy(
        toc.map((item) => item.url),
        { rootMargin: '0% 0% -80% 0%' },
    )

    return (
        <div className=''>
            <div className='mb-4 flex items-center gap-4'>On this page</div>
            <div>
                {toc.map((item) => {
                    const { title, url, depth } = item

                    return (
                        <a
                            key={url}
                            href={`#${url}`}
                            className={cn(
                                'block border-l-2 py-2 pr-2.5 text-sm leading-normal text-muted-foreground transition-all hover:text-foreground',
                                url === activeId && 'text-foreground border-foreground',
                            )}
                            style={{
                                paddingLeft: depth * 16,
                            }}>
                            {title}
                        </a>
                    )
                })}
            </div>
        </div>
    )
}

export default TableOfContents
