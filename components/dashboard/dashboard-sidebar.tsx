'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
    BarChart3Icon,
    CalendarIcon,
    CircleHelpIcon,
    CompassIcon,
    FileTextIcon,
    LayoutGridIcon,
    PaletteIcon,
    PlusIcon,
    SettingsIcon,
    SparklesIcon,
    TargetIcon,
} from 'lucide-react'

import { feedbackConfig } from '@/config/feedback'
import { useDrafts } from '@/hooks/use-drafts'
import { usePlan } from '@/hooks/use-plan'
import { Button } from '@/components/ui/button'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from '@/components/ui/sidebar'
import { CreationWizard } from '@/components/dashboard/creation-wizard/creation-wizard'
import { GettingStartedChecklist } from '@/components/dashboard/getting-started-checklist'
import { SidebarProfile } from '@/components/dashboard/sidebar-profile'
import { useUpgradePrompt } from '@/components/dashboard/upgrade-provider'

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentDraftId = searchParams.get('draft')
    const { recentDrafts } = useDrafts()
    const { isPaid } = usePlan()
    const { openUpgrade } = useUpgradePrompt()
    const [newPostOpen, setNewPostOpen] = React.useState(false)

    const isActive = (path: string) => pathname === path

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className='data-[slot=sidebar-menu-button]:p-1.5!'>
                            <Link href='/'>
                                <Image
                                    src='/images/logo-rounded-rectangle.png'
                                    alt='LinkedInPreview'
                                    width={20}
                                    height={20}
                                    className='size-5 rounded'
                                />
                                <span className='text-base font-semibold'>LinkedInPreview</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Posts */}
                <SidebarGroup>
                    <div className='flex items-center justify-between px-2'>
                        <SidebarGroupLabel className='text-muted-foreground p-0'>Posts</SidebarGroupLabel>
                        <Button
                            variant='outline'
                            size='sm'
                            className='h-6 px-2 text-xs'
                            onClick={() => setNewPostOpen(true)}>
                            <PlusIcon className='size-3' />
                            New
                        </Button>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {recentDrafts.length === 0 ? (
                                <SidebarMenuItem>
                                    <p className='text-muted-foreground px-2 py-1 text-xs'>No drafts yet</p>
                                </SidebarMenuItem>
                            ) : (
                                recentDrafts.map((draft) => (
                                    <SidebarMenuItem key={draft.id}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={currentDraftId === draft.id}
                                            tooltip={draft.title || 'Untitled'}>
                                            <Link href={`/dashboard/editor?draft=${draft.id}`}>
                                                <FileTextIcon />
                                                <span>{draft.title || 'Untitled'}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={isActive('/dashboard')} tooltip='All Posts'>
                                    <Link href='/dashboard'>
                                        <span className='text-muted-foreground text-xs'>View all posts</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                {/* Tools */}
                <SidebarGroup>
                    <SidebarGroupLabel className='text-muted-foreground'>Tools</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname.startsWith('/dashboard/carousel')}
                                    tooltip='Carousel'>
                                    <Link href='/dashboard/carousel'>
                                        <LayoutGridIcon />
                                        <span>Carousel</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive('/dashboard/calendar')}
                                    tooltip='Calendar'>
                                    <Link href='/dashboard/calendar'>
                                        <CalendarIcon />
                                        <span>Calendar</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive('/dashboard/analytics')}
                                    tooltip='Analytics'>
                                    <Link href='/dashboard/analytics'>
                                        <BarChart3Icon />
                                        <span>Analytics</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton disabled tooltip='Inspiration'>
                                    <CompassIcon />
                                    <span>Inspiration</span>
                                </SidebarMenuButton>
                                <SidebarMenuBadge className='text-[10px] opacity-60'>Soon</SidebarMenuBadge>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator />

                {/* Personalization */}
                <SidebarGroup>
                    <SidebarGroupLabel className='text-muted-foreground'>Personalization</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive('/dashboard/branding')}
                                    tooltip='Branding'>
                                    <Link href='/dashboard/branding'>
                                        <PaletteIcon />
                                        <span>Branding</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive('/dashboard/strategy')}
                                    tooltip='Content Strategy'>
                                    <Link href='/dashboard/strategy'>
                                        <TargetIcon />
                                        <span>Content Strategy</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Getting started */}
                <div className='mt-auto px-2 pb-2'>
                    <GettingStartedChecklist />
                </div>

                {/* Bottom nav */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {!isPaid && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        tooltip='Upgrade'
                                        onClick={() => openUpgrade('sidebar')}
                                        className='text-primary hover:text-primary'>
                                        <SparklesIcon />
                                        <span>Upgrade</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive('/dashboard/settings')}
                                    tooltip='Settings'>
                                    <Link href='/dashboard/settings'>
                                        <SettingsIcon />
                                        <span>Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    tooltip='Help & Feedback'
                                    data-tally-open={feedbackConfig.formId}
                                    data-tally-emoji-text='👋'
                                    data-tally-emoji-animation='wave'>
                                    <CircleHelpIcon />
                                    <span>Help & Feedback</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarProfile />
            </SidebarFooter>
            <SidebarRail />

            <CreationWizard open={newPostOpen} onOpenChange={setNewPostOpen} />
        </Sidebar>
    )
}
