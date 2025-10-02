"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Globe,
  Linkedin,
  MapPin,
  Users,
  Briefcase,
  Edit,
  Trash,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CompanyForm } from "@/components/forms/company-form";
import { toast } from "sonner";
import Link from "next/link";
import { formatMentionsForDisplay } from "@/lib/mentions";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
}

interface Deal {
  id: string;
  name: string;
  stage: string;
  value?: number;
}

interface Company {
  id: string;
  name: string;
  website?: string;
  linkedinUrl?: string;
  industry?: string;
  size?: string;
  location?: string;
  notes?: string;
  createdAt: string;
  assignedTo?: {
    id: string;
    name?: string;
    email: string;
  };
  contacts?: Contact[];
  deals?: Deal[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CompanyDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormOpen, setEditFormOpen] = useState(false);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/company/${id}`);
      if (!response.ok) throw new Error("Failed to fetch company");
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error("Error fetching company:", error);
      toast.error("Failed to load company");
      router.push("/company");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this company?")) return;

    try {
      const response = await fetch(`/api/company/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete company");

      toast.success("Company deleted successfully");
      router.push("/company");
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
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

  if (!company) return null;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/company")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground">Company Details</p>
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
        {/* Left column - Company Information and Related */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.website && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Website</p>
                  <Link
                    href={company.website}
                    target="_blank"
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {company.website}
                  </Link>
                </div>
              )}

              {company.linkedinUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">LinkedIn</p>
                  <Link
                    href={company.linkedinUrl}
                    target="_blank"
                    className="flex items-center gap-2 text-foreground hover:text-muted-foreground transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    {company.linkedinUrl}
                  </Link>
                </div>
              )}

              {company.industry && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Industry</p>
                  <Badge variant="secondary">{company.industry}</Badge>
                </div>
              )}

              {company.size && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Company Size
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {company.size}
                  </p>
                </div>
              )}

              {company.location && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Owner</p>
                <p>
                  {company.assignedTo?.name ||
                    company.assignedTo?.email ||
                    "Unassigned"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p>{format(new Date(company.createdAt), "PPP")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Related Contacts */}
          {company.contacts && company.contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Contacts ({company.contacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.contacts.map((contact) => (
                    <Link
                      key={contact.id}
                      href={`/contact/${contact.id}`}
                      className="block p-2 rounded hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1">
                        {contact.firstName} {contact.lastName}
                        <ArrowUpRight className="h-3 w-3" />
                      </p>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground">
                          {contact.title}
                        </p>
                      )}
                      {contact.email && (
                        <p className="text-sm text-muted-foreground">
                          {contact.email}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Deals */}
          {company.deals && company.deals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Opportunities ({company.deals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.deals.map((deal) => (
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
          {company.notes && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">
                  {formatMentionsForDisplay(company.notes)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <CompanyForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        company={company}
        onSuccess={fetchCompany}
      />
    </div>
  );
}
