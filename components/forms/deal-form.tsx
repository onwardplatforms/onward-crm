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
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DEAL_STAGES } from "@/lib/types";
import { CompanyForm } from "./company-form";
import { ContactForm } from "./contact-form";
import { currencySchema, formatCurrencyInput } from "@/lib/currency";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

const dealSchema = z.object({
  name: z.string().min(1, "Deal name is required"),
  value: currencySchema.optional(),
  licenses: z.coerce.number().min(1).default(1),
  stage: z.string().min(1, "Stage is required"),
  closeDate: z.date().nullable().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: {
    id: string;
    name?: string;
    value?: number;
    licenses?: number;
    stage?: string;
    closeDate?: string | Date | null;
    probability?: number;
    companyId?: string;
    contactId?: string;
    assignedToId?: string;
    notes?: string;
  };
  onSuccess?: () => void;
}

export function DealForm({
  open,
  onOpenChange,
  deal,
  onSuccess,
}: DealFormProps) {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ id: string; firstName: string; lastName: string; companyId?: string }>>([]);
  const [allContacts, setAllContacts] = useState<Array<{ id: string; firstName: string; lastName: string; companyId?: string }>>([]);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name?: string; email: string; isActive?: boolean }>>([]);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const { user: currentUser } = useCurrentUser();

  const form = useForm<DealFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(dealSchema) as any,
    defaultValues: {
      name: deal?.name || "",
      value: deal?.value || undefined,
      licenses: deal?.licenses || 1,
      stage: deal?.stage || "prospect",
      closeDate: deal?.closeDate ? new Date(deal.closeDate) : null,
      probability: deal?.probability || 0,
      companyId: deal?.companyId || undefined,
      contactId: deal?.contactId || undefined,
      assignedToId: deal?.assignedToId || currentUser?.id || undefined,
      notes: deal?.notes || "",
    },
  });

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/company");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanies([]);
    }
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      const contactsList = Array.isArray(data) ? data : [];
      setAllContacts(contactsList);
      setContacts(contactsList);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setAllContacts([]);
      setContacts([]);
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
    fetchCompanies();
    fetchContacts();
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (deal) {
      form.reset({
        name: deal.name || "",
        value: deal.value || undefined,
        licenses: deal.licenses || 1,
        stage: deal.stage || "prospect",
        closeDate: deal.closeDate ? new Date(deal.closeDate) : null,
        probability: deal.probability || 0,
        companyId: deal.companyId || undefined,
        contactId: deal.contactId || undefined,
        assignedToId: deal.assignedToId || undefined,
        notes: deal.notes || "",
      });
    } else if (currentUser?.id && !form.getValues("assignedToId")) {
      // Set default assignedToId for new deals
      form.setValue("assignedToId", currentUser.id);
    }
  }, [deal, form, currentUser]);

  // Reset contacts filter when dialog opens/closes
  useEffect(() => {
    if (open) {
      // When opening, if there's a selected company, filter contacts
      const companyId = form.getValues("companyId");
      if (companyId) {
        const filteredContacts = allContacts.filter(
          contact => !contact.companyId || contact.companyId === companyId
        );
        setContacts(filteredContacts);
      } else {
        setContacts(allContacts);
      }
    }
  }, [open, allContacts, form]);

  const onSubmit = async (data: DealFormData) => {
    setLoading(true);
    try {
      const url = deal ? `/api/opportunity/${deal.id}` : "/api/opportunity";
      const method = deal ? "PUT" : "POST";

      const submitData = {
        ...data,
        closeDate: data.closeDate || null,
        contactId: data.contactId === "none" ? null : data.contactId,
        companyId: data.companyId === "none" ? null : data.companyId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error("Failed to save deal");
      }

      toast.success(
        deal ? "Deal updated successfully" : "Deal created successfully"
      );
      
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving deal:", error);
      toast.error("Failed to save deal");
    } finally {
      setLoading(false);
    }
  };

  // Auto-set probability based on stage (only if probability is empty)
  const handleStageChange = (value: string) => {
    form.setValue("stage", value);
    
    // Only set probability if it's currently blank/undefined/0
    const currentProbability = form.getValues("probability");
    if (!currentProbability || currentProbability === 0) {
      // Set default probability based on stage (matching 10% increments)
      const defaultProbabilities: Record<string, number> = {
        prospect: 10,
        qualified: 30,
        demo: 50,
        proposal: 70,
        "closed-won": 100,
        "closed-lost": 0,
      };
      
      if (defaultProbabilities[value] !== undefined) {
        form.setValue("probability", defaultProbabilities[value]);
      }
    }
  };

  // Handle contact selection - auto-populate company
  const handleContactChange = (contactId: string) => {
    form.setValue("contactId", contactId);
    
    // Only auto-populate company if a real contact is selected (not "none")
    if (contactId !== "none") {
      // Find the selected contact and auto-populate their company
      const selectedContact = allContacts.find(c => c.id === contactId);
      if (selectedContact?.companyId) {
        form.setValue("companyId", selectedContact.companyId);
      }
    }
  };

  // Handle company selection - filter contacts
  const handleCompanyChange = (companyId: string) => {
    form.setValue("companyId", companyId);
    
    // Filter contacts to show only those from the selected company (plus unassigned)
    if (companyId && companyId !== "none") {
      const filteredContacts = allContacts.filter(
        contact => !contact.companyId || contact.companyId === companyId
      );
      setContacts(filteredContacts);
    } else {
      // If no company selected or "none" selected, show all contacts
      setContacts(allContacts);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {deal ? "Edit Deal" : "Add New Deal"}
          </DialogTitle>
          <DialogDescription>
            {deal
              ? "Update the deal information below."
              : "Enter the details for the new deal."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Website Redesign Project" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Value</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input 
                          className="pl-7"
                          placeholder="50,000" 
                          value={field.value || ''}
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value);
                            field.onChange(formatted);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="licenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Licenses</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select
                      onValueChange={handleStageChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEAL_STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Close Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value || undefined}
                        onDateChange={field.onChange}
                        placeholder="Select close date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probability (%)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select probability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="40">40%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="60">60%</SelectItem>
                        <SelectItem value="70">70%</SelectItem>
                        <SelectItem value="80">80%</SelectItem>
                        <SelectItem value="90">90%</SelectItem>
                        <SelectItem value="100">100%</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={handleContactChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a contact" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">None</span>
                        </SelectItem>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setContactFormOpen(true)}
                      title="Add new contact"
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
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={handleCompanyChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">None</span>
                        </SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
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
                      placeholder="Add any additional notes about this deal..." 
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
                {loading ? "Saving..." : deal ? "Update" : "Create"}
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

    {contactFormOpen && (
      <ContactForm
        open={contactFormOpen}
        onOpenChange={setContactFormOpen}
        onSuccess={() => {
          fetchContacts();
          setContactFormOpen(false);
        }}
      />
    )}
    </>
  );
}