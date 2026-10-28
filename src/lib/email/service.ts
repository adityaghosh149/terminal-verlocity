import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Terminal Velocity <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

let resendClient: Resend | null = null;
if (RESEND_API_KEY && RESEND_API_KEY.startsWith("re_")) {
  resendClient = new Resend(RESEND_API_KEY);
}

function getEmailWrapper(title: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body {
      background-color: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      color: #e2e8f0;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }
    .header {
      text-align: center;
      margin-bottom: 28px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #00f0ff;
      text-transform: uppercase;
    }
    .tagline {
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .code-box {
      background: #040711;
      border: 1px solid #00f0ff;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      font-size: 32px;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #00f0ff;
      margin: 24px 0;
    }
    .btn {
      display: inline-block;
      background: #00f0ff;
      color: #000000;
      font-weight: bold;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      margin: 20px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 14px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #1e293b;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TERMINAL VELOCITY</div>
      <div class="tagline">TYPE FAST. THINK FASTER.</div>
    </div>
    ${contentHtml}
    <div class="footer">
      This is an automated security transmission. If you did not initiate this request, no action is needed.<br>&copy; Terminal Velocity Project
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send Email Verification Code
 */
export async function sendVerificationEmail(
  toEmail: string,
  username: string,
  otpCode: string
): Promise<{ success: boolean; simulated?: boolean }> {
  const subject = `[Terminal Velocity] Verify your operative account - Code: ${otpCode}`;
  const html = getEmailWrapper(
    "Verify Your Account",
    `
      <h2 style="color: #f8fafc; font-size: 20px;">Welcome to the Grid, Operative ${username}.</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        To activate your Terminal Velocity account and begin competing on global leaderboards, enter the 6-digit cryptographic verification code below:
      </p>
      <div class="code-box">${otpCode}</div>
      <p style="color: #64748b; font-size: 13px;">
        This code expires in 10 minutes. Never share this code with anyone.
      </p>
    `
  );

  if (resendClient) {
    try {
      await resendClient.emails.send({
        from: EMAIL_FROM,
        to: toEmail,
        subject,
        html,
      });
      return { success: true };
    } catch (err) {
      console.error("Resend API error:", err);
      // Fall through to dev log
    }
  }

  // Local development fallback
  console.log(`\n================== [DEV EMAIL TRANSMISSION] ==================`);
  console.log(`To: ${toEmail} (${username})`);
  console.log(`Subject: ${subject}`);
  console.log(`VERIFICATION CODE: [ ${otpCode} ]`);
  console.log(`==============================================================\n`);

  return { success: true, simulated: true };
}

/**
 * Send Password Reset Link & Code
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  username: string,
  resetToken: string,
  numericOtp: string
): Promise<{ success: boolean; simulated?: boolean }> {
  const subject = `[Terminal Velocity] Security Alert: Password Reset Requested`;
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

  const html = getEmailWrapper(
    "Password Recovery Challenge",
    `
      <h2 style="color: #f8fafc; font-size: 20px;">Operative ${username},</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        A password reset request was initiated for your Terminal Velocity terminal account.
      </p>
      <p style="color: #94a3b8;">You can reset your credentials using either the one-time code or direct reset link:</p>
      
      <div class="code-box">${numericOtp}</div>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset Password Now</a>
      </div>
      
      <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
        This authorization token expires in 15 minutes. If you did not request this change, inspect your active sessions immediately.
      </p>
    `
  );

  if (resendClient) {
    try {
      await resendClient.emails.send({
        from: EMAIL_FROM,
        to: toEmail,
        subject,
        html,
      });
      return { success: true };
    } catch (err) {
      console.error("Resend API error:", err);
    }
  }

  console.log(`\n================== [DEV EMAIL: PASSWORD RESET] ==================`);
  console.log(`To: ${toEmail} (${username})`);
  console.log(`RESET OTP: [ ${numericOtp} ]`);
  console.log(`RESET LINK: ${resetUrl}`);
  console.log(`=================================================================\n`);

  return { success: true, simulated: true };
}

/**
 * Send Password Changed Security Notification
 */
export async function sendPasswordChangedEmail(
  toEmail: string,
  username: string
): Promise<{ success: boolean }> {
  const subject = `[Terminal Velocity] Security Notification: Password Changed`;
  const html = getEmailWrapper(
    "Security Alert",
    `
      <h2 style="color: #f8fafc; font-size: 20px;">Operative ${username},</h2>
      <p style="color: #94a3b8; line-height: 1.6;">
        The password for your Terminal Velocity account was successfully updated. All active refresh sessions have been terminated for security.
      </p>
      <p style="color: #ef4444; font-size: 13px;">
        If you did NOT perform this change, please recover your account immediately.
      </p>
    `
  );

  if (resendClient) {
    try {
      await resendClient.emails.send({
        from: EMAIL_FROM,
        to: toEmail,
        subject,
        html,
      });
      return { success: true };
    } catch (err) {
      console.error("Resend error:", err);
    }
  }

  console.log(`[SECURITY NOTIFICATION] Password changed for ${toEmail} (${username})`);
  return { success: true };
}
