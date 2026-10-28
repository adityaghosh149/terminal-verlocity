# Mathematical Architecture & Security Specification

This document details the mathematical modeling, data science methodology, and security architecture of **Terminal Velocity**.

---

## 1. Probability Engine & Expected Value Model

### 1.1 Authoritative Mathematical Formulation
Every falling data packet possesses four fundamental attributes:
1. **Advertised Reward ($R$):** The gross point yield credited upon clean interception.
2. **Corruption Probability ($p \in [0.05, 0.85]$):** The objective probability that the packet contains a malicious payload.
3. **Success Probability ($1 - p$):** The objective probability that the packet is clean.
4. **Corruption Penalty ($C$):** The point deduction and shield damage incurred if intercepted while corrupted.
5. **Interception Cost ($K$):** Optional upfront execution cost (defaults to 0).

The **Expected Value ($EV$)** represents the mathematical expectation of point return over repeated trials:

$$\mathbb{E}[V] = (1 - p)R - pC - K$$

#### Example:
A packet offers $R = 100$ points with a corruption risk of $p = 0.20$ (20%) and a corruption penalty of $C = 60$ points:
$$\mathbb{E}[V] = (1 - 0.20)(100) - (0.20)(60) = 80 - 12 = 68\text{ points}$$

### 1.2 Decision Science: Value Per Second (VPS)
In rapid typing arcade games, typing duration represents an opportunity cost. We model **Net Value Per Second ($VPS$)**:

$$VPS = \frac{\mathbb{E}[V]}{\text{Typing Duration (seconds)}}$$

Where typing duration is estimated dynamically from packet character length $L$ assuming an operative speed baseline of 60 WPM (5 characters/sec):
$$\text{Duration} = \max\left(0.5, \frac{L}{5}\right)$$

### 1.3 Seeded Deterministic PRNG (Mulberry32)
For reproducible testing and Daily Challenges, we utilize a 32-bit state generator:

$$t = s + \text{0x6D2B79F5}$$
$$t = (t \oplus (t \gg 15)) \times (t \mid 1)$$
$$t = t \oplus (t + (t \oplus (t \gg 7)) \times (t \mid 61))$$
$$\text{Output} = \frac{(t \oplus (t \gg 14)) \gg 0}{4294967296}$$

This guarantees that all players worldwide receiving the daily seed `challenge_YYYY-MM-DD` encounter an identical sequence of falling packets.

### 1.4 Post-Game Empirical Calibration
To evaluate player decision quality, packet events are binned into probability intervals $[0, 0.2), [0.2, 0.4), [0.4, 0.6), [0.6, 0.8), [0.8, 1.0]$.
For each bin $b$ with $N$ samples, we calculate:

$$\bar{p}_{\text{theoretical}} = \frac{1}{N}\sum_{i=1}^N p_i, \quad \hat{p}_{\text{observed}} = \frac{\sum_{i=1}^N \mathbb{I}(\text{corrupted})}{N}$$

The calibration curve compares $\bar{p}_{\text{theoretical}}$ against $\hat{p}_{\text{observed}}$ to illustrate sample variance and convergence under the Law of Large Numbers.

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
- Signed using `jose` with `HS256` and a 32+ character server-side private secret.
- **Expiration:** 15 minutes (`exp: 15m`).
- **Standard Claims:** `sub` (User ID), `iss` (`terminal-velocity.app`), `aud` (`terminal-velocity-players`), `iat`, `jti` (UUID).
- Delivered in secure `HttpOnly`, `SameSite=Lax`, `Secure` cookies to eliminate browser JavaScript XSS theft.

### 2.3 Refresh Token Rotation & Breach Containment
- Generated using 40 cryptographically secure random bytes (`crypto.randomBytes(40).toString('hex')`).
- Stored exclusively as **SHA-256 hashes** in MongoDB (`Session` collection).
- **Session Rotation:** On every refresh request, the previous token is invalidated, and a new token is issued with the same `familyId`.
- **Reuse Detection:** If an already-rotated refresh token is presented, the system detects replay/theft and **immediately revokes all active sessions in the token family** as a breach containment safeguard.

### 2.4 Cryptographic OTP & Challenge Engine
- Verification codes are 6-digit integers generated via `crypto.randomInt(100000, 1000000)`.
- Reset tokens are 32-byte high-entropy hex strings (`crypto.randomBytes(32)`).
- Stored only as SHA-256 hashes in MongoDB with a 10-minute TTL index.
- Strict purpose separation: `EMAIL_VERIFICATION`, `PASSWORD_RESET`, `LOGIN_OTP`.
- Hard limit of 5 failed attempts per challenge before permanent invalidation.
- Timing-safe equality checks (`crypto.timingSafeEqual`) prevent side-channel timing attacks.

### 2.5 Score Integrity & Tampering Protection
- Runs are initiated via `POST /api/game/start` which issues a cryptographically signed `runToken` containing start timestamp, seed, mode, and difficulty.
- Submissions via `POST /api/game/submit` validate:
  1. Signature of `runToken`.
  2. Idempotency check: unique `runId` recorded once.
  3. Plausible run duration ($10\text{s} \le t \le 7200\text{s}$).
  4. Typing speed threshold: WPM $> 240$ flagged as automated/inhuman.
  5. Telemetry event sum consistency: claimed final score must tally with packet points deltas.
- Only validated runs qualify for global and difficulty leaderboards.

---

## 3. Known Limitations & Recommendations

1. **Client-Side Arcade Environment:** Because Phaser 3 executes in the browser canvas, client-side memory modifications are theoretically possible on compromised devices. While server-side bound checks prevent impossible scores, high-stakes commercial gaming would benefit from server-side physics simulation.
2. **Key Rotation:** In large enterprise deployments, asymmetric signing keys (e.g. Ed25519 or RS256 with JWKS rotation) are recommended over shared symmetric secrets.
