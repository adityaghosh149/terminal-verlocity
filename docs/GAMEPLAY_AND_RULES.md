# Terminal Velocity - Official Gameplay & Rules Guide

Welcome to **Terminal Velocity**, a cyberpunk arcade typing game where mechanical typing speed and probabilistic decision-making determine your survival and leaderboard rank.

---

## 🎮 1. The Core Objective

Words (encrypted data packets) descend through 4 vertical terminal lanes toward the bottom defense firewall.

* **Type words** before they reach the bottom line to intercept and decrypt them for points.
* **Typing Lock:** Press the first letter of any active word on your keyboard to lock your typing target onto it, then type the rest of the word.
* **Corrupted Packets:** Words are classified into risk tiers:
  * 🟢 **Safe (< 25% risk):** Reliable point return. Never costs a shield, even if corrupted!
  * 🟡 **Caution (25%–49% risk):** Higher reward. Never costs a shield.
  * 🔴 **Danger (≥ 50% risk):** Massive point multipliers, but risks costing 1 shield if corrupted!
* **Shields (Lives):** You start each run with **5 Shields**. If any word hits the bottom unintercepted, or a danger word turns out corrupted, you lose 1 shield. The game ends when all 5 shields are depleted!

---

## 📐 2. Responsive Terminal Physics

* **Adaptive Fall Velocity:** Word descent speed is dynamically calculated based on your screen and terminal container size.
* **Edge-to-Edge Full Screen:** Press <kbd>F</kbd> anytime to toggle distraction-free full screen mode.
* **Bottom Baseline Popping:** Words are engineered to remain visible and active down to the exact bottom of the container. A word only pops/breaches when it reaches the true bottom defense threshold, ensuring fair reaction times on laptops, desktops, and full-screen displays alike.

---

## 🧮 3. Score Breakdown & Math Engine

Every completed run calculates three distinct score components that sum **exactly** to your total score:

$$\text{Total Score} = \text{Pure Typing Score} + \text{Multiplier Score} + \text{Speed Bonus Score}$$

### 1. Pure Typing Score
Base points earned solely from typing correct characters:
$$\text{Pure Typing Score} = 10 \times \text{Character Length of Word}$$
* *Example:* Intercepting the 5-letter word `CYBER` awards $10 \times 5 = 50$ pure typing points.

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
* *Example:* If your pure typing score is 500 and you typed at 75 WPM (+50% bonus), your speed bonus score is $500 \times 0.50 = 250$ points.

### 4. Luck Metric
Measures how actual packet outcomes deviated from statistical expectation:
$$\text{Luck} = \text{Pure Typing Score} - \text{Expected Pure Score}$$
* **Positive Luck ($> 0$):** You intercepted riskier packets that turned out clean more often than statistically expected.
* **Negative Luck ($< 0$):** Unfortunate packet corruption streaks lowered your pure yield below mathematical expectation.

### 5. Universal 2-Decimal Precision
All floating-point metrics (WPM, Accuracy %, Multipliers, Luck, and Averages) are consistently rounded to **2 decimal places** across the game canvas, dashboard analytics, and the database.

---

## 🕹️ 4. Game Modes

| Mode | Description | Win / Loss Condition |
| :--- | :--- | :--- |
| **Classic** | A high-octane 90-second sprint. Word drop speeds increase every 15 seconds. | Game ends when the 90-second timer hits 0 or all 5 shields are lost. |
| **Endless** | The ultimate survival endurance test. Infinite stream of words with increasing velocity. | Game ends when all 5 shields are depleted. |
| **Daily Challenge** | A worldwide deterministic challenge using a daily seed (`challenge_YYYY-MM-DD`). | One synchronized run per day. Every player worldwide gets the exact same sequence of words. |

---

## ⚡ 5. Difficulty Profiles

* **🟢 Easy:** Exact 4-letter words (e.g. `DATA`, `RISK`, `CODE`), gentler drop speed, low corruption risk (5%–20%).
* **🟡 Medium:** Exact 5-letter words (e.g. `CYBER`, `LOGIC`, `SHIFT`), balanced drop speed, moderate corruption risk (15%–45%).
* **🔴 Hard:** Exact 6-letter words (e.g. `MATRIX`, `CIPHER`, `VECTOR`), rapid drop speed, higher corruption risk (25%–70%).

---

## 💥 6. Tactical Controls

* **[TAB] EMP Blast:** Instantly obliterates the lowest falling word before it breaches your firewall. Defuses with 0 shield loss and grants $+50\%$ points. Earn $+1$ EMP charge for every 10-word streak!
* **[F] Full Screen:** Press `F` anytime to enter or exit distraction-free full-screen mode.
* **[ESC] Pause:** Pauses the arcade canvas and brings up the in-game menu.

---

## 📊 7. Post-Game Telemetry & Improvement Curves

The post-game **Data Science Dashboard** (`/dashboard`) tracks your skill evolution over time:

* **Mode & Difficulty Filters:** Because pacing and vocabulary differ between Classic Easy and Endless Hard, improvement curves can be filtered and compared by individual Mode and Difficulty combinations.
* **Tracking Metrics:**
  * **Effective WPM Progression:** Real-time and historical typing speed.
  * **Keystroke Accuracy %:** Clean hit vs miss ratio.
  * **Total Score vs Expected Value:** Realized score against theoretical expected yield.
  * **Risk Calibration Curve:** Observed packet corruption rate vs theoretical probability.

---

## 👤 8. Account & Identity Rules

* **Username Format:** Usernames can contain both uppercase and lowercase letters (e.g. `Aditya_G`, `CyberNinja99`), digits, and underscores (3–20 characters).
* **Uniqueness:** Usernames are unique case-insensitively (`CyberNinja` and `cyberninja` represent the same account).
* **Persistent Authentication:** Uses dual-token JWT authentication (15-minute access token + 30-day refresh token stored in secure `httpOnly` cookies). You stay logged in automatically across page refreshes and browser restarts.
