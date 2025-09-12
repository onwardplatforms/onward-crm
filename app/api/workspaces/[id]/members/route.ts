import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET workspace members
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
    
    // Check if user is a member of the workspace
    const userWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId
      }
    });
    
    if (!userWorkspace) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      );
    }
    
    // Get all workspace members (excluding soft-deleted)
    const members = await prisma.userWorkspace.findMany({
      where: {
        workspaceId,
        removedAt: null // Only active members
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // Owner first, then admin, then member
        { joinedAt: 'asc' }
      ]
    });
    
    // Format the response with member details and their role
    const formattedMembers = members.map(member => ({
      id: member.user.id,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      joinedAt: member.joinedAt,
      createdAt: member.user.createdAt
    }));
    
    return NextResponse.json({
      members: formattedMembers,
      currentUserRole: userWorkspace.role,
      currentUserId: userId
    });
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace members" },
      { status: 500 }
    );
  }
}

// DELETE remove member from workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workspaceId } = await params;
    const userId = request.headers.get("x-user-id");
    const { memberId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }
    
    // Get current user's role (must be active member)
    const currentUserWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId,
        removedAt: null
      }
    });
    
    if (!currentUserWorkspace) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      );
    }
    
    // Check if user is trying to leave the workspace (remove themselves)
    const isLeavingWorkspace = userId === memberId;
    
    if (isLeavingWorkspace) {
      // User is leaving the workspace
      
      // Prevent owner from leaving their own workspace
      if (currentUserWorkspace.role === "owner") {
        return NextResponse.json(
          { error: "Workspace owner cannot leave their own workspace" },
          { status: 400 }
        );
      }
      
      // Members can leave anytime - soft delete
      await prisma.userWorkspace.update({
        where: {
          userId_workspaceId: {
            userId: memberId,
            workspaceId
          }
        },
        data: {
          removedAt: new Date(),
          removedById: userId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: "Successfully left the workspace"
      });
    } else {
      // User is trying to remove another member
      
      // Only owners and admins can remove other members
      if (currentUserWorkspace.role !== "owner" && currentUserWorkspace.role !== "admin") {
        return NextResponse.json(
          { error: "You don't have permission to remove members" },
          { status: 403 }
        );
      }
      
      // Get the member to be removed
      const memberToRemove = await prisma.userWorkspace.findFirst({
        where: {
          userId: memberId,
          workspaceId
        }
      });
      
      if (!memberToRemove) {
        return NextResponse.json(
          { error: "Member not found in this workspace" },
          { status: 404 }
        );
      }
      
      // Prevent removing the owner
      if (memberToRemove.role === "owner") {
        return NextResponse.json(
          { error: "Cannot remove the workspace owner" },
          { status: 400 }
        );
      }
      
      // Admins can only remove members, not other admins
      if (currentUserWorkspace.role === "admin" && memberToRemove.role === "admin") {
        return NextResponse.json(
          { error: "Admins cannot remove other admins" },
          { status: 403 }
        );
      }
      
      // Remove the member - soft delete
      await prisma.userWorkspace.update({
        where: {
          userId_workspaceId: {
            userId: memberId,
            workspaceId
          }
        },
        data: {
          removedAt: new Date(),
          removedById: userId
        }
      });
      
      // Get member details for notification
      const removedUser = await prisma.user.findUnique({
        where: { id: memberId },
        select: { name: true, email: true }
      });
      
      // Create notification for the removed user
      await prisma.notification.create({
        data: {
          type: "removed_from_workspace",
          title: "Removed from Workspace",
          message: `You have been removed from the workspace`,
          userId: memberId,
          workspaceId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: `Successfully removed ${removedUser?.name || removedUser?.email} from the workspace`
      });
    }
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}