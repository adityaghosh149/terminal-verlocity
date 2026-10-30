# Terminal Velocity - Project Directory & File Guide

This document explains the organization, purpose, and responsibilities of every file and directory across the **Terminal Velocity** codebase.

---

## 📁 Root Directory Layout

```
ds-game/
├── docs/                     # Technical specifications, API guides & deployment manuals
├── src/                      # Next.js 14 application source code
│   ├── app/                  # App Router: Pages and backend API Route Handlers
│   ├── components/           # Reusable React components (Arcade, HUD, Analytics, UI)
│   ├── lib/                  # Core modules: DB connection, auth, probability, sound
│   ├── models/               # Mongoose database models & schema definitions
│   ├── store/                # Zustand client state stores (auth, game, session)
│   └── types/                # TypeScript type definitions and interfaces
├── tests/                    # Vitest automated unit & integration test suites
├── public/                   # Static assets (fonts, icons, audio, illustrations)
├── .env.example              # Environment variable template with documentation
├── .env.local                # Local development environment configuration (gitignored)
├── next.config.mjs           # Next.js bundler and serverless configuration
├── tailwind.config.ts        # Tailwind CSS theme, font families, and color chromatics
├── tsconfig.json             # TypeScript compiler settings and strict mode rules
├── package.json              # Project dependencies, scripts, and package metadata
└── README.md                 # Main project overview and getting started guide
```

---

## 🛠️ Detailed File & Directory Breakdown

### 1. `docs/` — Documentation & Specifications
* **`docs/GAMEPLAY_AND_RULES.md`**: Official player manual detailing word lengths by difficulty, streak multipliers, speed bonuses, 5-shield defense, special power-up packets (Nanite Shields, Matrix Slow-Mo, High Rollers), themed word packs, dynamic synthwave audio, typo heatmaps, and player archetypes.
* **`docs/ROUTES_AND_API.md`**: Exhaustive catalog of all frontend pages and backend API endpoints with Public vs. Protected authorization rules.
* **`docs/PROJECT_STRUCTURE_AND_FILES.md`**: This file; describes the responsibility of every directory and file.
* **`docs/ARCHITECTURE_AND_SECURITY.md`**: Deep dive into the mathematical formulations, Expected Value modeling, Argon2id hashing, and JWT security.
* **`docs/MONGODB_ATLAS_SETUP.md`**: Step-by-step setup guide for MongoDB Atlas M0 cluster, security credentials, network IP access, and Mongoose indexing.
* **`docs/VERCEL_DEPLOYMENT.md`**: Production deployment guide for Vercel, serverless function optimization, environment variables, and zero-config settings.

---

### 2. `src/app/` — Next.js 14 App Router

#### Page Routes:
* **`src/app/page.tsx`**: Home landing page with animated CRT hero terminal, feature grid, live online runner count, and instant play CTA.
* **`src/app/layout.tsx`**: Root layout wrapping the app in theme providers, global font loaders, and persistent navigation headers.
* **`src/app/globals.css`**: Tailwind CSS utilities, custom CRT scanlines, grid styling, and neon glow effects.
* **`src/app/game/page.tsx`**: The main game page hosting the arcade terminal canvas, difficulty picker, and HUD.
* **`src/app/dashboard/page.tsx`**: Post-game Data Science telemetry center featuring longitudinal WPM progression, EV calibration, interactive QWERTY typo heatmap, and player risk archetype classification.
* **`src/app/leaderboard/page.tsx`**: Global competitive rankings with mode and difficulty filters.
* **`src/app/settings/page.tsx`**: User settings for chromatic themes, procedural audio toggles, and profile updates.

#### API Route Handlers (`src/app/api/`):
* **`src/app/api/auth/register/route.ts`**: Creates accounts with Argon2id password hashing and sets 30-day persistent session cookies.
* **`src/app/api/auth/login/route.ts`**: Verifies credentials and issues fresh access and refresh tokens.
* **`src/app/api/auth/logout/route.ts`**: Invalidates sessions and clears browser auth cookies.
* **`src/app/api/auth/me/route.ts`**: Validates active session and executes silent background renewal of expired 15-minute access tokens.
* **`src/app/api/auth/refresh/route.ts`**: Rotates refresh tokens and re-issues new access tokens.
* **`src/app/api/auth/check-username/route.ts`**: Fast case-insensitive username availability check.
* **`src/app/api/game/start/route.ts`**: Issues cryptographically signed `runToken` authorizing arcade runs.
* **`src/app/api/game/submit/route.ts`**: Verifies run tokens, calculates exact score decomposition (`pureTypingScore`, `multiplierScore`, `speedBonusScore`, `luckScore`), logs typos, and persists runs.
* **`src/app/api/leaderboard/route.ts`**: Serves top global runs filtered by mode and difficulty.
* **`src/app/api/player/stats/route.ts`**: Returns authenticated user run history, EV calibration, typo map aggregation, and danger ratio.
* **`src/app/api/player/profile/route.ts`**: Handles display name and case-preserving username updates.
* **`src/app/api/player/change-password/route.ts`**: Re-hashes and updates passwords using Argon2id.
* **`src/app/api/player/settings/route.ts`**: Syncs theme and audio preferences to MongoDB.
* **`src/app/api/player/achievements/route.ts`**: Fetches player milestones and achievement badges.
* **`src/app/api/presence/route.ts`**: Broadcasts presence heartbeats and returns current online runners count.

---

### 3. `src/components/` — React UI & Arcade Components

#### `src/components/game/` (Arcade & Playfield)
* **`PhaserGame.tsx`**: Core arcade canvas component managing the 4-lane falling packets, keyboard event loop, combo tracking, nanite shield restore, matrix slow-mo, high rollers, and 5-shield system.
* **`PacketCard.tsx`**: Renders individual descending words with risk badges (Safe, Caution, Danger), special packet badges (Shield 🛡️, High Roller 🌟), advertised rewards, and countdown bars.
* **`GameHud.tsx`**: Top terminal telemetry bar showing live score, combo multiplier, remaining shields, and timer.
* **`GameBottomBar.tsx`**: Bottom assist bar showing current typing target, active buffer, and EMP trigger button.
* **`GameReadyOverlay.tsx`**: Pre-game configuration overlay with start button, rules preview, and themed word pack selector (Core Cyber, Dev Syntax, Security, Linux Admin).
* **`GameOverModal.tsx`**: Post-game modal displaying the exact score breakdown (`pureTypingScore` + `multiplierScore` + `speedBonusScore`), WPM, accuracy, and luck score.
* **`HowToPlayModal.tsx`**: Interactive in-game manual explaining word lengths, multipliers, speed bonuses, and shields.

#### `src/components/dashboard/` (Data Science Telemetry)
* **`TypoHeatmap.tsx`**: Interactive virtual QWERTY keyboard displaying keystroke error distribution with colored heat keys and mistype frequency stats.
* **`ArchetypeCard.tsx`**: Automated player persona classifier computing Calculated Strategist, Speed Demon, High Roller, or Zen Master personas.
* **`EvVsRealizedChart.tsx`**: Compares actual points scored vs theoretical expected value ($EV$) over time.
* **`CalibrationChart.tsx`**: Visualizes empirical packet corruption rate against theoretical probability.
* **`StatsSummaryCard.tsx`**: Displays key metrics (highest score, average WPM, accuracy, total runs).
* **`MethodologyCard.tsx`**: Explains mathematical expected value and empirical calibration formulas.

#### `src/components/auth/`
* **`AuthModal.tsx`**: Unified popup dialog supporting instant switching between Login and Registration.

#### `src/components/layout/`
* **`Navbar.tsx`**: Responsive header with navigation links, live user profile avatar, theme selector, and live online runners badge.
* **`OnlinePresenceBadge.tsx`**: Client component broadcasting periodic heartbeats and displaying live online runners with a pulsing green beacon.
* **`Footer.tsx`**: Cyberpunk-styled terminal footer with repository links and system status.

---

### 4. `src/lib/` — Core Engine & Business Logic
* **`src/lib/auth/jwt.ts`**: High-security token generation and verification using `jose` with configurable `JWT_ACCESS_EXPIRY` and `JWT_REFRESH_EXPIRY`.
* **`src/lib/db/mongodb.ts`**: Global connection-pooling Mongoose connection manager optimized for Vercel serverless lambda environments.
* **`src/lib/db/inMemoryStore.ts`**: Resilient in-memory fallback store ensuring smooth operation during offline testing and dev runs without MongoDB.
* **`src/lib/probability/engine.ts`**: Authoritative probability calculations: Expected Value, Value Per Second, packet generation in calibrated ranges, nanite shield packets, high roller packets, and empirical calibration binning.
* **`src/lib/probability/words.ts`**: Curated vocabulary pools strictly partitioned by difficulty (Easy: 4-letter words, Medium: 5-letter words, Hard: 6-letter words) across Core, Developer, Cybersecurity, and Sysadmin packs.
* **`src/lib/audio/soundEngine.ts`**: Zero-dependency procedural Web Audio API sound synthesizer producing mechanical keystrokes, shield restores, matrix slow-mo pulses, and dynamic 4-layer synthwave tracks.
* **`src/lib/utils.ts`**: Utility functions including the universal `round2` decimal precision helper and Tailwind class merge (`cn`).

---

### 5. `src/models/` — Mongoose Database Models
* **`User.ts`**: User credentials, Argon2id password hashes, display names, and embedded settings.
* **`GameRun.ts`**: Historical arcade run records containing exact score decomposition, WPM, accuracy, luck, typo map, and telemetry events.
* **`Presence.ts`**: Real-time active runner sessions with TTL auto-expiration index.
* **`Achievement.ts`**: Unlocked player milestones and awards.

---

### 6. `tests/` — Automated Testing Suite
* **`tests/unit/probability.test.ts`**: Verifies Expected Value formulas, word length partitions, variable reward ranges, shield recovery packets, and themed word packs.
* **`tests/unit/game_flow.test.ts`**: Tests combo streak multipliers, speed bonus percentage applications, and run metric aggregation.
* **`tests/unit/rounding.test.ts`**: Confirms universal 2-decimal precision across all metrics.
* **`tests/unit/auth_jwt.test.ts`**: Verifies JWT access/refresh token signing, expiration, and claims validation.
* **`tests/unit/session.test.ts`**: Tests session token hashing and rotation.
* **`tests/unit/profile_password.test.ts`**: Validates password updates and Argon2id re-hashing.
* **`tests/unit/presence.test.ts`**: Verifies client session presence registration, active runner counting, and eviction.
