import type React from 'react'

const BlurredLine: React.FC<{ width: string; height?: string }> = ({ width, height = 'h-3' }) => (
    <div className={`${height} rounded bg-neutral-300 opacity-60`} style={{ width, filter: 'blur(2px)' }} />
)

export const LeftSidebar: React.FC = () => {
    return (
        <div className='w-[225px] shrink-0 overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]'>
            {/* Banner */}
            <div
                className='h-14 w-full'
                style={{
                    background: 'linear-gradient(135deg, #9db3c8 0%, #788fa5 50%, #566879 100%)',
                    filter: 'blur(0.5px)',
                    opacity: 0.7,
                }}
            />

            {/* Avatar */}
            <div className='-mt-6 px-3'>
                <div
                    className='size-12 rounded-full border-2 border-white bg-[#9db3c8] opacity-70'
                    style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}
                />
            </div>

            {/* Name + headline */}
            <div className='mt-2 flex flex-col gap-1.5 px-3 pb-3'>
                <BlurredLine width='70%' height='h-3.5' />
                <BlurredLine width='85%' height='h-3' />
                <BlurredLine width='60%' height='h-3' />
            </div>

            <hr className='border-neutral-100' />

            {/* Stats */}
            <div className='flex flex-col gap-2 px-3 py-3'>
                {[
                    { label: '72px', value: '40px' },
                    { label: '80px', value: '40px' },
                ].map((item, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <div key={i} className='flex items-center justify-between'>
                        <BlurredLine width={item.label} />
                        <BlurredLine width={item.value} height='h-3.5' />
                    </div>
                ))}
            </div>

            <hr className='border-neutral-100' />

            {/* Premium CTA */}
            <div className='flex flex-col gap-1.5 px-3 py-3'>
                <div className='flex items-center gap-1.5'>
                    <div className='size-3 rounded-full bg-yellow-400 opacity-70' />
                    <BlurredLine width='75%' height='h-3' />
                </div>
                <BlurredLine width='90%' height='h-3' />
            </div>
        </div>
    )
}
