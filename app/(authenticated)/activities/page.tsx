"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, Search, Phone, Mail, Calendar, FileText,
  MoreHorizontal, Pencil, Trash
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, addDays, isAfter } from "date-fns";
import { ACTIVITY_TYPES } from "@/lib/types";
import { ActivityForm } from "@/components/forms/activity-form";
import { toast } from "sonner";

interface Activity {
  id: string;
  type: string;
  subject: string;
  date: string;
  time?: string;
  description?: string;
  completed: boolean;
  deal?: { id: string; name: string };
  contacts?: Array<{ id: string; firstName: string; lastName: string; company?: { name: string } }>;
  assignedTo?: { id: string; name: string; email: string };
  user?: { id: string; name: string };
}

const DATE_FILTERS = [
  { value: "future", label: "Future" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7", label: "Last 7 Days" },
  { value: "last15", label: "Last 15 Days" },
  { value: "last30", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
];

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/activities");
      if (!response.ok) throw new Error("Failed to fetch activities");
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete activity");
      
      toast.success("Activity deleted successfully");
      fetchActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedActivity(null);
  };

  const handleFormSuccess = () => {
    fetchActivities();
  };

  const filterByDate = (activity: Activity) => {
    const activityDate = new Date(activity.date);
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    
    switch (dateFilter) {
      case "future":
        return isAfter(activityDate, endOfDay(new Date()));
      case "today":
        return activityDate >= today && activityDate < tomorrow;
      case "yesterday":
        const yesterday = subDays(today, 1);
        return activityDate >= yesterday && activityDate < today;
      case "last7":
        const sevenDaysAgo = subDays(today, 7);
        return activityDate >= sevenDaysAgo && activityDate < tomorrow;
      case "last15":
        const fifteenDaysAgo = subDays(today, 15);
        return activityDate >= fifteenDaysAgo && activityDate < tomorrow;
      case "last30":
        const thirtyDaysAgo = subDays(today, 30);
        return activityDate >= thirtyDaysAgo && activityDate < tomorrow;
      case "all":
      default:
        return true;
    }
  };

  const filteredActivities = activities
    .filter((activity) => {
      const matchesSearch = 
        activity.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.contacts?.some((contact) => 
          contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        activity.deal?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = typeFilter === "all" || activity.type === typeFilter;
      const matchesDate = filterByDate(activity);
      
      return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activities</h2>
          <p className="text-muted-foreground">
            Track all your customer interactions and communications
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Log Activity
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Deal</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {searchTerm || typeFilter !== "all" || dateFilter !== "all"
                        ? "No activities found matching your filters."
                        : "No activities logged yet. Start by logging your first activity."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <span className="text-sm font-medium">
                            {ACTIVITY_TYPES.find(t => t.value === activity.type)?.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.subject}
                      </TableCell>
                      <TableCell>
                        {activity.contacts && activity.contacts.length > 0 ? (
                          <div className="space-y-1">
                            {activity.contacts.map((contact) => (
                              <div key={contact.id} className="text-sm">
                                <div>{contact.firstName} {contact.lastName}</div>
                                {contact.company && (
                                  <div className="text-muted-foreground text-xs">
                                    {contact.company.name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.deal ? (
                          <span className="text-sm">{activity.deal.name}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {format(new Date(activity.date), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {activity.assignedTo ? (
                          <span className="text-sm">
                            {activity.assignedTo.name || activity.assignedTo.email}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {activity.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(activity)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(activity.id)}
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

      <ActivityForm
        open={formOpen}
        onOpenChange={handleFormClose}
        activity={selectedActivity ? {
          id: selectedActivity.id,
          type: selectedActivity.type,
          subject: selectedActivity.subject,
          description: selectedActivity.description,
          date: selectedActivity.date,
          dealId: selectedActivity.deal?.id,
          assignedToId: selectedActivity.assignedTo?.id,
          contacts: selectedActivity.contacts?.map(c => ({ id: c.id }))
        } : undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}