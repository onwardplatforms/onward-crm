import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find the invite by token
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or has expired" },
        { status: 404 }
      );
    }

    // Check if invite has expired (7 days)
    const expiryDate = new Date(invite.createdAt);
    expiryDate.setDate(expiryDate.getDate() + 7);

    if (new Date() > expiryDate) {
      return NextResponse.json(
        { error: "This invite has expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: invite.id,
      workspace: invite.workspace,
      invitedBy: invite.invitedBy,
      email: invite.email,
      role: invite.role,
    });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}