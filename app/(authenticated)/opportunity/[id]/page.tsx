"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Briefcase, DollarSign, Calendar, Building2, User, Edit, Trash, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DealForm } from "@/components/forms/deal-form";
import { toast } from "sonner";
import Link from "next/link";
import { DEAL_STAGES } from "@/lib/types";
import { formatMentionsForDisplay } from "@/lib/mentions";

interface Deal {
  id: string;
  name: string;
  value?: number;
  licenses?: number;
  stage: string;
  closeDate?: string;
  probability?: number;
  notes?: string;
  createdAt: string;
  assignedTo?: {
    id: string;
    name?: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OpportunityDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormOpen, setEditFormOpen] = useState(false);

  const fetchDeal = async () => {
    try {
      const response = await fetch(`/api/opportunity/${id}`);
      if (!response.ok) throw new Error("Failed to fetch opportunity");
      const data = await response.json();
      setDeal(data);
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast.error("Failed to load opportunity");
      router.push("/opportunity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;

    try {
      const response = await fetch(`/api/opportunity/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete opportunity");

      toast.success("Opportunity deleted successfully");
      router.push("/opportunity");
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast.error("Failed to delete opportunity");
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

  if (!deal) return null;

  const stageInfo = DEAL_STAGES.find(s => s.value === deal.stage);

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/opportunity")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{deal.name}</h1>
            <p className="text-muted-foreground">Opportunity Details</p>
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
        {/* Left column - Opportunity Information and Related */}
        <div className="space-y-6">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Opportunity Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stage</p>
              <Badge variant="secondary">
                {stageInfo?.label || deal.stage}
              </Badge>
            </div>

            {deal.value && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Value</p>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="h-4 w-4" />
                  {deal.value.toLocaleString()}
                </p>
              </div>
            )}

            {deal.licenses && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Licenses</p>
                <p>{deal.licenses}</p>
              </div>
            )}

            {deal.probability !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Probability</p>
                <p>{deal.probability}%</p>
              </div>
            )}

            {deal.closeDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expected Close Date</p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(deal.closeDate), "PPP")}
                </p>
              </div>
            )}

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Owner</p>
              <p>{deal.assignedTo?.name || deal.assignedTo?.email || "Unassigned"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p>{format(new Date(deal.createdAt), "PPP")}</p>
            </div>
          </CardContent>
          </Card>

          {/* Related Company */}
          {deal.company && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/company/${deal.company.id}`}
                  className="block p-2 rounded hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1">
                    {deal.company.name}
                    <ArrowUpRight className="h-3 w-3" />
                  </p>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Related Contact */}
          {deal.contact && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Primary Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/contact/${deal.contact.id}`}
                  className="block p-2 rounded hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1">
                    {deal.contact.firstName} {deal.contact.lastName}
                    <ArrowUpRight className="h-3 w-3" />
                  </p>
                  {deal.contact.email && (
                    <p className="text-sm text-muted-foreground">{deal.contact.email}</p>
                  )}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Notes */}
        <div>
          {deal.notes && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{formatMentionsForDisplay(deal.notes)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <DealForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        deal={deal}
        onSuccess={fetchDeal}
      />
    </div>
  );
}