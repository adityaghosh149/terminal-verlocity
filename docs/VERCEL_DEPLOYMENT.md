# Vercel Deployment Guide for Terminal Velocity

Terminal Velocity is built natively for the Vercel serverless platform using Next.js App Router, edge-compatible cryptographic libraries (`jose`, Node `crypto`), and serverless MongoDB Atlas connection reuse.

---

## 1. Prerequisites

Before deploying to Vercel, ensure you have:
1. A **GitHub repository** containing the project source code.
2. A **MongoDB Atlas cluster** with network access set to `0.0.0.0/0` (see [`docs/MONGODB_ATLAS_SETUP.md`](MONGODB_ATLAS_SETUP.md)).

---

## 2. Deploying via Vercel Dashboard

1. Sign in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import your GitHub repository (`terminal-verlocity`).
4. Framework Preset: **Next.js** (automatically detected).
5. **Build and Output Settings:**
   * Keep the three toggle switches (**Build Command**, **Output Directory**, and **Install Command**) turned **OFF (gray)**.
   * This allows Vercel's zero-configuration engine to build the Next.js project and output to `.next` automatically.
6. In the **Environment Variables** section, paste the following 7 variables:

| Variable | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://<user>:<pass>@cluster0.abcde.mongodb.net/terminal_velocity?retryWrites=true&w=majority` |
| `JWT_ACCESS_SECRET` | 32+ character high-entropy key for access tokens | `d2b1c73c1a41261d330987a8c93a1a494013d108391db29cea885a8ae3db778c` |
| `JWT_REFRESH_SECRET` | 32+ character high-entropy key for refresh tokens | `948fe6b033bcbfb4ada9886ca69fc35ca5ac7a3ac290d32c7465678b61ff06a9` |
| `JWT_ACCESS_EXPIRY` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token lifespan (persistent session) | `30d` |
| `JWT_ISSUER` | Issuer claim verification | `terminal-velocity.app` |
| `JWT_AUDIENCE` | Audience claim verification | `terminal-velocity-players` |

> [!TIP]
> You can click **"Import .env or paste the .env contents"** and paste all 7 lines in a single click!

7. Click **Deploy**.
8. Vercel will install dependencies, compile the TypeScript code, optimize static assets, and deploy the serverless functions.

---

## 3. Serverless Optimizations Verified in Build

- **Connection Pooling**: Mongoose instances are cached on `globalThis` (`src/lib/db/mongodb.ts`), preventing connection pool exhaustion during concurrent lambda cold starts.
- **Argon2id Native Execution**: Marked with `serverComponentsExternalPackages` in `next.config.mjs`, ensuring Linux x64 serverless binaries are bundled cleanly without runtime resolution errors.
- **Static vs Dynamic Routing**: All API route handlers requiring cookies or search parameters are configured with `export const dynamic = 'force-dynamic'`, guaranteeing instant serverless execution without caching issues.
- **Zero Local Filesystem Dependency**: All player state, refresh sessions, rate limits, and game run telemetries are stored directly in MongoDB Atlas rather than ephemeral lambda disks.

---

## 4. Post-Deployment Verification Checklist

Once deployed to your `.vercel.app` domain:
1. Open the website on desktop and mobile.
2. Create an account at `/register` (supports both uppercase and lowercase usernames).
3. Confirm immediate login with persistent session cookies (`tv_access_token` and `tv_refresh_token`).
4. Launch an arcade run on `/game` across Easy, Medium, or Hard difficulty.
5. Check that falling words adapt to the container height and pop only when hitting the bottom threshold.
6. Complete the run and confirm that the score is submitted with exact score breakdown (`pureTypingScore` + `multiplierScore` + `speedBonusScore` = `totalScore`).
7. Confirm that your score appears on the `/leaderboard`.
8. Inspect post-game telemetry and mode/difficulty improvement curves on `/dashboard`.
9. Switch themes on `/settings` (e.g. Cyberpunk or Terminal Green) and verify persistence.
10. Refresh the page or return the next day to confirm you remain logged in via the 30-day refresh token.
