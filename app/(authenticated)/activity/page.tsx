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
      const response = await fetch("/api/activity");
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
      const response = await fetch(`/api/activity/${id}`, {
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
    <div className="flex flex-col h-full max-h-screen">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Activities</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track all your customer interactions and communications
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} size="sm" className="sm:size-default">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Log Activity</span>
            <span className="sm:hidden">Log</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
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
            <div className="hidden sm:flex items-center gap-4">
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
          </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {loading ? (
              <div className="text-center py-8">Loading activities...</div>
            ) : (
              <div className="overflow-auto h-full">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="hidden xl:table-cell">Opportunity</TableHead>
                    <TableHead className="hidden xl:table-cell">Team Involved</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Owner</TableHead>
                    <TableHead className="hidden 2xl:table-cell">Description</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      {searchTerm || typeFilter !== "all" || dateFilter !== "all"
                        ? "No activities found matching your filters."
                        : "No activities logged yet. Start by logging your first activity."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="max-w-[200px] font-medium truncate" title={activity.subject}>
                          {activity.subject}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-[150px]">
                          {activity.contacts && activity.contacts.length > 0 ? (
                            <div className="space-y-1">
                              {activity.contacts.map((contact) => (
                                <div key={contact.id} className="text-sm">
                                  <div className="truncate">{contact.firstName} {contact.lastName}</div>
                                  {contact.company && (
                                    <div className="text-muted-foreground text-xs truncate">
                                      {contact.company.name}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm">
                          {format(new Date(activity.date), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {getActivityIcon(activity.type)}
                          <span className="text-sm font-medium">
                            {ACTIVITY_TYPES.find(t => t.value === activity.type)?.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="max-w-[150px]">
                          {activity.deal ? (
                            <span className="text-sm truncate block" title={activity.deal.name}>{activity.deal.name}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="max-w-[150px]">
                          {activity.participants && activity.participants.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {activity.participants.slice(0, 2).map((participant) => (
                                <span
                                  key={participant.id}
                                  className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted truncate max-w-[100px]"
                                  title={participant.name || participant.email}
                                >
                                  {participant.name || participant.email}
                                </span>
                              ))}
                              {activity.participants.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{activity.participants.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden 2xl:table-cell">
                        <div className="max-w-[150px]">
                          {activity.assignedTo ? (
                            <span className="text-sm truncate block" title={activity.assignedTo.name || activity.assignedTo.email}>
                              {activity.assignedTo.name || activity.assignedTo.email}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden 2xl:table-cell">
                        <div className="max-w-[250px]">
                          <span className="text-sm text-muted-foreground break-words line-clamp-2">
                            {activity.description || "-"}
                          </span>
                        </div>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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