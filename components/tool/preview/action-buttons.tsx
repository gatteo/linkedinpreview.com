import type React from 'react'

import { cn } from '@/lib/utils'
import { Icon, type Icons } from '@/components/icon'

import { useScreenSize } from './preview-size-context'

export const ActionButtons: React.FC = () => {
    const { screenSize } = useScreenSize()

    return (
        <div className={cn('mt-2 flex items-center', screenSize === 'mobile' ? 'justify-between' : 'justify-around')}>
            {['Like', 'Comment', 'Share', 'Send'].map((action) => (
                <div
                    key={action}
                    className={cn(
                        'flex items-center justify-center rounded-lg px-1.5 py-2 font-semibold text-gray-500 hover:bg-gray-100',
                        screenSize === 'mobile' ? 'flex-col text-[10px]' : 'flex-row gap-1.5 text-sm',
                    )}>
                    <Icon
                        name={`linkedIn${action}` as keyof typeof Icons}
                        className={cn(screenSize === 'mobile' ? 'size-5 mb-1' : 'size-5')}
                    />
                    <span className={cn(screenSize === 'mobile' ? 'mt-1' : '')}>{action}</span>
                </div>
            ))}
        </div>
    )
}
