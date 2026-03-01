import type React from 'react'
import { Bell, Briefcase, Home, MessageSquare, Search, Users } from 'lucide-react'

import { Icons } from '@/components/icon'

interface NavItemProps {
    icon: React.ReactNode
    label: string
}

const NavItem: React.FC<NavItemProps> = ({ icon, label }) => (
    <div className='flex flex-col items-center gap-0.5 opacity-60'>
        <div className='size-5'>{icon}</div>
        <span className='hidden text-[10px] text-neutral-500 sm:block'>{label}</span>
    </div>
)

export const LinkedInHeader: React.FC = () => (
    <div className='sticky top-14 z-[5] border-b border-neutral-200 bg-white'>
        <div className='mx-auto flex h-[52px] max-w-[1128px] items-center justify-between px-4'>
            {/* Left: logo + search */}
            <div className='flex items-center gap-2'>
                <Icons.linkedinLogo aria-hidden='true' className='size-8 rounded-xs bg-[#0a66c2] text-white' />
                <div className='hidden min-w-[200px] items-center gap-2 rounded bg-[#edf3f8] px-3 py-2 sm:flex'>
                    <Search className='size-3.5 shrink-0 text-neutral-500' />
                    <span className='text-xs text-neutral-400'>Search</span>
                </div>
            </div>

            {/* Right: nav items */}
            <div className='flex items-center gap-3 sm:gap-5 md:gap-6'>
                <NavItem icon={<Home className='size-5' />} label='Home' />
                <NavItem icon={<Users className='size-5' />} label='My Network' />
                <NavItem icon={<Briefcase className='size-5' />} label='Jobs' />
                <NavItem icon={<MessageSquare className='size-5' />} label='Messaging' />
                <NavItem icon={<Bell className='size-5' />} label='Notifications' />
                <div className='flex flex-col items-center gap-0.5 opacity-60'>
                    <div className='size-5 rounded-full bg-neutral-300' />
                    <span className='hidden text-[10px] text-neutral-500 sm:block'>Me</span>
                </div>
            </div>
        </div>
    </div>
)
