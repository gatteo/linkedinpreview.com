import type React from 'react'

interface PlaceholderPostProps {
    variant?: 'short' | 'long' | 'with-image'
    initials?: string
    avatarColor?: string
}

const BlurredLine: React.FC<{ width: string; height?: string }> = ({ width, height = 'h-3' }) => (
    <div className={`${height} rounded bg-neutral-200 opacity-60`} style={{ width, filter: 'blur(2px)' }} />
)

export const PlaceholderPost: React.FC<PlaceholderPostProps> = ({
    variant = 'short',
    initials = 'JD',
    avatarColor = '#9db3c8',
}) => {
    return (
        <div className='overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]'>
            {/* Header */}
            <div className='px-4 pt-3 pb-2'>
                <div className='flex items-start gap-2.5'>
                    {/* Avatar */}
                    <div
                        className='flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white opacity-70'
                        style={{ backgroundColor: avatarColor }}>
                        {initials}
                    </div>

                    {/* Name / headline / timestamp */}
                    <div className='flex min-w-0 flex-1 flex-col gap-1.5 pt-0.5'>
                        <BlurredLine width='55%' height='h-3.5' />
                        <BlurredLine width='70%' />
                        <div className='flex items-center gap-1'>
                            <BlurredLine width='32px' />
                            <div className='size-1 rounded-full bg-neutral-300 opacity-60' />
                            <BlurredLine width='20px' />
                        </div>
                    </div>
                </div>

                {/* Body text */}
                <div className='mt-3 flex flex-col gap-2'>
                    <BlurredLine width='100%' height='h-3' />
                    <BlurredLine width='95%' height='h-3' />
                    {(variant === 'long' || variant === 'with-image') && (
                        <>
                            <BlurredLine width='88%' height='h-3' />
                            <BlurredLine width='60%' height='h-3' />
                        </>
                    )}
                    {variant === 'short' && <BlurredLine width='72%' height='h-3' />}
                </div>
            </div>

            {/* Image placeholder */}
            {variant === 'with-image' && <div className='h-40 w-full bg-neutral-100' />}

            {/* Reactions + actions */}
            <div className='px-4 pt-2 pb-2'>
                {/* Reaction counts */}
                <div className='flex items-center justify-between pb-2'>
                    <div className='flex items-center gap-1.5'>
                        <div className='flex -space-x-1 opacity-60'>
                            <div className='size-4 rounded-full bg-blue-400' />
                            <div className='size-4 rounded-full bg-red-400' />
                            <div className='size-4 rounded-full bg-yellow-400' />
                        </div>
                        <BlurredLine width='80px' />
                    </div>
                    <div className='flex items-center gap-2'>
                        <BlurredLine width='60px' />
                        <BlurredLine width='50px' />
                    </div>
                </div>

                <hr className='border-neutral-200' />

                {/* Action buttons */}
                <div className='mt-1 flex items-center justify-around opacity-40'>
                    {['Like', 'Comment', 'Repost', 'Send'].map((action) => (
                        <div key={action} className='flex items-center gap-1.5 rounded-lg px-2 py-2'>
                            <div className='size-4 rounded bg-neutral-300' style={{ filter: 'blur(1px)' }} />
                            <div className='h-3 w-10 rounded bg-neutral-300' style={{ filter: 'blur(2px)' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
