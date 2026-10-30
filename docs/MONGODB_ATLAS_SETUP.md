# MongoDB Atlas Setup Guide for Terminal Velocity

Terminal Velocity uses **MongoDB Atlas** as its authoritative, distributed database for:
- User accounts and hashed credentials (Argon2id)
- Cryptographic refresh token session management
- Validated game run records, telemetries, and exact score breakdowns
- Global and mode/difficulty-filtered leaderboards
- User theme, audio, and HUD preferences
- Player progression (XP, levels, and achievements)
- Distributed sliding-window rate limiting with TTL auto-expiration

---

## 1. Create a MongoDB Atlas Cluster (Free Tier M0)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Click **Create** to deploy a new database cluster.
3. Select **M0 (Free)** under shared clusters.
4. Choose a cloud provider (AWS, Google Cloud, or Azure) and a region closest to your target audience.
5. Name your cluster (e.g. `terminal-velocity-cluster`) and click **Create Deployment**.

---

## 2. Configure Database User & Security Credentials

1. In the left sidebar, navigate to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Authentication Method: **Password**.
4. Set a strong username (e.g. `tv_app_user`) and generate a secure password.
5. Set Database User Privileges: **Read and write to any database** (or restrict to `terminal_velocity` and `terminal_velocity_dev`).
6. Click **Add User**. Store these credentials securely.

---

## 3. Configure Network Access (IP Access List)

Because Vercel serverless functions run across dynamic cloud IP ranges, you must allow Atlas network access from Vercel:

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
7. Append the target database name:
   * **Production:** `/terminal_velocity`
     ```
     mongodb+srv://user:pass@cluster0.abcde.mongodb.net/terminal_velocity?retryWrites=true&w=majority
     ```
   * **Local Development:** `/terminal_velocity_dev` (isolates local testing data)
     ```
     mongodb+srv://user:pass@cluster0.abcde.mongodb.net/terminal_velocity_dev?retryWrites=true&w=majority
     ```

---

## 5. Automated Database Collections & Indexes

The application automatically creates collections, schemas, and compound indexes upon connection via Mongoose:

| Collection | Key Fields & Indexes | Purpose |
| :--- | :--- | :--- |
| `users` | `{ username: 1 }` (unique, case-insensitive), `passwordHash` | Player accounts, Argon2id passwords, and embedded settings |
| `gameruns` | `{ status: 1, finalScore: -1 }`, `{ status: 1, mode: 1, difficulty: 1, finalScore: -1 }` | Validated runs, pure typing score, multiplier score, speed bonus score, luck, and leaderboards |
| `sessions` | `{ sessionTokenHash: 1 }`, `{ familyId: 1 }`, `{ expiresAt: 1 }` (TTL) | Rotating refresh tokens and auto-expiration |
| `ratelimits` | `{ key: 1 }` (unique), `{ expiresAt: 1 }` (TTL) | Serverless sliding-window rate limiting |
| `achievements` | `{ userId: 1, achievementId: 1 }` (unique) | Prevents duplicate player achievement unlocks |

---

## 6. Configure Environment Variables

* **In `.env.local` (Local testing):**
  ```env
  MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/terminal_velocity_dev?retryWrites=true&w=majority"
  ```
* **In Vercel Project Settings (Production):**
  ```env
  MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/terminal_velocity?retryWrites=true&w=majority"
  ```
