'use client'

import * as React from 'react'
import { Loader2, MonitorIcon, MoonIcon, SunIcon, Trash2Icon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/dashboard/auth-provider'

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: MonitorIcon },
] as const

export function SettingsForm() {
    const { supabase } = useAuth()
    const { theme, setTheme } = useTheme()
    const [isResetting, setIsResetting] = React.useState(false)

    const handleReset = React.useCallback(async () => {
        setIsResetting(true)
        try {
            const { error: draftsError } = await supabase.from('drafts').delete().neq('id', '')
            if (draftsError) throw draftsError

            const { error: brandingError } = await supabase.from('branding').delete().neq('user_id', '')
            if (brandingError) throw brandingError

            const { error: analysesError } = await supabase.from('post_analyses').delete().neq('id', '')
            if (analysesError) throw analysesError

            toast.success('All data has been deleted')
            window.location.reload()
        } catch {
            toast.error('Failed to reset data')
        } finally {
            setIsResetting(false)
        }
    }, [supabase])

    return (
        <div className='max-w-2xl space-y-6 p-4 lg:p-6'>
            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Choose how the dashboard looks.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex gap-2'>
                        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                            <Button
                                key={value}
                                variant={theme === value ? 'default' : 'outline'}
                                size='sm'
                                onClick={() => setTheme(value)}
                                className='flex items-center gap-2'>
                                <Icon className='size-4' />
                                {label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Reset */}
            <Card className='border-destructive/50'>
                <CardHeader>
                    <CardTitle className='text-destructive'>Danger Zone</CardTitle>
                    <CardDescription>Permanently delete all your posts, branding data, and settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant='destructive' disabled={isResetting}>
                                {isResetting ? (
                                    <Loader2 className='mr-2 size-4 animate-spin' />
                                ) : (
                                    <Trash2Icon className='mr-2 size-4' />
                                )}
                                Reset All Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all your drafts, branding, and settings. This action
                                    cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleReset}
                                    className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                                    Delete Everything
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    )
}
