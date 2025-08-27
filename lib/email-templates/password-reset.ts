export const passwordResetEmailTemplate = (name: string, resetUrl: string) => {
  return {
    subject: 'Reset Your Password - Social Justice Platform',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
          }
          .message {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
          }
          .reset-button:hover {
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
          }
          .alternative-link {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
            font-family: monospace;
            font-size: 14px;
            color: #374151;
          }
          .security-notice {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .security-notice h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .security-notice p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
          }
          .footer a {
            color: #dc2626;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 20px;
            }
            .header h1 {
              font-size: 24px;
            }
            .reset-button {
              display: block;
              width: 100%;
              box-sizing: border-box;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hello ${name},
            </div>
            
            <div class="message">
              We received a request to reset your password for your Social Justice Platform account. 
              If you made this request, click the button below to create a new password.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="reset-button">
                Reset My Password
              </a>
            </div>
            
            <div class="message">
              If the button above doesn't work, you can copy and paste the following link into your browser:
            </div>
            
            <div class="alternative-link">
              ${resetUrl}
            </div>
            
            <div class="security-notice">
              <h3>🛡️ Security Notice</h3>
              <p>
                This password reset link will expire in 1 hour for your security. 
                If you didn't request this password reset, please ignore this email or 
                contact our support team if you have concerns.
              </p>
            </div>
            
            <div class="message">
              For your security, this link can only be used once and will expire after 1 hour.
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Social Justice Platform</strong></p>
            <p>Empowering voices, driving change</p>
            <p>
              If you have any questions, please contact us at 
              <a href="mailto:support@socialjusticeplatform.com">support@socialjusticeplatform.com</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name},
      
      We received a request to reset your password for your Social Justice Platform account.
      
      To reset your password, please visit the following link:
      ${resetUrl}
      
      This link will expire in 1 hour for your security.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      Social Justice Platform Team
      
      ---
      This is an automated message. Please do not reply to this email.
    `
  }
}

export const passwordChangeConfirmationTemplate = (name: string) => {
  return {
    subject: 'Password Changed Successfully - Social Justice Platform',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
          }
          .message {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 20px;
          }
          .success-notice {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .success-notice h3 {
            color: #065f46;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .success-notice p {
            color: #065f46;
            margin: 0;
            font-size: 14px;
          }
          .security-notice {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .security-notice h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
          }
          .security-notice p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
          }
          .footer a {
            color: #dc2626;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          @media (max-width: 600px) {
            .container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 20px;
            }
            .header h1 {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Updated</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              Hello ${name},
            </div>
            
            <div class="success-notice">
              <h3>🎉 Success!</h3>
              <p>
                Your password has been successfully changed. Your account is now secured with your new password.
              </p>
            </div>
            
            <div class="message">
              This email confirms that your password was changed on ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}.
            </div>
            
            <div class="security-notice">
              <h3>🛡️ Security Notice</h3>
              <p>
                If you didn't make this change, please contact our support team immediately. 
                Your account security is important to us.
              </p>
            </div>
            
            <div class="message">
              You can now sign in to your account using your new password. 
              Thank you for keeping your account secure!
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Social Justice Platform</strong></p>
            <p>Empowering voices, driving change</p>
            <p>
              If you have any questions, please contact us at 
              <a href="mailto:support@socialjusticeplatform.com">support@socialjusticeplatform.com</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name},
      
      Your password has been successfully changed.
      
      This change was made on ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })}.
      
      If you didn't make this change, please contact our support team immediately.
      
      Best regards,
      Social Justice Platform Team
      
      ---
      This is an automated message. Please do not reply to this email.
    `
  }
}