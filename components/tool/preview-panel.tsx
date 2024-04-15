import React from 'react'
import Image from 'next/image'

import { Icons } from '../icon'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { toPlainText } from './toText'
import { processNodes } from './transform'

export function PreviewPanel({ content }: { content: string }) {
    const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop')

    const [processedContent, setProcessedContent] = React.useState<string>('')

    React.useEffect(() => {
        if (!content) {
            return
        }

        setProcessedContent(toPlainText(processNodes(content).content))
    }, [content])

    return (
        <div>
            {/** Panel title */}
            <div className='flex h-16 border-b px-4 sm:px-6'>
                <div className='flex grow items-center justify-between'>
                    <h2 className='text-base font-semibold'>Post Preview</h2>
                    <Tabs value={screenSize} onValueChange={(v) => setScreenSize(v as typeof screenSize)}>
                        <TabsList>
                            <TabsTrigger value='mobile'>
                                <Icons.mobile className='size-5' />
                            </TabsTrigger>
                            <TabsTrigger value='tablet'>
                                <Icons.tablet className='size-5' />
                            </TabsTrigger>
                            <TabsTrigger value='desktop'>
                                <Icons.desktop className='size-5' />
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/** Panel content */}
            <div className='flex h-full min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto bg-gray-50 py-5'>
                <div className='mx-auto w-[555px]'>
                    <div className='font-system overflow-hidden rounded-lg bg-white shadow ring-1 ring-inset ring-gray-200'>
                        <div className='py-5 pl-4 pr-6'>
                            <div className='flex items-center gap-3'>
                                <div className='min-w-0 flex-1'>
                                    <div className='flex items-center gap-3'>
                                        <span className='relative inline-block shrink-0'>
                                            <Image
                                                alt=''
                                                loading='lazy'
                                                width='140'
                                                height='140'
                                                decoding='async'
                                                data-nimg='1'
                                                className='size-14 rounded-full object-cover'
                                                src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij4KICA8cGF0aCBmaWxsPSIjZTdlMmRjIiBkPSJNMCAwaDEyOHYxMjhIMHoiLz4KICA8cGF0aCBkPSJNODguNDEgODQuNjdhMzIgMzIgMCAxMC00OC44MiAwIDY2LjEzIDY2LjEzIDAgMDE0OC44MiAweiIgZmlsbD0iIzc4OGZhNSIvPgogIDxwYXRoIGQ9Ik04OC40MSA4NC42N2EzMiAzMiAwIDAxLTQ4LjgyIDBBNjYuNzkgNjYuNzkgMCAwMDAgMTI4aDEyOGE2Ni43OSA2Ni43OSAwIDAwLTM5LjU5LTQzLjMzeiIgZmlsbD0iIzlkYjNjOCIvPgogIDxwYXRoIGQ9Ik02NCA5NmEzMS45MyAzMS45MyAwIDAwMjQuNDEtMTEuMzMgNjYuMTMgNjYuMTMgMCAwMC00OC44MiAwQTMxLjkzIDMxLjkzIDAgMDA2NCA5NnoiIGZpbGw9IiM1NjY4N2EiLz4KPC9zdmc+Cg=='
                                            />
                                            <span className='absolute bottom-0 right-0 inline-flex size-4 items-center justify-center rounded-full bg-[#1052B8] text-white ring-2 ring-white'>
                                                <Icons.linkedinLogo className='size-2.5' />
                                            </span>
                                        </span>
                                        <div className='min-w-0 flex-1'>
                                            <p className='truncate text-sm font-semibold text-gray-900'>
                                                Matteo Giardino
                                            </p>
                                            <p className='truncate text-xs font-normal text-gray-500'>
                                                Re assoluto | Strategy | Product
                                            </p>
                                            <div className='flex items-center gap-1'>
                                                <span className='text-xs font-normal text-gray-500'>Now</span>
                                                <span className='text-xs font-normal text-gray-500'>•</span>
                                                <Icons.linkedInVisibility className='size-4 text-gray-500' />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* <div
                                className='prose relative mt-5'
                                dangerouslySetInnerHTML={{ __html: processedContent }}></div> */}
                            <div className='relative mt-5 whitespace-break-spaces'>{processedContent}</div>
                        </div>
                        <div className='relative'>
                            <div className='overflow-hidden'></div>
                        </div>
                        <div className='py-3 pl-4 pr-6'>
                            <div className='flex items-center justify-between'>
                                <div className='flex items-center justify-start gap-2'>
                                    <Image
                                        alt='post reactions'
                                        loading='lazy'
                                        width='24'
                                        height='24'
                                        decoding='async'
                                        data-nimg='1'
                                        className='h-5 w-auto'
                                        src='/images/post-reactions.svg'
                                    />
                                    <span className='mt-1 text-xs font-medium text-gray-500'>Wezard and 88 others</span>
                                </div>
                                <div className='flex items-center justify-end gap-2'>
                                    <span className='text-xs font-medium text-gray-500'>4 comments</span>
                                    <span className='text-xs font-medium text-gray-500'>•</span>
                                    <span className='text-xs font-medium text-gray-500'>1 repost</span>
                                </div>
                            </div>
                            <hr className='mt-3 border-gray-200' />
                            <div className='mt-2 flex items-center justify-between'>
                                <div className='flex items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100'>
                                    <Icons.linkedInLike className='size-5' />
                                    Like
                                </div>
                                <div className='flex items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100'>
                                    <Icons.linkedInComment className='size-5' />
                                    Comment
                                </div>
                                <div className='flex items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100'>
                                    <Icons.linkedInShare className='size-5' />
                                    Share
                                </div>
                                <div className='flex items-center justify-center gap-1.5 rounded-lg px-1.5 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100'>
                                    <Icons.linkedInSend className='size-5' />
                                    Send
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
