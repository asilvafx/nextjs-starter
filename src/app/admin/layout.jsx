'use client';

import { SquareArrowLeft, SquareArrowRight } from 'lucide-react';
import { redirect, usePathname } from 'next/navigation';
import React from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/ui/language-selector';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { NotificationsPopover } from '@/components/ui/notifications';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeSwitchGroup } from '@/components/ui/theme-mode';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { AppSidebar } from './components/app-sidebar';
import { findBreadcrumbPath } from './config/navigation';

export default function AdminLayout({ children }) {
    const { isAuthenticated, user, status } = useAuth();
    const pathname = usePathname();
    const breadcrumbs = findBreadcrumbPath(pathname);
    const [showMobileActions, setShowMobileActions] = React.useState(false);

    // Show loading spinner while authentication is being checked
    if (status === 'loading') {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <LoadingPage message="Loading administration panel..." />
            </div>
        );
    }

    // Protect admin routes
    if (!isAuthenticated && status !== 'loading') {
        redirect('/auth/login');
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex w-full items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb className={cn('md:block', showMobileActions && 'hidden')}>
                            <BreadcrumbList>
                                {breadcrumbs.map((crumb, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <BreadcrumbSeparator>{'>'}</BreadcrumbSeparator>}
                                        <BreadcrumbItem>
                                            {index === breadcrumbs.length - 1 ? (
                                                <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={crumb.url}>{crumb.title}</BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Mobile Actions Toggle Button */}
                        <div className="ms-auto flex md:hidden">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowMobileActions(!showMobileActions)}
                                className={cn('transition-transform duration-200', showMobileActions && 'hidden')}>
                                <SquareArrowLeft />
                            </Button>
                        </div>

                        {/* Layout Actions */}
                        <div className={`ms-auto items-center gap-2 ${showMobileActions ? 'flex' : 'hidden'} md:flex`}>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowMobileActions(!showMobileActions)}
                                className={cn('md:hidden', !showMobileActions && 'hidden')}>
                                <SquareArrowRight />
                            </Button>
                            <NotificationsPopover />
                            <LanguageSelector slim={true} />
                            <ThemeSwitchGroup compact={true} />
                        </div>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
