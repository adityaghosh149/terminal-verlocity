# Mathematical Architecture & Security Specification

This document details the mathematical modeling, data science methodology, and security architecture of **Terminal Velocity**.

---

## 1. Probability Engine & Scoring Architecture

### 1.1 Authoritative Mathematical Formulation
Every falling data packet possesses four fundamental attributes:
1. **Advertised Reward ($R$):** Defined strictly as the **Pure Typing Score** ($10 \times \text{word length}$). Intercepting clean awards $+R$ points.
2. **Corruption Probability ($p \in [0.10, 0.65]$):** The objective probability that the packet contains a corrupted payload.
3. **Success Probability ($1 - p$):** The objective probability that the packet is clean.
4. **Corruption Penalty ($C$):** Defined as the Pure Typing Score ($C = R$). Intercepting while corrupted deducts $-C$ points and resets streaks.
5. **Interception Cost ($K$):** Upfront execution cost (defaults to 0).

The **Expected Value ($EV$)** represents the mathematical expectation of point return over repeated trials:

$$\mathbb{E}[V] = (1 - p)R - pC = (1 - 2p)R$$

#### Example:
A 5-letter word (`CYBER`) has $R = 50\text{ pts}$ and $C = 50\text{ pts}$. With a corruption risk of $p = 0.20$ (20%):
$$\mathbb{E}[V] = (1 - 2(0.20)) \times 50 = (0.60) \times 50 = +30\text{ points}$$
If corrupted, the player receives $-50\text{ points}$. If clean, the player receives $+50\text{ points}$ (plus streak multiplier and speed bonus).

---

### 1.2 Exact Score Breakdown & Verification Model
A player's final score is calculated from three mathematically discrete components, the sum of which must match the total score exactly:

$$\text{Total Score} = \text{Pure Typing Score} + \text{Multiplier Score} + \text{Speed Bonus Score}$$

1. **Pure Typing Score:** Base points earned solely from typing correct characters:
   $$\text{Pure Typing Score} = 10 \times \text{Word Character Length}$$
2. **Multiplier Score:** Bonus points accumulated from maintaining consecutive streaks (up to $4.0\times$).
3. **Speed Bonus Score:** Typing speed bonus applied **strictly on the Pure Typing Score**:
   $$\text{Speed Bonus Score} = \text{Pure Typing Score} \times \text{Speed Bonus Percentage (from WPM)}$$
4. **Luck Metric:** Quantifies deviation from mathematical expected value:
   $$\text{Luck} = \text{Pure Typing Score} - \text{Expected Pure Score}$$
5. **Universal Decimal Precision:** All telemetry numbers (WPM, Accuracy %, Multipliers, Luck, Averages) are consistently rounded to **2 decimal places** across client, server, and database persistence layers.

---

### 1.3 Adaptive Canvas Physics & Responsive Sizing
To ensure fairness across all screen sizes and full-screen modes:
* Packet drop velocity is calculated adaptively based on the terminal container height.
* The breach threshold is anchored to the bottom boundary of the container, ensuring words remain fully legible and only pop upon contacting the bottom boundary.

---

### 1.4 Decision Science: Value Per Second (VPS)
In rapid typing arcade games, typing duration represents an opportunity cost. We model **Net Value Per Second ($VPS$)**:

$$VPS = \frac{\mathbb{E}[V]}{\text{Typing Duration (seconds)}}$$

Where typing duration is estimated dynamically from packet character length $L$ assuming an operative speed baseline of 60 WPM (5 characters/sec):
$$\text{Duration} = \max\left(0.5, \frac{L}{5}\right)$$

---

### 1.5 Seeded Deterministic PRNG (Mulberry32)
For reproducible testing and Daily Challenges, we utilize a 32-bit state generator:

$$t = s + \text{0x6D2B79F5}$$
$$t = (t \oplus (t \gg 15)) \times (t \mid 1)$$
$$t = t \oplus (t + (t \oplus (t \gg 7)) \times (t \mid 61))$$
$$\text{Output} = \frac{(t \oplus (t \gg 14)) \gg 0}{4294967296}$$

This guarantees that all players worldwide receiving the daily seed `challenge_YYYY-MM-DD` encounter an identical sequence of falling packets.

---

### 1.6 Post-Game Empirical Calibration & Performance Curves
1. **Calibration Curves:** Packet events are binned into probability intervals $[0, 0.2), [0.2, 0.4), [0.4, 0.6), [0.6, 0.8), [0.8, 1.0]$. For each bin $b$ with $N$ samples:
   $$\bar{p}_{\text{theoretical}} = \frac{1}{N}\sum_{i=1}^N p_i, \quad \hat{p}_{\text{observed}} = \frac{\sum_{i=1}^N \mathbb{I}(\text{corrupted})}{N}$$
2. **Performance Improvement Curves:** Historical WPM and Accuracy progression curves are segregated by **Game Mode** (Classic, Endless, Daily) and **Difficulty** (Easy, Medium, Hard), enabling meaningful longitudinal skill analysis.

---

## 2. Custom Authentication & Security Model

Terminal Velocity implements authentication from scratch without external managed auth providers (Auth.js, Clerk, Supabase, Firebase).

### 2.1 Password Hashing (Argon2id)
- **Algorithm:** Argon2id (hybrid data-dependent and data-independent memory addressing).
- **Parameters:**
  * Variant: `argon2id`
  * Memory Cost: `19456 KiB` (19 MiB for smooth serverless execution)
  * Time Cost: `2 passes`
  * Output Length: `32 bytes`
  * Parallelism: `1 thread`
- Passwords are never stored in plaintext, reversible formats, or accessible in API responses (`select: false` on Mongoose schema).

### 2.2 Short-Lived Access Tokens (JWT)
- Signed using `jose` with `HS256` and a 32+ character server-side private secret (`JWT_ACCESS_SECRET`).
- **Expiration:** Configurable via `JWT_ACCESS_EXPIRY` (default: `15m`).
- **Standard Claims:** `userId`, `username`, `name`, `tokenType: "access"`, `iss` (`terminal-velocity.app`), `aud` (`terminal-velocity-players`), `iat`, `exp`.
- Delivered in secure `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`tv_access_token`) to eliminate browser JavaScript XSS theft.

### 2.3 Long-Lived Refresh Tokens & Persistent Sessions
- Signed using `jose` with `HS256` and a 32+ character private secret (`JWT_REFRESH_SECRET`).
- **Expiration:** Configurable via `JWT_REFRESH_EXPIRY` (default: `30d`).
- Stored in secure `HttpOnly`, `SameSite=Lax`, `Secure` cookies (`tv_refresh_token`).
- **Silent Renewal:** When the 15-minute access token expires, `/api/auth/me` and `/api/auth/refresh` verify the refresh token and automatically issue a fresh access token in the background, keeping the player logged in without disruption.

### 2.4 Score Integrity & Anti-Tampering Engine
- Runs are initiated via `POST /api/game/start` which issues a cryptographically signed `runToken` containing start timestamp, seed, mode, and difficulty.
- Submissions via `POST /api/game/submit` validate:
  1. Cryptographic signature of `runToken`.
  2. Idempotency check: unique `runId` recorded once.
  3. Plausible run duration ($10\text{s} \le t \le 7200\text{s}$).
  4. Typing speed threshold: WPM $> 240$ flagged as automated/bot activity.
  5. Telemetry event sum consistency: claimed final score must tally with packet points deltas.
- Only validated runs qualify for global and difficulty leaderboards.

---

## 3. Known Limitations & Recommendations

1. **Client-Side Arcade Environment:** Because Phaser 3 executes in the browser canvas, client-side memory modifications are theoretically possible on compromised devices. While server-side bound checks prevent impossible scores, high-stakes commercial gaming would benefit from server-side physics simulation.
2. **Key Rotation:** In large enterprise deployments, asymmetric signing keys (e.g. Ed25519 or RS256 with JWKS rotation) are recommended over shared symmetric secrets.
