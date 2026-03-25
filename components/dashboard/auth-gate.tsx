'use client'

import { Loader2Icon } from 'lucide-react'

import { useAuth } from '@/components/dashboard/auth-provider'

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { isReady } = useAuth()

    if (!isReady) {
        return (
            <div className='flex min-h-svh items-center justify-center'>
                <Loader2Icon className='text-muted-foreground size-6 animate-spin' />
            </div>
        )
    }

    return <>{children}</>
}
