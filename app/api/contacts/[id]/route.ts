import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        activities: true,
        deals: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

// PUT update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Handle "unassigned" value and "none" for company
    const { assignedToId, companyId, ...restData } = body;
    
    // Build the update data object
    const updateData: Record<string, unknown> = {
      ...restData
    };
    
    // Handle company updates (required field)
    if (companyId) {
      updateData.company = {
        connect: { id: companyId }
      };
    }
    
    // Handle assignedTo updates
    if (assignedToId === "unassigned") {
      updateData.assignedTo = {
        disconnect: true
      };
    } else if (assignedToId) {
      updateData.assignedTo = {
        connect: { id: assignedToId }
      };
    }
    
    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

// DELETE contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contact.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}