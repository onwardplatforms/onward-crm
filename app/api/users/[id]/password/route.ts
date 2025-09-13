import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const requestUserId = request.headers.get("x-user-id");
    
    // Ensure users can only update their own password
    if (!requestUserId || requestUserId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    
    // Get the user's account with password
    const account = await prisma.account.findFirst({
      where: { 
        userId: userId,
        providerId: "credential" // Assuming credential provider for password auth
      }
    });
    
    if (!account || !account.password) {
      return NextResponse.json(
        { error: "User not found or no password set" },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, account.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the account
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword }
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}