# Vercel Deployment Guide for Terminal Velocity

Terminal Velocity is built natively for the Vercel serverless platform using Next.js App Router, edge-compatible cryptographic libraries, and serverless MongoDB Atlas connection reuse.

---

## 1. Prerequisites

Before deploying to Vercel, ensure you have:
1. A **GitHub repository** containing the project source code.
2. A **MongoDB Atlas cluster** with network access set to `0.0.0.0/0` (see `docs/MONGODB_ATLAS_SETUP.md`).
3. (Optional) A **Resend API Key** for transactional emails (see `docs/EMAIL_SETUP.md`).

---

## 2. Deploying via Vercel Dashboard

1. Sign in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import your GitHub repository (`ds-game` / `terminal-velocity`).
4. Framework Preset: **Next.js** (automatically detected).
5. In the **Environment Variables** section, expand and add the following:

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://user:pass@cluster0.abcde.mongodb.net/terminal_velocity?retryWrites=true&w=majority` |
| `JWT_ACCESS_SECRET` | 32+ character high-entropy key for access tokens | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_ISSUER` | Issuer claim | `terminal-velocity.app` |
| `JWT_AUDIENCE` | Audience claim | `terminal-velocity-players` |
| `APP_URL` | Production application URL | `https://your-project-name.vercel.app` |
| `RESEND_API_KEY` | Transactional email delivery API key | `re_123456789...` (Optional, defaults to dev log) |
| `EMAIL_FROM` | Sender address | `Terminal Velocity <onboarding@resend.dev>` |
| `NODE_ENV` | Production environment | `production` |

6. Click **Deploy**.
7. Vercel will install dependencies, compile the TypeScript code, optimize static assets, and deploy the serverless functions.

---

## 3. Serverless Optimizations Verified in Build

- **Connection Pooling**: Mongoose instances are cached on `globalThis` (`src/lib/db/mongodb.ts`), preventing connection pool exhaustion during concurrent lambda cold starts.
- **Argon2id Native Execution**: Marked with `serverComponentsExternalPackages` in `next.config.mjs`, ensuring Linux x64 serverless binaries are bundled without dynamic runtime resolution errors.
- **Static vs Dynamic Routing**: All API route handlers requiring cookies or search parameters are configured with `export const dynamic = 'force-dynamic'`, allowing instantaneous zero-overhead dynamic execution.
- **Zero Local Filesystem Dependency**: All player state, refresh sessions, rate limits, and verification challenges are stored directly in MongoDB Atlas rather than ephemeral lambda disks.

---

## 4. Post-Deployment Verification Checklist

Once deployed to your `.vercel.app` domain:
1. Open the website on desktop and mobile.
2. Create an account at `/register`.
3. Check the verification challenge (via Resend inbox or Vercel function runtime logs).
4. Verify your account with the 6-digit OTP code.
5. Launch an arcade run on `/game` across Easy, Medium, or Hard difficulty.
6. Complete the run and confirm that the score is submitted, validated, and viewable on `/leaderboard`.
7. Inspect the post-game Data Science telemetry on `/dashboard`.
8. Switch themes on `/settings` (e.g. Cyberpunk or Terminal Green) and verify persistence.
9. Sign out and sign in again to confirm session recovery.
