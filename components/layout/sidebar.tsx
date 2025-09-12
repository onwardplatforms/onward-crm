"use client";

import Link from "next/link";
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

const navigation = {
  main: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
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

  const renderNavItem = (item: any) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon
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
        <h1 className="text-xl font-bold">Onward CRM</h1>
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
              const response = await fetch("/api/auth/sign-out", {
                method: "POST",
              });
              if (response.ok) {
                window.location.href = "/signin";
              }
            } catch (error) {
              console.error("Logout failed:", error);
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