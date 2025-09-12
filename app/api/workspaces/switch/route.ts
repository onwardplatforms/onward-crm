import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST switch workspace
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const sessionId = request.headers.get("x-session-id");
    const { workspaceId } = await request.json();
    
    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }
    
    // Verify user has active access to this workspace
    const userWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId,
        removedAt: null // Must be active member
      },
      include: {
        workspace: true
      }
    });
    
    if (!userWorkspace) {
      return NextResponse.json(
        { error: "You don't have access to this workspace" },
        { status: 403 }
      );
    }
    
    // Update session with new workspace
    await prisma.session.update({
      where: { id: sessionId },
      data: { currentWorkspaceId: workspaceId }
    });
    
    return NextResponse.json({
      success: true,
      workspace: userWorkspace.workspace
    });
  } catch (error) {
    console.error("Error switching workspace:", error);
    return NextResponse.json(
      { error: "Failed to switch workspace" },
      { status: 500 }
    );
  }
}