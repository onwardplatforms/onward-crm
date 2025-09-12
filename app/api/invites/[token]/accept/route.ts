import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Find the invite
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: true,
        invitedBy: true
      }
    });
    
    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite token" },
        { status: 404 }
      );
    }
    
    // Check if invite is valid
    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `This invite has already been ${invite.status}` },
        { status: 400 }
      );
    }
    
    if (invite.expiresAt < new Date()) {
      // Update status to expired
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: "expired" }
      });
      
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 400 }
      );
    }
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });
    
    // Check if email matches (if invite was sent to specific email)
    if (invite.email && user?.email !== invite.email) {
      return NextResponse.json(
        { error: "This invite was sent to a different email address" },
        { status: 403 }
      );
    }
    
    // Check if already a member
    const existingMembership = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId: invite.workspaceId
      }
    });
    
    if (existingMembership) {
      // Update invite status
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: "accepted" }
      });
      
      return NextResponse.json(
        { error: "You are already a member of this workspace" },
        { status: 400 }
      );
    }
    
    // Add user to workspace
    await prisma.userWorkspace.create({
      data: {
        userId,
        workspaceId: invite.workspaceId,
        role: invite.role
      }
    });
    
    // Update invite status
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" }
    });
    
    // Create notification for inviter
    await prisma.notification.create({
      data: {
        type: "invite_accepted",
        title: "Invitation Accepted",
        message: `${user?.name || user?.email} has joined ${invite.workspace.name}`,
        userId: invite.invitedById,
        workspaceId: invite.workspaceId,
        inviteId: invite.id
      }
    });
    
    return NextResponse.json({
      success: true,
      workspace: invite.workspace,
      message: `Successfully joined ${invite.workspace.name}`
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}