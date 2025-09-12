"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus, Search, DollarSign, Calendar, TrendingUp, 
  MoreHorizontal, Pencil, Trash, Building2, User, GripVertical 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEAL_STAGES } from "@/lib/types";
import { DealForm } from "@/components/forms/deal-form";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DealsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/deals");
      if (!response.ok) throw new Error("Failed to fetch deals");
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleEdit = (deal: any) => {
    setSelectedDeal(deal);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    
    try {
      const response = await fetch(`/api/deals/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete deal");
      
      toast.success("Deal deleted successfully");
      fetchDeals();
    } catch (error) {
      console.error("Error deleting deal:", error);
      toast.error("Failed to delete deal");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedDeal(null);
  };

  const handleFormSuccess = () => {
    fetchDeals();
  };

  const handleStageChange = async (dealId: string, newStage: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal && deal.stage !== newStage) {
      try {
        const response = await fetch(`/api/deals/${dealId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...deal, stage: newStage }),
        });
        
        if (!response.ok) throw new Error("Failed to update deal");
        
        toast.success("Deal stage updated");
        fetchDeals();
      } catch (error) {
        console.error("Error updating deal stage:", error);
        toast.error("Failed to update deal stage");
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, deal: any) => {
    e.dataTransfer.setData("dealId", deal.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    const deal = deals.find(d => d.id === dealId);
    
    if (deal && deal.stage !== newStage) {
      try {
        const response = await fetch(`/api/deals/${dealId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...deal, stage: newStage }),
        });
        
        if (!response.ok) throw new Error("Failed to update deal");
        
        toast.success("Deal stage updated");
        fetchDeals();
      } catch (error) {
        console.error("Error updating deal stage:", error);
        toast.error("Failed to update deal stage");
      }
    }
  };

  const filteredDeals = deals.filter(
    (deal) =>
      deal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate metrics
  const totalPipeline = deals
    .filter(d => !["closed-won", "closed-lost"].includes(d.stage))
    .reduce((sum, deal) => sum + (deal.value || 0), 0);
  
  const avgDealSize = deals.length > 0 
    ? deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / deals.length 
    : 0;
  
  const closingThisMonth = deals.filter(deal => {
    if (!deal.closeDate) return false;
    const closeDate = new Date(deal.closeDate);
    const now = new Date();
    return closeDate.getMonth() === now.getMonth() && 
           closeDate.getFullYear() === now.getFullYear() &&
           !["closed-won", "closed-lost"].includes(deal.stage);
  });
  
  const closingValue = closingThisMonth.reduce((sum, deal) => sum + (deal.value || 0), 0);
  
  const wonDeals = deals.filter(d => d.stage === "closed-won").length;
  const lostDeals = deals.filter(d => d.stage === "closed-lost").length;
  const winRate = wonDeals + lostDeals > 0 
    ? (wonDeals / (wonDeals + lostDeals)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Deals</h2>
          <p className="text-muted-foreground">
            Track and manage your sales pipeline
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalPipeline.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length} deals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(avgDealSize).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closingThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">
              ${closingValue.toLocaleString()} value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {DEAL_STAGES.map((stage) => {
              const stageDeals = filteredDeals.filter(d => d.stage === stage.value);
              const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
              
              return (
                <Card 
                  key={stage.value} 
                  className="min-h-[400px] transition-colors"
                  onDragOver={(e) => {
                    handleDragOver(e);
                    e.currentTarget.classList.add("ring-2", "ring-primary");
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove("ring-2", "ring-primary");
                  }}
                  onDrop={(e) => {
                    handleDrop(e, stage.value);
                    e.currentTarget.classList.remove("ring-2", "ring-primary");
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {stage.label}
                      </CardTitle>
                      <Badge variant="secondary">{stageDeals.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${stageValue.toLocaleString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stageDeals.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          No deals in this stage
                        </p>
                      ) : (
                        stageDeals.map((deal) => (
                          <div
                            key={deal.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, deal)}
                            className="group rounded-lg border p-3 cursor-move hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] active:opacity-50"
                          >
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                              <div className="space-y-1 flex-1">
                                <p className="text-sm font-medium leading-none">
                                  {deal.name}
                                </p>
                                {deal.company && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {deal.company.name}
                                  </p>
                                )}
                                {deal.contact && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {deal.contact.firstName} {deal.contact.lastName}
                                  </p>
                                )}
                                {deal.value && (
                                  <p className="text-sm font-semibold">
                                    ${deal.value.toLocaleString()}
                                  </p>
                                )}
                                {deal.closeDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Close: {format(new Date(deal.closeDate), "MMM d")}
                                  </p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(deal)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(deal.id)}
                                    className="text-red-600"
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading deals...</div>
              ) : filteredDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No deals found. Create your first deal to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <p className="font-medium">{deal.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {deal.value && <span className="font-semibold">${deal.value.toLocaleString()}</span>}
                          {deal.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {deal.company.name}
                            </span>
                          )}
                          {deal.contact && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {deal.contact.firstName} {deal.contact.lastName}
                            </span>
                          )}
                          {deal.closeDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(deal.closeDate), "MMM d, yyyy")}
                            </span>
                          )}
                          {deal.assignedTo && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {deal.assignedTo.name || deal.assignedTo.email}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={deal.stage}
                          onValueChange={(value) => handleStageChange(deal.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEAL_STAGES.map((stage) => (
                              <SelectItem key={stage.value} value={stage.value}>
                                {stage.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(deal)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(deal.id)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DealForm
        open={formOpen}
        onOpenChange={handleFormClose}
        deal={selectedDeal}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}