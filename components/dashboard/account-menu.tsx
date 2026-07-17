'use client'

import * as React from 'react'
import Link from 'next/link'
import { useFeaturebase } from 'featurebase-js/react'
import { ChevronsUpDownIcon, CreditCardIcon, Loader2, LogOutIcon, SparklesIcon, UserPlusIcon } from 'lucide-react'

import { Routes } from '@/config/routes'
import { useLinkedInStatus } from '@/hooks/use-linkedin-status'
import { usePlan } from '@/hooks/use-plan'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { useAuth } from '@/components/dashboard/auth-provider'
import { useUpgradePrompt } from '@/components/dashboard/upgrade-provider'

// ---------------------------------------------------------------------------
// Sidebar footer account slot. Reads identity from useAuth (guest / email /
// LinkedIn) and plan from usePlan - the positive Pro/Lifetime indicator lives in
// the plan Badge here (R3). Logout is gated: an identity-less guest cannot log
// out, since signing out resets to a fresh guest and loses their work (R4).
// ---------------------------------------------------------------------------

function initials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'in'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

const PLAN_BADGE: Record<'free' | 'pro' | 'lifetime', { label: string; variant: 'secondary' | 'default' }> = {
    free: { label: 'Free', variant: 'secondary' },
    pro: { label: 'Pro', variant: 'default' },
    lifetime: { label: 'Lifetime', variant: 'default' },
}

export function AccountMenu() {
    const { isMobile } = useSidebar()
    const { supabase, email, pendingEmail, isAnonymous } = useAuth()
    const { plan, isPaid } = usePlan()
    const { openUpgrade } = useUpgradePrompt()
    const { status } = useLinkedInStatus()
    const { shutdown: shutdownMessenger } = useFeaturebase()
    const [loggingOut, setLoggingOut] = React.useState(false)

    const connection = status?.connection ?? null
    const linkedInName = connection?.name ?? null

    // A durable identity survives a logout+reload. Without one, "logging out"
    // just spins up a fresh anonymous session and orphans the current work.
    const hasDurableIdentity = Boolean(email) || Boolean(connection)
    const isGuest = isAnonymous && !hasDurableIdentity

    const primaryLine = email ?? pendingEmail ?? linkedInName ?? 'Guest account'
    const secondaryLine = email
        ? 'Signed in with email'
        : pendingEmail
          ? 'Check your inbox to confirm'
          : linkedInName
            ? `LinkedIn: ${linkedInName}`
            : 'Guest session'

    const badge = PLAN_BADGE[plan]

    const handleLogout = React.useCallback(async () => {
        setLoggingOut(true)
        try {
            shutdownMessenger()
            await supabase.auth.signOut()
        } finally {
            window.location.reload()
        }
    }, [shutdownMessenger, supabase])

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            tooltip={primaryLine}
                            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'>
                            <Avatar className='size-8 rounded-full'>
                                {connection?.pictureUrl ? (
                                    <AvatarImage src={connection.pictureUrl} alt={primaryLine} />
                                ) : null}
                                <AvatarFallback className='rounded-full text-xs'>
                                    {initials(primaryLine)}
                                </AvatarFallback>
                            </Avatar>
                            <div className='grid flex-1 text-left leading-tight'>
                                <span className='truncate text-sm font-medium'>{primaryLine}</span>
                                <span className='text-muted-foreground truncate text-xs'>{secondaryLine}</span>
                            </div>
                            <Badge variant={badge.variant} className='ml-auto'>
                                {badge.label}
                            </Badge>
                            <ChevronsUpDownIcon className='ml-1 size-4 shrink-0' />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='min-w-60 rounded-lg'
                        side={isMobile ? 'bottom' : 'right'}
                        align='end'
                        sideOffset={4}>
                        <DropdownMenuLabel className='p-0 font-normal'>
                            <div className='flex items-center gap-2 px-1.5 py-1.5 text-left'>
                                <Avatar className='size-8 rounded-full'>
                                    {connection?.pictureUrl ? (
                                        <AvatarImage src={connection.pictureUrl} alt={primaryLine} />
                                    ) : null}
                                    <AvatarFallback className='rounded-full text-xs'>
                                        {initials(primaryLine)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='grid flex-1 leading-tight'>
                                    <span className='truncate text-sm font-medium'>{primaryLine}</span>
                                    <span className='text-muted-foreground truncate text-xs'>{secondaryLine}</span>
                                </div>
                                <Badge variant={badge.variant}>{badge.label}</Badge>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {isPaid ? (
                                <DropdownMenuItem asChild>
                                    <Link href={Routes.DashboardSettings}>
                                        <CreditCardIcon />
                                        Manage plan
                                    </Link>
                                </DropdownMenuItem>
                            ) : (
                                <DropdownMenuItem onSelect={() => openUpgrade('account_menu')}>
                                    <SparklesIcon />
                                    Upgrade
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        {isGuest ? (
                            <DropdownMenuItem asChild>
                                <Link href={Routes.DashboardSettings}>
                                    <UserPlusIcon />
                                    Save your account
                                </Link>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                variant='destructive'
                                disabled={loggingOut}
                                onSelect={(event) => {
                                    event.preventDefault()
                                    handleLogout()
                                }}>
                                {loggingOut ? <Loader2 className='animate-spin' /> : <LogOutIcon />}
                                Log out
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
