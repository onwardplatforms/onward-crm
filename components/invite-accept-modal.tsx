"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface InviteAcceptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  inviterName?: string;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
}

export function InviteAcceptModal({
  open,
  onOpenChange,
  workspaceName,
  inviterName,
  onAccept,
  onDecline,
  isAccepting = false,
}: InviteAcceptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <DialogTitle>Workspace Invitation</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {inviterName ? (
              <>
                <span className="font-medium">{inviterName}</span> has invited you to join{" "}
                <span className="font-medium">{workspaceName}</span>
              </>
            ) : (
              <>
                You've been invited to join <span className="font-medium">{workspaceName}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            By accepting this invitation, you'll gain access to all the workspace's contacts, deals, and activities.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onDecline}
            disabled={isAccepting}
          >
            Decline
          </Button>
          <Button
            onClick={onAccept}
            disabled={isAccepting}
          >
            {isAccepting ? "Accepting..." : "Accept Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}