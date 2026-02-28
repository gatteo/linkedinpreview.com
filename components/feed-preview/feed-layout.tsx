import type React from 'react'

import { LINKEDIN_BG } from './constants'
import { LeftSidebar } from './left-sidebar'
import { PlaceholderPost } from './placeholder-post'
import { RightSidebar } from './right-sidebar'

interface FeedLayoutProps {
    children: React.ReactNode
    mode: 'desktop' | 'mobile'
}

const StartAPostBar: React.FC = () => (
    <div className='overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]'>
        <div className='flex items-center gap-3 px-4 py-3'>
            {/* Avatar placeholder */}
            <div className='size-10 shrink-0 rounded-full bg-[#9db3c8] opacity-60' />

            {/* Input bar placeholder */}
            <div
                className='flex flex-1 items-center rounded-full border border-neutral-300 px-4 py-2.5 opacity-50'
                style={{ filter: 'blur(0.5px)' }}>
                <div className='h-3 w-32 rounded bg-neutral-300' style={{ filter: 'blur(2px)' }} />
            </div>
        </div>

        {/* Bottom icon row */}
        <div className='flex items-center gap-1 border-t border-neutral-100 px-4 py-2'>
            {[70, 65, 80, 75].map((w, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} className='flex items-center gap-1.5 rounded px-2 py-1 opacity-40'>
                    <div className='size-4 rounded bg-neutral-400' style={{ filter: 'blur(1px)' }} />
                    <div
                        className='h-3 rounded bg-neutral-400'
                        style={{ width: `${w * 0.6}px`, filter: 'blur(2px)' }}
                    />
                </div>
            ))}
        </div>
    </div>
)

export const FeedLayout: React.FC<FeedLayoutProps> = ({ children, mode }) => {
    if (mode === 'mobile') {
        return (
            <div className='min-h-full w-full' style={{ backgroundColor: LINKEDIN_BG }}>
                <div className='mx-auto flex max-w-[480px] flex-col gap-2 px-0 py-4'>
                    <StartAPostBar />
                    <PlaceholderPost variant='short' initials='AK' avatarColor='#788fa5' />
                    {children}
                    <PlaceholderPost variant='long' initials='RS' avatarColor='#566879' />
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-full w-full' style={{ backgroundColor: LINKEDIN_BG }}>
            <div className='mx-auto flex max-w-[1128px] items-start gap-4 px-4 py-4'>
                {/* Left sidebar */}
                <div className='sticky top-[124px]'>
                    <LeftSidebar />
                </div>

                {/* Center feed */}
                <div className='flex min-w-0 flex-1 flex-col gap-2'>
                    <StartAPostBar />
                    <PlaceholderPost variant='with-image' initials='AK' avatarColor='#788fa5' />
                    {children}
                    <PlaceholderPost variant='long' initials='RS' avatarColor='#566879' />
                    <PlaceholderPost variant='short' initials='ML' avatarColor='#9db3c8' />
                </div>

                {/* Right sidebar */}
                <div className='sticky top-[124px]'>
                    <RightSidebar />
                </div>
            </div>
        </div>
    )
}
