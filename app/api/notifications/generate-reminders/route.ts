import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { format } from "date-fns";

// This should be called daily via a cron job or scheduled task
export async function POST(request: Request) {
  try {
    // For security, you might want to add a secret key check here
    // const { headers } = request;
    // const authHeader = headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Get activities happening 3 days from now
    const targetDate = addDays(new Date(), 3);
    const startOfTargetDay = startOfDay(targetDate);
    const endOfTargetDay = endOfDay(targetDate);

    // Find all activities scheduled for 3 days from now
    const upcomingActivities = await prisma.activity.findMany({
      where: {
        date: {
          gte: startOfTargetDay,
          lte: endOfTargetDay,
        },
      },
      include: {
        assignedTo: true,
        user: true,
        contacts: {
          include: {
            company: true,
          },
        },
        deal: true,
      },
    });

    // Generate notifications for each activity
    const notifications = [];
    for (const activity of upcomingActivities) {
      // Determine who should receive the notification
      const recipientId = activity.assignedToId || activity.userId;
      
      // Check if user has activity reminders enabled
      const preferences = await prisma.notificationPreference.findUnique({
        where: { userId: recipientId },
      });

      if (!preferences || preferences.activityReminders) {
        // Check if notification already exists for this activity
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: recipientId,
            activityId: activity.id,
            type: "activity_reminder",
          },
        });

        if (!existingNotification) {
          // Create notification
          const contactNames = activity.contacts
            .map(c => `${c.firstName} ${c.lastName}`)
            .join(", ");
          
          const notification = await prisma.notification.create({
            data: {
              type: "activity_reminder",
              title: `Upcoming ${activity.type}: ${activity.subject}`,
              message: `You have an activity scheduled for ${format(activity.date, "EEEE, MMMM d")}${
                contactNames ? ` with ${contactNames}` : ""
              }${activity.deal ? ` for deal: ${activity.deal.name}` : ""}`,
              userId: recipientId,
              activityId: activity.id,
              workspaceId: activity.workspaceId,
            },
          });
          notifications.push(notification);
        }
      }
    }

    // Clean up old read notifications (older than 30 days)
    const thirtyDaysAgo = addDays(new Date(), -30);
    await prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    return NextResponse.json({
      success: true,
      notificationsCreated: notifications.length,
      message: `Generated ${notifications.length} activity reminders`,
    });
  } catch (error) {
    console.error("Error generating activity reminders:", error);
    return NextResponse.json(
      { error: "Failed to generate reminders" },
      { status: 500 }
    );
  }
}