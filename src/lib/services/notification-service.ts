import { notificationServiceApi } from '@/lib/api/api-service';
import { createEmailService, EmailService } from './email-service';
import { getFullnameinitial } from '@/lib/utils';

export interface MessageItem {
  id: string;
  content: string;
  authorEmail: string;
  authorName: string;
  authorImageUrl?: string;
  createdAt: string;
}

export interface AuthorSection {
  authorEmail: string;
  authorName: string;
  authorImageUrl?: string;
  messages: MessageItem[];
  messageCount: number;
}

export interface ChannelSection {
  channelId: string;
  channelName: string;
  totalMessageCount: number;
  authorSections: AuthorSection[];
}

export interface EmailNotificationData {
  userEmail: string;
  userName: string;
  channelSections: ChannelSection[];
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = createEmailService();
  }

  /**
   * Get unread messages that need notifications (older than 30 minutes and not sent)
   */
  async getUnreadMessagesForNotifications(): Promise<EmailNotificationData[]> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    try {
      // Get all users with unread messages
      const users = await notificationServiceApi.getUsersWithUnreadMessages();

      if (!users || users.length === 0) {
        return [];
      }

      const notifications: EmailNotificationData[] = [];

      for (const user of users) {
        if (!user.unreadMsg || !Array.isArray(user.unreadMsg) || user.unreadMsg.length === 0) {
          continue;
        }

        // Get message details for unread messages
        const messages = await notificationServiceApi.getMessagesForNotifications(user.unreadMsg);
        
        if (!messages || messages.length === 0) {
          continue;
        }

        // Filter messages older than 30 minutes and not sent
        const filteredMessages = messages.filter(m => 
          m.createdAt < thirtyMinutesAgo && !m.sentNotification
        );

        if (filteredMessages.length === 0) {
          continue;
        }

        // Get channel and author information
        const channelIds = [...new Set(filteredMessages.map(m => m.channelId))];
        const authorEmails = [...new Set(filteredMessages.map(m => m.authorEmail))];

        const channels = await notificationServiceApi.getChannelsInfo(channelIds);
        const authors = await notificationServiceApi.getAuthorsInfo(authorEmails);

        const channelsMap = new Map(channels?.map(c => [c.id, c.name]) || []);
        const authorsMap = new Map(authors?.map(a => [a.email, { name: a.firstName, imageUrl: a.imageUrl }]) || []);

        // Group messages by channel, then by author
        const channelGroups = new Map<string, ChannelSection>();

        for (const message of filteredMessages) {
          const channelId = message.channelId;
          const channelName = channelsMap.get(channelId) || 'Unknown Channel';
          const authorEmail = message.authorEmail;
          const authorInfo = authorsMap.get(authorEmail);

          if (!channelGroups.has(channelId)) {
            channelGroups.set(channelId, {
              channelId,
              channelName,
              totalMessageCount: 0,
              authorSections: []
            });
          }

          const channelGroup = channelGroups.get(channelId)!;
          
          // Find or create author section
          let authorSection = channelGroup.authorSections.find(a => a.authorEmail === authorEmail);
          if (!authorSection) {
            authorSection = {
              authorEmail,
              authorName: authorInfo?.name || authorEmail,
              authorImageUrl: authorInfo?.imageUrl,
              messages: [],
              messageCount: 0
            };
            channelGroup.authorSections.push(authorSection);
          }

          // Add message to author section
          authorSection.messages.push({
            id: message.id,
            content: message.content,
            authorEmail,
            authorName: authorInfo?.name || authorEmail,
            authorImageUrl: authorInfo?.imageUrl,
            createdAt: message.createdAt
          });
          authorSection.messageCount++;
          channelGroup.totalMessageCount++;
        }

        const notificationData = {
          userEmail: user.email,
          userName: user.firstName || user.email,
          channelSections: Array.from(channelGroups.values())
        };
        
        console.log(`📧 Generated notification data for ${user.email}:`, {
          userEmail: notificationData.userEmail,
          userName: notificationData.userName,
          channelCount: notificationData.channelSections.length,
          totalMessages: notificationData.channelSections.reduce((sum, cs) => sum + cs.totalMessageCount, 0)
        });
        
        notifications.push(notificationData);
      }

      return notifications;
    } catch (error) {
      console.error('Error fetching unread messages for notifications:', error);
      return [];
    }
  }

  /**
   * Mark messages as notification sent
   */
  async markNotificationsAsSent(messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;

    try {
      await notificationServiceApi.markNotificationsAsSent(messageIds);
    } catch (error) {
      console.error('Error marking notifications as sent:', error);
      throw error;
    }
  }

  /**
   * Get all message IDs from notification data for marking as sent
   */
  private getAllMessageIds(notificationData: EmailNotificationData): string[] {
    const messageIds: string[] = [];
    
    for (const channelSection of notificationData.channelSections) {
      for (const authorSection of channelSection.authorSections) {
        for (const message of authorSection.messages) {
          messageIds.push(message.id);
        }
      }
    }
    
    return messageIds;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notificationData: EmailNotificationData): Promise<void> {
    try {
      const totalUnreadCount = notificationData.channelSections.reduce((sum, n) => sum + n.totalMessageCount, 0);
      const subject = `You have ${totalUnreadCount} unread messages in Feedbird`;
      const html = this.generateEmailHTML(notificationData);
      await this.emailService.sendEmail({
        to: notificationData.userEmail,
        subject,
        html,
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
      });

      console.log(`✅ Email notification sent to ${notificationData.userEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send email notification to ${notificationData.userEmail}:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML email content
   */
  public generateEmailHTML(notificationData: EmailNotificationData): string {
    const totalUnreadCount = notificationData.channelSections.reduce((sum, n) => sum + n.totalMessageCount, 0);
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Feedbird - Unread Messages</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #FAFAFA; padding-top: 40px; }
          .container { max-width: 400px; margin: 0 auto; padding: 40px; background-color: #FFFFFF; }
          .header { text-align: left; margin-bottom: 40px; }
          .channel-section { margin-bottom: 40px; }
          .channel-title { font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #1C1D1F; }
          .author-section { margin-bottom: 24px; }
          .author-section-title { font-size: 16px; font-weight: 600; color: #1C1D1F; }
          .message-item { padding-top: 24px; padding-bottom: 24px; border-bottom: 1px solid #EAE9E9;}
          .message-header { margin-bottom: 8px; overflow: hidden; }
          .author-info { float: left; }
          .avatar { width: 24px; height: 24px; border-radius: 4px; display: inline-block; text-align: center; line-height: 24px; margin-right: 8px; font-weight: bold; font-size: 14px; background-color: #007bff; color: white; vertical-align: top; }
          .author-name { font-weight: 600; font-size: 13px; color: #1C1D1F; display: inline-block; vertical-align: top; line-height: 24px; }
          .timestamp { color: #838488; font-size: 12px; font-weight: 400; float: right; line-height: 24px; vertical-align: top; }
          .message-content { color: #1C1D1F; font-size: 13px; font-weight: 400; line-height: 20px; }
          .reply-button { display: inline-block; background: #4670F9; color: #FFFFFF; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; }
          .footer { margin-top: 72px; }
          .footer-top { margin-bottom: 40px; overflow: hidden; }
          .footer-logo { float: left; display: block; }
          .social-icons { float: right; display: block; }
          .social-icon { width: 17.5px; height: 17.5px; opacity: 0.5; margin-left: 8px; display: inline-block; vertical-align: middle; }
          .footer-links { text-align: left; margin-bottom: 24px; }
          .footer-link { color: #838488; text-decoration: none; font-size: 12px; font-weight: 400; font-style: normal; margin-right: 16px; }
          .footer-divider { color: #EAE9E9; margin-right: 16px; }
          .footer-text { text-align: left; color: #838488; font-size: 12px; font-weight: 400; font-style: normal; line-height: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://app.feedbird.com/images/logo/logo.png" alt="Feedbird Logo">
          </div>
    `;
console.log("notificationData.channelSections:", notificationData.channelSections);
    for (const channelSection of notificationData.channelSections) {
      html += `
        <div class="channel-section">
          <div class="channel-title">
            You have ${channelSection.totalMessageCount} unread messages in the ${channelSection.channelName} channel
          </div>
      `;

      for (const authorSection of channelSection.authorSections) {
        html += `
          <div class="author-section">
            <div class="author-section-title">
              ${authorSection.messageCount} new messages from ${authorSection.authorName}
            </div>
        `;

        for (const message of authorSection.messages) {
          const avatarText = getFullnameinitial(undefined, undefined, message.authorName || message.authorEmail || '?');
          const formattedTime = this.formatMessageTime(message.createdAt);
          
          // Generate avatar HTML - use image if available, otherwise use text
          const avatarHTML = message.authorImageUrl 
            ? `<img src="${message.authorImageUrl}" alt="${message.authorName}" style="width: 24px; height: 24px; border-radius: 4px; object-fit: cover; margin-right: 8px;">`
            : `<div class="avatar">${avatarText}</div>`;
          
          html += `
            <div class="message-item">
              <div class="message-header">
                <div class="author-info">
                  ${avatarHTML}
                  <div class="author-name">${message.authorName}</div>
                </div>
                <div class="timestamp">${formattedTime}</div>
              </div>
              <div class="message-content">${message.content}</div>
            </div>
          `;
        }

        html += `
          </div>
        `;
      }

      // Add reply button for this specific channel
      html += `
          <div style="text-align: left; margin-top: 24px;">
            <a href="https://app.feedbird.com/messages?channel=${channelSection.channelId}" class="reply-button" style="color: #FFFFFF !important; text-decoration: none;">
              Reply instantly
            </a>
          </div>
        </div>
      `;
    }
    
    html += `
          <div class="footer">
            <div class="footer-top">
              <img src="https://app.feedbird.com/images/logo/logo.png" alt="Feedbird Logo" class="footer-logo">
              <div class="social-icons">
                <img src="https://app.feedbird.com/images/platforms/linkedin.png" alt="LinkedIn" class="social-icon">
                <img src="https://app.feedbird.com/images/platforms/facebook.png" alt="Facebook" class="social-icon">
                <img src="https://app.feedbird.com/images/platforms/twitter.png" alt="Twitter" class="social-icon">
                <img src="https://app.feedbird.com/images/platforms/instagram.png" alt="Instagram" class="social-icon">
                <img src="https://app.feedbird.com/images/platforms/youtube.png" alt="YouTube" class="social-icon">
                <img src="https://app.feedbird.com/images/platforms/tiktok.png" alt="TikTok" class="social-icon">
              </div>
            </div>
            
            <div class="footer-links">
              <a href="#" class="footer-link">Our Blog</a>
              <span class="footer-divider">|</span>
              <a href="#" class="footer-link">Unsubscribe</a>
              <span class="footer-divider">|</span>
              <a href="#" class="footer-link">Policies</a>
              <span class="footer-divider">|</span>
              <a href="#" class="footer-link">Help Center</a>
            </div>
            
            <div class="footer-text">
              <div style="margin-bottom: 8px;">© 2025 Feedbird</div>
              <div style="margin-bottom: 24px;">415 Mission Street, 3rd Floor, San Francisco, CA 94105</div>
              <div>All rights reserved.</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Format message time in a readable format
   */
  private formatMessageTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // Today - show time
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      // Yesterday
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      // Other days - show date and time
      return date.toLocaleDateString('en-US', { 
        month: 'long',
        day: 'numeric'
      }) + ` at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
  }
}
