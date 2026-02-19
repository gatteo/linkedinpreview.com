'use client'

import React from 'react'
import { IconSearch } from '@tabler/icons-react'
import posthog from 'posthog-js'

import { type BlogPostPreview } from '@/types/blog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PostCard } from './post-card'

export function FilteredPosts({ posts }: { posts: BlogPostPreview[] }) {
    const [searchValue, setSearchValue] = React.useState('')
    const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    const filteredPosts = posts.filter((post) => post.title.toLowerCase().includes(searchValue.toLowerCase()))

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchValue(value)

        // Debounce tracking to avoid excessive events
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (value.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                posthog.capture('blog_search_performed', {
                    search_query: value,
                    results_count: posts.filter((post) => post.title.toLowerCase().includes(value.toLowerCase()))
                        .length,
                })
            }, 500)
        }
    }

    React.useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [])

    return (
        <section id='reason' className='container max-w-6xl py-16 md:py-24'>
            <div className='relative mb-8'>
                <Input
                    type='text'
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder='Search for an article'
                    aria-label='Search for an article'
                    className='pl-12'
                    id='search'
                />
                <Label htmlFor='search'>
                    <IconSearch className='absolute left-4 top-1/2 -translate-y-1/2' size={20} />
                </Label>
            </div>

            {filteredPosts.length === 0 && <div className='text-center text-xl'>No results at the moment</div>}

            <div className='-mx-4 grid gap-4 sm:grid-cols-2'>
                {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </section>
    )
}
