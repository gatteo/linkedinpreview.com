'use client'

import * as React from 'react'
import { useReducedMotion } from 'framer-motion'

import { toTipTapParagraphs } from '@/lib/parse-formatted-text'
import { PostCard } from '@/components/tool/preview/post-card'
import { ScreenSizeProvider } from '@/components/tool/preview/preview-size-context'

const HERO_POST =
    "Most posts die in the first line.\n\nThe hook is everything - if it doesn't earn the click on “...see more”, the rest never gets read. 👇"

// Split by code point so the 👇 surrogate pair is never sliced mid-character.
const HERO_CHARS = Array.from(HERO_POST)

const HERO_AUTHOR = {
    name: 'Matteo Giardino',
    headline: 'Founder @ devv.it',
    avatarUrl: 'https://github.com/gatteo.png',
}

/**
 * The floating card in the hero. Renders the same PostCard used by the tool,
 * onboarding and editor, so the landing page shows a real LinkedIn preview
 * (avatar, headline, reactions, Like/Comment/Repost/Send). The post body types
 * itself out on load for a bit of life.
 */
export function HeroPostPreview() {
    const reduceMotion = useReducedMotion()
    const [count, setCount] = React.useState(1)

    React.useEffect(() => {
        if (reduceMotion) {
            setCount(HERO_CHARS.length)
            return
        }
        setCount(1)
        const id = setInterval(() => {
            setCount((c) => {
                if (c >= HERO_CHARS.length) {
                    clearInterval(id)
                    return c
                }
                return c + 1
            })
        }, 24)
        return () => clearInterval(id)
    }, [reduceMotion])

    const typed = HERO_CHARS.slice(0, count).join('')
    const doc = React.useMemo(() => ({ type: 'doc', content: toTipTapParagraphs(typed) }), [typed])

    return (
        <div className='w-[400px] max-w-full'>
            <ScreenSizeProvider initialSize='desktop'>
                <PostCard content={doc} media={null} author={HERO_AUTHOR} clampContent={false} />
            </ScreenSizeProvider>
        </div>
    )
}
