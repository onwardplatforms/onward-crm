"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Calendar, Briefcase, UserPlus, UserCheck, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  activity?: { id: string; type: string; subject: string };
  deal?: { id: string; name: string };
  invite?: { id: string; token?: string; workspace: { name: string }; invitedBy: { name: string } };
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set());
  const [inviteStatuses, setInviteStatuses] = useState<Record<string, 'accepted' | 'declined'>>({})

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else if (response.status === 401) {
        // User is not authenticated, silently ignore
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch {
      // Network error or other issue - silently fail
      // This can happen during SSR or when the user is not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        if (notificationIds) {
          setNotifications(prev =>
            prev.map(n =>
              notificationIds.includes(n.id) ? { ...n, read: true } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Don't do anything for workspace invites - they have their own buttons
    if (notification.type === "workspace_invite") {
      return;
    }
    
    if (!notification.read) {
      markAsRead([notification.id]);
    }
    
    setOpen(false);
    
    // Navigate to relevant page based on notification type
    if (notification.type === "activity_reminder" && notification.activity) {
      window.location.href = "/activities";
    } else if (notification.type === "deal_update" && notification.deal) {
      window.location.href = "/deals";
    }
  };

  const handleAcceptInvite = async (notification: Notification) => {
    if (!notification.invite || !notification.invite.token) return;
    
    setProcessingInvites(prev => new Set(prev).add(notification.id));
    
    try {
      const response = await fetch(`/api/invites/${notification.invite.token}/accept`, {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Successfully joined workspace");
        // Mark notification as read and set status
        markAsRead([notification.id]);
        setInviteStatuses(prev => ({ ...prev, [notification.id]: 'accepted' }));
        // Reload to update workspaces after a short delay
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setProcessingInvites(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  const handleDeclineInvite = async (notificationId: string) => {
    // Mark the notification as read and set status
    markAsRead([notificationId]);
    setInviteStatuses(prev => ({ ...prev, [notificationId]: 'declined' }));
    toast.info("Invitation declined");
  };

  const markAllAsRead = () => {
    markAsRead();
  };

  useEffect(() => {
    // Only fetch if we're in the browser (not during SSR)
    if (typeof window !== 'undefined') {
      fetchNotifications();
      // Refresh notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "activity_reminder":
        return <Calendar className="h-4 w-4" />;
      case "deal_update":
        return <Briefcase className="h-4 w-4" />;
      case "workspace_invite":
        return <UserPlus className="h-4 w-4" />;
      case "invite_accepted":
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 border-b last:border-b-0",
                  !notification.read && "bg-muted/50",
                  notification.type !== "workspace_invite" && "cursor-pointer hover:bg-accent"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    {notification.type === "workspace_invite" && notification.invite && (
                      <div className="mt-2">
                        {inviteStatuses[notification.id] === 'accepted' ? (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <UserCheck className="h-3 w-3" />
                            <span>Accepted</span>
                          </div>
                        ) : inviteStatuses[notification.id] === 'declined' ? (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <X className="h-3 w-3" />
                            <span>Declined</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvite(notification);
                              }}
                              disabled={processingInvites.has(notification.id)}
                            >
                              {processingInvites.has(notification.id) ? (
                                "Accepting..."
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeclineInvite(notification.id);
                              }}
                              disabled={processingInvites.has(notification.id)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}