import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all deals
export async function GET(request: NextRequest) {
  try {
    const deals = await prisma.deal.findMany({
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
    
    // Get the authenticated user ID from headers (set by middleware)
    const userId = request.headers.get("x-user-id");
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Handle "unassigned" value
    const { assignedToId, ...restData } = body;
    const dealData = {
      ...restData,
      userId,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
    };
    
    // Create deal and initial transition in a transaction
    const deal = await prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: dealData,
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