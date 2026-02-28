import type React from 'react'
import { IconBrandLinkedin } from '@tabler/icons-react'

const NavIcon: React.FC<{ width?: string }> = ({ width = '24px' }) => (
    <div className='flex flex-col items-center gap-0.5 opacity-40'>
        <div className='size-5 rounded bg-neutral-400' style={{ filter: 'blur(1px)' }} />
        <div className='h-2 rounded bg-neutral-400' style={{ width, filter: 'blur(2px)' }} />
    </div>
)

export const LinkedInHeader: React.FC = () => (
    <div className='sticky top-14 z-[5] border-b border-neutral-200 bg-white'>
        <div className='mx-auto flex h-[52px] max-w-[1128px] items-center justify-between px-4'>
            {/* Left: logo + search */}
            <div className='flex items-center gap-2'>
                <IconBrandLinkedin className='size-8 text-[#0a66c2]' />
                <div
                    className='hidden items-center rounded bg-[#edf3f8] px-3 py-1.5 sm:flex'
                    style={{ filter: 'blur(0.5px)' }}>
                    <div className='h-3 w-40 rounded bg-neutral-300' style={{ filter: 'blur(2px)' }} />
                </div>
            </div>

            {/* Right: nav icons */}
            <div className='flex items-center gap-5 sm:gap-6'>
                <NavIcon width='22px' />
                <NavIcon width='28px' />
                <NavIcon width='18px' />
                <NavIcon width='32px' />
                <NavIcon width='38px' />
                <div className='flex flex-col items-center gap-0.5 opacity-40'>
                    <div className='size-5 rounded-full bg-neutral-400' style={{ filter: 'blur(1px)' }} />
                    <div className='h-2 w-6 rounded bg-neutral-400' style={{ filter: 'blur(2px)' }} />
                </div>
            </div>
        </div>
    </div>
)
