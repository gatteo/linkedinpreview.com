'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

import { Routes } from '@/config/routes'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Icon } from '@/components/icon'

export type PreviewAuthor = {
    name?: string
    headline?: string
    avatarUrl?: string | null
}

type UserInfoProps = {
    author?: PreviewAuthor
    /**
     * When true (the public homepage tool, where there's no way to set a real
     * author inline), hovering the name/avatar reveals a prompt to configure
     * branding in the dashboard.
     */
    promptBranding?: boolean
}

const FALLBACK_NAME = 'Matteo Giardino'
const FALLBACK_HEADLINE = 'Founder @ devv.it'
const FALLBACK_AVATAR =
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjggMTI4Ij4KICA8cGF0aCBmaWxsPSIjZTdlMmRjIiBkPSJNMCAwaDEyOHYxMjhIMHoiLz4KICA8cGF0aCBkPSJNODguNDEgODQuNjdhMzIgMzIgMCAxMC00OC44MiAwIDY2LjEzIDY2LjEzIDAgMDE0OC44MiAweiIgZmlsbD0iIzc4OGZhNSIvPgogIDxwYXRoIGQ9Ik04OC40MSA4NC42N2EzMiAzMiAwIDAxLTQ4LjgyIDBBNjYuNzkgNjYuNzkgMCAwMDAgMTI4aDEyOGE2Ni43OSA2Ni43OSAwIDAwLTM5LjU5LTQzLjMzeiIgZmlsbD0iIzlkYjNjOCIvPgogIDxwYXRoIGQ9Ik02NCA5NmEzMS45MyAzMS45MyAwIDAwMjQuNDEtMTEuMzMgNjYuMTMgNjYuMTMgMCAwMC00OC44MiAwQTMxLjkzIDMxLjkzIDAgMDA2NCA5NnoiIGZpbGw9IiM1NjY4N2EiLz4KPC9zdmc+Cg=='

export const UserInfo: React.FC<UserInfoProps> = ({ author, promptBranding = false }) => {
    const name = author?.name?.trim() || FALLBACK_NAME
    const headline = author?.headline?.trim() || FALLBACK_HEADLINE
    const avatarUrl = author?.avatarUrl?.trim() || FALLBACK_AVATAR

    const body = (
        <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-3'>
                <span className='relative inline-block shrink-0'>
                    <Image
                        alt=''
                        loading='lazy'
                        width={140}
                        height={140}
                        className={cn(
                            'size-12 rounded-full object-cover',
                            promptBranding && 'ring-primary/0 group-hover:ring-primary/30 ring-2 transition-all',
                        )}
                        src={avatarUrl}
                    />
                    <span className='absolute right-0 bottom-0 inline-flex size-4 items-center justify-center rounded-full bg-[#1052B8] text-white ring-2 ring-white'>
                        <Icon name='linkedinLogo' className='size-2.5' />
                    </span>
                </span>
                <div className='min-w-0 flex-1'>
                    <p
                        className={cn(
                            'truncate text-sm font-semibold text-neutral-900',
                            promptBranding &&
                                'underline-offset-2 group-hover:underline group-hover:decoration-neutral-300 group-hover:decoration-dotted',
                        )}>
                        {name}
                    </p>
                    <p className='truncate text-xs font-normal text-neutral-500'>{headline}</p>
                    <div className='flex items-center gap-1'>
                        <span className='text-xs font-normal text-neutral-500'>Now</span>
                        <span className='text-xs font-normal text-neutral-500'>•</span>
                        <Icon name='linkedInVisibility' className='size-3.5 text-neutral-500' />
                    </div>
                </div>
            </div>
        </div>
    )

    if (!promptBranding) {
        return <div className='flex items-center gap-3'>{body}</div>
    }

    return <BrandingPrompt>{body}</BrandingPrompt>
}

/**
 * Wraps the author row in a popover that invites the visitor to set their real
 * name and photo. A popover (not a tooltip) so it works on hover, tap and
 * keyboard focus alike - tooltips never open on touch and a plain row isn't
 * focusable.
 */
function BrandingPrompt({ children }: { children: React.ReactNode }) {
    const reduceMotion = useReducedMotion()
    const [open, setOpen] = React.useState(false)
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const cancelClose = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current)
    }
    const openNow = () => {
        cancelClose()
        setOpen(true)
    }
    // Small delay so the pointer can travel from the trigger into the popover.
    const closeSoon = () => {
        cancelClose()
        closeTimer.current = setTimeout(() => setOpen(false), 120)
    }

    React.useEffect(() => cancelClose, [])

    // Subtle fade + scale + lift on enter, a touch quicker on exit.
    const motionProps = reduceMotion
        ? {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              exit: { opacity: 0, transition: { duration: 0.1 } },
          }
        : {
              initial: { opacity: 0, scale: 0.96, y: 4 },
              animate: { opacity: 1, scale: 1, y: 0 },
              exit: { opacity: 0, scale: 0.97, y: 2, transition: { duration: 0.12, ease: 'easeIn' as const } },
          }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type='button'
                    aria-label='Set your name and photo'
                    onMouseEnter={openNow}
                    onMouseLeave={closeSoon}
                    onFocus={openNow}
                    onBlur={closeSoon}
                    className='group flex w-full cursor-pointer items-center gap-3 rounded-md text-left outline-none'>
                    {children}
                </button>
            </PopoverTrigger>
            <AnimatePresence>
                {open && (
                    <PopoverContent
                        asChild
                        forceMount
                        side='top'
                        align='start'
                        sideOffset={8}
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onMouseEnter={openNow}
                        onMouseLeave={closeSoon}
                        className='w-auto max-w-[230px] p-3'>
                        <motion.div {...motionProps} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
                            <p className='text-xs leading-relaxed text-neutral-600'>
                                That is a sample profile.{' '}
                                <Link
                                    href={Routes.DashboardBranding}
                                    className='text-primary hover:text-primary/80 font-medium underline-offset-2 transition-colors hover:underline'>
                                    Show your own name and photo
                                </Link>
                            </p>
                        </motion.div>
                    </PopoverContent>
                )}
            </AnimatePresence>
        </Popover>
    )
}
