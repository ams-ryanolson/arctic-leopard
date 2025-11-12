import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface DataTableColumn<T> {
    key: keyof T | string;
    header: ReactNode;
    align?: 'left' | 'right' | 'center';
    render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Array<DataTableColumn<T>>;
    data: T[];
    getRowKey?: (row: T, index: number) => string | number;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    getRowKey = (row, index) => (typeof row === 'object' && row !== null && 'id' in row ? (row as { id: string | number }).id : index),
    className,
}: DataTableProps<T>) {
    return (
        <div className={cn('overflow-hidden rounded-2xl border border-white/10', className)}>
            <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-black/30 text-xs uppercase tracking-[0.3em] text-white/50">
                    <tr>
                        {columns.map((column, index) => (
                            <th
                                key={String(column.key) ?? index}
                                className={cn('px-4 py-3 text-left', {
                                    'text-right': column.align === 'right',
                                    'text-center': column.align === 'center',
                                })}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-black/20 text-white/80">
                    {data.map((row, rowIndex) => (
                        <tr key={getRowKey(row, rowIndex)} className="transition hover:bg-white/5">
                            {columns.map((column, columnIndex) => (
                                <td
                                    key={`${String(column.key)}-${columnIndex}`}
                                    className={cn('px-4 py-3', {
                                        'text-right': column.align === 'right',
                                        'text-center': column.align === 'center',
                                    })}
                                >
                                    {column.render
                                        ? column.render(row)
                                        : (row as Record<string, unknown>)[column.key as string]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}




