'use client'

import Link from 'next/link'
import { CheckCircle2Icon, Linkedin, TriangleAlertIcon } from 'lucide-react'

import { ApiRoutes, Routes } from '@/config/routes'
import { cn } from '@/lib/utils'
import { useLinkedInStatus } from '@/hooks/use-linkedin-status'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'

// ---------------------------------------------------------------------------
// Sidebar footer: a LinkedIn profile indicator when connected, or a
// conversion-focused CTA to connect when not. Hidden entirely when LinkedIn
// is not configured on the server (no point tempting a broken flow).
// ---------------------------------------------------------------------------

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'in'
    return (parts[0][0] + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

export function SidebarProfile() {
    const { status, isLoading } = useLinkedInStatus()

    // Avoid a flash/layout shift before the status resolves, and stay quiet
    // when the integration is not configured.
    if (isLoading || !status?.configured) return null

    const connection = status.connection
    return connection ? (
        <ConnectedProfile
            name={connection.name ?? 'LinkedIn account'}
            pictureUrl={connection.pictureUrl}
            expired={connection.expired}
            expiresSoon={connection.expiresSoon}
        />
    ) : (
        <ConnectCta />
    )
}

function ConnectedProfile({
    name,
    pictureUrl,
    expired,
    expiresSoon,
}: {
    name: string
    pictureUrl: string | null
    expired: boolean
    expiresSoon: boolean
}) {
    const statusLine = expired ? (
        <span className='text-destructive flex items-center gap-1'>
            <TriangleAlertIcon className='size-3 shrink-0' />
            Reconnect to keep publishing
        </span>
    ) : expiresSoon ? (
        <span className='flex items-center gap-1 text-amber-600 dark:text-amber-500'>
            <TriangleAlertIcon className='size-3 shrink-0' />
            Connection expires soon
        </span>
    ) : (
        <span className='text-muted-foreground flex items-center gap-1'>
            <CheckCircle2Icon className='size-3 shrink-0 text-green-600' />
            LinkedIn connected
        </span>
    )

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild size='lg' tooltip={name}>
                    <Link href={Routes.DashboardSettings}>
                        <Avatar className='size-8 rounded-full'>
                            {pictureUrl ? <AvatarImage src={pictureUrl} alt={name} /> : null}
                            <AvatarFallback className='bg-[#0a66c2]/10 text-xs text-[#0a66c2]'>
                                {initials(name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className='grid flex-1 text-left leading-tight'>
                            <span className='truncate text-sm font-medium'>{name}</span>
                            <span className='truncate text-xs'>{statusLine}</span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

function ConnectCta() {
    return (
        <>
            {/* Expanded sidebar: full benefit-led CTA card. */}
            <div
                className={cn(
                    'mx-2 mb-1 rounded-lg border bg-gradient-to-b from-[#0a66c2]/5 to-transparent p-3',
                    'group-data-[collapsible=icon]:hidden',
                )}>
                <div className='flex items-center gap-2'>
                    <div className='flex size-7 shrink-0 items-center justify-center rounded-md bg-[#0a66c2]/10'>
                        <Linkedin className='size-4 text-[#0a66c2]' />
                    </div>
                    <p className='text-sm leading-tight font-medium'>Publish to LinkedIn</p>
                </div>
                <p className='text-muted-foreground mt-1.5 text-xs leading-snug'>
                    Connect your account to publish and schedule posts without ever leaving the editor.
                </p>
                <Button asChild size='sm' className='mt-2.5 w-full bg-[#0a66c2] text-white hover:bg-[#004182]'>
                    <a href={ApiRoutes.LinkedInAuth}>
                        <Linkedin className='size-4' />
                        Connect LinkedIn
                    </a>
                </Button>
            </div>

            {/* Collapsed (icon) sidebar: compact icon button with tooltip. */}
            <SidebarMenu className='hidden group-data-[collapsible=icon]:flex'>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip='Connect LinkedIn' className='text-[#0a66c2]'>
                        <a href={ApiRoutes.LinkedInAuth}>
                            <Linkedin />
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    )
}
