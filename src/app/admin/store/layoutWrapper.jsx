'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sections = [
    {
        label: 'Products & Services',
        href: '/admin/store/catalog',
        icon: 'BoxIcon'
    },
    {
        label: 'Categories',
        href: '/admin/store/categories',
        icon: 'FolderIcon'
    },
    {
        label: 'Collections',
        href: '/admin/store/collections',
        icon: 'LayoutGridIcon'
    }
];

export default function StoreLayout({ children }) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-bold text-3xl">Catalog Management</h1>
                <p className="text-muted-foreground">Manage your products, categories, and collections</p>
            </div>

            <div className="flex items-center space-x-4 border-b pb-4">
                {sections.map((section) => (
                    <Button
                        key={section.href}
                        variant="ghost"
                        asChild
                        className={cn(
                            'text-muted-foreground hover:text-primary',
                            pathname === section.href && 'bg-muted text-primary'
                        )}>
                        <Link href={section.href}>{section.label}</Link>
                    </Button>
                ))}
            </div>

            <div>{children}</div>
        </div>
    );
}
