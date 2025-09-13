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
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { CompanyForm } from "./company-form";
import { phoneSchema, formatPhoneOnChange } from "@/lib/phone";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: phoneSchema,
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  title: z.string().optional(),
  companyId: z.string().min(1, "Company is required"),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    title?: string;
    companyId?: string;
    assignedToId?: string;
    notes?: string;
  };
  onSuccess?: () => void;
}

export function ContactForm({
  open,
  onOpenChange,
  contact,
  onSuccess,
}: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name?: string; email: string }>>([]);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const { user: currentUser } = useCurrentUser();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      email: contact?.email || "",
      phone: contact?.phone || undefined,
      linkedinUrl: contact?.linkedinUrl || "",
      title: contact?.title || "",
      companyId: contact?.companyId || undefined,
      assignedToId: contact?.assignedToId || currentUser?.id || undefined,
      notes: contact?.notes || "",
    },
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/users", {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error("Failed to fetch team members:", res.status);
        setTeamMembers([]);
        return;
      }
      const data = await res.json();
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      setTeamMembers([]);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (contact) {
      form.reset({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        linkedinUrl: contact.linkedinUrl || "",
        title: contact.title || "",
        companyId: contact.companyId || undefined,
        assignedToId: contact.assignedToId || undefined,
        notes: contact.notes || "",
      });
    } else if (currentUser?.id && !form.getValues("assignedToId")) {
      // Set default assignedToId for new contacts
      form.setValue("assignedToId", currentUser.id);
    }
  }, [contact, form, currentUser]);

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const url = contact
        ? `/api/contacts/${contact.id}`
        : "/api/contacts";
      const method = contact ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Contact save error:", errorData);
        throw new Error(errorData.error || "Failed to save contact");
      }

      toast.success(
        contact ? "Contact updated successfully" : "Contact created successfully"
      );
      
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
          <DialogDescription>
            {contact
              ? "Update the contact information below."
              : "Enter the details for the new contact."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(555) 555-5555" 
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhoneOnChange(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input 
                      type="url"
                      placeholder="https://linkedin.com/in/johndoe" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Sales Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.length === 0 ? (
                          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                            <p>No companies yet.</p>
                            <button
                              type="button"
                              onClick={() => setCompanyFormOpen(true)}
                              className="hover:text-foreground transition-colors cursor-pointer"
                            >
                              Create a company first →
                            </button>
                          </div>
                        ) : (
                          companies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCompanyFormOpen(true)}
                      title="Add new company"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes about this contact..." 
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
                {loading ? "Saving..." : contact ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {companyFormOpen && (
      <CompanyForm
        open={companyFormOpen}
        onOpenChange={setCompanyFormOpen}
        onSuccess={() => {
          fetchCompanies();
          setCompanyFormOpen(false);
        }}
      />
    )}
    </>
  );
}