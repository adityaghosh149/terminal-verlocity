# TERMINAL VELOCITY
### Type Fast. Think Faster.
*A Full-Stack Probability-Based Arcade Typing Game with Custom Authentication, Tactical Power-ups, Real-Time Presence & Data Science Telemetry*

---

## 🚀 Overview

**Terminal Velocity** is a modern full-stack web arcade game and data science application where mechanical typing speed, probabilistic risk management, and tactical reflexes jointly determine player survival. Players intercept encrypted data packets descending through a cybernetic 4-lane terminal grid. Intercepting clean packets yields rewards, while corrupted packets incur penalties and shield damage. 

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **MongoDB Atlas**, **Mongoose**, **Jose (JWT)**, and **Argon2id**.

---

## ⚡ Core Features

- **Cyberpunk Arcade Canvas:** Fast, responsive falling packet interception with procedural particle trails, CRT scanlines, and adaptive container-height physics.
- **Special Tactical Power-ups:**
  - 🛡️ **Nanite Shield Recovery Packet:** Spawns when shields drop to $\le 2$; clean interception restores +1 Shield (up to 5 max).
  - ⏳ **Decryption Overclock (Matrix Slow-Mo):** Unlocked at 15, 30, and 45 streaks; slows descending packets by 50% for 5 seconds.
  - 🌟 **Golden "High Roller" Packets:** Ultra-rare packet offering $3\times$ reward with a 50/50 coin-flip risk ($p = 0.50$).
- **Custom Themed Word Packs:** Selectable on the pre-game overlay:
  - 🖥️ **Core Cyber:** Cyberpunk terminal terminology (`byte`, `data`, `matrix`, `cipher`).
  - 💻 **Developer Syntax:** Keywords and constructs (`const`, `async`, `await`, `struct`).
  - 🛡️ **Cybersecurity:** Threat and defense words (`hash`, `trojan`, `payload`, `breach`).
  - 🐧 **Linux Sysadmin:** Unix tools and daemons (`grep`, `sudo`, `docker`, `kernel`).
- **Dynamic Layered Synthwave Audio:** Procedural Web Audio API engine that dynamically builds musical layers as your clean streak increases:
  - $1\times$: Sub-bass synthline
  - $2\times$: Hi-hat percussion
  - $3\times$: Fast arpeggiated synths
  - $4\times$ Overdrive: Full cyberpunk synthwave lead
- **Real-Time Online Runners Presence:** Live network telemetry badge showing the exact number of active players currently connected, powered by automated background heartbeats.
- **Data Science Telemetry & Personas (`/dashboard`):**
  - **Interactive QWERTY Typo Heatmap:** Heat-colored virtual keyboard displaying per-key mistype statistics.
  - **Player Risk Archetype Personas:** Automated behavioral classifier (Calculated Strategist, Speed Demon, High Roller, Zen Master).
  - **Longitudinal Improvement Curves:** Filterable by individual **Mode and Difficulty** combinations.
  - **Calibration Curves:** Comparing observed packet corruption rates against theoretical mathematical probability.
- **Custom Authentication Built from Scratch:** Zero external managed auth providers (no Clerk, Supabase, or Auth.js):
  - High-security **Argon2id** password hashing.
  - Case-preserving usernames (supports upper & lowercase, unique case-insensitively).
  - Short-lived 15-minute **JWT access tokens** (`jose`).
  - 30-day **persistent refresh tokens** in `httpOnly`, `SameSite=Lax`, `Secure` cookies with silent background rotation.
  - Configurable expiration periods via environment variables (`JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY`).
- **Exact Score Breakdown & Integrity:**
  - **Pure Typing Score:** Base points earned purely from typing advertised rewards in calibrated ranges per difficulty.
  - **Multiplier Score:** Bonus points from consecutive streaks (up to $4.0\times$).
  - **Speed Bonus Score:** Speed bonus percentage derived from WPM applied strictly to the Pure Typing Score.
  - **Exact Sum Verification:** $\text{Total Score} = \text{Pure Typing Score} + \text{Multiplier Score} + \text{Speed Bonus Score}$.
  - **Luck Index:** Calculated from pure score vs expected pure score ($\text{Luck} = \text{PureTypingScore} - \text{ExpectedPureScore}$).
  - **Universal 2-Decimal Precision:** WPM, Accuracy %, Multipliers, Luck, and score metrics consistently formatted to 2 decimal places.
- **3 Game Modes & 3 Difficulty Profiles:**
  - *Classic:* 90-second sprint with escalating drop velocities.
  - *Endless:* Survival mode against infinite streams until 5 firewall shields are lost.
  - *Daily Challenge:* Worldwide deterministic seeded run (`challenge_YYYY-MM-DD`).
  - *Difficulties:* Easy (4-letter words), Medium (5-letter words), and Hard (6-letter words).
- **5 Theme Chromatics:** Midnight (default), Cyberpunk, Terminal Green, Amber Protocol, and Light Mode.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS, Lucide React, Framer Motion |
| **Arcade Canvas & Audio** | Custom HTML5 Canvas / React DOM animation loop, Web Audio API procedural synthesizer |
| **State Management** | Zustand (persistent settings, theme synchronization, live HUD telemetry) |
| **Data Analytics** | Recharts, Custom Probability Engine |
| **Backend & APIs** | Next.js Route Handlers (`force-dynamic`), Server-only security modules |
| **Database** | MongoDB Atlas, Mongoose (schemas, compound indexes, TTL auto-cleanup) |
| **Authentication** | Argon2id (`@node-rs/argon2`), `jose` (JWT), Node `crypto` |
| **Testing** | Vitest (unit & integration tests) |
| **Deployment** | Vercel (serverless deployment ready) |

---

## 📋 Quick Start & Local Setup

### 1. Prerequisites
- Node.js (v18.17+ or v20+)
- npm or pnpm
- MongoDB Atlas cluster (or local MongoDB instance)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/adityaghosh149/terminal-verlocity.git
cd terminal-verlocity

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate `.env.local` with your configuration:
```env
# MongoDB Atlas Connection URI
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/terminal_velocity_dev?retryWrites=true&w=majority"

# 32+ character high-entropy JWT secrets
JWT_ACCESS_SECRET="your_local_jwt_access_secret_min_32_chars"
JWT_REFRESH_SECRET="your_local_jwt_refresh_secret_min_32_chars"

# Token Expirations
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="30d"

# Issuer & Audience
JWT_ISSUER="terminal-velocity.app"
JWT_AUDIENCE="terminal-velocity-players"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Suite

Run the automated Vitest test suite covering probability mathematics, Argon2id hashing, JWT access & refresh tokens, presence tracking, and telemetry score tallying:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 🌐 Production Build & Deployment

To verify the production build:
```bash
npm run build
```

### Complete Technical Documentation:
- [Official Gameplay & Rules Guide](docs/GAMEPLAY_AND_RULES.md)
- [Complete Routes & API Specification](docs/ROUTES_AND_API.md)
- [Project Directory & File Structure Guide](docs/PROJECT_STRUCTURE_AND_FILES.md)
- [MongoDB Atlas Setup Guide](docs/MONGODB_ATLAS_SETUP.md)
- [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT.md)
- [Mathematical Architecture & Security Specification](docs/ARCHITECTURE_AND_SECURITY.md)

---

## 🔐 Security Considerations

- Passwords hashed with **Argon2id** (memory cost: 19 MiB, time cost: 2 passes).
- Bearer credentials stored strictly in **HttpOnly, SameSite=Lax, Secure** cookies to eliminate client-side XSS theft.
- Refresh tokens hashed with **SHA-256** before database persistence.
- Automatic **token reuse detection**: attempting to use a rotated token revokes the entire session family.
- Competitive score integrity: client scores must match signed server `runToken` bounds and packet event sums to enter leaderboards.
- Rate limiting and session presence eviction prevent denial of service and memory leaks.

---

## 📜 License
MIT License. Created for the College Data Science & Advanced Software Engineering Showcase.
