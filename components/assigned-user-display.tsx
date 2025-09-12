"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AssignedUserDisplayProps {
  user: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  workspaceId?: string;
  className?: string;
}

export function AssignedUserDisplay({ user, workspaceId, className }: AssignedUserDisplayProps) {
  const [isRemoved, setIsRemoved] = useState(false);
  
  useEffect(() => {
    if (!user || !workspaceId) return;
    
    // Check if user is removed from workspace
    const checkUserStatus = async () => {
      try {
        const response = await fetch(`/api/users/${user.id}/workspace-status?workspaceId=${workspaceId}`);
        if (response.ok) {
          const data = await response.json();
          setIsRemoved(data.isRemoved);
        }
      } catch (error) {
        console.error("Error checking user workspace status:", error);
      }
    };
    
    checkUserStatus();
  }, [user, workspaceId]);
  
  if (!user) {
    return <span className={cn("text-sm text-muted-foreground", className)}>Unassigned</span>;
  }
  
  const displayName = user.name || user.email;
  
  return (
    <span className={cn("text-sm", className)}>
      {displayName}
      {isRemoved && (
        <span className="text-muted-foreground ml-1">(removed)</span>
      )}
    </span>
  );
}