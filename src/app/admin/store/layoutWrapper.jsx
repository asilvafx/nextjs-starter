'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminHeader from '@/app/admin/components/AdminHeader';
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
        <div className="space-y-4">
            <AdminHeader title="Catalog Management" description="Manage your products, categories, and collections" />

            <div className="overflow-x-auto border-b pb-4">
                <div className="flex min-w-max items-center space-x-4">
                    {sections.map((section) => (
                        <Button
                            key={section.href}
                            variant="ghost"
                            asChild
                            className={cn(
                                'whitespace-nowrap text-muted-foreground hover:text-primary',
                                pathname === section.href && 'bg-muted text-primary'
                            )}>
                            <Link href={section.href}>{section.label}</Link>
                        </Button>
                    ))}
                </div>
            </div>

            <div>{children}</div>
        </div>
    );
}
