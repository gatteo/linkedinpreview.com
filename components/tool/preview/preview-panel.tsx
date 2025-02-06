import type React from 'react'

import { cn } from '@/lib/utils'

import { ActionButtons } from './action-buttons'
import { ContentSection } from './content-section'
import { PreviewHeader } from './preview-header'
import { ScreenSizeProvider, useScreenSize } from './preview-size-context'
import { Reactions } from './reactions'
import { UserInfo } from './user-info'

interface PreviewPanelProps {
    content: string
}

const PreviewPanelContent: React.FC<PreviewPanelProps> = ({ content }) => {
    const { screenSize } = useScreenSize()

    const containerWidth = {
        mobile: 'w-[320px]',
        tablet: 'w-[480px]',
        desktop: 'w-[555px]',
    }

    return (
        <div className='flex h-full flex-col'>
            <PreviewHeader />
            <div className='flex flex-1 flex-col items-center gap-5 overflow-y-auto bg-gray-50 py-5'>
                <div className={cn('mx-auto transition-all duration-300', containerWidth[screenSize])}>
                    <div className='font-system overflow-hidden rounded-lg bg-white shadow ring-1 ring-inset ring-gray-200'>
                        <div className='py-5 pl-4 pr-6'>
                            <UserInfo />
                            <ContentSection content={content} />
                        </div>
                        <div className='relative'>
                            <div className='overflow-hidden'></div>
                        </div>
                        <div className='py-3 pl-4 pr-6'>
                            <Reactions />
                            <hr className='mt-3 border-gray-200' />
                            <ActionButtons />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ content }) => {
    return (
        <ScreenSizeProvider>
            <PreviewPanelContent content={content} />
        </ScreenSizeProvider>
    )
}
