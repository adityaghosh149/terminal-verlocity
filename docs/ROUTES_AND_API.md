# Terminal Velocity - Routes & API Documentation

This document provides a comprehensive specification of all user-facing frontend page routes and backend API route handlers in **Terminal Velocity**, detailing access authorization (Public vs. Protected), HTTP methods, request bodies, query parameters, and responses.

---

## 1. Frontend Page Routes

| Route | Access Level | Description | Key Features |
| :--- | :--- | :--- | :--- |
| `/` | **Public** | Home / Landing Page | Introduction to game rules, live CRT terminal hero preview, feature highlights, live online runners badge, and instant "PLAY NOW" CTA. |
| `/game` | **Public** *(Guest Playable)* | Main Arcade Playfield | 4-lane descending packet interception canvas, dynamic HUD, tactical EMP blast, full-screen mode, slow-mo overclock banner, themed word pack selector, and game over modal. |
| `/dashboard` | **Public** *(Session-enhanced)* | Data Science Analytics | Longitudinal WPM and accuracy progression curves, Expected Value vs. Realized Score charts, empirical risk calibration curves, interactive QWERTY Typo Heatmap, and Player Risk Archetypes. |
| `/leaderboard` | **Public** | Global Leaderboards | Filterable ranking tables across Modes (Classic, Endless, Daily) and Difficulties (Easy, Medium, Hard) with real-time score, WPM, and accuracy telemetry. |
| `/settings` | **Public** *(Session-synced)* | Preferences & Configuration | Cyberpunk theme selector (Midnight, Cyberpunk, Terminal Green, Amber Protocol, Light Mode), sound FX toggles, CRT scanline toggles, and account management. |

---

## 2. Authentication & Session API Routes

### 2.1 Register New Account
* **Endpoint:** `POST /api/auth/register`
* **Access Level:** **Public**
* **Description:** Creates a new player account with Argon2id password hashing and establishes a persistent 30-day session.
* **Request Body:**
  ```json
  {
    "username": "NeoCipher",
    "password": "SecurePassword123!",
    "name": "Thomas Anderson"
  }
  ```
* **Validation Rules:**
  * `username`: 3–20 characters, alphanumeric and underscores, case-preserving with case-insensitive uniqueness.
  * `password`: Minimum 8 characters.
* **Response (201 Created):**
  Sets `tv_access_token` (15m) and `tv_refresh_token` (30d) `httpOnly` secure cookies.
  ```json
  {
    "success": true,
    "user": {
      "id": "6721fb...",
      "username": "NeoCipher",
      "name": "Thomas Anderson"
    }
  }
  ```

---

### 2.2 User Login
* **Endpoint:** `POST /api/auth/login`
* **Access Level:** **Public**
* **Description:** Validates credentials against Argon2id hash and issues fresh access and refresh token cookies.
* **Request Body:**
  ```json
  {
    "username": "NeoCipher",
    "password": "SecurePassword123!"
  }
  ```
* **Response (200 OK):**
  Sets `tv_access_token` and `tv_refresh_token` cookies. Returns authenticated user payload.

---

### 2.3 User Logout
* **Endpoint:** `POST /api/auth/logout`
* **Access Level:** **Public**
* **Description:** Invalidates the current refresh session and clears all authentication cookies.
* **Response (200 OK):**
  Clears `tv_access_token` and `tv_refresh_token` cookies (`maxAge: 0`).

---

### 2.4 Active Session Check & Silent Token Refresh
* **Endpoint:** `GET /api/auth/me`
* **Access Level:** **Public / Semi-Protected**
* **Description:** Checks the active user session. If the 15-minute access token has expired but the 30-day refresh token is valid, it **silently signs and sets a new access token** in the response cookie.
* **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "6721fb...",
      "username": "NeoCipher",
      "name": "Thomas Anderson",
      "settings": { "theme": "cyberpunk", "soundEnabled": true }
    }
  }
  ```
  *(Returns `{ "user": null }` if not logged in).*

---

### 2.5 Explicit Token Refresh
* **Endpoint:** `POST /api/auth/refresh`
* **Access Level:** **Protected** *(Requires valid `tv_refresh_token` cookie)*
* **Description:** Manually rotates the refresh token and re-issues a fresh 15-minute access token.

---

### 2.6 Username Availability Check
* **Endpoint:** `GET /api/auth/check-username?username=desired_name`
* **Access Level:** **Public**
* **Description:** Performs real-time case-insensitive lookup to confirm if a username is available during registration.
* **Response (200 OK):**
  ```json
  { "available": true, "username": "desired_name" }
  ```

---

## 3. Game Run & Scoring API Routes

### 3.1 Start Game Run
* **Endpoint:** `POST /api/game/start`
* **Access Level:** **Public** *(Guest or Authenticated)*
* **Description:** Authorizes the start of an arcade run and issues a cryptographically signed, tamper-evident `runToken` containing the seed, timestamp, mode, and difficulty.
* **Request Body:**
  ```json
  {
    "mode": "classic",
    "difficulty": "medium",
    "username": "NeoCipher"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "runId": "run_9f81a7b...",
    "runToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "startTime": 1730278400000,
    "seed": "seed_a1b2c3d4",
    "mode": "classic",
    "difficulty": "medium"
  }
  ```

---

### 3.2 Submit Game Run
* **Endpoint:** `POST /api/game/submit`
* **Access Level:** **Public** *(Authorized via signed `runToken`)*
* **Description:** Validates client score integrity against signed `runToken` bounds, typing speed limits (WPM $\le 240$), enforces the **$(2 \times (100 - \text{accuracy}))\%$ Accuracy Penalty** on Base Typing Score, decomposes score into exact components (`actualTypingScore` [net], `rawTypingScore`, `accuracyPenaltyPct`, `accuracyPenaltyScore`, `multiplierScore`, `speedBonusScore`, `luckScore`), logs keystroke typos (`typoMap`), and captures selected word pack. Persists validated run to MongoDB.
* **Request Body:**
  ```json
  {
    "runToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "finalScore": 1450.50,
    "actualTypingScore": 900.00,
    "rawTypingScore": 1000.00,
    "accuracyPenaltyPct": 10.00,
    "accuracyPenaltyScore": 100.00,
    "multiplierScore": 350.50,
    "speedBonusScore": 200.00,
    "luckScore": 45.20,
    "wpm": 78.40,
    "accuracy": 95.00,
    "maxCombo": 18,
    "events": [...],
    "endTime": 1730278460000,
    "username": "NeoCipher",
    "typoMap": { "E": 2, "R": 1, "T": 4 },
    "wordPack": "developer"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "runId": "run_9f81a7b...",
    "status": "validated",
    "leaderboardRank": 4
  }
  ```

---

## 4. Leaderboard & Analytics API Routes

### 4.1 Global & Filtered Leaderboards
* **Endpoint:** `GET /api/leaderboard`
* **Access Level:** **Public**
* **Query Parameters:**
  * `mode` *(optional)*: `classic` | `endless` | `daily`
  * `difficulty` *(optional)*: `easy` | `medium` | `hard`
  * `limit` *(optional)*: default `50`
* **Response (200 OK):**
  Array of top-scoring runs sorted by `finalScore` descending with player telemetry.

---

### 4.2 Player Personal Statistics & History
* **Endpoint:** `GET /api/player/stats`
* **Access Level:** **Protected** *(Requires active user session)*
* **Description:** Retrieves all historical game runs, personal bests, empirical calibration binning, longitudinal WPM/accuracy curves, aggregated `typoMap`, and calculated `dangerRatio` (for archetype classification).

---

## 5. Player Profile & Settings API Routes

### 5.1 Player Profile
* **Endpoint:** `GET /api/player/profile` | `PUT /api/player/profile`
* **Access Level:** **Protected** *(Requires active user session)*
* **Description:**
  * `GET`: Returns player account information, creation date, and current settings.
  * `PUT`: Updates display name and case-preserving username.

---

### 5.2 Change Password
* **Endpoint:** `POST /api/player/change-password`
* **Access Level:** **Protected** *(Requires active user session)*
* **Description:** Verifies current password and re-hashes new password using Argon2id.
* **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```

---

### 5.3 Player Settings Persistence
* **Endpoint:** `GET /api/player/settings` | `PUT /api/player/settings`
* **Access Level:** **Protected** *(Requires active user session)*
* **Description:** Persists theme chromatics, sound volume, CRT scanline toggles, and HUD preferences directly into the user document in MongoDB.

---

### 5.4 Player Achievements
* **Endpoint:** `GET /api/player/achievements`
* **Access Level:** **Protected** *(Requires active user session)*
* **Description:** Returns earned achievements, unlock timestamps, and progress toward upcoming speed and survival milestones.

---

## 6. Presence & Real-Time Network Telemetry API Routes

### 6.1 Get Active Online Runners Count
* **Endpoint:** `GET /api/presence`
* **Access Level:** **Public**
* **Description:** Returns the total count of active runners connected across the network within the last 60 seconds.
* **Response (200 OK):**
  ```json
  {
    "onlineCount": 14,
    "timestamp": 1730278400000
  }
  ```

---

### 6.2 Heartbeat Broadcast
* **Endpoint:** `POST /api/presence`
* **Access Level:** **Public** *(Session or Authenticated)*
* **Description:** Broadcasts a client heartbeat every 25 seconds to maintain active presence in the network registry. Automatically evicts stale sessions older than 60 seconds (with MongoDB TTL 90-second index).
* **Request Body:**
  ```json
  {
    "sessionId": "tv_sess_abc123_xyz",
    "username": "NeoCipher",
    "path": "/game"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "onlineCount": 14,
    "sessionId": "tv_sess_abc123_xyz"
  }
  ```
