import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user already has a workspace
    const existingWorkspace = await prisma.userWorkspace.findFirst({
      where: {
        userId: userId,
      },
      include: {
        workspace: true,
      },
    });

    if (existingWorkspace) {
      return NextResponse.json({ workspace: existingWorkspace.workspace });
    }

    // Generate a unique slug for the workspace
    const slug = `workspace-${userId.substring(0, 8)}-${Date.now()}`;

    // Create default workspace for the new user with the user as owner
    const workspace = await prisma.workspace.create({
      data: {
        name: "My Workspace",
        slug: slug,
        users: {
          create: {
            userId: userId,
            role: "owner",
          },
        },
      },
    });

    // Set the workspace as active for the user
    await prisma.user.update({
      where: { id: userId },
      data: { activeWorkspaceId: workspace.id },
    });

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error("Failed to create workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}