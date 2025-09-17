"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ArrowUpRight, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { CompanyForm } from "@/components/forms/company-form";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  website?: string;
  linkedin?: string;
  notes?: string;
  assignedTo?: { id: string; name: string; email: string };
  deals?: Array<{ id: string }>;
  contacts?: Array<{ id: string }>;
  _count?: { contacts: number; deals: number };
}

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/company");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return;
    
    try {
      const response = await fetch(`/api/company/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete company");
      
      toast.success("Company deleted successfully");
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedCompany(null);
  };

  const handleFormSuccess = () => {
    fetchCompanies();
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div className="flex-shrink-0 p-4 sm:p-6 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Companies</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage companies and their details
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} size="sm" className="sm:size-default">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Company</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 sm:px-6 pb-4 sm:pb-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {loading ? (
              <div className="text-center py-8">Loading companies...</div>
            ) : (
              <div className="overflow-auto h-full">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Website</TableHead>
                    <TableHead className="hidden md:table-cell">Industry</TableHead>
                    <TableHead className="hidden lg:table-cell">Size</TableHead>
                    <TableHead className="hidden lg:table-cell">Location</TableHead>
                    <TableHead className="hidden sm:table-cell">Contacts</TableHead>
                    <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {searchTerm
                        ? "No companies found matching your search."
                        : "No companies found. Add your first company to get started."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="min-w-[150px] max-w-[250px]">
                          <div className="flex items-start gap-2">
                            <span className="font-medium truncate">{company.name}</span>
                            {company.linkedin && (
                              <a
                                href={company.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                                title="View LinkedIn Company Page"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="max-w-[200px]">
                          {company.website ? (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <span className="truncate">{company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                              <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-[150px] truncate" title={company.industry || undefined}>
                          {company.industry || <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="max-w-[100px] truncate">
                          {company.size || <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="max-w-[150px] truncate">
                          <span className="text-muted-foreground">-</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">
                          {company._count?.contacts || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="max-w-[150px]">
                          {company.assignedTo ? (
                            <span className="text-sm truncate block" title={company.assignedTo.name || company.assignedTo.email}>
                              {company.assignedTo.name || company.assignedTo.email}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
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
                            <DropdownMenuItem onClick={() => handleEdit(company)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(company.id)}
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

      <CompanyForm
        open={formOpen}
        onOpenChange={handleFormClose}
        company={selectedCompany ? {
          id: selectedCompany.id,
          name: selectedCompany.name,
          website: selectedCompany.website,
          linkedinUrl: selectedCompany.linkedin,
          industry: selectedCompany.industry,
          size: selectedCompany.size,
          assignedToId: selectedCompany.assignedTo?.id,
          notes: selectedCompany.notes
        } : undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}