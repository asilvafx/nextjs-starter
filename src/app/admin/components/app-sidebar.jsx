// @/app/admin/components/app-sidebar.jsx

'use client';

import { Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarTrigger
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { navigation } from '../config/navigation';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

export function AppSidebar(props) {
    const { user } = useAuth();

    const data = {
        user: {
            name: user?.displayName || 'NA',
            email: user?.email || '-',
            avatar: '/images/avatar.webp'
        },
        ...navigation
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="flex-row items-center justify-start">
                <Image
                    src="/next.svg"
                    alt="Logo"
                    width={150}
                    height={150}
                    className="dark:invert"
                    style={{ height: 'auto', maxHeight: '20px', maxWidth: '100px', minWidth: '30px' }}
                    priority={true}
                />
                <div className="ms-auto peer-[[data-collapsible=icon]_&]:hidden group-data-[collapsible=icon]:hidden">
                    <Link href="/" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                            <Globe />
                        </Button>
                    </Link>
                    <span className="ms-2 md:hidden">
                        <SidebarTrigger />
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain nav={data} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
