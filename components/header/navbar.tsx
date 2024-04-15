import Link from 'next/link'

import { HeaderLinks } from '@/config/urls'

export function Navbar() {
    return (
        <ul className='hidden space-x-2 md:flex'>
            {HeaderLinks.map((link) => (
                <li key={link.text}>
                    <Link
                        className='rounded px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-accent-foreground'
                        href={link.href}
                        scroll>
                        {link.text}
                    </Link>
                </li>
            ))}
        </ul>
    )
}
