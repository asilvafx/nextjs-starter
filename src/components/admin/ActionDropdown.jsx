'use client';

import { MoreHorizontal } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// ActionDropdown: consistent trigger + menu for row actions
export default function ActionDropdown({ items = [], disabled = false }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
                {items.map((it, idx) => (
                    <DropdownMenuItem
                        key={idx}
                        onClick={it.onClick}
                        className={it.destructive ? 'text-destructive' : ''}>
                        {it.icon ? <span className="mr-2 inline-block align-middle">{it.icon}</span> : null}
                        <span>{it.label}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
