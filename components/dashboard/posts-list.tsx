'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { FileTextIcon, PlusIcon, SearchIcon } from 'lucide-react'

import { Routes } from '@/config/routes'
import { POST_FORMATS, type DraftStatus } from '@/lib/drafts'
import { cn } from '@/lib/utils'
import { useDrafts } from '@/hooks/use-drafts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CreationWizard } from '@/components/dashboard/creation-wizard/creation-wizard'
import { labelColor } from '@/components/dashboard/label-picker'
import { PageHeader } from '@/components/dashboard/page-header'
import { PostsTable } from '@/components/dashboard/posts-table'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterStatus = DraftStatus | 'all'

const STATUS_FILTERS: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Published', value: 'published' },
]

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasFilter, onNewPost }: { hasFilter: boolean; onNewPost: () => void }) {
    if (hasFilter) {
        return (
            <div className='flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center'>
                <FileTextIcon className='text-muted-foreground/40 size-10' />
                <div>
                    <h3 className='font-medium'>No posts match your filter</h3>
                    <p className='text-muted-foreground text-sm'>Try a different status or search query</p>
                </div>
            </div>
        )
    }

    return (
        <div className='flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center'>
            <FileTextIcon className='text-muted-foreground/40 size-10' />
            <div>
                <h3 className='font-medium'>No posts yet</h3>
                <p className='text-muted-foreground text-sm'>Create your first post to get started</p>
            </div>
            <Button onClick={onNewPost}>
                <PlusIcon className='size-4' />
                New Post
            </Button>
        </div>
    )
}

// ---------------------------------------------------------------------------
// PostsList
// ---------------------------------------------------------------------------

function PostsListSkeleton() {
    return (
        <div className='flex flex-col gap-4'>
            <div className='overflow-hidden rounded-lg border'>
                <div className='bg-muted px-4 py-3'>
                    <Skeleton className='h-4 w-32' />
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
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

export function PostsList() {
    const router = useRouter()
    const { drafts, isLoading, deleteDraft, duplicateDraft } = useDrafts()
    const [newPostOpen, setNewPostOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [filterStatus, setFilterStatus] = React.useState<FilterStatus>('all')
    const [filterLabel, setFilterLabel] = React.useState<string | null>(null)

    const filteredDrafts = React.useMemo(() => {
        let result = [...drafts]

        if (filterStatus !== 'all') {
            result = result.filter((d) => d.status === filterStatus)
        }

        if (filterLabel !== null) {
            result = result.filter((d) => d.label === filterLabel)
        }

        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter((d) => d.title.toLowerCase().includes(q))
        }

        result.sort((a, b) => b.updatedAt - a.updatedAt)

        return result
    }, [drafts, filterStatus, filterLabel, search])

    const handleDuplicate = async (id: string) => {
        const newDraft = await duplicateDraft(id)
        if (newDraft) {
            router.push(Routes.DashboardEditor(newDraft.id))
        }
    }

    const handleDelete = async (id: string) => {
        await deleteDraft(id)
    }

    const hasActiveFilter = filterStatus !== 'all' || filterLabel !== null || search.trim().length > 0

    return (
        <>
            <PageHeader title='Posts'>
                <Button size='sm' onClick={() => setNewPostOpen(true)}>
                    <PlusIcon className='size-4' />
                    New Post
                </Button>
            </PageHeader>

            <div className='flex flex-1 flex-col gap-4 overflow-y-auto p-4 lg:p-6'>
                {/* Filters + search */}
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='bg-muted inline-flex h-9 items-center rounded-lg p-1'>
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFilterStatus(f.value)}
                                className={cn(
                                    'inline-flex items-center rounded-md px-3 py-1 text-sm font-medium transition-colors',
                                    filterStatus === f.value
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className='flex items-center gap-2'>
                        <Select
                            value={filterLabel ?? '__all__'}
                            onValueChange={(v) => setFilterLabel(v === '__all__' ? null : v)}>
                            <SelectTrigger className='h-9 w-44'>
                                {filterLabel ? (
                                    <div className='flex items-center gap-1.5'>
                                        <div className={`size-2 shrink-0 rounded-full ${labelColor(filterLabel)}`} />
                                        <span className='truncate'>{filterLabel}</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder='All formats' />
                                )}
                            </SelectTrigger>
                            <SelectContent className='p-1'>
                                <SelectItem value='__all__' className='px-3 py-2'>
                                    All formats
                                </SelectItem>
                                {POST_FORMATS.map((label) => (
                                    <SelectItem key={label} value={label} className='px-3 py-2'>
                                        <div className='flex items-center gap-1.5'>
                                            <div className={`size-2 shrink-0 rounded-full ${labelColor(label)}`} />
                                            <span>{label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className='relative w-full sm:w-60'>
                            <SearchIcon className='text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2' />
                            <Input
                                placeholder='Search posts...'
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className='h-9 pl-8'
                            />
                        </div>
                    </div>
                </div>

                {/* Table or empty state */}
                {isLoading ? (
                    <PostsListSkeleton />
                ) : filteredDrafts.length === 0 ? (
                    <EmptyState hasFilter={hasActiveFilter} onNewPost={() => setNewPostOpen(true)} />
                ) : (
                    <PostsTable data={filteredDrafts} onDuplicate={handleDuplicate} onDelete={handleDelete} />
                )}
            </div>

            <CreationWizard open={newPostOpen} onOpenChange={setNewPostOpen} />
        </>
    )
}
