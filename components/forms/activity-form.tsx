"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import { ACTIVITY_TYPES } from "@/lib/types";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const activitySchema = z.object({
  type: z.string().min(1, "Type is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  date: z.date().nullable().optional(),
  contactIds: z.array(z.string()).optional(),
  dealId: z.string().optional(),
  assignedToId: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: {
    id: string;
    type?: string;
    subject?: string;
    description?: string;
    date?: string | Date;
    dealId?: string;
    assignedToId?: string;
    contacts?: Array<{ id: string }>;
    participants?: Array<{ id: string }>;
  };
  onSuccess?: () => void;
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

export function ActivityForm({
  open,
  onOpenChange,
  activity,
  onSuccess,
  contactId,
  dealId,
}: ActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Array<{ id: string; firstName: string; lastName: string; company?: { name: string } }>>([]);
  const [deals, setDeals] = useState<Array<{ id: string; name: string }>>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name?: string; email: string; isActive?: boolean }>>([]);
  const { user: currentUser } = useCurrentUser();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: activity?.type || "meeting",
      subject: activity?.subject || "",
      description: activity?.description || "",
      date: activity?.date ? new Date(activity.date) : new Date(),
      contactIds: activity?.contacts?.map((c: { id: string }) => c.id) || (contactId ? [contactId] : []),
      dealId: activity?.dealId || dealId || "none",
      assignedToId: activity?.assignedToId || currentUser?.id || undefined,
      participantIds: activity?.participants?.map((p: { id: string }) => p.id) || [],
    },
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await fetch("/api/opportunity");
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching deals:", error);
      setDeals([]);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      setTeamMembers([]);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchDeals();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (activity) {
      form.reset({
        type: activity.type || "meeting",
        subject: activity.subject || "",
        description: activity.description || "",
        date: activity.date ? new Date(activity.date) : new Date(),
        contactIds: activity.contacts?.map((c: { id: string }) => c.id) || [],
        dealId: activity.dealId || "none",
        assignedToId: activity.assignedToId || undefined,
        participantIds: activity.participants?.map((p: { id: string }) => p.id) || [],
      });
    } else if (currentUser?.id && !form.getValues("assignedToId")) {
      // Set default assignedToId for new activities
      form.setValue("assignedToId", currentUser.id);
    }
  }, [activity, form, currentUser]);

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    try {
      const url = activity ? `/api/activity/${activity.id}` : "/api/activity";
      const method = activity ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save activity");
      }

      toast.success(
        activity ? "Activity updated successfully" : "Activity logged successfully"
      );
      
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity");
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    form.setValue("type", value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {activity ? "Edit Activity" : "Log Activity"}
          </DialogTitle>
          <DialogDescription>
            {activity
              ? "Update the activity details below."
              : "Record a customer interaction or communication."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={handleTypeChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value || undefined}
                        onDateChange={field.onChange}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Quick summary of the activity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Contacts Involved</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={contacts.map((contact) => ({
                        value: contact.id,
                        label: `${contact.firstName} ${contact.lastName}${contact.company ? ` (${contact.company.name})` : ''}`,
                      }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select customer contacts..."
                      emptyText="No contacts found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="participantIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Members Involved</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={teamMembers
                        .filter(m => m.isActive)
                        .map((member) => ({
                          value: member.id,
                          label: member.name || member.email,
                        }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select team members who participated..."
                      emptyText="No team members found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dealId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal (Optional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select deal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.filter(m => m.isActive).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add detailed notes about this activity..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : activity ? "Update" : "Log Activity"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}