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

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");

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

  useEffect(() => {
    fetchContacts();
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
    (contact) =>
      contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Helper function to get last contacted date for a contact
  const getLastContactedDate = (contactId: string) => {
    // Filter activities that include this contact
    const contactActivities = activities.filter(a => 
      a.contacts && Array.isArray(a.contacts) && 
      a.contacts.some((c: { id: string }) => c.id === contactId)
    );
    
    if (contactActivities.length === 0) return null;
    
    // Sort by date descending and return the most recent
    const sorted = contactActivities.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sorted[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
          <p className="text-muted-foreground">
            Manage your contacts and their information
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading contacts...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Last Contacted</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {searchTerm
                        ? "No contacts found matching your search."
                        : "No contacts found. Add your first contact to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.linkedinUrl && (
                              <a
                                href={contact.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                title="View LinkedIn Profile"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          {contact.company && (
                            <p className="text-sm text-muted-foreground">
                              {contact.company.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {formatPhoneNumber(contact.phone)}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{contact.title || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>
                        {(() => {
                          const lastActivity = getLastContactedDate(contact.id);
                          if (!lastActivity) {
                            return <span className="text-muted-foreground">Never</span>;
                          }
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {format(new Date(lastActivity.date), "MMM d, yyyy")}
                              </span>
                              <Link 
                                href={`/activities?contactId=${contact.id}`}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                              </Link>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <AssignedUserDisplay 
                          user={contact.assignedTo || null} 
                          workspaceId={workspaceId}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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