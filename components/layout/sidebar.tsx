"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Activity,
  Settings,
  LogOut,
  UsersRound,
} from "lucide-react";
import { WorkspaceSelector } from "@/components/workspace-selector";

const navigation = {
  main: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
  crm: [
    { name: "Companies", href: "/companies", icon: Building2 },
    { name: "Contacts", href: "/contacts", icon: Users },
    { name: "Deals", href: "/deals", icon: Briefcase },
    { name: "Activities", href: "/activities", icon: Activity },
  ],
  organization: [
    { name: "Team", href: "/team", icon: UsersRound },
  ],
};

export function Sidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon
          className={cn(
            "mr-3 h-5 w-5 flex-shrink-0",
            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
          )}
        />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center px-6 border-b">
        <Image 
          src="/logo.svg" 
          alt="Onward CRM Logo" 
          width={24} 
          height={24} 
          className="mr-2 rounded-full"
        />
        <h1 className="text-xl font-bold">Onward CRM</h1>
      </div>
      <div className="border-b px-3 py-3">
        <WorkspaceSelector />
      </div>
      <nav className="flex-1 space-y-6 px-3 py-4">
        {/* Main */}
        <div className="space-y-1">
          {navigation.main.map(renderNavItem)}
        </div>
        
        {/* CRM Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sales Pipeline
          </p>
          {navigation.crm.map(renderNavItem)}
        </div>
        
        {/* Organization Section */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Organization
          </p>
          {navigation.organization.map(renderNavItem)}
        </div>
      </nav>
      <div className="border-t p-3">
        <Link
          href="/settings"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
          Settings
        </Link>
        <button
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={async () => {
            try {
              // Call our custom signout endpoint to clear cookies
              await fetch("/api/auth/signout", {
                method: "POST",
                credentials: "include",
              });

              // Force a hard navigation to clear any cached state
              window.location.href = "/";
            } catch (error) {
              // Silently fail but still redirect
              window.location.href = "/";
            }
          }}
        >
          <LogOut className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
          Sign Out
        </button>
      </div>
    </div>
  );
}