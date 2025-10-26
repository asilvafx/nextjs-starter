'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

// AdminHeader: title, description, actions area
export default function AdminHeader({ title, description, children }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="font-bold text-3xl">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">{children}</div>
        </div>
    );
}
