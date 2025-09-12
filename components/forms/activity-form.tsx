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

const activitySchema = z.object({
  type: z.string().min(1, "Type is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  date: z.date().nullable().optional(),
  contactIds: z.array(z.string()).optional(),
  dealId: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity?: any;
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
  companyId,
  dealId,
}: ActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: activity?.type || "note",
      subject: activity?.subject || "",
      description: activity?.description || "",
      date: activity?.date ? new Date(activity.date) : new Date(),
      contactIds: activity?.contacts?.map((c: any) => c.id) || (contactId ? [contactId] : []),
      dealId: activity?.dealId || dealId || undefined,
    },
  });

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setContacts([]);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await fetch("/api/deals");
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching deals:", error);
      setDeals([]);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchDeals();
  }, []);

  useEffect(() => {
    if (activity) {
      form.reset({
        type: activity.type || "note",
        subject: activity.subject || "",
        description: activity.description || "",
        date: activity.date ? new Date(activity.date) : new Date(),
        contactIds: activity.contacts?.map((c: any) => c.id) || [],
        dealId: activity.dealId || undefined,
      });
    }
  }, [activity, form]);

  const onSubmit = async (data: ActivityFormData) => {
    setLoading(true);
    try {
      const url = activity ? `/api/activities/${activity.id}` : "/api/activities";
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

  // Auto-set subject based on type
  const handleTypeChange = (value: string) => {
    form.setValue("type", value);
    
    // Only set subject if it's currently blank
    const currentSubject = form.getValues("subject");
    if (!currentSubject) {
      const typeLabel = ACTIVITY_TYPES.find(t => t.value === value)?.label;
      const today = new Date().toLocaleDateString();
      form.setValue("subject", `${typeLabel} - ${today}`);
    }
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
                        date={field.value}
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
                  <FormLabel>Contacts (Optional)</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={contacts.map((contact) => ({
                        value: contact.id,
                        label: `${contact.firstName} ${contact.lastName}`,
                        company: contact.company?.name,
                      }))}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Select contacts..."
                      emptyText="No contacts found."
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