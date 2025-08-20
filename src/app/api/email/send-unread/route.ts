// app/api/email/send-unread/route.ts
import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification-service";

export const dynamic = "force-dynamic"; // avoid any caching for GET

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

async function processNotifications() {
  const notificationService = new NotificationService();

  const notifications = await notificationService.getUnreadMessagesForNotifications();
  if (notifications.length === 0) {
    return NextResponse.json({ message: "No notifications to send", processed: 0 });
  }

  let totalProcessed = 0;
  const allMessageIds: string[] = [];

  for (const notificationData of notifications) {
    try {
      await notificationService.sendEmailNotification(notificationData);
      for (const channelSection of notificationData.channelSections) {
        for (const authorSection of channelSection.authorSections) {
          allMessageIds.push(...authorSection.messages.map(m => m.id));
        }
      }
      totalProcessed++;
    } catch (err) {
      console.error(`Error processing notifications for ${notificationData.userEmail}:`, err);
    }
  }

  return NextResponse.json({
    message: "Notifications processed successfully",
    processed: totalProcessed,
    totalUsers: notifications.length,
    totalMessages: allMessageIds.length,
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return processNotifications();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return processNotifications();
}
