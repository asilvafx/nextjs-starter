"use client";

import { useAuth } from "@/hooks/useAuth";
import AdminSidebar from "./components/sidebar";
import { redirect } from "next/navigation";

export default function AdminLayout({ children }) {
  const { isAuthenticated, user, status } = useAuth();

  // Protect admin routes
  if (!isAuthenticated && status !== "loading") {
    redirect("/auth/login");
  } 

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex h-full md:w-72 md:flex-col fixed inset-y-0 z-50">
        <AdminSidebar />
      </div>
      <main className="flex-1 md:pl-72">
        <div className="container p-6">
          {children}
        </div>
      </main>
    </div>
  );
}