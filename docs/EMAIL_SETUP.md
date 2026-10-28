# Transactional Email Setup Guide (Resend)

Terminal Velocity uses transactional emails strictly for delivering:
- 6-digit cryptographic email verification codes
- Password reset OTPs and direct one-click authorization links
- Security alerts when a password has been modified

> **Important Security Architecture Principle:**
> Email delivery is treated strictly as transport infrastructure, NOT an identity provider. All cryptographic token generation, SHA-256 challenge hashing, expiration verification, attempt limits, and single-use invalidation are executed entirely by our own custom authentication engine.

---

## 1. Local Development Behavior (Zero Config Required)

If `RESEND_API_KEY` is not provided or set to empty in `.env.local`:
- The application automatically activates **Development Console Fallback Mode**.
- Verification OTP codes and password reset links are printed directly to the server terminal:
  ```
  ================== [DEV EMAIL TRANSMISSION] ==================
  To: operative@domain.com (neo_velocity)
  Subject: [Terminal Velocity] Verify your operative account - Code: 839201
  VERIFICATION CODE: [ 839201 ]
  ==============================================================
  ```
- This ensures teammates, classmates, and evaluators can immediately test account registration, email verification, and password recovery locally without creating an external email account!

---

## 2. Production Setup with Resend

To enable real email delivery to external inboxes:

1. Create a free account at [Resend.com](https://resend.com).
2. Go to **API Keys** and click **Create API Key**.
3. Set permissions to **Full Access** or **Sending Access**.
4. Copy the API key (starts with `re_...`).

### For Testing Inboxes (Without a Custom Domain)
- By default, Resend provides the sandbox sender: `onboarding@resend.dev`.
- In the sandbox, you can deliver emails to the email address associated with your Resend account.
- Configure:
  ```env
  RESEND_API_KEY="re_your_api_key_here"
  EMAIL_FROM="Terminal Velocity <onboarding@resend.dev>"
  ```

### For Production Delivery (With Custom Domain)
1. In Resend, go to **Domains** → **Add Domain**.
2. Add your custom domain (e.g. `terminalvelocity.game`).
3. Add the recommended SPF, DKIM, and DMARC DNS records in your domain registrar (e.g. Cloudflare, Namecheap, Vercel).
4. Once verified, configure:
  ```env
  EMAIL_FROM="Terminal Velocity <security@terminalvelocity.game>"
  ```
