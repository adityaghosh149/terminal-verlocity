# Terminal Velocity - Official Gameplay & Rules Guide

Welcome to **Terminal Velocity**, a cyberpunk arcade typing game where mechanical typing speed, probabilistic decision-making, typing accuracy, and tactical reflexes determine your survival and leaderboard rank.

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

Every completed run calculates discrete score components that sum **exactly** to your total score:

$$\text{Total Score} = (\text{Base Typing Score} - \text{Accuracy Penalty}) + \text{Multiplier Score} + \text{Speed Bonus Score}$$

### 1. Advertised Reward Ranges & Base Typing Score
The **Advertised Reward** displayed on every packet represents its **Base Typing Score**, dynamically sampled from a calibrated range per difficulty and risk tier:

| Difficulty | Word Length | Advertised Reward Range | Safe Tier (< 25%) | Caution Tier (25%–49%) | Danger Tier (≥ 50%) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🟢 **Easy** | 4 letters | **40 to 70 PTS** | 40–50 PTS | 50–60 PTS | 60–70 PTS |
| 🟡 **Medium** | 5 letters | **75 to 130 PTS** | 75–90 PTS | 90–110 PTS | 110–130 PTS |
| 🔴 **Hard** | 6 letters | **140 to 240 PTS** | 140–170 PTS | 170–205 PTS | 205–240 PTS |

*High Roller packets multiply these advertised reward ranges by $3\times$.*

**Interception Outcomes:**
* **Non-Corrupted (Clean) Packets:** You receive **positive** base score ($+\text{Advertised Reward}$), plus clean streak multipliers and speed bonuses.
* **Corrupted Packets:** You receive **negative** penalty ($-\text{Advertised Reward}$), your clean streak multiplier resets to zero, and danger words risk losing 1 shield.
* **Fair Shield Rule:** 🟢 Safe and 🟡 Caution packets never cost a shield upon corruption. Only 🔴 Danger words or bottom-line breaches deduct shields.

---

### 2. Accuracy Penalty: $(2 \times (100 - \text{Accuracy}))\%$
To reward precision and punish frantic key-spamming, your **Base Typing Score** is subject to a strict accuracy deduction:

$$\text{Accuracy Penalty } \% = \min(100, \max(0, 2 \times (100 - \text{Accuracy})))$$
$$\text{Accuracy Penalty Score} = \text{Base Typing Score} \times \left(\frac{\text{Accuracy Penalty } \%}{100}\right)$$
$$\text{Net Typing Score} = \text{Base Typing Score} - \text{Accuracy Penalty Score}$$

| Player Accuracy % | Error Rate ($100 - \text{Acc}$) | Penalty Applied on Base Typing | Example on 1,000 Base Score | Net Typing Score |
| :--- | :--- | :--- | :--- | :--- |
| 🌟 **100% (Flawless)** | $0\%$ | **0% (None)** | $-0\text{ PTS}$ | **1,000 PTS** |
| 🟢 **98%** | $2\%$ | **-4%** | $-40\text{ PTS}$ | **960 PTS** |
| 🟡 **95%** | $5\%$ | **-10%** | $-100\text{ PTS}$ | **900 PTS** |
| 🟠 **90%** | $10\%$ | **-20%** | $-200\text{ PTS}$ | **800 PTS** |
| 🔴 **80%** | $20\%$ | **-40%** | $-400\text{ PTS}$ | **600 PTS** |

> **Pro Takeaway:** Maintaining $98\%+$ accuracy is vastly more profitable than typing at 120 WPM with frequent typos, because mistakes penalize both your streak multiplier AND your base score!

---

### 3. Clean Streak Multipliers
Typing clean words consecutively without errors unlocks massive point multipliers:
* **Base (1x):** 0–2 streak
* **2x Multiplier:** 3 in a row
* **3x Multiplier:** 6 in a row
* **4x MAX Multiplier:** 10+ in a row
* Points earned above the base from streak multipliers are recorded as **Multiplier Score**.

---

### 4. Typing Speed Bonus (Applied on Net Typing Score)
The faster your fingers type each word, the higher your bonus percentage based on Words Per Minute (WPM):
* **30+ WPM:** $+20\%$ Speed Bonus
* **50+ WPM:** $+35\%$ Speed Bonus
* **70+ WPM:** $+50\%$ Speed Bonus
* **90+ WPM:** $+75\%$ Speed Bonus
* **110+ WPM:** $+100\%$ Speed Bonus (Double Points!)
* **Formula:** $\text{Speed Bonus Score} = \text{Net Typing Score} \times \text{Speed Bonus } \%$

---

### 5. Luck Metric
Measures how actual packet outcomes deviated from statistical expectation:
$$\text{Luck} = \text{Net Typing Score} - \text{Expected Value Pure Score}$$
* **Positive Luck ($> 0$):** You intercepted riskier packets that turned out clean more often than statistically expected.
* **Negative Luck ($< 0$):** Unfortunate packet corruption streaks lowered your pure yield below mathematical expectation.

---

### 6. Universal 2-Decimal Precision
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

---

## 🏆 11. Pro Strategy Guide: How to Score Better

Tested and verified by top leaderboard runners. Follow these 6 core tactics to maximize your score and climb the rankings:

### 🎯 Tactic 1: Accuracy First, Speed Second
* **The Double-Penalty Hazard:** Every typo resets your **4x streak multiplier** back to 1x AND triggers the **$(2 \times \text{mistype}\%)$ penalty** on your Base Typing score.
* **The Math:** A runner typing 70 WPM at 99% accuracy will almost always beat a runner typing 100 WPM at 90% accuracy (who suffers a -20% score deduction and repeated multiplier resets).
* **Rule:** Focus on clean, rhythmic keystrokes before chasing speed bonuses.

### 🛡️ Tactic 2: Build Your 4x Multiplier on Safe & Caution Words
* 🟢 Safe packets ($p < 0.25$) and 🟡 Caution packets ($p < 0.50$) **never deduct shields** even if corrupted.
* Use these low-risk words early in your run to safely chain 10 clean words in a row to hit the permanent **4x MAX multiplier**. Once at 4x, every subsequent word yields quadrupled points!

### ⏳ Tactic 3: Exploit Decryption Overclock (Matrix Slow-Mo)
* At streaks of **15, 30, and 45**, the engine activates 5 seconds of half-speed packet descent.
* Use this slow-motion window to clear the lowest words in congested lanes, restore breathing room, and lock onto high-value words without rushing.

### 🛡️ Tactic 4: Clutch Shield Management with Nanite Packets
* When your shields drop to 2 or 1, the system automatically begins spawning glowing cyan **Nanite Shield Recovery Packets**.
* These packets move faster (+25% speed) but are guaranteed to be in the **Safe tier**. Prioritize them immediately to restore +1 Shield and avoid elimination.

### 🌟 Tactic 5: Only Gamble on Golden High Rollers with 3+ Shields
* Golden packets offer a massive **$3\times$ Advertised Reward**, but carry an exact 50% coin-flip risk.
* **When to intercept:** If you have 4 or 5 shields and a 4x multiplier active, the upside ($3\times$ base $\times 4\times$ combo) is mathematically worth the risk.
* **When to avoid:** If you are down to 1 or 2 shields, let the high roller pass or use EMP, as corruption risks run termination.

### ⚡ Tactic 6: Save EMP Blasts for Firewall Redline Emergencies
* You earn +1 EMP charge for every 10 consecutive clean words.
* EMP obliterates the lowest impending packet with 0 shield penalty and grants $+50\%$ bonus points.
* Never waste EMP on freshly spawned packets near the top of the lane; save your EMP charges for moments when a Danger word or breached word touches the bottom defense line.
