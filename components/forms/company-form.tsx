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
import { INDUSTRIES, COMPANY_SIZES } from "@/lib/types";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: {
    id: string;
    name?: string;
    website?: string;
    linkedinUrl?: string;
    industry?: string;
    size?: string;
    location?: string;
    assignedToId?: string;
    notes?: string;
  };
  onSuccess?: () => void;
}

export function CompanyForm({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyFormProps) {
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name?: string; email: string }>>([]);
  const { user: currentUser } = useCurrentUser();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || "",
      website: company?.website || "",
      linkedinUrl: company?.linkedinUrl || "",
      industry: company?.industry || "",
      size: company?.size || "",
      location: company?.location || "",
      assignedToId: company?.assignedToId || currentUser?.id || undefined,
      notes: company?.notes || "",
    },
  });

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        website: company.website || "",
        linkedinUrl: company.linkedinUrl || "",
        industry: company.industry || "",
        size: company.size || "",
        location: company.location || "",
        assignedToId: company.assignedToId || undefined,
        notes: company.notes || "",
      });
    } else if (currentUser?.id && !form.getValues("assignedToId")) {
      // Set default assignedToId for new companies
      form.setValue("assignedToId", currentUser.id);
    }
  }, [company, form, currentUser]);

  const onSubmit = async (data: CompanyFormData) => {
    setLoading(true);
    try {
      const url = company
        ? `/api/companies/${company.id}`
        : "/api/companies";
      const method = company ? "PUT" : "POST";

      // Handle "unassigned" value
      const { assignedToId, ...restData } = data;
      const submitData = {
        ...restData,
        assignedToId: assignedToId === "unassigned" ? null : assignedToId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Company save error:", errorData);
        throw new Error(errorData.error || "Failed to save company");
      }

      toast.success(
        company ? "Company updated successfully" : "Company created successfully"
      );
      
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving company:", error);
      toast.error("Failed to save company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {company ? "Edit Company" : "Add New Company"}
          </DialogTitle>
          <DialogDescription>
            {company
              ? "Update the company information below."
              : "Enter the details for the new company."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
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
                      placeholder="https://linkedin.com/company/acme-inc" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.label}
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
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMPANY_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco, CA" {...field} />
                  </FormControl>
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
                      placeholder="Add any additional notes about this company..." 
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
                {loading ? "Saving..." : company ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}