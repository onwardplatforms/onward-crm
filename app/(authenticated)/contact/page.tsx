"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, MoreHorizontal, Pencil, Trash, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { toast } from "sonner";
import { formatPhoneNumber } from "@/lib/phone";
import { AssignedUserDisplay } from "@/components/assigned-user-display";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  title?: string;
  linkedinUrl?: string;
  notes?: string;
  company?: { id: string; name: string };
  assignedTo?: { id: string; name: string; email: string };
  deals?: Array<{ id: string }>;
  activities?: Array<{ id: string }>;
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  date: string;
  contacts?: Array<{ id: string }>;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const fetchContacts = async () => {
    try {
      const [contactsRes, activitiesRes] = await Promise.all([
        fetch("/api/contact"),
        fetch("/api/activity")
      ]);

      if (!contactsRes.ok) throw new Error("Failed to fetch contacts");
      if (!activitiesRes.ok) throw new Error("Failed to fetch activities");

      const contactsData = await contactsRes.json();
      const activitiesData = await activitiesRes.json();

      setContacts(contactsData);
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const workspaceResponse = await fetch("/api/workspaces");
      if (workspaceResponse.ok) {
        const workspaceData = await workspaceResponse.json();
        const currentWorkspace = workspaceData.workspaces?.find(
          (w: { id: string }) => w.id === workspaceData.currentWorkspaceId
        );

        if (currentWorkspace) {
          const response = await fetch(`/api/workspaces/${currentWorkspace.id}/members`);
          if (response.ok) {
            const data = await response.json();
            setTeamMembers(data.members || []);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchTeamMembers();
    // Fetch current workspace
    fetch("/api/workspaces")
      .then(res => res.json())
      .then(data => {
        if (data.currentWorkspaceId) {
          setWorkspaceId(data.currentWorkspaceId);
        }
      })
      .catch(console.error);
  }, []);

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete contact");

      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedContact(null);
  };

  const handleFormSuccess = () => {
    fetchContacts();
  };

  const filteredContacts = contacts.filter(
    (contact) => {
      const matchesSearch = contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesOwner = ownerFilter === "all" ||
        (ownerFilter === "unassigned" ? !contact.assignedTo :
        contact.assignedTo?.id === ownerFilter);

      return matchesSearch && matchesOwner;
    }
  );

  // Helper function to get last contacted date for a contact (past activities only)
  const getLastContactedDate = (contactId: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Filter activities that include this contact and are in the past
    const contactActivities = activities.filter(a =>
      a.contacts && Array.isArray(a.contacts) &&
      a.contacts.some((c: { id: string }) => c.id === contactId) &&
      new Date(a.date) <= today
    );

    if (contactActivities.length === 0) return null;

    // Sort by date descending and return the most recent
    const sorted = contactActivities.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sorted[0];
  };

  // Helper function to get next contact date for a contact (future activities only)
  const getNextContactDate = (contactId: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Filter activities that include this contact and are in the future
    const contactActivities = activities.filter(a =>
      a.contacts && Array.isArray(a.contacts) &&
      a.contacts.some((c: { id: string }) => c.id === contactId) &&
      new Date(a.date) > today
    );

    if (contactActivities.length === 0) return null;

    // Sort by date ascending and return the nearest future activity
    const sorted = contactActivities.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sorted[0];
  };

  // Helper function to get total contact count (past activities only)
  const getTotalContactCount = (contactId: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return activities.filter(a =>
      a.contacts && Array.isArray(a.contacts) &&
      a.contacts.some((c: { id: string }) => c.id === contactId) &&
      new Date(a.date) <= today
    ).length;
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Contacts</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your contacts and their information
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} size="sm" className="sm:size-default">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2 flex-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-4 sm:px-6">
            {loading ? (
              <div className="text-center py-8">Loading contacts...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "No contacts found matching your search."
                  : "No contacts found. Add your first contact to get started."}
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <div className="min-w-fit">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] min-w-[200px]">Contact</TableHead>
                        <TableHead className="hidden sm:table-cell w-[150px] min-w-[150px]">Title</TableHead>
                        <TableHead className="hidden md:table-cell w-[100px] min-w-[100px] text-center">Last Contact</TableHead>
                        <TableHead className="hidden md:table-cell w-[100px] min-w-[100px] text-center">Next Contact</TableHead>
                        <TableHead className="hidden lg:table-cell w-[100px] min-w-[100px] text-center">Touchpoints</TableHead>
                        <TableHead className="hidden xl:table-cell w-[200px] min-w-[200px]">Email</TableHead>
                        <TableHead className="hidden 2xl:table-cell w-[140px] min-w-[140px]">Phone</TableHead>
                        <TableHead className="hidden 2xl:table-cell w-[150px] min-w-[150px]">Owner</TableHead>
                        <TableHead className="w-[50px] min-w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell className="w-[200px] min-w-[200px]">
                            <div className="space-y-1">
                              <div className="flex items-start gap-2">
                                <Link
                                  href={`/contact/${contact.id}`}
                                  className="font-medium truncate max-w-[160px] text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1"
                                >
                                  {contact.firstName} {contact.lastName}
                                  <ArrowUpRight className="h-3 w-3" />
                                </Link>
                              </div>
                              {contact.company && (
                                <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[180px]">
                                  {contact.company.name}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Title - visible from 640px */}
                          <TableCell className="hidden sm:table-cell w-[150px] min-w-[150px]">
                            <span className="text-xs sm:text-sm truncate block max-w-[140px]">
                              {contact.title || <span className="text-muted-foreground">-</span>}
                            </span>
                          </TableCell>

                          {/* Last Contact - visible from 768px */}
                          <TableCell className="hidden md:table-cell w-[100px] min-w-[100px] text-center">
                            {(() => {
                              const lastActivity = getLastContactedDate(contact.id);
                              if (!lastActivity) {
                                return <span className="text-muted-foreground text-xs sm:text-sm">-</span>;
                              }
                              return (
                                <Link
                                  href={`/activity?contactId=${contact.id}`}
                                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {format(new Date(lastActivity.date), "MMM d, yyyy")}
                                </Link>
                              );
                            })()}
                          </TableCell>

                          {/* Next Contact - visible from 768px */}
                          <TableCell className="hidden md:table-cell w-[100px] min-w-[100px] text-center">
                            {(() => {
                              const nextActivity = getNextContactDate(contact.id);
                              if (!nextActivity) {
                                return <span className="text-muted-foreground text-xs sm:text-sm">-</span>;
                              }
                              return (
                                <Link
                                  href={`/activity?contactId=${contact.id}`}
                                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  {format(new Date(nextActivity.date), "MMM d, yyyy")}
                                </Link>
                              );
                            })()}
                          </TableCell>

                          {/* Touchpoints - visible from 1024px */}
                          <TableCell className="hidden lg:table-cell w-[100px] min-w-[100px] text-center">
                            <span className="text-sm font-medium">
                              {getTotalContactCount(contact.id)}
                            </span>
                          </TableCell>

                          {/* Email - visible from 1280px */}
                          <TableCell className="hidden xl:table-cell w-[200px] min-w-[200px]">
                            {contact.email ? (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm truncate block max-w-[180px]"
                                title={contact.email}
                              >
                                {contact.email}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                            )}
                          </TableCell>

                          {/* Phone - visible from 1536px */}
                          <TableCell className="hidden 2xl:table-cell w-[140px] min-w-[140px]">
                            {contact.phone ? (
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm truncate block max-w-[130px]"
                              >
                                {formatPhoneNumber(contact.phone)}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                            )}
                          </TableCell>

                          {/* Owner - visible from 1536px */}
                          <TableCell className="hidden 2xl:table-cell w-[150px] min-w-[150px]">
                            <div className="max-w-[140px]">
                              {contact.assignedTo ? (
                                <span className="text-xs sm:text-sm truncate block">
                                  {contact.assignedTo.name || contact.assignedTo.email}
                                </span>
                              ) : (
                                <span className="text-xs sm:text-sm text-muted-foreground">Unassigned</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Actions - always visible */}
                          <TableCell className="w-[50px] min-w-[50px]">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(contact)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(contact.id)}
                                  className="text-red-600"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ContactForm
        open={formOpen}
        onOpenChange={handleFormClose}
        contact={selectedContact ? {
          id: selectedContact.id,
          firstName: selectedContact.firstName,
          lastName: selectedContact.lastName,
          email: selectedContact.email,
          phone: selectedContact.phone,
          linkedinUrl: selectedContact.linkedinUrl,
          title: selectedContact.title,
          companyId: selectedContact.company?.id,
          assignedToId: selectedContact.assignedTo?.id,
          notes: selectedContact.notes
        } : undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}