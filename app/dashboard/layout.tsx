import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AuthGate } from '@/components/dashboard/auth-gate'
import { AuthProvider } from '@/components/dashboard/auth-provider'
import { DashboardDebugMenu } from '@/components/dashboard/dashboard-debug-menu'
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar'
import { OnboardingController } from '@/components/dashboard/onboarding/onboarding-controller'
import { PlanProvider } from '@/components/dashboard/plan-provider'
import { UpgradeProvider } from '@/components/dashboard/upgrade-provider'
import { TallyScript } from '@/components/feedback/tally-script'

export const metadata: Metadata = {
    title: 'Dashboard - LinkedInPreview.com',
    description: 'Create, preview, and manage your LinkedIn posts.',
    robots: { index: false, follow: false },
}

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
                <AuthProvider>
                    <AuthGate>
                        <PlanProvider>
                            <UpgradeProvider>
                                <div
                                    className='mx-auto h-svh w-full max-w-[1500px]'
                                    style={{ transform: 'translateZ(0)' }}>
                                    <SidebarProvider
                                        className='h-full !min-h-0'
                                        style={
                                            {
                                                '--sidebar-width': '280px',
                                                '--header-height': 'calc(var(--spacing) * 12)',
                                            } as React.CSSProperties
                                        }>
                                        <Suspense fallback={<div className='w-[--sidebar-width] shrink-0' />}>
                                            <DashboardSidebar variant='inset' />
                                        </Suspense>
                                        <SidebarInset className='overflow-hidden border'>
                                            <div className='flex flex-1 flex-col overflow-hidden'>{children}</div>
                                        </SidebarInset>
                                    </SidebarProvider>
                                </div>
                                <OnboardingController />
                                {process.env.NODE_ENV === 'development' && <DashboardDebugMenu />}
                            </UpgradeProvider>
                        </PlanProvider>
                    </AuthGate>
                </AuthProvider>
            </ThemeProvider>
            <Toaster />
            <TallyScript />
        </>
    )
}
