import { Resend } from "resend";
import {
  buildVerificationEmailHtml,
  buildPasswordResetEmailHtml,
  buildPasswordChangedEmailHtml,
} from "./templates";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Terminal Velocity <onboarding@resend.dev>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

let resendClient: Resend | null = null;
if (RESEND_API_KEY && RESEND_API_KEY.startsWith("re_")) {
  resendClient = new Resend(RESEND_API_KEY);
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
  const html = buildVerificationEmailHtml(username, otpCode);

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
  const html = buildPasswordResetEmailHtml(username, resetUrl, numericOtp);

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
  const html = buildPasswordChangedEmailHtml(username);

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
