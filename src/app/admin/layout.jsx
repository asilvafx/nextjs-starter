"use client";

import { SquareArrowLeft, SquareArrowRight } from 'lucide-react';
import { redirect, usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import IntlSelector from '@/components/intl-selector';
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
    // Fetch languages for the admin header and pass them to IntlSelector to ensure
    // the admin layout shows the same available languages as the homepage.
    const [adminLanguages, setAdminLanguages] = useState([]);

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const res = await fetch('/api/query/public/site_settings');
                const json = await res.json();
                if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
                    const siteSettings = json.data[0];
                    const availableLangs = siteSettings.availableLanguages || ['en'];

                    const languageNames = {
                        en: { name: 'English', flag: '🇺🇸' },
                        es: { name: 'Spanish', flag: '🇪🇸' },
                        fr: { name: 'Français', flag: '🇫🇷' },
                        de: { name: 'German', flag: '🇩🇪' },
                        it: { name: 'Italian', flag: '🇮🇹' },
                        pt: { name: 'Portuguese', flag: '🇵🇹' },
                        ja: { name: 'Japanese', flag: '🇯🇵' },
                        ko: { name: 'Korean', flag: '🇰🇷' },
                        zh: { name: 'Chinese', flag: '🇨🇳' }
                    };

                    const langToCountry = {
                        en: 'US',
                        es: 'ES',
                        fr: 'FR',
                        de: 'DE',
                        it: 'IT',
                        pt: 'PT',
                        ja: 'JP',
                        ko: 'KR',
                        zh: 'CN'
                    };

                    const formatted = availableLangs.map((code) => ({
                        id: code,
                        code,
                        name: languageNames[code]?.name || code.toUpperCase(),
                        flag: languageNames[code]?.flag || '🌐',
                        countryCode: langToCountry[code] || undefined
                    }));

                    if (mounted) setAdminLanguages(formatted);
                }
            } catch (err) {
                // don't block admin UI if languages can't be fetched
                console.error('Failed to load admin languages', err);
            }
        };

        load();

        return () => {
            mounted = false;
        };
    }, []);
    // Use the same frontend Intl selector component used on the homepage.
    // IntlSelector handles fetching available languages and formatting (including countryCode/flags).

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
                            <IntlSelector slim={true} initialLanguages={adminLanguages} />
                            <ThemeSwitchGroup compact={true} />
                        </div>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
