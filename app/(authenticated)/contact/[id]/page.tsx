"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Linkedin,
  Briefcase,
  Building2,
  Edit,
  Trash,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ContactForm } from "@/components/forms/contact-form";
import { toast } from "sonner";
import Link from "next/link";
import { formatMentionsForDisplay } from "@/lib/mentions";

interface Activity {
  id: string;
  type: string;
  subject: string;
  date: string;
}

interface Deal {
  id: string;
  name: string;
  stage: string;
  value?: number;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  title?: string;
  notes?: string;
  createdAt: string;
  company?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name?: string;
    email: string;
  };
  activities?: Activity[];
  deals?: Deal[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContactDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormOpen, setEditFormOpen] = useState(false);

  const fetchContact = async () => {
    try {
      const response = await fetch(`/api/contact/${id}`);
      if (!response.ok) throw new Error("Failed to fetch contact");
      const data = await response.json();
      setContact(data);
    } catch (error) {
      console.error("Error fetching contact:", error);
      toast.error("Failed to load contact");
      router.push("/contact");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete contact");

      toast.success("Contact deleted successfully");
      router.push("/contact");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-4 sm:p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/contact")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-muted-foreground">Contact Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditFormOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column - Contact Information and Related */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.email && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {contact.email}
                  </a>
                </div>
              )}

              {contact.phone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.phone}
                  </a>
                </div>
              )}

              {contact.linkedinUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">LinkedIn</p>
                  <Link
                    href={contact.linkedinUrl}
                    target="_blank"
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    {contact.linkedinUrl}
                  </Link>
                </div>
              )}

              {contact.title && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Title</p>
                  <p className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    {contact.title}
                  </p>
                </div>
              )}

              <Separator />

              {contact.company && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company</p>
                  <Link
                    href={`/company/${contact.company.id}`}
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Building2 className="h-4 w-4" />
                    {contact.company.name}
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                <p>
                  {contact.assignedTo?.name ||
                    contact.assignedTo?.email ||
                    "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p>{format(new Date(contact.createdAt), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Related Activities */}
          {contact.activities && contact.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Activities ({contact.activities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contact.activities.map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/activity/${activity.id}`}
                      className="block p-2 rounded hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1">
                        {activity.subject}
                        <ArrowUpRight className="h-3 w-3" />
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">{activity.type}</Badge>
                        <span>{format(new Date(activity.date), "PPP")}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Deals */}
          {contact.deals && contact.deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Opportunities ({contact.deals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contact.deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/opportunity/${deal.id}`}
                      className="block p-2 rounded hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1">
                        {deal.name}
                        <ArrowUpRight className="h-3 w-3" />
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline">{deal.stage}</Badge>
                        {deal.value && (
                          <span>${deal.value.toLocaleString()}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Notes */}
        <div>
          {contact.notes && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">
                  {formatMentionsForDisplay(contact.notes)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <ContactForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        contact={contact}
        onSuccess={fetchContact}
      />
    </div>
  );
}
