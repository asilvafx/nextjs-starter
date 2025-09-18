"use client"
import Link from "next/link"
import Image from "next/image"
import {
  Globe,
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
import { Button } from "@/components/ui/button"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/images/avatar.webp",
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
        <span 
            className="w-full flex items-center justify-start gap-1 px-0"
        >
        <Image 
            src="/images/logo.png"
            alt="Logo"
            width={50}
            height={50} 
            className="max-h-8 dark:invert" 
            style={{ width: 'auto' }}
            priority={true} 
        /> 
        <span className="ms-auto group-data-[collapsible=icon]:hidden peer-[[data-collapsible=icon]_&]:hidden"> 
        <Link href="/" target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm">
          <Globe />
        </Button>
        </Link>
        </span>
        </span> 
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