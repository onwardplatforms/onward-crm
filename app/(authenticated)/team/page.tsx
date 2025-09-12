"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Search, UserMinus, LogOut,
  MoreHorizontal, Shield, Crown, User
} from "lucide-react";
import { WorkspaceInviteModal } from "@/components/workspace-invite-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const router = useRouter();

  const fetchTeamMembers = async () => {
    try {
      // First get current workspace
      const workspaceResponse = await fetch("/api/workspaces");
      if (workspaceResponse.ok) {
        const workspaceData = await workspaceResponse.json();
        const currentWorkspace = workspaceData.workspaces?.find(
          (w: any) => w.id === workspaceData.currentWorkspaceId
        );
        
        if (currentWorkspace) {
          setWorkspaceId(currentWorkspace.id);
          setWorkspaceName(currentWorkspace.name);
          
          // Then get workspace members
          const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`);
          
          if (response.ok) {
            const data = await response.json();
            setTeamMembers(data.members || []);
            setCurrentUserRole(data.currentUserRole);
            setCurrentUserId(data.currentUserId);
          } else {
            console.error("Error fetching team members");
            setTeamMembers([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Failed to load team members");
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const isLeavingWorkspace = memberId === currentUserId;
    const confirmMessage = isLeavingWorkspace 
      ? "Are you sure you want to leave this workspace?" 
      : `Are you sure you want to remove ${memberName} from this workspace?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        if (isLeavingWorkspace) {
          // Redirect to home or refresh to update workspace
          window.location.href = "/";
        } else {
          fetchTeamMembers();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove member");
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Members of {workspaceName || "your workspace"}
          </p>
        </div>
        {(currentUserRole === "owner" || currentUserRole === "admin") && (
          <Button onClick={() => setInviteModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading team members...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {searchTerm
                        ? "No team members found matching your search."
                        : "No team members found in this workspace."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {member.name ? getInitials(member.name) : member.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name || member.email}</p>
                            {member.id === currentUserId && (
                              <p className="text-xs text-muted-foreground">(You)</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${member.email}`}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {member.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {member.id === currentUserId ? (
                          // Current user can only leave if not owner
                          currentUserRole !== "owner" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                                  className="text-destructive"
                                >
                                  <LogOut className="mr-2 h-4 w-4" />
                                  Leave Workspace
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        ) : (
                          // Can only remove others if admin or owner
                          (currentUserRole === "owner" || currentUserRole === "admin") && 
                          // Can't remove owner
                          member.role !== "owner" &&
                          // Admins can't remove other admins
                          !(currentUserRole === "admin" && member.role === "admin") && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                                  className="text-destructive"
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  Remove from Workspace
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <WorkspaceInviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
      />
    </div>
  );
}