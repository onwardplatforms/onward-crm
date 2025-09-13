import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all deals
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    const deals = await prisma.deal.findMany({
      where: {
        workspaceId,
      },
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
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }
}

// POST create new deal
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
    
    // Handle "unassigned" value and "none" for company/contact
    const { assignedToId, companyId, contactId, ...restData } = body;
    
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
    
    // Only add company if it's not "none" and has a value
    if (companyId && companyId !== "none") {
      createData.company = {
        connect: { id: companyId }
      };
    }
    
    // Only add contact if it's not "none" and has a value
    if (contactId && contactId !== "none") {
      createData.contact = {
        connect: { id: contactId }
      };
    }
    
    // Only add assignedTo if it's not "unassigned" and has a value
    if (assignedToId && assignedToId !== "unassigned") {
      createData.assignedTo = {
        connect: { id: assignedToId }
      };
    }
    
    // Create deal and initial transition in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: createData,
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
      
      // Create initial transition record
      await tx.dealTransition.create({
        data: {
          dealId: newDeal.id,
          fromStage: null, // null indicates initial creation
          toStage: newDeal.stage,
          fromPosition: null,
          toPosition: newDeal.position,
          value: newDeal.value,
          probability: newDeal.probability,
          changedById: userId,
        },
      });
      
      return newDeal;
    });
    
    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error("Error creating deal:", error);
    return NextResponse.json(
      { error: "Failed to create deal" },
      { status: 500 }
    );
  }
}