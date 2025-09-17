"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  Image,
  BarChart,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    color: "text-sky-500"
  },
  {
    title: "Access",
    url: "/admin/access",
    icon: Users,
    color: "text-violet-500"
  },
  {
    title: "Store",
    url: "/admin/store",
    icon: Store,
    color: "text-pink-700"
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: ShoppingCart,
    color: "text-orange-700"
  },
  {
    title: "Gallery",
    url: "/admin/gallery",
    icon: Image,
    color: "text-emerald-500"
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart,
    color: "text-green-700"
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    color: "text-gray-500"
  }
];

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="h-full border-r">
        <SidebarContent>
          <div className="px-3 py-4">
            <Link href="/admin" className="flex items-center mb-10">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </Link>
          </div>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors",
                        pathname === item.url
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      )}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className={cn("h-5 w-5", item.color)} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="w-full flex items-center gap-3 p-2 rounded-lg text-red-500 hover:bg-accent/50 mt-4"
                    onClick={() => {/* Add logout handler */}}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}

export default AdminSidebar;