import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT update workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    const { name } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }
    
    // Check if user is the owner of the workspace
    const userWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspaceId: id,
        role: "owner"
      }
    });
    
    if (!userWorkspace) {
      return NextResponse.json(
        { error: "You don't have permission to edit this workspace" },
        { status: 403 }
      );
    }
    
    // Generate new slug from the name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    let slug = baseSlug;
    let counter = 1;
    
    // Find a unique slug (excluding the current workspace)
    while (true) {
      const existing = await prisma.workspace.findFirst({
        where: {
          slug,
          NOT: { id }
        }
      });
      
      if (!existing) break;
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Update the workspace
    const workspace = await prisma.workspace.update({
      where: { id },
      data: { 
        name: name.trim(),
        slug
      }
    });
    
    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error updating workspace:", error);
    return NextResponse.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}