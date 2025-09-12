import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        activities: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!deal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      { error: "Failed to fetch deal" },
      { status: 500 }
    );
  }
}

// PUT update deal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("Updating deal:", id, "with data:", body);
    
    // Handle "unassigned" value
    const { assignedToId, ...restData } = body;
    const updateData = {
      ...restData,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
    };
    
    console.log("Processed update data:", updateData);
    
    const deal = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(deal);
  } catch (error) {
    console.error("Error updating deal:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to update deal", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE deal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.deal.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deal:", error);
    return NextResponse.json(
      { error: "Failed to delete deal" },
      { status: 500 }
    );
  }
}