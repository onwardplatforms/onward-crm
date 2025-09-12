import { NextRequest, NextResponse } from "next/server";
import { createWorkspaceForUser } from "@/lib/workspace";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    // Check if user already has a workspace
    const existingWorkspace = await prisma.userWorkspace.findFirst({
      where: { userId }
    });
    
    if (existingWorkspace) {
      return NextResponse.json({ 
        message: "User already has a workspace",
        workspaceId: existingWorkspace.workspaceId 
      });
    }
    
    // Create workspace for the new user
    const workspace = await createWorkspaceForUser(userId);
    
    return NextResponse.json({ 
      message: "Workspace created successfully",
      workspace 
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}