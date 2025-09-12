import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all team members (users in the same workspace)
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    console.log("Users API - workspace ID:", workspaceId);
    console.log("Users API - all headers:", Object.fromEntries(request.headers.entries()));
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    // Get all active users in the current workspace through the UserWorkspace join table
    const userWorkspaces = await prisma.userWorkspace.findMany({
      where: {
        workspaceId,
        removedAt: null, // Only active members
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            image: true,
            title: true,
            phone: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                assignedContacts: true,
                assignedDeals: true,
                assignedCompanies: true,
              },
            },
          },
        },
      },
      orderBy: {
        user: {
          createdAt: "desc",
        },
      },
    });
    
    // Extract users from the userWorkspace records and add workspace role
    const users = userWorkspaces.map(uw => ({
      ...uw.user,
      workspaceRole: uw.role,
    }));
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST invite new team member to workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workspaceId = request.headers.get("x-workspace-id");
    const userId = request.headers.get("x-user-id");
    
    if (!workspaceId || !userId) {
      return NextResponse.json(
        { error: !userId ? "Unauthorized" : "Workspace not found" },
        { status: !userId ? 401 : 400 }
      );
    }
    
    // Check if the requesting user has permission to invite (owner or admin)
    const requestingUserWorkspace = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
    
    if (!requestingUserWorkspace || !['owner', 'admin'].includes(requestingUserWorkspace.role)) {
      return NextResponse.json(
        { error: "You don't have permission to invite users to this workspace" },
        { status: 403 }
      );
    }
    
    // Create user if they don't exist, then add them to the workspace
    const user = await prisma.user.upsert({
      where: { email: body.email },
      update: {
        name: body.name || undefined,
        title: body.title || undefined,
        phone: body.phone || undefined,
      },
      create: {
        email: body.email,
        name: body.name,
        role: body.role || "member",
        title: body.title,
        phone: body.phone,
        isActive: body.isActive !== false,
      },
    });
    
    // Add user to workspace if not already a member
    const existingMembership = await prisma.userWorkspace.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });
    
    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }
    
    await prisma.userWorkspace.create({
      data: {
        userId: user.id,
        workspaceId,
        role: body.workspaceRole || "member",
      },
    });
    
    // Return the user with workspace info
    const userWithWorkspace = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      title: user.title,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      workspaceRole: body.workspaceRole || "member",
    };
    
    // Note: The user will need to use "forgot password" to set their password
    // Or you could send them an invitation email with a password reset link
    
    return NextResponse.json(userWithWorkspace, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team member:", error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}