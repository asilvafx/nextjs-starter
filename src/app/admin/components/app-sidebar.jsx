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
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

import { useAuth } from "@/hooks/useAuth";

export function AppSidebar(props) {

const { isAuthenticated, user, status } = useAuth();

// This is sample data.
const data = {
  user: {
    name: user?.displayName || "NA",
    email: user?.email || "-",
    avatar: "/images/avatar.webp",
  }, 
  Main: [
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
      icon: Frame,
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
  Home: [
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
  System: [
    {
      title: "Administration",
      url: "#",
      icon: Frame,
    },
    {
      title: "Maintenance",
      url: "#",
      icon: PieChart,
    },
  ],
}

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
      <div className="ms-auto group-data-[collapsible=icon]:hidden peer-[[data-collapsible=icon]_&]:hidden"> 
      <Link href="/" target="_blank" rel="noopener noreferrer">
      <Button variant="outline" size="sm">
        <Globe />
      </Button>
      </Link> 
      <span className="md:hidden">
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
)
}