"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections = [
  {
    label: "Items",
    href: "/admin/store/catalog",
  },
  {
    label: "Categories",
    href: "/admin/store/categories",
  },
  {
    label: "Collections",
    href: "/admin/store/collections",
  },
];

export default function StoreLayout({ children }) {

  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Catalog Management</h1>
        <p className="text-muted-foreground">
          Manage your products, categories, and collections
        </p>
      </div>

      <div className="flex items-center space-x-4 border-b pb-4">
        {sections.map((section) => (
          <Button
            key={section.href}
            variant="ghost"
            asChild
            className={cn(
              "text-muted-foreground hover:text-primary",
              pathname === section.href && "text-primary bg-muted"
            )}
          >
            <Link href={section.href}>{section.label}</Link>
          </Button>
        ))}
      </div>

      <div>{children}</div>
    </div>
  );
}