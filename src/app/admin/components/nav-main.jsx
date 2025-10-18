'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar
} from '@/components/ui/sidebar';

export function NavMain({ nav }) {
    const { isMobile, setOpenMobile } = useSidebar();
    const pathname = usePathname();

    const handleLinkClick = (_e) => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <>
            <SidebarGroup>
                <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                <SidebarMenu>
                    {nav.Home.map((item, key) => (
                        <SidebarMenuItem key={key}>
                            <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url} asChild>
                                <Link href={item.url} onClick={handleLinkClick}>
                                    <item.icon className="mr-2 size-4" />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarMenu>
                    {nav.Main.map((item, key) => {
                        // For items without subitems, render a simple button
                        if (!item.items) {
                            return (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url} asChild>
                                        <Link href={item.url} onClick={handleLinkClick}>
                                            {item.icon && <item.icon className="mr-2 size-4" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        }

                        // For items with subitems (like Store), render a collapsible
                        return (
                            <Collapsible key={key} asChild defaultOpen={item.isActive} className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={item.items?.some((subItem) => pathname === subItem.url)}>
                                            {item.icon && <item.icon className="mr-2 size-4" />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items?.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                        <Link href={subItem.url} onClick={handleLinkClick}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>Developer</SidebarGroupLabel>
                <SidebarMenu>
                    {nav.Developer.map((item, key) => {
                        // For items without subitems, render a simple button
                        if (!item.items) {
                            return (
                                <SidebarMenuItem key={key}>
                                    <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url} asChild>
                                        <Link href={item.url} onClick={handleLinkClick}>
                                            {item.icon && <item.icon className="mr-2 size-4" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        }

                        // For items with subitems (like Store), render a collapsible
                        return (
                            <Collapsible key={key} asChild defaultOpen={item.isActive} className="group/collapsible">
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={item.items?.some((subItem) => pathname === subItem.url)}>
                                            {item.icon && <item.icon className="mr-2 size-4" />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items?.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                                        <Link href={subItem.url} onClick={handleLinkClick}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
                <SidebarGroupLabel>System</SidebarGroupLabel>
                <SidebarMenu>
                    {nav.System.map((item, key) => (
                        <SidebarMenuItem key={key}>
                            <SidebarMenuButton tooltip={item.title} isActive={pathname === item.url} asChild>
                                <Link href={item.url} onClick={handleLinkClick}>
                                    <item.icon className="mr-2 size-4" />
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}
