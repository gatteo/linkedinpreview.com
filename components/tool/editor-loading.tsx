/* eslint-disable react/no-array-index-key */
import { Icons } from '../icon'
import { Skeleton } from '../ui/skeleton'

export function EditorLoading() {
    return (
        <div className='flex size-full flex-col'>
            {/** Panel title */}
            <div className='flex h-14 border-b border-border px-4 sm:px-6'>
                <div className='flex grow items-center justify-between'>
                    <div className='flex flex-none flex-wrap items-center justify-start gap-2'>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Skeleton key={index} className='size-8 rounded-md' />
                        ))}
                    </div>
                </div>
            </div>

            {/** Editor */}
            <div className='grow overflow-y-auto px-4 py-5 sm:px-6'>
                <div className='not-prose relative text-muted-foreground'>
                    Loading editor <Icons.spinner className='mb-0.5 ml-1 inline size-4 animate-spin' />
                </div>
            </div>

            {/** Actions */}
            <div className='border-t border-border px-4 py-3 sm:px-6'>
                <div className='flex flex-row gap-2 sm:items-center sm:justify-between sm:gap-6'>
                    <div className='flex items-center justify-start gap-2'>
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className='size-8 rounded-md' />
                        ))}
                    </div>
                    <div className='flex flex-1 items-center justify-end gap-2 sm:gap-4'>
                        <Skeleton className='h-10 w-32 rounded-md' />
                    </div>
                </div>
            </div>
        </div>
    )
}
