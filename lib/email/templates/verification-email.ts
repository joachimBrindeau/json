/**
 * Email verification template
 * HTML email template for email verification
 */

export function getVerificationEmailTemplate(options: {
  verificationUrl: string;
  recipientName?: string;
}): { subject: string; html: string; text: string } {
  const { verificationUrl, recipientName = 'there' } = options;

  const subject = 'Verify your email address - JSON Viewer';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${recipientName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for signing up for JSON Viewer! Please verify your email address by clicking the button below:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" 
         style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
        Verify Email Address
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
      Or copy and paste this link into your browser:
    </p>
    
    <p style="font-size: 12px; color: #999; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 20px 0;">
      ${verificationUrl}
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; margin: 0;">
      If you're having trouble clicking the button, copy and paste the URL above into your web browser.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">© ${new Date().getFullYear()} JSON Viewer. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
Verify Your Email Address - JSON Viewer

Hi ${recipientName},

Thank you for signing up for JSON Viewer! Please verify your email address by visiting the link below:

${verificationUrl}

This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

---

© ${new Date().getFullYear()} JSON Viewer. All rights reserved.
  `.trim();

  return { subject, html, text };
}

