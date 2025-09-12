import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all contacts
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId,
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

// POST create new contact
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
    
    // Handle "unassigned" value
    const { assignedToId, ...restData } = body;
    const contactData = {
      ...restData,
      userId,
      workspaceId,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
    };
    
    const contact = await prisma.contact.create({
      data: contactData,
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
    
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}