import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    const deal = await prisma.deal.findFirst({
      where: { 
        id,
        workspaceId 
      },
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
    
    // Get the authenticated user ID and workspace from headers (set by middleware)
    const userId = request.headers.get("x-user-id");
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    console.log("Updating deal:", id, "with data:", body);
    
    // Get the current deal to check for stage changes
    const currentDeal = await prisma.deal.findFirst({
      where: { 
        id,
        workspaceId 
      },
      select: {
        stage: true,
        position: true,
        value: true,
        probability: true,
      },
    });
    
    if (!currentDeal) {
      return NextResponse.json(
        { error: "Deal not found" },
        { status: 404 }
      );
    }
    
    // Handle "unassigned" value
    const { assignedToId, ...restData } = body;
    const updateData = {
      ...restData,
      assignedToId: assignedToId === "unassigned" ? null : assignedToId,
    };
    
    console.log("Processed update data:", updateData);
    
    // Check if stage is changing
    const isStageChanging = updateData.stage && updateData.stage !== currentDeal.stage;
    
    // Update the deal and create transition if stage changed
    const deal = await prisma.$transaction(async (tx) => {
      // Update the deal
      const updatedDeal = await tx.deal.update({
        where: { 
          id,
          workspaceId 
        },
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
      
      // Create transition record if stage changed
      if (isStageChanging) {
        await tx.dealTransition.create({
          data: {
            dealId: id,
            fromStage: currentDeal.stage,
            toStage: updateData.stage!,
            fromPosition: currentDeal.position,
            toPosition: updateData.position || 0,
            value: updateData.value || currentDeal.value,
            probability: updateData.probability || currentDeal.probability,
            changedById: userId,
          },
        });
      }
      
      return updatedDeal;
    });
    
    // Create notification if someone else updated the deal
    if (isStageChanging && userId) {
      // Get full deal info for notification
      const dealInfo = await prisma.deal.findFirst({
        where: { 
          id,
          workspaceId 
        },
        include: {
          user: true,
          assignedTo: true,
        },
      });
      
      if (dealInfo) {
        // Determine who should be notified
        const notifyUserIds = new Set<string>();
        
        // Notify the deal owner if it's not the person making the change
        if (dealInfo.userId && dealInfo.userId !== userId) {
          notifyUserIds.add(dealInfo.userId);
        }
        
        // Notify the assigned user if it's not the person making the change
        if (dealInfo.assignedToId && dealInfo.assignedToId !== userId) {
          notifyUserIds.add(dealInfo.assignedToId);
        }
        
        // Create notifications for each user who should be notified
        for (const notifyUserId of notifyUserIds) {
          // Check if user has deal updates enabled
          const preferences = await prisma.notificationPreference.findUnique({
            where: { userId: notifyUserId },
          });
          
          if (!preferences || preferences.dealUpdates) {
            // Get the name of the person who made the change
            const changer = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true },
            });
            
            await prisma.notification.create({
              data: {
                type: "deal_update",
                title: `Deal "${deal.name}" moved to ${updateData.stage}`,
                message: `${changer?.name || changer?.email || "Someone"} moved the deal from ${currentDeal.stage} to ${updateData.stage}`,
                userId: notifyUserId,
                dealId: id,
                workspaceId,
              },
            });
          }
        }
      }
    }
    
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
    const workspaceId = request.headers.get("x-workspace-id");
    
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 400 }
      );
    }
    
    await prisma.deal.delete({
      where: { 
        id,
        workspaceId 
      },
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