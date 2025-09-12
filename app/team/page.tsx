"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, Search, Mail, Phone, UserCheck, UserX, 
  MoreHorizontal, Pencil, Shield, User 
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
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No team members found matching your search."
                : "No team members found. Add your first team member to get started."}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member) => (
                <Card key={member.id} className={!member.isActive ? "opacity-60" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name ? getInitials(member.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium leading-none">
                              {member.name}
                            </p>
                            {member.role === "admin" && (
                              <Shield className="h-3 w-3 text-yellow-600" />
                            )}
                          </div>
                          {member.title && (
                            <p className="text-sm text-muted-foreground">
                              {member.title}
                            </p>
                          )}
                          <div className="flex flex-col gap-1 pt-2">
                            <a
                              href={`mailto:${member.email}`}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </a>
                            {member.phone && (
                              <a
                                href={`tel:${member.phone}`}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Badge variant={member.isActive ? "default" : "secondary"}>
                              {member.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {member.role === "admin" ? "Admin" : "Member"}
                            </Badge>
                          </div>
                          {member._count && (
                            <div className="flex gap-3 pt-2 text-xs text-muted-foreground">
                              <span>{member._count.assignedContacts || 0} contacts</span>
                              <span>{member._count.assignedDeals || 0} deals</span>
                              <span>{member._count.assignedCompanies || 0} companies</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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