"use client"
import Link from "next/link"
import Image from "next/image"
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
  navHome: [
    {
      title: "Overview",
      url: "#",
      icon: Frame,
    },
    {
      title: "Analytics",
      url: "#",
      icon: PieChart,
    },
  ],
}

export function AppSidebar(props) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
            href="/admin"
        >
        <Image 
            src="/images/logo.png"
            alt="Logo"
            width={50}
            height={50} 
            className="max-h-8" 
            style={{ width: 'auto' }}
            priority={true} 
        />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavMain navMain={data.navMain} navHome={data.navHome} /> 
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}