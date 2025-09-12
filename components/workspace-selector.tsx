"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Building2, Plus, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  joinedAt: string;
}

interface WorkspaceSelectorProps {
  className?: string;
}

export function WorkspaceSelector({ className }: WorkspaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const router = useRouter();

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
        setCurrentWorkspaceId(data.currentWorkspaceId || "");
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const switchWorkspace = async (workspaceId: string) => {
    if (workspaceId === currentWorkspaceId) {
      setOpen(false);
      return;
    }

    try {
      const response = await fetch("/api/workspaces/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentWorkspaceId(workspaceId);
        toast.success(`Switched to ${data.workspace.name}`);
        setOpen(false);
        // Refresh the page to reload data for the new workspace
        router.refresh();
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to switch workspace");
      }
    } catch (error) {
      console.error("Error switching workspace:", error);
      toast.error("Failed to switch workspace");
    }
  };

  const handleEditWorkspace = async () => {
    if (!editingName.trim() || !currentWorkspace) return;
    
    setSavingName(true);
    try {
      const response = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingName.trim() }),
      });

      if (response.ok) {
        const updatedWorkspace = await response.json();
        setWorkspaces(prevWorkspaces => 
          prevWorkspaces.map(w => 
            w.id === currentWorkspace.id 
              ? { ...w, name: updatedWorkspace.name }
              : w
          )
        );
        toast.success("Workspace name updated");
        setEditDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update workspace name");
      }
    } catch (error) {
      console.error("Error updating workspace:", error);
      toast.error("Failed to update workspace name");
    } finally {
      setSavingName(false);
    }
  };

  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);

  if (loading) {
    return (
      <div className={cn("flex items-center space-x-2 px-3 py-2", className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!currentWorkspace) {
    return null;
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between px-3 py-2 h-auto",
              className
            )}
          >
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{currentWorkspace.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{currentWorkspace.role}</span>
              </div>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search workspace..." />
            <CommandEmpty>No workspace found.</CommandEmpty>
            <CommandGroup heading="Your Workspaces">
              {workspaces.map((workspace) => (
                <CommandItem
                  key={workspace.id}
                  value={workspace.name}
                  onSelect={() => switchWorkspace(workspace.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentWorkspaceId === workspace.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">{workspace.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{workspace.role}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {currentWorkspace.role === "owner" && (
                <CommandItem
                  onSelect={() => {
                    setEditingName(currentWorkspace.name);
                    setEditDialogOpen(true);
                    setOpen(false);
                  }}
                >
                  <Settings2 className="mr-2 h-4 w-4" />
                  Edit Workspace Name
                </CommandItem>
              )}
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  toast.info("Create workspace feature coming soon!");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Workspace
              </CommandItem>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workspace Name</DialogTitle>
            <DialogDescription>
              Change the name of your workspace. This will be visible to all members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                placeholder="Enter workspace name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={savingName}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditWorkspace}
              disabled={savingName || !editingName.trim()}
            >
              {savingName ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}