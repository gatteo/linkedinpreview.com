import type React from 'react'
import { CircleHelp } from 'lucide-react'

import { feedbackConfig } from '@/config/feedback'
import { cn } from '@/lib/utils'

import type { Media } from '../tool'
import { ActionButtons } from './action-buttons'
import { ContentSection } from './content-section'
import { PreviewHeader } from './preview-header'
import { ScreenSizeProvider, useScreenSize } from './preview-size-context'
import { Reactions } from './reactions'
import { UserInfo } from './user-info'

interface PreviewPanelProps {
    content: any
    media: Media | null
}

const PreviewPanelContent: React.FC<PreviewPanelProps> = ({ content, media }) => {
    const { screenSize } = useScreenSize()

    const containerWidth = {
        mobile: 'w-[320px]',
        tablet: 'w-[480px]',
        desktop: 'w-[555px]',
    }

    return (
        <div className='flex h-full flex-col'>
            <PreviewHeader />
            <div className='flex flex-1 flex-col items-center gap-5 overflow-y-auto bg-neutral-50 py-5'>
                <div className={cn('mx-auto transition-all duration-300', containerWidth[screenSize])}>
                    <div className='font-system overflow-hidden rounded-lg bg-white shadow ring-1 ring-inset ring-neutral-200'>
                        <div className='py-5 pl-4 pr-6'>
                            <UserInfo />
                            <ContentSection content={content} />
                        </div>
                        {media && (
                            <div className='relative w-full'>
                                {media.type === 'video' ? (
                                    <video
                                        src={media.src}
                                        controls
                                        playsInline
                                        loop
                                        className='w-full'
                                        style={{ maxHeight: '600px' }}
                                    />
                                ) : (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={media.src}
                                        alt='Post'
                                        className='w-full object-cover'
                                        style={{ maxHeight: '600px', objectFit: 'contain' }}
                                    />
                                )}
                            </div>
                        )}
                        <div className='py-3 pl-4 pr-6'>
                            <Reactions />
                            <hr className='mt-3 border-neutral-200' />
                            <ActionButtons />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() =>
                        window.Tally?.openPopup(feedbackConfig.formId, {
                            hiddenFields: { source: 'preview-panel', pageUrl: window.location.href },
                        })
                    }
                    className='flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600'>
                    <CircleHelp className='size-3.5' />
                    <span>Bug or feature request? Let us know</span>
                </button>
            </div>
        </div>
    )
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ content, media }) => {
    return (
        <ScreenSizeProvider>
            <PreviewPanelContent content={content} media={media} />
        </ScreenSizeProvider>
    )
}
