import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * Email configuration interface.
 */
export interface IEmailConfig {
  /** SMTP host address */
  host: string;
  /** SMTP port number */
  port: number;
  /** SMTP authentication user */
  user: string;
  /** SMTP authentication password */
  pass: string;
  /** Sender email address */
  from: string;
}

/**
 * Email content structure for sending.
 */
export interface IEmailContent {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** Email body content */
  body: string;
  /** HTML email body (optional) */
  html?: string;
  /** CC recipients (optional) */
  cc?: string | string[];
  /** BCC recipients (optional) */
  bcc?: string | string[];
  /** Attachments (optional) */
  attachments?: any[];
}

/**
 * Email sending result interface.
 */
export interface IEmailResult {
  /** Success status flag */
  success: boolean;
  /** Message ID from SMTP server */
  messageId: string | null;
  /** Error message if failed */
  error: string | null;
  /** Timestamp of send attempt */
  timestamp: Date;
}

/**
 * Service for managing email sending operations.
 * Integrates with Nodemailer for SMTP-based email delivery.
 * Provides async email sending with error handling and logging.
 */
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initializes SMTP transporter with environment configuration.
   * Called automatically on service initialization.
   *
   * @private
   */
  private initializeTransporter(): void {
    try {
      const config: IEmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@example.com',
      };

      if (!config.user || !config.pass) {
        console.warn('Email service: SMTP credentials not configured');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465,
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Sends email with provided content and recipient.
   *
   * @param emailContent Email content structure
   * @returns Promise resolving to email result with status
   * @example
   * ```typescript
   * const result = await emailService.sendEmail({
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   body: 'Welcome to our platform',
   *   html: '<p>Welcome to our platform</p>'
   * });
   * ```
   */
  async sendEmail(emailContent: IEmailContent): Promise<IEmailResult> {
    const result: IEmailResult = {
      success: false,
      messageId: null,
      error: null,
      timestamp: new Date(),
    };

    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: emailContent.to,
        subject: emailContent.subject,
        text: emailContent.body,
        html: emailContent.html || emailContent.body,
        cc: emailContent.cc,
        bcc: emailContent.bcc,
        attachments: emailContent.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      result.success = true;
      result.messageId = info.messageId;

      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Email sending failed:', error);
      return result;
    }
  }

  /**
   * Sends batch email to multiple recipients.
   *
   * @param recipients Array of recipient email addresses
   * @param subject Email subject line
   * @param body Email body content
   * @param html Optional HTML email body
   * @returns Promise resolving to array of email results
   */
  async sendBatchEmail(
    recipients: string[],
    subject: string,
    body: string,
    html?: string,
  ): Promise<IEmailResult[]> {
    const results: IEmailResult[] = [];

    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: recipient,
        subject,
        body,
        html,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Sends templated email with variable substitution.
   *
   * @param to Recipient email address
   * @param subject Email subject
   * @param templateBody Email body with {{var}} placeholders
   * @param variables Object with key-value pairs for substitution
   * @returns Promise resolving to email result
   */
  async sendTemplatedEmail(
    to: string,
    subject: string,
    templateBody: string,
    variables: Record<string, string>,
  ): Promise<IEmailResult> {
    let body = templateBody;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }

    return this.sendEmail({
      to,
      subject,
      body,
    });
  }

  /**
   * Verifies SMTP connection is working.
   *
   * @returns Promise resolving to boolean connection status
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        return false;
      }
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email transporter verification failed:', error);
      return false;
    }
  }

  /**
   * Sends email with file attachments.
   *
   * @param to Recipient email address
   * @param subject Email subject
   * @param body Email body
   * @param attachmentPaths Array of file paths to attach
   * @returns Promise resolving to email result
   */
  async sendEmailWithAttachments(
    to: string,
    subject: string,
    body: string,
    attachmentPaths: string[],
  ): Promise<IEmailResult> {
    const attachments = attachmentPaths.map((path) => ({
      path,
    }));

    return this.sendEmail({
      to,
      subject,
      body,
      attachments,
    });
  }

  /**
   * Gets current email configuration status.
   *
   * @returns Configuration status object
   */
  getConfigStatus(): Record<string, any> {
    return {
      initialized: !!this.transporter,
      host: process.env.SMTP_HOST || 'not configured',
      port: process.env.SMTP_PORT || 'not configured',
      from: process.env.SMTP_FROM || 'not configured',
    };
  }
}
