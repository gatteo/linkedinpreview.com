import Link from 'next/link'

import { HeaderLinks } from '@/config/urls'

export function Navbar() {
    return (
        <ul className='hidden items-center gap-1 md:flex'>
            {HeaderLinks.map((link) => (
                <li key={link.text}>
                    <Link
                        className='rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-900'
                        href={link.href}
                        scroll>
                        {link.text}
                    </Link>
                </li>
            ))}
        </ul>
    )
}
