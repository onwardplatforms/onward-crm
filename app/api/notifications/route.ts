import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const workspaceId = request.headers.get("x-workspace-id");

  if (!userId || !workspaceId) {
    return NextResponse.json(
      { error: !userId ? "Unauthorized" : "Workspace not found" },
      { status: !userId ? 401 : 400 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        workspaceId,
        ...(unreadOnly && { read: false }),
      },
      include: {
        activity: {
          include: {
            contacts: true,
            deal: true,
          },
        },
        deal: {
          include: {
            company: true,
            contact: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        workspaceId,
        read: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  const workspaceId = request.headers.get("x-workspace-id");

  if (!userId || !workspaceId) {
    return NextResponse.json(
      { error: !userId ? "Unauthorized" : "Workspace not found" },
      { status: !userId ? 401 : 400 }
    );
  }

  try {
    const { notificationIds } = await request.json();

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          workspaceId,
        },
        data: {
          read: true,
        },
      });
    } else {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId,
          workspaceId,
          read: false,
        },
        data: {
          read: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}