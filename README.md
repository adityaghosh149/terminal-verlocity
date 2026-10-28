# TERMINAL VELOCITY
### Type Fast. Think Faster.
*A Full-Stack Probability-Based Arcade Typing Game with Custom Authentication & Data Science Telemetry*

---

## 🚀 Overview

**Terminal Velocity** is a modern full-stack web arcade game and data science application where typing speed and mathematical risk management jointly determine player survival. Players intercept encrypted data packets descending through a cybernetic terminal grid. Intercepting clean packets yields rewards, but corrupted packets incur severe penalties and shield damage. 

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Phaser 3**, **MongoDB Atlas**, **Mongoose**, **Jose (JWT)**, and **Argon2id**.

---

## ⚡ Core Features

- **Cyberpunk Arcade Canvas:** Fast, responsive falling packet interception built on Phaser 3 with procedural particle trails and CRT scanlines.
- **Independent Probability Engine:** Authoritative Expected Value calculations ($EV = (1-p)R - pC - K$), seeded deterministic PRNG (Mulberry32), and empirical calibration binning.
- **Custom Authentication Built from Scratch:** Zero managed auth providers (no Clerk, Supabase, or Auth.js). Complete implementation of:
  - Argon2id password hashing
  - 15-minute JWT access tokens (`jose`)
  - 30-day rotating refresh tokens with token family reuse detection and breach containment
  - Cryptographic 6-digit OTP email verification challenges
  - Purpose-bound password recovery tokens & OTPs
  - Session revocation and active session management
  - Serverless-compatible distributed sliding-window rate limiting
- **3 Game Modes & Difficulties:**
  - *Classic:* 90-second sprint with escalating drop velocities.
  - *Endless:* Survival mode against infinite streams until 3 firewall shields are lost.
  - *Daily Challenge:* Worldwide deterministic seeded run (`challenge_YYYY-MM-DD`).
  - *Difficulties:* Easy, Medium, and Hard profiles adjusting speed, string length, and risk.
- **Data Science Post-Game Telemetry:**
  - Realized score vs Theoretical Expected Value comparison per packet.
  - Empirical corruption frequency vs theoretical risk (Calibration Curve).
  - Score progression trajectory over time.
  - Rational Decision Index ($RDI$) and sample variance analysis.
- **Score Integrity Engine:** Server-authorized run tokens (`runToken`), duration bounds, typing speed feasibility caps ($< 240$ WPM), and telemetry event tally validation.
- **5 Theme Chromatics:** Midnight (default), Cyberpunk, Terminal Green, Amber Protocol, and Light Mode.
- **Zero-Dependency Synthesizer:** Real-time Web Audio API sound engine for mechanical keystrokes, success chimes, glitch alarms, and combo fanfares.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 App Router, React 18, TypeScript (strict), Tailwind CSS, Lucide React, Framer Motion |
| **Arcade Canvas** | Phaser 3, Web Audio API procedural synthesizer |
| **State Management** | Zustand (persistent settings, theme synchronization, live HUD telemetry) |
| **Data Analytics** | Recharts, Custom Probability Engine |
| **Backend & APIs** | Next.js Route Handlers (`force-dynamic`), Server-only security modules |
| **Database** | MongoDB Atlas, Mongoose (schemas, compound indexes, TTL auto-cleanup) |
| **Authentication** | Argon2id (`@node-rs/argon2`), `jose` (JWT), Node `crypto` |
| **Email Infrastructure** | Resend API with local development console fallback |
| **Testing** | Vitest (unit & integration tests) |
| **Deployment** | Vercel (serverless deployment ready) |

---

## 📋 Quick Start & Local Setup

### 1. Prerequisites
- Node.js (v18.17+ or v20+)
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/terminal-velocity.git
cd terminal-velocity

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# MongoDB Atlas Connection URI
MONGODB_URI="mongodb+srv://username:password@cluster0.mongodb.net/terminal_velocity?retryWrites=true&w=majority"

# 32+ character JWT Signing Secret
JWT_ACCESS_SECRET="terminal_velocity_super_secret_jwt_access_signing_key_min_32_chars"
JWT_ISSUER="terminal-velocity.app"
JWT_AUDIENCE="terminal-velocity-players"

# Application URL
APP_URL="http://localhost:3000"

# Transactional Email (Optional for local testing; logs to console when unset)
RESEND_API_KEY=""
EMAIL_FROM="Terminal Velocity <onboarding@resend.dev>"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Suite

Run the automated Vitest test suite covering probability mathematics, Argon2id hashing, JWT access tokens, token rotation, and end-to-end telemetry tallying:

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

For complete cloud deployment instructions:
- [MongoDB Atlas Setup Guide](docs/MONGODB_ATLAS_SETUP.md)
- [Vercel Deployment Guide](docs/VERCEL_DEPLOYMENT.md)
- [Email Infrastructure Guide](docs/EMAIL_SETUP.md)
- [Architecture & Security Specification](docs/ARCHITECTURE_AND_SECURITY.md)

---

## 🔐 Security Considerations

- Passwords hashed with **Argon2id** (memory cost: 19 MiB, time cost: 2 passes).
- Bearer credentials stored strictly in **HttpOnly, SameSite=Lax, Secure** cookies.
- Refresh tokens hashed with **SHA-256** before database persistence.
- Automatic **token reuse detection**: attempting to use a rotated token revokes the entire session family.
- Timing-safe comparisons (`crypto.timingSafeEqual`) on all challenges.
- Distributed sliding-window rate limiting prevents brute-force on authentication endpoints.
- Competitive score integrity: client scores must match signed server `runToken` bounds and packet event sums to enter leaderboards.

---

## 📜 License
MIT License. Created for the College Data Science & Advanced Software Engineering Showcase.
