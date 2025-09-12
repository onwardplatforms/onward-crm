import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single activity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const activity = await prisma.activity.findUnique({
      where: { id },
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
      },
    });
    
    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity" },
      { status: 500 }
    );
  }
}

// PUT update activity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Extract contactIds and other data
    const { contactIds, dealId, ...restData } = body;
    
    // First disconnect all existing contacts
    await prisma.activity.update({
      where: { id },
      data: {
        contacts: {
          set: [],
        },
      },
    });
    
    // Then update with new data
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        ...restData,
        dealId: dealId === "none" ? null : dealId,
        contacts: {
          connect: contactIds?.map((contactId: string) => ({ id: contactId })) || [],
        },
      },
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
      },
    });
    
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

// DELETE activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.activity.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}