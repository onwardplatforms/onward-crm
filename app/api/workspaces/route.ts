import { NextRequest, NextResponse } from "next/server";
import { getUserWorkspaces } from "@/lib/workspace";

// GET user's workspaces
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const workspaces = await getUserWorkspaces(userId);
    
    // Get current workspace from session
    const currentWorkspaceId = request.headers.get("x-workspace-id");
    
    return NextResponse.json({
      workspaces,
      currentWorkspaceId
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}