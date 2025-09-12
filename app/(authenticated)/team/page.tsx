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
  Plus, Search, UserCheck, UserX, 
  MoreHorizontal, Pencil
} from "lucide-react";
import { UserForm } from "@/components/forms/user-form";
import { toast } from "sonner";

export default function TeamPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch("/api/users");
      
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(Array.isArray(data) ? data : []);
      } else if (response.status === 500) {
        // Only show error for server errors
        console.error("Server error fetching team members");
        toast.error("Failed to load team members");
      } else {
        // For other status codes (404, etc), just set empty array
        setTeamMembers([]);
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      // Network errors or other issues
      toast.error("Failed to connect to server");
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const handleEdit = (member: any) => {
    setSelectedMember(member);
    setFormOpen(true);
  };

  const handleToggleStatus = async (member: any) => {
    try {
      const response = await fetch(`/api/users/${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...member, isActive: !member.isActive }),
      });
      
      if (!response.ok) throw new Error("Failed to update team member");
      
      toast.success(`Team member ${member.isActive ? 'deactivated' : 'activated'}`);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error updating team member:", error);
      toast.error("Failed to update team member");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedMember(null);
  };

  const handleFormSuccess = () => {
    fetchTeamMembers();
  };

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Manage your team members and their roles
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
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
                  <TableHead>Phone</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {searchTerm
                        ? "No team members found matching your search."
                        : "No team members found. Add your first team member to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className={!member.isActive ? "opacity-60" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name ? getInitials(member.name) : "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name || "Unnamed"}</p>
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
                        {member.phone ? (
                          <a
                            href={`tel:${member.phone}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {member.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.title || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.role === "admin" ? "Admin" : "Member"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member._count ? (
                          <div className="text-sm text-muted-foreground">
                            <span>{member._count.assignedContacts || 0} contacts</span>
                            <br />
                            <span>{member._count.assignedDeals || 0} deals</span>
                            <br />
                            <span>{member._count.assignedCompanies || 0} companies</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(member)}>
                              {member.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UserForm
        open={formOpen}
        onOpenChange={handleFormClose}
        user={selectedMember}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}