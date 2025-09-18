"use client";

import { useAuth } from "@/hooks/useAuth"; 
import { redirect } from "next/navigation"; 
import { AppSidebar } from "./components/app-sidebar"
import { NotificationsPopover } from "@/components/ui/notifications";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator" 
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Button } from "@/components/ui/button";
import { ThemeSwitchGroup } from "@/components/ui/theme-mode";
import { LanguageSelector } from "@/components/ui/language-selector";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { findBreadcrumbPath } from "./config/navigation";
import React from "react";

export default function AdminLayout({ children }) {
  const { isAuthenticated, user, status } = useAuth();
  const pathname = usePathname();
  const breadcrumbs = findBreadcrumbPath(pathname);

  // Protect admin routes
  if (!isAuthenticated && status !== "loading") {
    redirect("/auth/login");
  } 

  return (
      <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="w-full flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index >= 0 && (
                      <BreadcrumbSeparator className="hidden md:block">
                        {">"}
                      </BreadcrumbSeparator>
                    )}
                    <BreadcrumbItem className="hidden md:block">
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.url}>
                          {crumb.title}
                        </BreadcrumbLink>
                      )}
                      
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ms-auto flex items-center gap-2"> 
            <NotificationsPopover />
            <LanguageSelector slim={true} />
            <ThemeSwitchGroup compact={true} />
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0"> 
           {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}