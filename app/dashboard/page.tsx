import { Suspense } from 'react'
import type { Metadata } from 'next'

import { Skeleton } from '@/components/ui/skeleton'
import { PostsList } from '@/components/dashboard/posts-list'

export const metadata: Metadata = {
    title: 'Posts - LinkedInPreview.com',
}

function PostsPageSkeleton() {
    return (
        <div className='flex flex-col gap-6 p-4 lg:p-6'>
            <div className='flex items-center justify-between'>
                <Skeleton className='h-8 w-24' />
                <Skeleton className='h-9 w-28' />
            </div>
            <div className='overflow-hidden rounded-lg border'>
                <div className='bg-muted px-4 py-3'>
                    <Skeleton className='h-4 w-32' />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className='flex items-center gap-4 border-t px-4 py-3'>
                        <Skeleton className='size-4 rounded' />
                        <Skeleton className='h-4 flex-1' />
                        <Skeleton className='h-5 w-16 rounded-full' />
                        <Skeleton className='h-4 w-10' />
                        <Skeleton className='h-4 w-20' />
                        <Skeleton className='size-8 rounded-md' />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<PostsPageSkeleton />}>
            <PostsList />
        </Suspense>
    )
}
