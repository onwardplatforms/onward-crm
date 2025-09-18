import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all activities
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    const activities = await prisma.activity.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        workspaceId: true,
        dealId: true,
        assignedToId: true,
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

// POST create new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the authenticated user ID and workspace from headers (set by middleware)
    const userId = request.headers.get("x-user-id");
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!userId || !workspaceId) {
      return NextResponse.json(
        { error: !userId ? "Unauthorized" : "Workspace not found" },
        { status: !userId ? 401 : 400 }
      );
    }
    
    // Extract contactIds, participantIds and other data
    const { contactIds, participantIds, dealId, assignedToId, ...restData } = body;
    
    const activityData = {
      ...restData,
      userId,
      workspaceId,
      dealId: dealId === "none" ? null : dealId,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
      contacts: {
        connect: contactIds?.map((id: string) => ({ id })) || [],
      },
      participants: {
        connect: participantIds?.map((id: string) => ({ id })) || [],
      },
    };
    
    const activity = await prisma.activity.create({
      data: activityData,
      select: {
        id: true,
        type: true,
        subject: true,
        description: true,
        date: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        workspaceId: true,
        dealId: true,
        assignedToId: true,
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        deal: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create activity", details: errorMessage },
      { status: 500 }
    );
  }
}