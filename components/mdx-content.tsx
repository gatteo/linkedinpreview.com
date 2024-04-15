import React from 'react'

import { getTOC } from '@/lib/blog'
import TableOfContents from '@/components/blog/post-toc'

import { ShareIcons } from './blog/share-icons'
import Mdx from './mdx/mdx'

type Props = {
    url: string
    body: {
        code: string
        raw: string
    }
    title: string
}

export async function Content({ title, body, url }: Props) {
    const toc = await getTOC(body.raw)

    return (
        <>
            <div className='mt-8 flex flex-col justify-between lg:flex-row'>
                <article className='w-full lg:w-[670px]'>
                    <Mdx code={body.code} />
                </article>
                <aside className='hidden lg:block lg:min-w-[270px] lg:max-w-[270px]'>
                    <div className='sticky top-24 will-change-[transform,opacity]'>
                        {toc && toc.length > 0 && <TableOfContents toc={toc} />}
                        <div className='mt-6 flex justify-start'>
                            <ShareIcons title={title} url={url} />
                        </div>
                    </div>
                </aside>
            </div>
        </>
    )
}
