import Link from 'next/link'
import { LayoutDashboardIcon } from 'lucide-react'

import { Routes } from '@/config/routes'
import { HeaderLinks } from '@/config/urls'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Icon, Icons } from '../icon'
import { Button } from '../ui/button'

export function MobileNav() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    className='flex size-9 items-center justify-center p-0 md:hidden'
                    type='button'
                    aria-label='Toggle menu'
                    title='Toggle menu'
                    variant='ghost'>
                    <Icons.menu size={20} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                {HeaderLinks.map((link) => (
                    <DropdownMenuItem key={link.text} asChild>
                        <Link href={link.href} className='flex items-center gap-3'>
                            <Icon name={link.icon} className='size-4' />
                            <div>{link.text}</div>
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={Routes.Dashboard} className='text-primary flex items-center gap-3 font-medium'>
                        <LayoutDashboardIcon className='size-4' />
                        <div>Open Dashboard</div>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
