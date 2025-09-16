"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus, Search, 
  MoreHorizontal, Pencil, Trash, GripVertical 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEAL_STAGES } from "@/lib/types";
import { DealForm } from "@/components/forms/deal-form";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatCurrency, formatCompactCurrency } from "@/lib/currency";

interface Deal {
  id: string;
  name: string;
  value?: number;
  licenses?: number;
  stage: string;
  position?: number;
  closeDate?: string | Date | null;
  probability?: number;
  companyId?: string;
  contactId?: string;
  assignedToId?: string;
  notes?: string;
  company?: { id: string; name: string };
  contact?: { id: string; firstName: string; lastName: string };
  assignedTo?: { id: string; name?: string; email: string };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function DealsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pipeline");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ dealId: string; position: 'before' | 'after' } | null>(null);
  const [showDropZones, setShowDropZones] = useState(false);

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/opportunity");
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleEdit = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return;
    
    try {
      const response = await fetch(`/api/opportunity/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete opportunity");
      
      toast.success("Deal deleted successfully");
      fetchDeals();
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast.error("Failed to delete opportunity");
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setSelectedDeal(null);
  };

  const handleFormSuccess = () => {
    fetchDeals();
  };

  const handleStageChange = async (dealId: string, newStage: string, skipRefetch = false, customPosition?: number) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      try {
        // Calculate new position for the deal
        let newPosition: number;
        if (customPosition !== undefined) {
          // Use the provided position and round it to integer
          newPosition = Math.round(customPosition);
        } else {
          const stageDeals = deals.filter(d => d.stage === newStage && d.id !== dealId);
          newPosition = stageDeals.length > 0 
            ? Math.max(...stageDeals.map(d => d.position || 0)) + 1 
            : 0;
        }
        
        // Only send the fields that can be updated
        const updateData = {
          name: deal.name,
          value: deal.value,
          stage: newStage,
          position: newPosition,
          closeDate: deal.closeDate,
          probability: deal.probability,
          companyId: deal.companyId,
          contactId: deal.contactId,
          assignedToId: deal.assignedToId,
          notes: deal.notes,
        };
        
        const response = await fetch(`/api/opportunity/${dealId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Deal update failed:", errorText);
          try {
            const errorJson = JSON.parse(errorText);
            console.error("Error details:", errorJson.details);
          } catch {
            // Not JSON, just log the text
          }
          throw new Error("Failed to update opportunity");
        }
        
        toast.success("Deal stage updated");
        
        // Only refetch if we haven't already updated optimistically
        if (!skipRefetch) {
          fetchDeals();
        }
      } catch (error) {
        console.error("Error updating opportunity stage:", error);
        toast.error("Failed to update opportunity stage");
        // On error, refetch to get correct state
        fetchDeals();
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    e.dataTransfer.setData("dealId", deal.id);
    e.dataTransfer.effectAllowed = "move";
    
    // Create a clone for the drag image before hiding the original
    const dragElement = e.currentTarget as HTMLElement;
    const clone = dragElement.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '-1000px';
    clone.style.opacity = '0.8';
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    
    // Clean up the clone after a brief delay
    setTimeout(() => {
      document.body.removeChild(clone);
    }, 0);
    
    // Set dragged deal to hide original
    setDraggedDeal(deal.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    e.stopPropagation();
    const dealId = e.dataTransfer.getData("dealId");
    
    let newPosition: number;
    
    // Get all deals in the target stage sorted by position
    const stageDeals = deals
      .filter(d => d.stage === newStage && d.id !== dealId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    // If we have a drop indicator, calculate position based on it
    if (dropIndicator) {
      const targetIndex = stageDeals.findIndex(d => d.id === dropIndicator.dealId);
      if (targetIndex !== -1) {
        if (dropIndicator.position === 'before') {
          // Insert before the target
          if (targetIndex === 0) {
            newPosition = (stageDeals[0].position || 0) - 100;
          } else {
            const prevPos = stageDeals[targetIndex - 1].position || 0;
            const currPos = stageDeals[targetIndex].position || 0;
            newPosition = Math.floor((prevPos + currPos) / 2);
          }
        } else {
          // Insert after the target
          if (targetIndex === stageDeals.length - 1) {
            newPosition = (stageDeals[targetIndex].position || 0) + 100;
          } else {
            const currPos = stageDeals[targetIndex].position || 0;
            const nextPos = stageDeals[targetIndex + 1].position || 0;
            newPosition = Math.floor((currPos + nextPos) / 2);
          }
        }
      } else {
        // Fallback to end of list
        newPosition = stageDeals.length > 0 
          ? Math.max(...stageDeals.map(d => d.position || 0)) + 100
          : 0;
      }
    } else {
      // No indicator, add to end
      newPosition = stageDeals.length > 0 
        ? Math.max(...stageDeals.map(d => d.position || 0)) + 100
        : 0;
    }
    
    // Optimistically update the deal stage and position in state
    const updatedDeals = deals.map(d => 
      d.id === dealId ? { ...d, stage: newStage, position: newPosition } : d
    );
    setDeals(updatedDeals);
    setDraggedDeal(null);
    setDropIndicator(null);
    
    // Then update the backend (skip refetch since we already updated optimistically)
    await handleStageChange(dealId, newStage, true, newPosition);
  };

  const handleDragEnd = () => {
    setDraggedDeal(null);
    setDropIndicator(null);
    setShowDropZones(false);
  };

  const handleDragOverCard = (e: React.DragEvent, dealId: string) => {
    e.preventDefault();
    // Don't stop propagation so the card container can also get the event
    
    // Don't show position indicators for the card being dragged
    if (dealId === draggedDeal) {
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    
    setDropIndicator({ dealId, position });
  };

  const handleDragLeaveCard = () => {
    setDropIndicator(null);
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Opportunities</h2>
          <p className="text-muted-foreground">
            Track and manage your sales pipeline
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompactCurrency(totalPipeline)}
            </div>
            <p className="text-xs text-muted-foreground">
              {deals.filter(d => !["closed-won", "closed-lost"].includes(d.stage)).length} opportunities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCompactCurrency(avgDealSize)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closingThisMonth.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCompactCurrency(closingValue)} value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pipeline" className="flex-1 mt-1 overflow-hidden p-1">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5 h-full">
            {/* Active stages - only prospect through proposal */}
            {DEAL_STAGES.slice(0, 4).map((stage) => {
              const stageDeals = filteredDeals
                .filter(d => d.stage === stage.value)
                .sort((a, b) => (a.position || 0) - (b.position || 0));
              const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
              
              return (
                <Card 
                  key={stage.value} 
                  className="h-full flex flex-col transition-colors gap-0"
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
                  <CardHeader className="pb-2 flex-shrink-0 min-h-[5.5rem]">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {stage.label}
                      </CardTitle>
                      <Badge variant="secondary">{stageDeals.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatCompactCurrency(stageValue)}
                    </p>
                    {stage.description && (
                      <p className="text-xs text-muted-foreground/70">
                        {stage.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden px-3 pt-2 pb-3">
                    <div className="space-y-3 h-full overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      {/* Drop zone for first position */}
                      {stageDeals.length > 0 && (
                        <div 
                          className="h-2 relative"
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropIndicator({ dealId: stageDeals[0].id, position: 'before' });
                          }}
                          onDragLeave={() => setDropIndicator(null)}
                          onDrop={(e) => handleDrop(e, stage.value)}
                        >
                          {dropIndicator?.dealId === stageDeals[0]?.id && dropIndicator?.position === 'before' && (
                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
                          )}
                        </div>
                      )}
                      {stageDeals.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                          No opportunities in this stage
                        </p>
                      ) : (
                        stageDeals.map((deal, index) => (
                          <div key={deal.id} className="relative">
                            {dropIndicator?.dealId === deal.id && dropIndicator?.position === 'before' && index > 0 && (
                              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary z-10" />
                            )}
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, deal)}
                              onDragEnd={handleDragEnd}
                              onDragOver={(e) => handleDragOverCard(e, deal.id)}
                              onDragLeave={handleDragLeaveCard}
                              onDrop={(e) => handleDrop(e, stage.value)}
                              onDoubleClick={() => handleEdit(deal)}
                              className={cn(
                                "group rounded-lg border p-3 cursor-grab hover:shadow-lg transition-shadow bg-muted/50 relative",
                                draggedDeal === deal.id && "opacity-0"
                              )}
                            >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
                              <div className="space-y-1 flex-1">
                                <p className="text-sm font-medium leading-none">
                                  {deal.name}
                                </p>
                                {deal.company && (
                                  <p className="text-xs text-muted-foreground">
                                    {deal.company.name}
                                  </p>
                                )}
                                {deal.contact && (
                                  <p className="text-xs text-muted-foreground">
                                    {deal.contact.firstName} {deal.contact.lastName}
                                  </p>
                                )}
                                {deal.value && (
                                  <p className="text-sm font-semibold">
                                    {formatCurrency(deal.value)}
                                    {deal.licenses && deal.licenses > 1 && (
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({deal.licenses} licenses)
                                      </span>
                                    )}
                                  </p>
                                )}
                                {deal.closeDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Close: {format(new Date(deal.closeDate), "MMM d")}
                                  </p>
                                )}
                              </div>
                            </div>
                            </div>
                            {dropIndicator?.dealId === deal.id && dropIndicator?.position === 'after' && (
                              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary z-10" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Closed column - combines won and lost */}
            {(() => {
              const closedWonDeals = filteredDeals
                .filter(d => d.stage === 'closed-won')
                .sort((a, b) => (a.position || 0) - (b.position || 0));
              const closedLostDeals = filteredDeals
                .filter(d => d.stage === 'closed-lost')
                .sort((a, b) => (a.position || 0) - (b.position || 0));
              const totalClosedValue = [...closedWonDeals, ...closedLostDeals]
                .reduce((sum, deal) => sum + (deal.value || 0), 0);
              
              return (
                <Card 
                  className="h-full flex flex-col transition-colors gap-0"
                  onDragOver={(e) => {
                    handleDragOver(e);
                    e.currentTarget.classList.add("ring-2", "ring-primary");
                    setShowDropZones(true);
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove("ring-2", "ring-primary");
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setShowDropZones(false);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("ring-2", "ring-primary");
                    setShowDropZones(false);
                  }}
                >
                  <CardHeader className="pb-2 flex-shrink-0 min-h-[5.5rem]">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Closed
                      </CardTitle>
                      <Badge variant="secondary">{closedWonDeals.length + closedLostDeals.length}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatCompactCurrency(totalClosedValue)}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Completed opportunities - won or lost
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden px-3 pt-2 pb-3">
                    <div className="h-full relative">
                      {/* Drop zones when dragging */}
                      {showDropZones && draggedDeal && (
                        <div className="absolute inset-0 flex flex-col z-10">
                          <div
                            className="flex-1 border border-dotted border-muted-foreground/30 rounded-t-lg flex items-center justify-center transition-all"
                            onDragEnter={(e) => {
                              e.currentTarget.classList.add("bg-accent/50", "border-foreground", "border-solid");
                              e.currentTarget.classList.remove("border-dotted", "border-muted-foreground/30");
                              const text = e.currentTarget.querySelector('p');
                              if (text) {
                                text.classList.remove("text-muted-foreground");
                                text.classList.add("text-foreground");
                              }
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                e.currentTarget.classList.remove("bg-accent/50", "border-foreground", "border-solid");
                                e.currentTarget.classList.add("border-dotted", "border-muted-foreground/30");
                                const text = e.currentTarget.querySelector('p');
                                if (text) {
                                  text.classList.add("text-muted-foreground");
                                  text.classList.remove("text-foreground");
                                }
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDrop(e, 'closed-won');
                              setShowDropZones(false);
                            }}
                          >
                            <p className="text-xs text-muted-foreground transition-colors">Won</p>
                          </div>
                          <div
                            className="flex-1 border border-dotted border-muted-foreground/30 rounded-b-lg flex items-center justify-center transition-all"
                            onDragEnter={(e) => {
                              e.currentTarget.classList.add("bg-accent/50", "border-foreground", "border-solid");
                              e.currentTarget.classList.remove("border-dotted", "border-muted-foreground/30");
                              const text = e.currentTarget.querySelector('p');
                              if (text) {
                                text.classList.remove("text-muted-foreground");
                                text.classList.add("text-foreground");
                              }
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                e.currentTarget.classList.remove("bg-accent/50", "border-foreground", "border-solid");
                                e.currentTarget.classList.add("border-dotted", "border-muted-foreground/30");
                                const text = e.currentTarget.querySelector('p');
                                if (text) {
                                  text.classList.add("text-muted-foreground");
                                  text.classList.remove("text-foreground");
                                }
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDrop(e, 'closed-lost');
                              setShowDropZones(false);
                            }}
                          >
                            <p className="text-xs text-muted-foreground transition-colors">Lost</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3 h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                      
                      {/* Won section */}
                      {!showDropZones && closedWonDeals.length > 0 && (
                        <>
                          <div className="text-xs font-medium text-muted-foreground px-1">Won ({closedWonDeals.length})</div>
                          {closedWonDeals.map((deal, index) => (
                            <div key={deal.id} className="relative">
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, deal)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOverCard(e, deal.id)}
                                onDragLeave={handleDragLeaveCard}
                                onDrop={(e) => handleDrop(e, 'closed-won')}
                                onDoubleClick={() => handleEdit(deal)}
                                className={cn(
                                  "group rounded-lg border p-3 cursor-grab hover:shadow-lg transition-shadow bg-muted/50 relative",
                                  draggedDeal === deal.id && "opacity-0"
                                )}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
                                  <div className="space-y-1 flex-1">
                                    <p className="text-sm font-medium leading-none">
                                      {deal.name}
                                    </p>
                                    {deal.value && (
                                      <p className="text-sm font-semibold">
                                        {formatCurrency(deal.value)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Lost section */}
                      {!showDropZones && closedLostDeals.length > 0 && (
                        <>
                          <div className="text-xs font-medium text-muted-foreground px-1 mt-3">Lost ({closedLostDeals.length})</div>
                          {closedLostDeals.map((deal, index) => (
                            <div key={deal.id} className="relative">
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, deal)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOverCard(e, deal.id)}
                                onDragLeave={handleDragLeaveCard}
                                onDrop={(e) => handleDrop(e, 'closed-lost')}
                                onDoubleClick={() => handleEdit(deal)}
                                className={cn(
                                  "group rounded-lg border p-3 cursor-grab hover:shadow-lg transition-shadow bg-background relative opacity-60",
                                  draggedDeal === deal.id && "opacity-0"
                                )}
                              >
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
                                <div className="flex items-start gap-2">
                                  <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
                                  <div className="space-y-1 flex-1">
                                    <p className="text-sm font-medium leading-none line-through text-muted-foreground">
                                      {deal.name}
                                    </p>
                                    {deal.value && (
                                      <p className="text-sm text-muted-foreground line-through">
                                        {formatCurrency(deal.value)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {!showDropZones && closedWonDeals.length === 0 && closedLostDeals.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">
                          No closed opportunities
                        </p>
                      )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </TabsContent>
        
        <TabsContent value="list" className="flex-1 mt-1 overflow-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading opportunities...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Licenses</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Close Date</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          {searchTerm
                            ? "No opportunities found matching your search."
                            : "No opportunities found. Create your first opportunity to get started."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeals.map((deal) => (
                        <TableRow key={deal.id} className="cursor-pointer" onDoubleClick={() => handleEdit(deal)}>
                          <TableCell className="font-medium">
                            {deal.name}
                          </TableCell>
                          <TableCell>
                            {deal.value ? (
                              <span className="font-semibold">{formatCurrency(deal.value)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{deal.licenses || 1}</span>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={deal.stage}
                              onValueChange={(value) => handleStageChange(deal.id, value)}
                            >
                              <SelectTrigger className="w-[140px] h-8">
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
                          </TableCell>
                          <TableCell>
                            {deal.company ? (
                              <span>{deal.company.name}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {deal.contact ? (
                              <span>
                                {deal.contact.firstName} {deal.contact.lastName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {deal.closeDate ? (
                              <span>{format(new Date(deal.closeDate), "MMM d, yyyy")}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {deal.probability ? (
                              <Badge variant="outline">{deal.probability}%</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {deal.assignedTo ? (
                              <span className="text-sm">
                                {deal.assignedTo.name || deal.assignedTo.email}
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
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DealForm
        open={formOpen}
        onOpenChange={handleFormClose}
        deal={selectedDeal ? {
          id: selectedDeal.id,
          name: selectedDeal.name,
          value: selectedDeal.value,
          licenses: selectedDeal.licenses,
          stage: selectedDeal.stage,
          closeDate: selectedDeal.closeDate,
          probability: selectedDeal.probability,
          companyId: selectedDeal.companyId,
          contactId: selectedDeal.contactId,
          assignedToId: selectedDeal.assignedToId,
          notes: selectedDeal.notes
        } : undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}