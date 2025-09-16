"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface InviteDetails {
  id: string;
  workspace: {
    id: string;
    name: string;
  };
  invitedBy: {
    name?: string;
    email: string;
  };
  email: string;
  role: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = params.token as string;

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const response = await fetch(`/api/invites/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("This invite link is invalid or has expired.");
          } else {
            setError("Failed to load invite details.");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setInvite(data);
      } catch (error) {
        console.error("Error fetching invite:", error);
        setError("Failed to load invite details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInviteDetails();
  }, [token]);

  const handleAcceptInvite = async () => {
    if (!session) {
      // Save the invite token and redirect to sign in
      localStorage.setItem("pendingInvite", token);
      router.push("/signin");
      return;
    }

    setAccepting(true);
    try {
      const response = await fetch(`/api/invites/${token}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to accept invite");
      }

      toast.success("Successfully joined workspace!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast.error((error as Error).message || "Failed to accept invite");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-destructive">
              <XCircle className="h-12 w-12" />
            </div>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription className="mt-2">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-primary">
            <CheckCircle className="h-12 w-12" />
          </div>
          <CardTitle>You&apos;re invited to join {invite.workspace.name}</CardTitle>
          <CardDescription className="mt-2">
            {invite.invitedBy.name || invite.invitedBy.email} has invited you to collaborate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Workspace:</span>
                <span className="font-medium">{invite.workspace.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your role:</span>
                <span className="font-medium capitalize">{invite.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invited by:</span>
                <span className="font-medium">{invite.invitedBy.name || invite.invitedBy.email}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {session ? (
            <>
              <Button
                className="w-full"
                onClick={handleAcceptInvite}
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invite"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                You&apos;ll be added to this workspace as {session.user?.email}
              </p>
            </>
          ) : (
            <>
              <Link href="/signin" className="w-full">
                <Button className="w-full">
                  Sign in to Accept
                </Button>
              </Link>
              <Link href="/signup" className="w-full">
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </Link>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}