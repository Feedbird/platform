import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (you might want to add proper authentication here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    // TODO: Add proper token validation here
    
    const notificationService = new NotificationService();
    
    // Get unread messages that need notifications
    const notifications = await notificationService.getUnreadMessagesForNotifications();
    console.log('notifications:', notifications);
    if (notifications.length === 0) {
      return NextResponse.json({ 
        message: 'No notifications to send',
        processed: 0 
      });
    }

    let totalProcessed = 0;
    const allMessageIds: string[] = [];

    // Process each user's notifications
    for (const notificationData of notifications) {
      try {
        // Send email notification
        await notificationService.sendEmailNotification(notificationData);
        
        // Collect all message IDs to mark as sent
        for (const channelSection of notificationData.channelSections) {
          for (const authorSection of channelSection.authorSections) {
            allMessageIds.push(...authorSection.messages.map(m => m.id));
          }
        }
        
        totalProcessed++;
      } catch (error) {
        console.error(`Error processing notifications for ${notificationData.userEmail}:`, error);
        // Continue with other users even if one fails
      }
    }

    // Mark all processed messages as notification sent
    // if (allMessageIds.length > 0) {
    //   await notificationService.markNotificationsAsSent(allMessageIds);
    // }

    return NextResponse.json({
      message: 'Notifications processed successfully',
      processed: totalProcessed,
      totalUsers: notifications.length,
      totalMessages: allMessageIds.length
    });

  } catch (error) {
    console.error('Error in notification endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Notification endpoint is working. Use POST to send email.',
    usage: 'POST /api/email/send-unread with Bearer token'
  });
}

