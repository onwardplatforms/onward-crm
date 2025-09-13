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
    
    // Handle "unassigned" value and "none" for company
    const { assignedToId, companyId, ...restData } = body;
    
    // Build the data object conditionally
    const createData: Record<string, unknown> = {
      ...restData,
      user: {
        connect: { id: userId }
      },
      workspace: {
        connect: { id: workspaceId }
      }
    };
    
    // Add company (required field)
    if (companyId) {
      createData.company = {
        connect: { id: companyId }
      };
    }
    
    // Only add assignedTo if it's not "unassigned" and has a value
    if (assignedToId && assignedToId !== "unassigned") {
      createData.assignedTo = {
        connect: { id: assignedToId }
      };
    }
    
    const contact = await prisma.contact.create({
      data: createData,
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
    console.error("Error details:", (error as Error).message);
    if ((error as { code?: string }).code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid company or assigned user reference" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create contact" },
      { status: 500 }
    );
  }
}