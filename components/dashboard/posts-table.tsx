'use client'

import * as React from 'react'
import Link from 'next/link'
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table'
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    CopyIcon,
    EllipsisVerticalIcon,
    PenLineIcon,
    Trash2Icon,
} from 'lucide-react'

import { Routes } from '@/config/routes'
import { type DraftManifestEntry, type DraftStatus } from '@/lib/drafts'
import { cn } from '@/lib/utils'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_STYLES: Record<DraftStatus, string> = {
    draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

// ---------------------------------------------------------------------------
// Actions cell - separate component so each row has isolated dialog state
// ---------------------------------------------------------------------------

function ActionsCell({
    draft,
    onDuplicate,
    onDelete,
}: {
    draft: DraftManifestEntry
    onDuplicate: (id: string) => void
    onDelete: (id: string) => void
}) {
    const [deleteOpen, setDeleteOpen] = React.useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='text-muted-foreground size-8'>
                        <EllipsisVerticalIcon className='size-4' />
                        <span className='sr-only'>Actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-32'>
                    <DropdownMenuItem asChild>
                        <Link href={Routes.DashboardEditor(draft.id)}>
                            <PenLineIcon className='size-4' />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(draft.id)}>
                        <CopyIcon className='size-4' />
                        Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant='destructive' onClick={() => setDeleteOpen(true)}>
                        <Trash2Icon className='size-4' />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent size='sm'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete post?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &ldquo;{draft.title || 'Untitled'}&rdquo; will be permanently deleted. This cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant='destructive'
                            onClick={() => {
                                onDelete(draft.id)
                                setDeleteOpen(false)
                            }}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function createColumns(
    onDuplicate: (id: string) => void,
    onDelete: (id: string) => void,
): ColumnDef<DraftManifestEntry>[] {
    return [
        {
            id: 'select',
            header: ({ table }) => (
                <div className='flex items-center justify-center'>
                    <Checkbox
                        checked={
                            table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
                        }
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label='Select all'
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className='flex items-center justify-center'>
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label='Select row'
                    />
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'title',
            header: 'Title',
            cell: ({ row }) => (
                <Link
                    href={Routes.DashboardEditor(row.original.id)}
                    className='text-foreground hover:text-primary line-clamp-1 font-medium'>
                    {row.original.title || 'Untitled'}
                </Link>
            ),
            enableHiding: false,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    variant='secondary'
                    className={cn('px-1.5 py-0 text-[10px] capitalize', STATUS_STYLES[row.original.status])}>
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: 'wordCount',
            header: () => <div className='text-right'>Words</div>,
            cell: ({ row }) => <div className='text-right tabular-nums'>{row.original.wordCount}</div>,
        },
        {
            accessorKey: 'updatedAt',
            header: 'Modified',
            cell: ({ row }) => (
                <span className='text-muted-foreground text-sm'>{formatRelativeDate(row.original.updatedAt)}</span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => <ActionsCell draft={row.original} onDuplicate={onDuplicate} onDelete={onDelete} />,
            enableHiding: false,
        },
    ]
}

// ---------------------------------------------------------------------------
// PostsTable
// ---------------------------------------------------------------------------

interface PostsTableProps {
    data: DraftManifestEntry[]
    onDuplicate: (id: string) => void
    onDelete: (id: string) => void
}

export function PostsTable({ data, onDuplicate, onDelete }: PostsTableProps) {
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)

    const columns = React.useMemo(() => createColumns(onDuplicate, onDelete), [onDuplicate, onDelete])

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnVisibility, rowSelection, columnFilters },
        getRowId: (row) => row.id,
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    })

    const selectedRows = table.getFilteredSelectedRowModel().rows

    return (
        <div className='flex flex-col gap-4'>
            {/* Bulk actions bar */}
            {selectedRows.length > 0 && (
                <div className='bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-2'>
                    <span className='text-muted-foreground text-sm'>{selectedRows.length} selected</span>
                    <Button variant='destructive' size='sm' onClick={() => setBulkDeleteOpen(true)}>
                        <Trash2Icon className='size-3.5' />
                        Delete
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => setRowSelection({})}>
                        Clear
                    </Button>
                </div>
            )}

            <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                <AlertDialogContent size='sm'>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedRows.length} posts?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete {selectedRows.length} post
                            {selectedRows.length !== 1 ? 's' : ''}. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            variant='destructive'
                            onClick={() => {
                                selectedRows.forEach((r) => onDelete(r.original.id))
                                setRowSelection({})
                                setBulkDeleteOpen(false)
                            }}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Table */}
            <div className='overflow-hidden rounded-lg border'>
                <Table>
                    <TableHeader className='bg-muted'>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} colSpan={header.colSpan}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-24 text-center'>
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {table.getPageCount() > 1 && (
                <div className='flex items-center justify-between px-2'>
                    <div className='text-muted-foreground text-sm'>
                        {selectedRows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className='flex items-center gap-2'>
                        <span className='text-sm'>
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </span>
                        <Button
                            variant='outline'
                            size='icon'
                            className='size-8'
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}>
                            <ChevronLeftIcon className='size-4' />
                        </Button>
                        <Button
                            variant='outline'
                            size='icon'
                            className='size-8'
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}>
                            <ChevronRightIcon className='size-4' />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
