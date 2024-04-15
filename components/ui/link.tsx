import * as React from 'react'
import NextLink from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

export const linkVariants = cva('', {
    variants: {
        variant: {
            article: 'bg-article-link dark:bg-article-link-dark no-underline',
            muted: 'text-muted-foreground transition-colors hover:text-foreground',
        },
    },
})

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof linkVariants>

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
    const { href, className, children, variant, ...rest } = props

    if ((href as string).startsWith('/')) {
        return (
            <NextLink className={cn(linkVariants({ variant, className }))} href={href as string} ref={ref} {...rest}>
                {children}
            </NextLink>
        )
    }

    if ((href as string).startsWith('#')) {
        return (
            <a className={cn(linkVariants({ variant, className }))} href={href} ref={ref} {...rest}>
                {children}
            </a>
        )
    }

    return (
        <a
            className={cn(linkVariants({ variant, className }))}
            target='_blank'
            rel='noopener noreferrer'
            href={href}
            ref={ref}
            {...rest}>
            {children}
        </a>
    )
})

Link.displayName = 'Link'
