# MongoDB Atlas Setup Guide for Terminal Velocity

Terminal Velocity uses **MongoDB Atlas** as its authoritative, distributed database for:
- User accounts and hashed credentials (Argon2id)
- Cryptographic session family tracking & refresh token rotation
- Email OTP and password recovery verification challenges
- Validated game run records and post-game telemetry
- Global and mode/difficulty-filtered leaderboards
- User theme, audio, and HUD preferences
- Player progression (XP, levels, and achievements)
- Distributed sliding-window rate limiting with TTL auto-expiration

---

## 1. Create a MongoDB Atlas Cluster (Free Tier M0)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** to deploy a new database cluster.
3. Select **M0 (Free)** under shared clusters.
4. Choose a cloud provider (AWS, Google Cloud, or Azure) and a region closest to your target audience (e.g. US East / N. Virginia for Vercel).
5. Name your cluster (e.g. `terminal-velocity-cluster`) and click **Create Deployment**.

---

## 2. Configure Database User & Security Credentials

1. In the left sidebar, navigate to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Authentication Method: **Password**.
4. Set a strong username (e.g. `tv_app_user`) and generate a secure password.
5. Set Database User Privileges: **Read and write to any database** (or restrict to `terminal_velocity` database).
6. Click **Add User**. Store these credentials securely.

---

## 3. Configure Network Access (IP Access List)

Because Vercel serverless functions run across dynamic IP ranges, you must allow Atlas network access from Vercel:

1. In the left sidebar, navigate to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
4. Add a description: `Vercel Serverless Functions`.
5. Click **Confirm**.

---

## 4. Obtain the Connection String (URI)

1. In the left sidebar, navigate to **Deployment** → **Database**.
2. Click the **Connect** button on your cluster.
3. Under **Connect your application**, select **Drivers**.
4. Driver: **Node.js**, Version: **5.5 or later**.
5. Copy the connection string. It will look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user credentials.
7. Append the database name `/terminal_velocity` before the query parameters:
   ```
   mongodb+srv://tv_app_user:YourSecretPass123@cluster0.abcde.mongodb.net/terminal_velocity?retryWrites=true&w=majority
   ```

---

## 5. Automated Database Indexes & Collections

The application automatically creates the necessary collections, unique constraints, and compound indexes upon connection via Mongoose:

| Collection | Key Indexes | Purpose |
| :--- | :--- | :--- |
| `users` | `{ email: 1 }` (unique), `{ username: 1 }` (unique) | Enforce unique accounts and fast lookups |
| `sessions` | `{ sessionTokenHash: 1 }`, `{ familyId: 1 }`, `{ expiresAt: 1 }` (TTL) | Rotating refresh tokens and auto-expiration |
| `verificationchallenges` | `{ target: 1, purpose: 1 }`, `{ expiresAt: 1 }` (TTL) | Single-use OTPs with auto-cleanup |
| `gameruns` | `{ status: 1, finalScore: -1 }`, `{ status: 1, mode: 1, difficulty: 1, finalScore: -1 }` | Ultra-fast global and filtered leaderboard sorting |
| `ratelimits` | `{ key: 1 }` (unique), `{ expiresAt: 1 }` (TTL) | Serverless sliding-window rate limiting |
| `usersettings` | `{ userId: 1 }` (unique) | Theme, audio, and HUD persistence |
| `achievements` | `{ userId: 1, achievementId: 1 }` (unique) | Prevent duplicate unlocks |

---

## 6. Configure Environment Variables

In your `.env.local` (local development) and in Vercel Project Settings:
```env
MONGODB_URI="mongodb+srv://tv_app_user:YourSecretPass123@cluster0.abcde.mongodb.net/terminal_velocity?retryWrites=true&w=majority"
```
