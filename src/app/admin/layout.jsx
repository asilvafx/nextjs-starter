"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./components/sidebar";
import { redirect } from "next/navigation";

export default function AdminLayout({ children }) {
  const { isAuthenticated, user, status } = useAuth();

  // Protect admin routes
  if (!isAuthenticated && status !== "loading") {
    redirect("/auth/login");
  } 

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72">
        <div className="px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}