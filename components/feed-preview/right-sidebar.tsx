import type React from 'react'

const BlurredLine: React.FC<{ width: string; height?: string }> = ({ width, height = 'h-3' }) => (
    <div className={`${height} rounded bg-neutral-300 opacity-60`} style={{ width, filter: 'blur(0.5px)' }} />
)

const followItems = [
    { initials: 'TK', color: '#788fa5' },
    { initials: 'ML', color: '#9db3c8' },
    { initials: 'RS', color: '#566879' },
]

export const RightSidebar: React.FC = () => {
    return (
        <div className='w-[300px] shrink-0 overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]'>
            {/* Heading */}
            <div className='px-3 pt-3 pb-2'>
                <BlurredLine width='65%' height='h-3.5' />
            </div>

            {/* Follow recommendations */}
            {followItems.map((item, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i}>
                    <div className='flex items-center gap-2.5 px-3 py-2.5'>
                        {/* Avatar */}
                        <div
                            className='flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white opacity-70'
                            style={{ backgroundColor: item.color }}>
                            {item.initials}
                        </div>

                        {/* Name + category */}
                        <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
                            <BlurredLine width='70%' height='h-3' />
                            <BlurredLine width='55%' height='h-2.5' />
                        </div>

                        {/* Follow button placeholder */}
                        <div
                            className='flex items-center gap-1 rounded-full border border-neutral-400 px-3 py-1 opacity-50'
                            style={{ filter: 'blur(0.5px)' }}>
                            <div className='h-3 w-8 rounded bg-neutral-400' style={{ filter: 'blur(0.5px)' }} />
                        </div>
                    </div>
                    {i < followItems.length - 1 && <hr className='mx-3 border-neutral-100' />}
                </div>
            ))}

            <hr className='mt-1 border-neutral-100' />

            {/* Footer links */}
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-3'>
                {[50, 55, 45, 60, 40].map((w, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <BlurredLine key={i} width={`${w}px`} height='h-2.5' />
                ))}
            </div>
        </div>
    )
}
