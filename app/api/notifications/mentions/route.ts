import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {

  try {
    const body = await request.json();
    const {
      mentions,
      mentionerName,
      contextType,
      contextId,
      contextName,
      workspaceId,
      message
    } = body;

    if (!mentions || mentions.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Create notifications for each mentioned user
    const notifications = await Promise.all(
      mentions.map(async (mentionedUserId: string) => {
        // Check if user has @mentions notifications enabled
        const preferences = await prisma.notificationPreference.findUnique({
          where: { userId: mentionedUserId },
        });

        // Default to true if no preferences exist or atMentions is not set
        if (preferences && preferences.atMentions === false) {
          return null;
        }

        // Create the notification
        const notification = await prisma.notification.create({
          data: {
            type: "at_mention",
            title: `${mentionerName} mentioned you`,
            message: message || `You were mentioned in ${contextName}`,
            userId: mentionedUserId,
            workspaceId,
            // Link to the appropriate entity
            ...(contextType === "activity" && { activityId: contextId }),
            ...(contextType === "deal" && { dealId: contextId }),
            ...(contextType === "contact" && { contactId: contextId }),
            ...(contextType === "company" && { companyId: contextId }),
          },
        });

        return notification;
      })
    );

    const validNotifications = notifications.filter(Boolean);

    return NextResponse.json({
      notifications: validNotifications,
      count: validNotifications.length
    });
  } catch (error) {
    console.error("Error creating mention notifications:", error);
    return NextResponse.json(
      { error: "Failed to create mention notifications" },
      { status: 500 }
    );
  }
}