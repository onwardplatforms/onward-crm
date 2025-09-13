import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all companies
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    const companies = await prisma.company.findMany({
      where: {
        workspaceId,
      },
      include: {
        _count: {
          select: {
            contacts: true,
            deals: true,
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
        createdAt: "desc",
      },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

// POST create new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the authenticated user ID and workspace from headers (set by middleware)
    const userId = request.headers.get("x-user-id");
    const workspaceId = request.headers.get("x-workspace-id");
    console.log("Creating company with user ID:", userId, "and workspace ID:", workspaceId);
    
    if (!userId || !workspaceId) {
      console.error("Missing required headers - userId:", userId, "workspaceId:", workspaceId);
      return NextResponse.json(
        { error: !userId ? "Unauthorized" : "Workspace not found" },
        { status: !userId ? 401 : 400 }
      );
    }
    
    // Handle "unassigned" value
    const { assignedToId, ...restData } = body;
    
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
    
    // Only add assignedTo if it's not "unassigned" and has a value
    if (assignedToId && assignedToId !== "unassigned") {
      createData.assignedTo = {
        connect: { id: assignedToId }
      };
    }
    
    const company = await prisma.company.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: createData as any,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}