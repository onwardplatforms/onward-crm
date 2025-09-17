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
  MoreHorizontal, Shield, Crown, User,
  Clock, X, Copy
} from "lucide-react";
import { WorkspaceInviteModal } from "@/components/workspace-invite-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [teamMembers, setTeamMembers] = useState<Array<{
    id: string;
    name?: string;
    email: string;
    role: string;
    title?: string;
    phone?: string;
    joinedAt?: string;
    isRemovedFromWorkspace?: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [pendingInvites, setPendingInvites] = useState<Array<{
    id: string;
    email: string;
    role: string;
    invitedBy: {
      name?: string;
      email: string;
    };
    createdAt: string;
    expiresAt: string;
    token: string;
  }>>([]);
  const router = useRouter();

  const fetchPendingInvites = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invites`);
      if (response.ok) {
        const invites = await response.json();
        setPendingInvites(invites || []);
      } else {
        console.error("Error fetching invites");
        setPendingInvites([]);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
      setPendingInvites([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // First get current workspace
      const workspaceResponse = await fetch("/api/workspaces");
      if (workspaceResponse.ok) {
        const workspaceData = await workspaceResponse.json();
        const currentWorkspace = workspaceData.workspaces?.find(
          (w: { id: string; name: string }) => w.id === workspaceData.currentWorkspaceId
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

            // Fetch pending invites if user is admin/owner
            if (data.currentUserRole === "owner" || data.currentUserRole === "admin") {
              await fetchPendingInvites(currentWorkspace.id);
            }
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

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm("Are you sure you want to cancel this invite?")) return;

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invites/${inviteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Invite cancelled");
        await fetchPendingInvites(workspaceId);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to cancel invite");
      }
    } catch (error) {
      console.error("Error cancelling invite:", error);
      toast.error("Failed to cancel invite");
    }
  };

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied to clipboard");
  };

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
    <div className="flex flex-col h-full max-h-screen">
      <div className="flex-shrink-0 p-6 pb-0">
        <div className="flex items-center justify-between mb-6">
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
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6 space-y-6">
        <Card className="h-auto">
          <CardHeader className="flex-shrink-0">
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
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Joined</TableHead>
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
                        <div className="flex items-start gap-3 min-w-[150px] max-w-[250px]">
                          <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                            <AvatarFallback className="text-xs">
                              {member.name ? getInitials(member.name) : member.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{member.name || member.email}</p>
                            {member.id === currentUserId && (
                              <p className="text-xs text-muted-foreground">(You)</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-[200px]">
                          <a
                            href={`mailto:${member.email}`}
                            className="text-muted-foreground hover:text-foreground transition-colors block truncate"
                            title={member.email}
                          >
                            {member.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invites Section */}
        {(currentUserRole === "owner" || currentUserRole === "admin") && pendingInvites.length > 0 && (
          <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden sm:table-cell">Invited By</TableHead>
                    <TableHead className="hidden md:table-cell">Expires</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-start gap-2 min-w-[150px] max-w-[250px]">
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="truncate" title={invite.email}>{invite.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(invite.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(invite.role)}
                          {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="max-w-[150px]">
                        <span className="text-sm text-muted-foreground truncate block" title={invite.invitedBy.name || invite.invitedBy.email}>
                          {invite.invitedBy.name || invite.invitedBy.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyInviteLink(invite.token)}
                          title="Copy invite link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCancelInvite(invite.id)}
                          title="Cancel invite"
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <WorkspaceInviteModal
        open={inviteModalOpen}
        onOpenChange={(open) => {
          setInviteModalOpen(open);
          // Refresh invites when modal closes
          if (!open && workspaceId && (currentUserRole === "owner" || currentUserRole === "admin")) {
            fetchPendingInvites(workspaceId);
          }
        }}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
      />
    </div>
  );
}