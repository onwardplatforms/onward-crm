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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/contexts/sidebar-context";

const navigation = {
  main: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ],
  crm: [
    { name: "Companies", href: "/company", icon: Building2 },
    { name: "Contacts", href: "/contact", icon: Users },
    { name: "Opportunities", href: "/opportunity", icon: Briefcase },
    { name: "Activities", href: "/activity", icon: Activity },
  ],
  organization: [
    { name: "Team", href: "/team", icon: UsersRound },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();

  const renderNavItem = (item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    if (isCollapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "group flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                )}
              />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {item.name}
          </TooltipContent>
        </Tooltip>
      );
    }

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
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "flex h-full flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "flex h-16 items-center border-b",
          isCollapsed ? "px-3 justify-center" : "px-6"
        )}>
          {isCollapsed ? (
            <Image
              src="/logo.svg"
              alt="Onward CRM Logo"
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <>
              <Image
                src="/logo.svg"
                alt="Onward CRM Logo"
                width={24}
                height={24}
                className="mr-2 rounded-full"
              />
              <h1 className="text-xl font-bold">Onward CRM</h1>
            </>
          )}
        </div>
        {!isCollapsed && (
          <div className="border-b px-3 py-3">
            <WorkspaceSelector />
          </div>
        )}
        <nav className={cn(
          "flex-1 space-y-6 py-4",
          isCollapsed ? "px-3 flex flex-col items-center" : "px-3"
        )}>
          {/* Main */}
          <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
            {navigation.main.map(renderNavItem)}
          </div>

          {/* CRM Section */}
          <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sales Pipeline
              </p>
            )}
            {navigation.crm.map(renderNavItem)}
          </div>

          {/* Organization Section */}
          <div className={cn("space-y-1", isCollapsed && "flex flex-col items-center")}>
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Organization
              </p>
            )}
            {navigation.organization.map(renderNavItem)}
          </div>
        </nav>
        <div className={cn(
          "border-t",
          isCollapsed ? "p-2 flex flex-col items-center space-y-1" : "p-3"
        )}>
          {isCollapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/settings"
                    className="group flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="group flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={async () => {
                      try {
                        await fetch("/api/auth/signout", {
                          method: "POST",
                          credentials: "include",
                        });
                        window.location.href = "/";
                      } catch (error) {
                        window.location.href = "/";
                      }
                    }}
                  >
                    <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
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
                    await fetch("/api/auth/signout", {
                      method: "POST",
                      credentials: "include",
                    });
                    window.location.href = "/";
                  } catch (error) {
                    window.location.href = "/";
                  }
                }}
              >
                <LogOut className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}