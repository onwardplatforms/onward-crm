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
  assignedTo?: { id: string; name: string };
  deals?: Array<{ id: string }>;
  contacts?: Array<{ id: string }>;
}

export default function CompaniesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
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
      const response = await fetch(`/api/companies/${id}`, {
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
      company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground">
            Manage companies and their details
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      <Card>
        <CardHeader>
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
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading companies...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Assigned To</TableHead>
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
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {company.name}
                          {company.linkedinUrl && (
                            <a
                              href={company.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              title="View LinkedIn Company Page"
                            >
                              <ArrowUpRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{company.industry}</TableCell>
                      <TableCell>{company.size}</TableCell>
                      <TableCell>
                        {company.location || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {company._count?.contacts || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {company.assignedTo ? (
                          <span className="text-sm">
                            {company.assignedTo.name || company.assignedTo.email}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
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
          )}
        </CardContent>
      </Card>

      <CompanyForm
        open={formOpen}
        onOpenChange={handleFormClose}
        company={selectedCompany}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}