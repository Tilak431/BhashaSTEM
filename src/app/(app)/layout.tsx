"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  LayoutDashboard,
  Library,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Header } from "@/components/common/Header";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/library",
    icon: Library,
    label: "Content Library",
  },
  {
    href: "/quizzes",
    icon: ClipboardCheck,
    label: "Assessments",
  },
  {
    href: "/ask",
    icon: MessageCircle,
    label: "Ask AI",
  },
  {
    href: "/recommendations",
    icon: Sparkles,
    label: "Get Recommendations",
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="border-sidebar-border"
      >
        <SidebarContent>
          <SidebarHeader className="p-4">
            <div
              className={cn(
                "flex items-center gap-2",
                "group-data-[collapsible=icon]:hidden"
              )}
            >
              <h2 className="font-headline text-2xl font-semibold text-sidebar-primary">
                BhashaSTEM
              </h2>
            </div>
          </SidebarHeader>

          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label }}
                    asChild
                  >
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {/* Footer content if any */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
