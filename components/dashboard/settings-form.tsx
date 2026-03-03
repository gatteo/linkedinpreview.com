'use client'

import * as React from 'react'
import { DownloadIcon, MonitorIcon, MoonIcon, SunIcon, Trash2Icon, UploadIcon } from 'lucide-react'
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

const THEME_OPTIONS = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: MonitorIcon },
] as const

export function SettingsForm() {
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const { theme, setTheme } = useTheme()

    const handleExport = () => {
        toast.info('Export will be available once data sync is enabled')
    }

    const handleImport = (_e: React.ChangeEvent<HTMLInputElement>) => {
        toast.info('Import will be available once data sync is enabled')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleReset = () => {
        toast.info('Reset will be available once data sync is enabled')
    }

    return (
        <div className='max-w-2xl space-y-6 p-4 lg:p-6'>
            <p className='text-muted-foreground text-sm'>Manage your preferences and account data.</p>

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

            {/* Export */}
            <Card>
                <CardHeader>
                    <CardTitle>Export Data</CardTitle>
                    <CardDescription>Download all your posts, branding, and settings as a JSON file.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant='outline' onClick={handleExport}>
                        <DownloadIcon className='mr-2 size-4' />
                        Export Backup
                    </Button>
                </CardContent>
            </Card>

            {/* Import */}
            <Card>
                <CardHeader>
                    <CardTitle>Import Data</CardTitle>
                    <CardDescription>
                        Restore from a previously exported backup file. This will replace all current data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <input ref={fileInputRef} type='file' accept='.json' className='hidden' onChange={handleImport} />
                    <Button variant='outline' onClick={() => fileInputRef.current?.click()}>
                        <UploadIcon className='mr-2 size-4' />
                        Import Backup
                    </Button>
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
                            <Button variant='destructive'>
                                <Trash2Icon className='mr-2 size-4' />
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
