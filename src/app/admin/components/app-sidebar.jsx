"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  Users,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "./nav-main" 
import { NavUser } from "./nav-user" 
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  }, 
  navMain: [
    {
      title: "Access",
      url: "#",
      icon: Users, 
      items: [
        {
          title: "Users",
          url: "/admin/access/users",
        },
        {
          title: "Roles",
          url: "#",
        },
      ],
    },
    {
      title: "Store",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Orders",
          url: "/admin/store/orders",
        },
        {
          title: "Catalog",
          url: "/admin/store/catalog",
        },
        {
          title: "Customers",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    }, 
    {
      title: "Gallery",
      url: "/admin/gallery",
      icon: Frame,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar(props) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        Brand
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} /> 
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}