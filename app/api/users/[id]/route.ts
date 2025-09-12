import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("Fetching user with ID:", id);
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        title: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedContacts: true,
            assignedDeals: true,
            assignedCompanies: true,
          },
        },
      },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching team member:", error);
    return NextResponse.json(
      { error: "Failed to fetch team member" },
      { status: 500 }
    );
  }
}

// PUT update team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log("Received update data:", body);
    
    const { password, _count, createdAt, updatedAt, id: bodyId, ...userData } = body;
    
    // Note: Password changes should be handled through Better Auth's password reset flow
    // We don't handle password updates here anymore
    
    console.log("Updating user with cleaned data:", userData);
    
    const user = await prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        title: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedContacts: true,
            assignedDeals: true,
            assignedCompanies: true,
          },
        },
      },
    });
    
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE team member (soft delete by deactivating)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Soft delete - just deactivate the user
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    });
    
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error deactivating team member:", error);
    return NextResponse.json(
      { error: "Failed to deactivate team member" },
      { status: 500 }
    );
  }
}