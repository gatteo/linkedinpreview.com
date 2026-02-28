'use client'

import React from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { IconSearch } from '@tabler/icons-react'
import posthog from 'posthog-js'

import { type BlogPostPreview } from '@/types/blog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PostCard } from './post-card'

const URL_DEBOUNCE_MS = 300
const TRACK_DEBOUNCE_MS = 500

export function FilteredPosts({ posts, initialSearch }: { posts: BlogPostPreview[]; initialSearch?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [searchValue, setSearchValue] = React.useState(initialSearch ?? searchParams.get('q') ?? '')
    const urlTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const trackTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const filteredPosts = posts.filter((post) => post.title.toLowerCase().includes(searchValue.toLowerCase()))

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchValue(value)

        // Debounce URL update
        if (urlTimeoutRef.current) clearTimeout(urlTimeoutRef.current)
        urlTimeoutRef.current = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            if (value) {
                params.set('q', value)
            } else {
                params.delete('q')
            }
            const qs = params.toString()
            React.startTransition(() => {
                router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false })
            })
        }, URL_DEBOUNCE_MS)

        // Debounce PostHog tracking
        if (trackTimeoutRef.current) clearTimeout(trackTimeoutRef.current)
        if (value.length >= 2) {
            trackTimeoutRef.current = setTimeout(() => {
                posthog.capture('blog_search_performed', {
                    search_query: value,
                    results_count: posts.filter((post) => post.title.toLowerCase().includes(value.toLowerCase()))
                        .length,
                })
            }, TRACK_DEBOUNCE_MS)
        }
    }

    React.useEffect(() => {
        return () => {
            if (urlTimeoutRef.current) clearTimeout(urlTimeoutRef.current)
            if (trackTimeoutRef.current) clearTimeout(trackTimeoutRef.current)
        }
    }, [])

    return (
        <section className='border-border border-t'>
            <div className='max-w-content mx-auto px-6 py-16 md:py-24'>
                <div className='relative mb-10'>
                    <Input
                        type='text'
                        value={searchValue}
                        onChange={handleSearchChange}
                        placeholder='Search for an article...'
                        aria-label='Search for an article'
                        className='border-border shadow-subtle h-12 rounded-xl pl-12 text-base'
                        id='search'
                    />
                    <Label htmlFor='search'>
                        <IconSearch className='absolute top-1/2 left-4 -translate-y-1/2 text-neutral-400' size={20} />
                    </Label>
                </div>

                {filteredPosts.length === 0 && (
                    <div className='py-16 text-center text-lg text-neutral-500'>No articles found</div>
                )}

                <div className='grid gap-6 sm:grid-cols-2'>
                    {filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            </div>
        </section>
    )
}
