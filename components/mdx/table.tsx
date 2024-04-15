/* eslint-disable react/no-array-index-key */
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '@/components/ui/table'

type TableProps = {
    headers: string[]
    rows: string[][]
}

export const Table = (props: TableProps) => {
    const { headers, rows } = props

    return (
        <UITable className='not-prose'>
            <TableHeader>
                <TableRow>
                    {headers.map((header, i) => (
                        <TableHead key={i}>{header}</TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((row, i) => (
                    <TableRow key={i}>
                        {row.map((cell, j) => (
                            <TableCell key={j}>{cell}</TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </UITable>
    )
}
