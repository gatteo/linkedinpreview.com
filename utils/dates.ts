import { format } from 'date-fns'

export function formatDate(date: string | Date, pattern?: string): string {
    return format(new Date(date), pattern || 'PP')
}
