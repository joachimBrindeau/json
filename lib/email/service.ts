/**
 * Email service for sending transactional emails
 * Uses nodemailer with SMTP configuration
 */

import nodemailer from 'nodemailer';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

/**
 * Create SMTP transporter
 */
function createTransporter() {
  if (!config.email.enabled) {
    logger.warn('Email service is disabled - SMTP configuration missing');
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure, // true for 465, false for other ports
    auth: {
      user: config.email.smtp.username,
      pass: config.email.smtp.password,
    },
    // SendGrid specific options
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Send email using configured SMTP
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      logger.warn(
        { to: options.to, subject: options.subject },
        'Email not sent - SMTP not configured'
      );
      return false;
    }

    const mailOptions = {
      from: `"${config.email.from.name}" <${config.email.from.email}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(
      {
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      },
      'Email sent successfully'
    );

    return true;
  } catch (error) {
    logger.error(
      {
        err: error,
        to: options.to,
        subject: options.subject,
      },
      'Failed to send email'
    );
    return false;
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      return false;
    }

    await transporter.verify();
    logger.info('SMTP connection verified');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'SMTP connection verification failed');
    return false;
  }
}

