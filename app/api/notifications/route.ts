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
        OR: [
          { workspaceId },
          { type: "workspace_invite" }, // Include workspace invites regardless of workspace
        ],
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
        contact: {
          include: {
            company: true,
          },
        },
        company: true,
        invite: {
          include: {
            workspace: true,
            invitedBy: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });
    
    // Filter out workspace invites that have been accepted or declined
    const filteredNotifications = notifications.filter(notification => {
      if (notification.type === "workspace_invite" && notification.invite) {
        // Only show pending invites
        return notification.invite.status === "pending";
      }
      return true;
    });

    // Get unread count (only count notifications we're actually showing)
    const unreadCount = filteredNotifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications: filteredNotifications, unreadCount });
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

  console.log("PUT /api/notifications - userId:", userId, "workspaceId:", workspaceId);

  if (!userId || !workspaceId) {
    console.log("Missing userId or workspaceId");
    return NextResponse.json(
      { error: !userId ? "Unauthorized" : "Workspace not found" },
      { status: !userId ? 401 : 400 }
    );
  }

  try {
    const { notificationIds } = await request.json();
    console.log("Notification IDs to mark as read:", notificationIds);

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      // For specific IDs, we only check userId to handle cross-workspace notifications like @mentions
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
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