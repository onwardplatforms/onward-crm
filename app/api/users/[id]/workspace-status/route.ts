import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    
    if (!workspaceId) {
      // If no workspace specified, use the current workspace from headers
      const headerWorkspaceId = request.headers.get("x-workspace-id");
      if (!headerWorkspaceId) {
        return NextResponse.json(
          { error: "Workspace ID is required" },
          { status: 400 }
        );
      }
    }
    
    const finalWorkspaceId = workspaceId || request.headers.get("x-workspace-id");
    
    if (!finalWorkspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }
    
    // Check user's status in the workspace
    const userWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId: finalWorkspaceId
      }
    });
    
    if (!userWorkspace) {
      // User was never in this workspace
      return NextResponse.json({
        exists: false,
        isRemoved: false,
        isActive: false
      });
    }
    
    return NextResponse.json({
      exists: true,
      isRemoved: !!userWorkspace.removedAt,
      isActive: !userWorkspace.removedAt,
      removedAt: userWorkspace.removedAt,
      role: userWorkspace.role
    });
  } catch (error) {
    console.error("Error checking user workspace status:", error);
    return NextResponse.json(
      { error: "Failed to check user status" },
      { status: 500 }
    );
  }
}