// @/components/ui/skeleton.tsx

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="skeleton" className={cn('animate-pulse rounded-md bg-input', className)} {...props} />;
}

function TableSkeleton({ columns = 5, rows = 5 }: { columns?: number; rows?: number }): React.ReactElement {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {[...Array(columns)].map((_, index) => (
                        <TableHead key={index}>
                            <div className="flex items-center justify-center">
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {[...Array(rows)].map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                        {[...Array(columns)].map((_, colIndex) => (
                            <TableCell key={colIndex} className={colIndex === columns - 1 ? 'text-right' : ''}>
                                {colIndex === columns - 1 ? (
                                    <div className="flex justify-end gap-2">
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                ) : (
                                    <Skeleton className="h-4 w-20" />
                                )}
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export { Skeleton, TableSkeleton };
