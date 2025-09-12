import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addDays } from "date-fns";

// GET workspace invites
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is admin/owner of the workspace
    const userWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId,
        role: { in: ["owner", "admin"] }
      }
    });
    
    if (!userWorkspace) {
      return NextResponse.json(
        { error: "You don't have permission to view invites" },
        { status: 403 }
      );
    }
    
    // Get pending invites
    const invites = await prisma.workspaceInvite.findMany({
      where: {
        workspaceId,
        status: "pending",
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST create new invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const userId = request.headers.get("x-user-id");
    const { email, role = "member" } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Check if user is admin/owner of the workspace
    const userWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId,
        role: { in: ["owner", "admin"] }
      }
    });
    
    if (!userWorkspace) {
      return NextResponse.json(
        { error: "You don't have permission to send invites" },
        { status: 403 }
      );
    }
    
    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          where: { workspaceId }
        }
      }
    });
    
    if (existingUser?.workspaces.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }
    
    // Check for existing pending invite
    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: {
        email,
        workspaceId,
        status: "pending",
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 400 }
      );
    }
    
    // Get workspace details
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });
    
    // Create the invite
    const invite = await prisma.workspaceInvite.create({
      data: {
        email,
        role,
        workspaceId,
        invitedById: userId,
        expiresAt: addDays(new Date(), 7), // Expires in 7 days
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // Create notification if user exists
    if (existingUser) {
      await prisma.notification.create({
        data: {
          type: "workspace_invite",
          title: "Workspace Invitation",
          message: `You've been invited to join ${workspace?.name}`,
          userId: existingUser.id,
          workspaceId,
          inviteId: invite.id
        }
      });
    }
    
    // TODO: Send email invitation
    // For now, we'll just return the invite with the token
    // In production, you'd send an email with a link like:
    // ${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}
    
    return NextResponse.json({
      ...invite,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}