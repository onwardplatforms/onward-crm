import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all activities
export async function GET(request: NextRequest) {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        contacts: {
          include: {
            company: true,
          },
        },
        deal: true,
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
    
    // Get the authenticated user ID from headers (set by middleware)
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Extract contactIds and other data
    const { contactIds, dealId, assignedToId, ...restData } = body;
    
    const activityData = {
      ...restData,
      userId,
      dealId: dealId === "none" ? null : dealId,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
      contacts: {
        connect: contactIds?.map((id: string) => ({ id })) || [],
      },
    };
    
    const activity = await prisma.activity.create({
      data: activityData,
      include: {
        contacts: {
          include: {
            company: true,
          },
        },
        deal: true,
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
      },
    });
    
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}