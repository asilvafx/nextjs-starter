'use client';

import React from 'react';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/components/ui/pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TableSkeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// AdminTable: wraps table content with ScrollArea, skeleton and pagination
export default function AdminTable({
    loading,
    columns = [],
    items = [],
    renderRow,
    page = 1,
    totalPages = 1,
    onPageChange = () => {}
}) {
    if (loading) {
        return <TableSkeleton columns={Math.max(columns.length, 3)} rows={5} />;
    }

    return (
        <div className="flex flex-col">
            <ScrollArea className="h-[calc(100vh-250px)]">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, idx) => (
                                <TableHead key={idx} className={col.className || ''}>
                                    {col.title}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>{items.map((item) => renderRow(item))}</TableBody>
                </Table>
            </ScrollArea>

            {totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => onPageChange(Math.max(1, page - 1))}
                                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <PaginationItem key={p}>
                                    <PaginationLink
                                        onClick={() => onPageChange(p)}
                                        isActive={p === page}
                                        className="cursor-pointer">
                                        {p}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                                    className={
                                        page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
