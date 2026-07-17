import Link from 'next/link'

const NAV_LINKS = [
    { text: 'Features', href: '/#all-features' },
    { text: 'How it works', href: '/#how-it-works' },
    { text: 'Open source', href: '/#opensource' },
    { text: 'FAQ', href: '/#faqs' },
]

export function Navbar() {
    return (
        <ul className='hidden items-center gap-6 md:flex'>
            {NAV_LINKS.map((link) => (
                <li key={link.text}>
                    <Link
                        className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-150'
                        href={link.href}
                        scroll>
                        {link.text}
                    </Link>
                </li>
            ))}
        </ul>
    )
}
