/**
 * Email Service for Feedbird Notifications
 * This service provides email sending functionality using Resend
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<void>;
}

/**
 * Console Email Service (for development/testing)
 * Logs emails to console instead of actually sending them
 */
export class ConsoleEmailService implements EmailService {
  async sendEmail(options: EmailOptions): Promise<void> {
    console.log('📧 Console Email Service - Email would be sent:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('From:', options.from || 'noreply@feedbird.com');
    console.log('HTML Length:', options.html.length, 'characters');
    console.log('Preview:', options.html.substring(0, 200) + '...');
    console.log('---');
  }
}

/**
 * Resend Email Service
 * Requires resend package
 */
export class ResendEmailService implements EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(this.apiKey);
      const result = await resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

    } catch (error) {
      console.error('❌ Resend email error:', error);
      if (error instanceof Error) {
        console.error('  Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      throw error;
    }
  }
}

/**
 * Create the appropriate email service based on environment configuration
 * Falls back to console service if Resend is not configured
 */
export function createEmailService(): EmailService {
  // Check for Resend configuration
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
    return new ResendEmailService(
      process.env.RESEND_API_KEY,
      process.env.RESEND_FROM_EMAIL
    );
  }

  // Fallback to console service for development
  return new ConsoleEmailService();
}
