// @/app/admin/components/app-sidebar.jsx

"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Globe,
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
import { navigation } from "../config/navigation";

export function AppSidebar(props) {

const { user } = useAuth();

const data = {
  user: {
    name: user?.displayName || "NA",
    email: user?.email || "-",
    avatar: "/images/avatar.webp",
  },
  ...navigation
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
      <span className="md:hidden ms-2">
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