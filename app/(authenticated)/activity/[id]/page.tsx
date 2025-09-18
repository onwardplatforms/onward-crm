"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, Users, Briefcase, Edit, Trash, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ActivityForm } from "@/components/forms/activity-form";
import { toast } from "sonner";
import Link from "next/link";
import { ACTIVITY_TYPES } from "@/lib/types";
import { formatMentionsForDisplay } from "@/lib/mentions";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: {
    id: string;
    name: string;
  };
}

interface Participant {
  id: string;
  name?: string;
  email: string;
}

interface Activity {
  id: string;
  type: string;
  subject: string;
  description?: string;
  date: string;
  createdAt: string;
  assignedTo?: {
    id: string;
    name?: string;
    email: string;
  };
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  contacts?: Contact[];
  participants?: Participant[];
  deal?: {
    id: string;
    name: string;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ActivityDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [editFormOpen, setEditFormOpen] = useState(false);

  const fetchActivity = async () => {
    try {
      const response = await fetch(`/api/activity/${id}`);
      if (!response.ok) throw new Error("Failed to fetch activity");
      const data = await response.json();
      setActivity(data);
    } catch (error) {
      console.error("Error fetching activity:", error);
      toast.error("Failed to load activity");
      router.push("/activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const response = await fetch(`/api/activity/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete activity");

      toast.success("Activity deleted successfully");
      router.push("/activity");
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
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

  if (!activity) return null;

  const activityType = ACTIVITY_TYPES.find(t => t.value === activity.type);

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/activity")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{activity.subject}</h1>
            <p className="text-muted-foreground">Activity Details</p>
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
        {/* Left column - Activity Information and Related */}
        <div className="space-y-6">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activity Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Type</p>
              <Badge variant="secondary">{activityType?.label || activity.type}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Date</p>
              <p>{format(new Date(activity.date), "PPP 'at' p")}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-1">Owner</p>
              <p>{activity.assignedTo?.name || activity.assignedTo?.email || "Unassigned"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Created by</p>
              <p>{activity.user?.name || activity.user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p>{format(new Date(activity.createdAt), "PPP")}</p>
            </div>
          </CardContent>
          </Card>

          {/* Related Contacts */}
          {activity.contacts && activity.contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Customer Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activity.contacts.map((contact) => (
                    <Link
                      key={contact.id}
                      href={`/contact/${contact.id}`}
                      className="block p-2 rounded hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1">
                        {contact.firstName} {contact.lastName}
                        <ArrowUpRight className="h-3 w-3" />
                      </p>
                      {contact.company && (
                        <p className="text-sm text-muted-foreground">{contact.company.name}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Participants */}
          {activity.participants && activity.participants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members Involved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {activity.participants.map((participant) => (
                    <Badge key={participant.id} variant="secondary">
                      {participant.name || participant.email}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Opportunity */}
          {activity.deal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Related Opportunity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/opportunity/${activity.deal.id}`}
                  className="block p-2 rounded hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-foreground hover:text-muted-foreground transition-colors inline-flex items-center gap-1">
                    {activity.deal.name}
                    <ArrowUpRight className="h-3 w-3" />
                  </p>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Description/Notes */}
        <div>
          {activity.description && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{formatMentionsForDisplay(activity.description)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <ActivityForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        activity={activity}
        onSuccess={fetchActivity}
      />
    </div>
  );
}