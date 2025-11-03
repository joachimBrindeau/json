#!/usr/bin/env tsx
/**
 * Test email service connection
 * Verifies SMTP configuration and sends a test email
 * 
 * Usage: tsx scripts/test-email.ts [email-address]
 */

import { verifyEmailConnection, sendEmail } from '../lib/email/service';
import { config } from '../lib/config';
import { logger } from '../lib/logger';

async function testEmailService(testEmail?: string) {
  console.log('📧 Testing Email Service Configuration\n');

  // Check configuration
  console.log('Configuration:');
  console.log(`  SMTP Host: ${config.email.smtp.host}`);
  console.log(`  SMTP Port: ${config.email.smtp.port}`);
  console.log(`  SMTP Username: ${config.email.smtp.username}`);
  console.log(`  From Email: ${config.email.from.email}`);
  console.log(`  From Name: ${config.email.from.name}`);
  console.log(`  Email Enabled: ${config.email.enabled}\n`);

  if (!config.email.enabled) {
    console.error('❌ Email service is disabled. Please check your SMTP configuration in .env');
    process.exit(1);
  }

  // Test connection
  console.log('🔌 Testing SMTP connection...');
  const connectionOk = await verifyEmailConnection();

  if (!connectionOk) {
    console.error('❌ SMTP connection failed. Please check your credentials.');
    process.exit(1);
  }

  console.log('✅ SMTP connection verified!\n');

  // Test email sending (if email provided)
  if (testEmail) {
    console.log(`📨 Sending test email to ${testEmail}...`);
    const sent = await sendEmail({
      to: testEmail,
      subject: 'Test Email - JSON Viewer',
      html: `
        <h1>Email Service Test</h1>
        <p>This is a test email from JSON Viewer to verify email functionality.</p>
        <p>If you received this, your SMTP configuration is working correctly! ✅</p>
        <hr>
        <p><small>Sent at ${new Date().toISOString()}</small></p>
      `,
      text: 'This is a test email from JSON Viewer. If you received this, your SMTP configuration is working correctly!',
    });

    if (sent) {
      console.log(`✅ Test email sent successfully to ${testEmail}!`);
      console.log('   Please check your inbox (and spam folder).\n');
    } else {
      console.error(`❌ Failed to send test email to ${testEmail}`);
      console.error('   Check logs for details.');
      process.exit(1);
    }
  } else {
    console.log('💡 To send a test email, provide an email address:');
    console.log('   tsx scripts/test-email.ts your-email@example.com\n');
  }

  console.log('✅ All email service tests passed!');
}

// Get email from command line args
const testEmail = process.argv[2];

testEmailService(testEmail).catch((error) => {
  logger.error({ err: error }, 'Email test failed');
  console.error('❌ Email test failed:', error.message);
  process.exit(1);
});

