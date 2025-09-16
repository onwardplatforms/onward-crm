import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id: workspaceId, inviteId } = await params;
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
        { error: "You don't have permission to cancel invites" },
        { status: 403 }
      );
    }

    // Delete the invite
    await prisma.workspaceInvite.delete({
      where: {
        id: inviteId,
        workspaceId, // Ensure invite belongs to this workspace
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling invite:", error);
    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}