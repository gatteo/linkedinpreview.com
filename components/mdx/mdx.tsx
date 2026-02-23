'use client'

import React from 'react'
import * as runtime from 'react/jsx-runtime'
import Image from 'next/image'
import { type MDXComponents } from 'mdx/types'
import ReactDOM from 'react-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { CtaCard } from '../cta-card'
import { Link } from '../ui/link'
import { Heading } from './heading'
import { ImageZoom } from './image-zoom'
import { ItemGrid } from './item-grid'
import { LinkCard } from './link-card'
import { Pre } from './pre'
import { Table } from './table'
import { Tree } from './tree'
import { Video } from './video'

type MdxProps = {
    code: string
}

const components: MDXComponents = {
    h2: (props: React.ComponentPropsWithoutRef<'h2'>) => <Heading as='h2' {...props} />,
    h3: (props: React.ComponentPropsWithoutRef<'h3'>) => <Heading as='h3' {...props} />,
    h4: (props: React.ComponentPropsWithoutRef<'h4'>) => <Heading as='h4' {...props} />,
    h5: (props: React.ComponentPropsWithoutRef<'h5'>) => <Heading as='h5' {...props} />,
    h6: (props: React.ComponentPropsWithoutRef<'h6'>) => <Heading as='h6' {...props} />,
    a: ({ children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <Link variant='article' {...rest}>
            {children}
        </Link>
    ),
    Image: ({ alt, ...rest }: React.ComponentPropsWithoutRef<typeof Image>) => (
        <>
            <ImageZoom>
                <Image
                    className='rounded-md border shadow-md transition-transform hover:scale-[102%]'
                    alt={alt}
                    {...rest}
                />
            </ImageZoom>
            <figcaption className='text-center'>{alt}</figcaption>
        </>
    ),
    pre: Pre,

    // Custom components
    Alert: (props: React.ComponentPropsWithoutRef<typeof Alert>) => <Alert {...props} />,
    AlertTitle: (props: React.ComponentPropsWithoutRef<typeof AlertTitle>) => <AlertTitle {...props} />,
    AlertDescription: (props: React.ComponentPropsWithoutRef<typeof AlertDescription>) => (
        <AlertDescription {...props} />
    ),
    Table,
    ItemGrid,
    Tree,
    Video,
    LinkCard,
    CtaCard,
}

// Contentlayer compiles MDX with the dev JSX transform (jsxDEV).
// React 19's production runtime doesn't expose getOwner on the dispatcher,
// which jsxDEV tries to call, breaking the build.
// This shim maps jsxDEV → jsx/jsxs so the compiled code works in production.
const patchedRuntime = {
    ...runtime,
    jsxDEV: (runtime as any).jsx,
}

// Some contentlayer-compiled MDX bundles inline a copy of the React dev JSX
// runtime that calls `ReactSharedInternals.A.getOwner()`. This method doesn't
// exist in React 19 production, causing `t.getOwner is not a function`.
// We patch the code string to make the getOwner call safe before evaluation.
function patchContentlayerCode(code: string): string {
    // Replace `.getOwner()` with `.getOwner?.()` to safely handle the missing method
    return code.replace(/\.getOwner\(\)/g, '.getOwner?.()')
}

function useMDXComponent(code: string) {
    return React.useMemo(() => {
        const scope = { React, ReactDOM, _jsx_runtime: patchedRuntime }
        const patched = patchContentlayerCode(code)
        const fn = new Function(...Object.keys(scope), patched)
        return fn(...Object.values(scope)).default
    }, [code])
}

/* eslint-disable react-hooks/static-components -- MDX component is dynamically compiled from contentlayer code string */
const Mdx = ({ code }: MdxProps) => {
    const Component = useMDXComponent(code)

    return (
        <div className='prose w-full max-w-none dark:prose-invert'>
            <Component components={{ ...components }} />
        </div>
    )
}
/* eslint-enable react-hooks/static-components */

export default Mdx
