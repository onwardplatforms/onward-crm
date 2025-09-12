import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET single team member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        title: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedContacts: true,
            assignedDeals: true,
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { password, ...userData } = body;
    
    let updateData = userData;
    
    // If password is provided, hash it
    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData = { ...userData, password: hashedPassword };
    }
    
    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        title: true,
        phone: true,
        isActive: true,
        createdAt: true,
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
  { params }: { params: { id: string } }
) {
  try {
    // Soft delete - just deactivate the user
    const user = await prisma.user.update({
      where: { id: params.id },
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