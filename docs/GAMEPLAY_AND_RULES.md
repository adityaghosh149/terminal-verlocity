# Terminal Velocity - Official Gameplay & Rules Guide

Welcome to **Terminal Velocity**, a cyberpunk arcade typing game where mechanical typing speed, probabilistic decision-making, and tactical reflexes determine your survival and leaderboard rank.

---

## 🎮 1. The Core Objective

Words (encrypted data packets) descend through 4 vertical terminal lanes toward the bottom defense firewall.

* **Type words** before they reach the bottom line to intercept and decrypt them for points.
* **Typing Lock:** Press the first letter of any active word on your keyboard to lock your typing target onto it, then type the rest of the word.
* **Corrupted Packets:** Words are classified into risk tiers:
  * 🟢 **Safe (< 25% risk):** Reliable point return. Never costs a shield, even if corrupted!
  * 🟡 **Caution (25%–49% risk):** Higher reward. Never costs a shield.
  * 🔴 **Danger (≥ 50% risk):** Massive point upside, but risks costing 1 shield if corrupted!
* **Shields (Lives):** You start each run with **5 Shields**. If any word hits the bottom unintercepted, or a danger word turns out corrupted, you lose 1 shield. The game ends when all 5 shields are depleted!

---

## 🛡️ 2. Special Tactical Packets & Power-Ups

To reward skilled decision-making under pressure, specialized tactical packets dynamically spawn in the lanes:

### 1. Nanite Shield Recovery Packet (🛡️)
* **Trigger Condition:** Automatically activates when a runner's shields drop to $\le 2$.
* **Appearance & Speed:** Fast-moving glowing cyan packet with the `🛡️ +1 SHIELD` badge (+25% descent velocity).
* **Risk Profile:** Guaranteed **Safe tier** ($p \in [0.05, 0.20]$).
* **Effect:** Intercepting it cleanly restores **+1 Shield** (up to the maximum 5 shields) and plays the shield restoration chime, granting a clutch comeback mechanic for high-skill runners.

### 2. Decryption Overclock / Matrix Slow-Mo (⏳)
* **Trigger Condition:** Awarded upon reaching streaks of **15, 30, and 45 clean words**.
* **Effect:** Activates a **5-second Matrix Slow-Mo pulse** that slows down the falling speed of all descending packets by **50%** ($0.5\times$ speed).
* **HUD Indicator:** Displays a pulsing emerald banner `⏳ DECRYPTION OVERCLOCK: MATRIX SLOW-MO 0.5X ACTIVE` with an overclock audio pulse, allowing runners to clear crowded lanes and sustain high streaks.

### 3. Golden "High Roller" Packets (🌟)
* **Trigger Condition:** Ultra-rare packet (6% natural spawn chance).
* **Appearance:** Pulsing golden/amber card styled with the `🌟 3X HIGH ROLLER` banner.
* **Risk & Reward Profile:** Offers **$3\times$ Advertised Reward** with a strict coin-flip risk ($p = 0.50$). Runners must instantly weigh whether the massive $3\times$ point upside is worth the danger of shield loss.

---

## 📚 3. Custom Themed Word Packs

Runners can select their preferred vocabulary on the pre-game overlay before starting a run:
* 🖥️ **Core Cyber:** Cyberpunk terminal vocabulary (`byte`, `data`, `matrix`, `cipher`, `kernel`).
* 💻 **Developer Syntax:** Programming keywords and constructs (`const`, `async`, `await`, `struct`, `yield`).
* 🛡️ **Cybersecurity:** Threat and defense terminology (`hash`, `trojan`, `payload`, `botnet`, `breach`).
* 🐧 **Linux Sysadmin:** Unix tools, daemons, and system commands (`grep`, `sudo`, `docker`, `system`, `kernel`).

> All themed packs strictly enforce 4-letter words on Easy, 5-letter words on Medium, and 6-letter words on Hard.

---

## 🎧 4. Dynamic Layered Synthwave Audio

The game features a procedural Web Audio synthwave sound engine that dynamically layers instruments as your clean streak escalates:
* **Base (0–2 Streak):** Sub-bass synthline driving the background rhythm.
* **2x Multiplier (3–5 Streak):** 16th-note hi-hat percussion kicks in.
* **3x Multiplier (6–9 Streak):** Rapid 8th-note arpeggiated synths join the mix.
* **4x MAX Overdrive (10+ Streak):** Full cyberpunk synthwave lead melody.
* **Streak Loss:** Drops back to base layer instantly with an audio corruption alert.

---

## 🧮 5. Score Breakdown & Math Engine

Every completed run calculates three distinct score components that sum **exactly** to your total score:

$$\text{Total Score} = \text{Pure Typing Score} + \text{Multiplier Score} + \text{Speed Bonus Score}$$

### 1. Advertised Reward Ranges & Pure Typing Score
The **Advertised Reward** displayed on every packet represents its base **Pure Typing Score**, dynamically sampled from a calibrated range per difficulty and risk tier:

| Difficulty | Word Length | Advertised Reward Range | Safe Tier (< 25%) | Caution Tier (25%–49%) | Danger Tier (≥ 50%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🟢 **Easy** | 4 letters | **40 to 70 PTS** | 40–50 PTS | 50–60 PTS | 60–70 PTS |
| 🟡 **Medium** | 5 letters | **75 to 130 PTS** | 75–90 PTS | 90–110 PTS | 110–130 PTS |
| 🔴 **Hard** | 6 letters | **140 to 240 PTS** | 140–170 PTS | 170–205 PTS | 205–240 PTS |

*High Roller packets multiply these advertised reward ranges by $3\times$.*

**Interception Outcomes:**
* **Non-Corrupted (Clean) Packets:** You receive **positive** pure score ($+\text{Advertised Reward}$), plus clean streak multipliers and speed bonuses.
* **Corrupted Packets:** You receive **negative** penalty ($-\text{Advertised Reward}$), your clean streak multiplier resets to zero, and danger words risk losing 1 shield.
* **Fair Shield Rule:** 🟢 Safe and 🟡 Caution packets never cost a shield upon corruption. Only 🔴 Danger words or bottom-line breaches deduct shields.

### 2. Clean Streak Multipliers
Typing clean words consecutively without errors unlocks massive point multipliers:
* **Base (1x):** 0–2 streak
* **2x Multiplier:** 3 in a row
* **3x Multiplier:** 6 in a row
* **4x MAX Multiplier:** 10+ in a row
* Points earned above the pure typing base from the streak multiplier are recorded as **Multiplier Score**.

### 3. Typing Speed Bonus (Applied on Pure Typing Score)
The faster your fingers type each word, the higher your bonus percentage based on Words Per Minute (WPM):
* **30+ WPM:** $+20\%$ Speed Bonus
* **50+ WPM:** $+35\%$ Speed Bonus
* **70+ WPM:** $+50\%$ Speed Bonus
* **90+ WPM:** $+75\%$ Speed Bonus
* **110+ WPM:** $+100\%$ Speed Bonus (Double Points!)
* **Rule:** The speed bonus percentage is applied **strictly to your Pure Typing Score**:
  $$\text{Speed Bonus Score} = \text{Pure Typing Score} \times \text{Speed Bonus } \%$$

### 4. Luck Metric
Measures how actual packet outcomes deviated from statistical expectation:
$$\text{Luck} = \text{Pure Typing Score} - \text{Expected Pure Score}$$
* **Positive Luck ($> 0$):** You intercepted riskier packets that turned out clean more often than statistically expected.
* **Negative Luck ($< 0$):** Unfortunate packet corruption streaks lowered your pure yield below mathematical expectation.

### 5. Universal 2-Decimal Precision
All floating-point metrics (WPM, Accuracy %, Multipliers, Luck, and Averages) are consistently rounded to **2 decimal places** across the game canvas, dashboard analytics, and the database.

---

## 🕹️ 6. Game Modes

| Mode | Description | Win / Loss Condition |
| :--- | :--- | :--- |
| **Classic** | A high-octane 90-second sprint. Word drop speeds increase every 15 seconds. | Game ends when the 90-second timer hits 0 or all 5 shields are lost. |
| **Endless** | The ultimate survival endurance test. Infinite stream of words with increasing velocity. | Game ends when all 5 shields are depleted. |
| **Daily Challenge** | A worldwide deterministic challenge using a daily seed (`challenge_YYYY-MM-DD`). | One synchronized run per day. Every player worldwide gets the exact same sequence of words. |

---

## 💥 7. Tactical Controls

* **[TAB] EMP Blast:** Instantly obliterates the lowest falling word before it breaches your firewall. Defuses with 0 shield loss and grants $+50\%$ points. Earn $+1$ EMP charge for every 10-word streak!
* **[F] Full Screen:** Press `F` anytime to enter or exit distraction-free full-screen mode.
* **[ESC] Pause:** Pauses the arcade canvas and brings up the in-game menu.
* **[Ctrl+Enter] / [F2] Quick Restart:** Instantly restarts your run.

---

## 📊 8. Advanced Telemetry, Heatmaps & Personas (`/dashboard`)

The post-game **Data Science Dashboard** (`/dashboard`) tracks your skill evolution over time:

### 1. Interactive QWERTY Typo Heatmap
* Virtual keyboard visualizing keystroke errors recorded during your runs.
* Heat-mapped colors (emerald green for flawless keys $\to$ amber for occasional typos $\to$ rose red for high-frequency error keys).
* Interactive key inspection showing the exact mistype count and percentage of total mistakes.

### 2. Player Risk Archetype Personas
Calculates your automated behavioral persona from your historical and latest run telemetry:
* 🛡️ **The Calculated Strategist:** High accuracy ($\ge 95\%$), prioritizes Safe packets ($\ge 65\%$ Safe selection).
* ⚡ **The Speed Demon:** High velocity ($90+$ WPM), leverages high speed bonuses.
* 🎲 **The High Roller:** Chases 🔴 Danger packets ($\ge 35\%$ Danger selection) for maximum score thrill.
* 🧘 **The Zen Master:** Flawless accuracy ($\ge 99\%$) with zero unforced errors.

### 3. Historical Improvement Curves & Filters
* **Mode & Difficulty Filters:** Filter telemetry by Classic vs. Endless vs. Daily, and Easy vs. Medium vs. Hard.
* **Telemetry Charts:** Effective WPM progression, keystroke accuracy over time, total score vs expected EV, and empirical calibration curves.

---

## 🌐 9. Live Online Runners Presence

* **Real-Time Network Telemetry:** Displays the exact count of active runners currently online on the platform with a live pulsing green beacon.
* **Presence Heartbeat:** Clients broadcast heartbeats every 25 seconds to `/api/presence`. Stale sessions older than 60 seconds are automatically evicted.
* **Visibility:** Displayed in the global navigation bar across all pages and on the home page hero section.

---

## 👤 10. Account & Identity Rules

* **Username Format:** Usernames can contain both uppercase and lowercase letters (e.g. `Aditya_G`, `CyberNinja99`), digits, and underscores (3–20 characters).
* **Uniqueness:** Usernames are unique case-insensitively (`CyberNinja` and `cyberninja` represent the same account).
* **Persistent Authentication:** Uses dual-token JWT authentication (15-minute access token + 30-day refresh token stored in secure `httpOnly` cookies). You stay logged in automatically across page refreshes and browser restarts.
