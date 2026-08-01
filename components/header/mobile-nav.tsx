'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, LayoutDashboardIcon, XIcon } from 'lucide-react'
import { Dialog } from 'radix-ui'

import { withEntrySource } from '@/config/entry-sources'
import { Routes } from '@/config/routes'
import { ExternalLinks, HeaderLinks } from '@/config/urls'

import { IconTile } from '../home/_shared'
import { Icon, Icons } from '../icon'
import { TrackClick } from '../tracking/track-click'
import { Button } from '../ui/button'

export function MobileNav() {
    const [open, setOpen] = useState(false)
    const close = () => setOpen(false)

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <Button
                    className='flex size-9 items-center justify-center p-0 md:hidden'
                    type='button'
                    aria-label='Open menu'
                    title='Open menu'
                    variant='ghost'>
                    <Icons.menu size={20} />
                </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Content
                    aria-describedby={undefined}
                    className='bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 flex flex-col duration-200 ease-[var(--ease-out)] md:hidden'>
                    <Dialog.Title className='sr-only'>Navigation menu</Dialog.Title>

                    <div className='flex h-[var(--header-height)] shrink-0 items-center justify-between px-7'>
                        <Link href='/' onClick={close} aria-label='Homepage' className='flex items-center gap-2.5'>
                            <Image src='/images/logo.svg' alt='' width={26} height={26} unoptimized />
                            <span className='font-heading text-[17px] font-semibold tracking-[-0.01em]'>
                                LinkedInPreview
                            </span>
                        </Link>
                        <Dialog.Close asChild>
                            <Button
                                className='flex size-9 items-center justify-center p-0'
                                type='button'
                                aria-label='Close menu'
                                variant='ghost'>
                                <XIcon className='size-5' />
                            </Button>
                        </Dialog.Close>
                    </div>

                    <nav className='min-h-0 flex-1 overflow-y-auto px-7 pt-1 pb-6'>
                        <ul className='border-border divide-border divide-y border-b'>
                            {HeaderLinks.map((link) => (
                                <li key={link.text}>
                                    <Link
                                        href={link.href}
                                        onClick={close}
                                        className='active:bg-secondary/60 -mx-3 flex items-center gap-3.5 rounded-lg px-3 py-3 transition-colors'>
                                        <IconTile size='sm'>
                                            <Icon name={link.icon} />
                                        </IconTile>
                                        <span className='font-heading text-[17px] font-semibold tracking-[-0.01em]'>
                                            {link.text}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    href={withEntrySource(Routes.Dashboard, 'mobile_nav')}
                                    onClick={close}
                                    className='active:bg-secondary/60 -mx-3 flex items-center gap-3.5 rounded-lg px-3 py-3 transition-colors'>
                                    <IconTile icon={LayoutDashboardIcon} size='sm' />
                                    <span className='font-heading text-[17px] font-semibold tracking-[-0.01em]'>
                                        Dashboard
                                    </span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={ExternalLinks.GitHub}
                                    onClick={close}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='active:bg-secondary/60 -mx-3 flex items-center gap-3.5 rounded-lg px-3 py-3 transition-colors'>
                                    <IconTile size='sm'>
                                        <Icons.github />
                                    </IconTile>
                                    <span className='font-heading text-[17px] font-semibold tracking-[-0.01em]'>
                                        GitHub
                                    </span>
                                    <ArrowUpRight className='text-muted-foreground ml-auto size-4' />
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    <div className='border-border flex shrink-0 flex-col gap-2.5 border-t px-7 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]'>
                        <TrackClick
                            event='cta_button_clicked'
                            properties={{ button_name: 'create_plan', source: 'mobile_nav' }}>
                            <Button asChild size='lg' className='h-12 w-full text-[15px]'>
                                <Link href={withEntrySource(Routes.Dashboard, 'mobile_nav_cta')} onClick={close}>
                                    Create my LinkedIn plan
                                </Link>
                            </Button>
                        </TrackClick>
                        <Button asChild variant='outline' size='lg' className='h-12 w-full text-[15px]'>
                            <Link href={Routes.Tool} onClick={close}>
                                Start writing
                            </Link>
                        </Button>
                        <div className='text-muted-foreground mt-1 flex items-center justify-center gap-2 font-mono text-xs tracking-[0.02em]'>
                            <span>Free</span>
                            <span className='opacity-45'>·</span>
                            <span>No signup</span>
                            <span className='opacity-45'>·</span>
                            <span>Open source</span>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
