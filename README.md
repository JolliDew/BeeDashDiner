# 🍯 JolliDew (BeeDashDiner)

A small idle restaurant game built with **vanilla JavaScript modules**, **PHP**, and **MySQL/MariaDB**. You run a bee café: hire automatic workers, improve recipes, complete missions, unlock new restaurants, and spend diamonds on cosmetics.

> **Branch:** `feature/gameplay-expansion`
> **Contribution:** 10 progression levels, automatic cross-station workers, tips, milestones, missions, global/per-station upgrades, diamonds, cosmetics, save migration, and tests.

The previous README mentioned Supabase/PostgreSQL. The code in this repository uses **MySQL/MariaDB through PDO**. This README describes what actually ships.

---

## ✨ What changed in this branch

| System | What it does |
|---|---|
| **10 levels** | Levels 1–4 are Meadow Stand, 5–7 are Hive Café, 8–10 are Royal Hive. |
| **Automatic workers** | Bees never need to be assigned. They serve their home station first, then help the longest-waiting customer anywhere. |
| **Tips** | Customers sometimes leave a bonus (10–30% of the dish price). Tip chance starts at 8% and can be upgraded to 25%. |
| **Recipe milestones** | Recipes go to level 10. At level 5 the station earns **+25% profit**; at level 10 it cooks **15% faster**. |
| **Global upgrades** | Tip jar, bigger queue, faster walking, and a fourth worker slot. These survive restaurant changes. |
| **Per-station upgrades** | Late-game kitchen speed and a one-time 2× profit upgrade for each station. |
| **Missions** | Three missions per level. Missions must be finished before you can advance. Already-satisfied missions auto-complete in order, including out-of-order upgrades. |
| **Diamonds** | Mission and level rewards. Spent in the cosmetics shop. |
| **Cosmetics** | Four bee accessories bought with diamonds. Equipped cosmetics are saved and shown on every bee. |
| **Save migration** | Old location-only saves keep their honey, staff, and recipe progress and move to the matching tier. |
| **Docs + tests** | Gameplay guide, changelog, testing checklist, 37 JavaScript tests, and PHP save-validation checks. |

See **[docs/GAMEPLAY.md](docs/GAMEPLAY.md)** for all formulas, mission tables, and design rules. See **[CHANGELOG.md](CHANGELOG.md)** for the change list and migration steps. See **[docs/TESTING.md](docs/TESTING.md)** for the manual test checklist.

---

## 🧰 Tech stack

- **Frontend:** HTML5, CSS3, vanilla JavaScript ES modules. No build step and no npm runtime dependencies.
- **Backend:** PHP 8+ with PDO and session authentication.
- **Database:** MySQL 5.7+ or MariaDB 10.2+. XAMPP ships MariaDB.
- **Server:** Apache/XAMPP, or PHP's built-in development server.
- **Tests:** Node.js 20+ built-in test runner, plus a dependency-free PHP test script.

Modern versions of Chrome, Firefox, or Safari are required for CSS nesting and ES modules.

---

## 🚀 Setup

### 1. Get the branch

```bash
git clone https://github.com/JohnDavidMorandante/JolliDew.git
cd JolliDew
git switch feature/gameplay-expansion
```

### 2. Create the database

Start **Apache** and **MySQL** in XAMPP, then import the schema.

**Fresh install (recommended):**

- phpMyAdmin: **Import** → `gamefile/login_db.sql` → **Go**
- or CLI:

```bash
mysql -u root -p < gamefile/login_db.sql
```

The file creates `jollidew_db`, the account tables, the v2 progress columns, and the menu reference data. It is safe to re-run.

**Already have a JolliDew database from before this branch?**

Import `gamefile/upgrade_db.sql` once instead. It adds the new columns and gives existing saves the correct starting tier. See [Upgrading an existing save](#upgrading-an-existing-save).

### 3. Create your local database config

```bash
cp gamefile/db.example.php gamefile/db.php
```

Edit `gamefile/db.php` if your MySQL user/password is not the XAMPP default (`root`, empty password). `gamefile/db.php` is ignored by git, so credentials are never committed.

### 4. Run the game

**Option A — XAMPP/Apache**

Copy or clone the project into your XAMPP `htdocs` folder, for example:

```text
/Applications/XAMPP/xamppfiles/htdocs/JolliDew
```

Then open:

```text
http://localhost/JolliDew/gamefile/login.php
```

**Option B — PHP built-in server**

From the repository root:

```bash
php -S 127.0.0.1:8000 -t gamefile
```

Then open <http://127.0.0.1:8000/login.php>.

### 5. Optional Google sign-in

Google login is not required. Username/password registration works out of the box.

```bash
cp gamefile/src/google-config.example.php gamefile/src/google-config.php
```

Put your Google OAuth client ID and secret in `google-config.php`, and register the redirect URI shown by the setup in Google Cloud Console. If the file is missing or still contains placeholders, the Google button shows a friendly "not configured" page instead of failing.

---

## 🎮 How to play

1. **Register** an account and press **Play Game**.
2. Workers serve customers automatically. You never drag or assign bees.
3. Spend honey on:
   - **Hire bee** — more workers at that station.
   - **Recipe** — higher price and shorter cooking time.
   - **Unlock station** — open the next menu item.
   - **Global upgrades** — shared by the whole restaurant.
4. Complete the three missions for your current level. The **Advance** button stays locked until they are done.
5. Move to the next restaurant when the move cost is paid. Your honey, diamonds, cosmetics, and global upgrades travel with you; that restaurant's stations and per-station upgrades reset.
6. Finish all 10 levels to complete the game.

### Starting and moving costs

| Move | Cost |
|---|---|
| Meadow Stand → Hive Café (after level 4) | 6,500 honey + all Meadow stations open |
| Hive Café → Royal Hive (after level 7) | 48,000 honey + all Hive stations open |

Each restaurant also requires its stations to be unlocked before you can move on.

---

## ⚙️ Systems at a glance

### Worker behaviour

- A bee always checks **its home station first**.
- If no customer is waiting there, it takes the **longest-waiting customer anywhere**.
- A customer is claimed by one bee at a time.
- A "helping" bee gets a small gold glow in the scene.

### Tips

| Upgrade level | Tip chance |
|---|---|
| 0 | 8% |
| 1 | 10% |
| … | +2% per level |
| 10 | 25% (cap) |

A tip is worth **10–30%** of the dish price. Tips count toward tip missions and increase total earnings.

### Recipe milestones

| Recipe level | Effect |
|---|---|
| 5 | +25% profit at that station |
| 10 | −15% cooking time at that station |

Recipe upgrades also give **+30% price** and **−10% cooking time** per level. The maximum is 10.

### Global upgrades

| Upgrade | Unlocks | Max | Effect |
|---|---|---|---|
| 🪙 Tip jar | Level 2 | 10 | +2% tip chance per level |
| 🪑 Bigger waiting area | Level 3 | 5 | +2 queue seats per level |
| 💨 Wing workout | Level 4 | 5 | −5% walking time per level |
| 🐝 Extra worker | Level 6 | 1 | Unlocks a 4th worker at every station |

Global upgrades cost more in later restaurants (`6×` per location).

### Per-station upgrades

| Upgrade | Unlocks | Max | Effect |
|---|---|---|---|
| ⏱️ Kitchen drills | Level 8 | 5 | −4% cooking time per level |
| ✨ Golden recipe | Level 9 | 1 | Double that station's profit |

### Cosmetics (diamonds)

| Cosmetic | Cost | Effect |
|---|---|---|
| 🎀 Little bow | 8 💎 | Bow on every bee |
| 🕶️ Cool shades | 12 💎 | Shades on every bee |
| 🎩 Tiny top hat | 18 💎 | Top hat on every bee |
| 👑 Royal crown | 28 💎 | Crown on every bee |

One bee accessory can be equipped at a time. Cosmetics are cosmetic only and never change income or speed.

---

## 🗺️ Progression map

| Level | Restaurant | Stations | New systems |
|---|---|---|---|
| 1–4 | Meadow Stand | 3 | Basics, hiring, recipes, tips |
| 5–7 | Hive Café | 4 | 4th station, 4th worker slot, larger targets |
| 8–10 | Royal Hive | 5 | Kitchen drills, golden recipe, mastery missions |

The full 30-mission list, rewards, and formulas are in **[docs/GAMEPLAY.md](docs/GAMEPLAY.md)**.

### Mission auto-completion

Missions are an ordered list. The tracker only checks the current level's missions, but when a new mission becomes current it checks whether it is **already satisfied**. If it is, it completes immediately and loops to the next mission. This means:

- Upgrading station 2 before station 1 still completes the later mission.
- Earning 20,000 honey before reaching level 6 auto-completes the "earn 20,000" mission when level 6 starts.
- The player never has to replay an objective they already finished.

Missions for the **next** level stay locked until the player presses **Advance**, so progression cannot be skipped by accident.

---

## 💾 Save data

Saves are stored per account in MySQL and mirrored to `localStorage` as an offline backup.

New fields:

- `level` (1–10), `diamonds`
- `upgrades` — global upgrade levels
- `missions` — `index`, `done[]`, `finished`
- `stats` — `served`, `earned`, `tips`, `tipHoney`
- `cosmetics` — `owned[]`, `equipped.bee`
- per-station `workLvl` and `profitX2`

The backend validates and clamps every field before writing. Invalid station counts and malformed saves are rejected.

### Upgrading an existing save

If your database was created before this branch, run `gamefile/upgrade_db.sql` **once**:

- phpMyAdmin → choose `jollidew_db` → **Import** → `gamefile/upgrade_db.sql`
- or CLI: `mysql -u root -p jollidew_db < gamefile/upgrade_db.sql`

It adds the new columns and sets old location-only saves to the first tier of their restaurant (Hive = 5, Royal = 8). Honey, staff, and recipe levels are preserved. The frontend also repairs missing mission indexes and clamps old values when loading.

> XAMPP's MariaDB supports `ADD COLUMN IF NOT EXISTS`. On stock MySQL 8, remove `IF NOT EXISTS` from `upgrade_db.sql` and run it only once, or add the columns manually. Fresh installs should use `login_db.sql`, which works on both.

---

## 🧪 Tests

From the repository root:

```bash
npm test
```

This runs:

- **37 JavaScript tests** using Node's built-in test runner:
  - economy, prices, milestones, tips, worker cap, upgrade costs
  - v2 save round-trip and v1 migration
  - station clamping and level/location repair
  - worker job selection and claim handling
  - mission definitions and auto-completion/cascade
  - final reward paid once
  - cosmetics ownership/purchase/equip rules
- **PHP save-validator checks** via `php tests/SaveRepository.test.php`:
  - v2 payload acceptance
  - v1 defaults
  - level/location repair
  - clamping of currencies, upgrades, stations, missions, and cosmetics
  - malformed input rejection

If `php` is not on your PATH with XAMPP:

```bash
/Applications/XAMPP/xamppfiles/bin/php tests/SaveRepository.test.php
```

The automated suite does **not** need a database. A manual browser/API test was also run against MariaDB 10.4 and PHP 8.5; see **[docs/TESTING.md](docs/TESTING.md)**. Run `npm test` after changing balance numbers or mission definitions.

---

## 🛠️ Developer tools

`in-game.php` enables the dev panel by default so the group can test quickly:

```php
$devMode = true; // set to false for a public/release build
```

The 🛠 button opens:

- free honey and diamonds
- level jump buttons
- unlock all / max all
- "Missions ✓" — complete the current level's missions
- time speed ×1 / ×5 / ×20
- reset save

**Set `$devMode = false` before a public deployment** if players should not have free currency.

### Tuning the game

Most balance lives in:

- `gamefile/js/config.js` — level rewards, starting honey, prices, cook times, costs, milestones, tips, queue size, walking speed, demand.
- `gamefile/js/missions.js` — the 30 missions, targets, and rewards.
- `gamefile/js/upgrades.js` — global and per-station upgrade definitions and unlock levels.
- `gamefile/js/cosmetics.js` — diamond prices and cosmetics.

Nothing in the game needs a build step; refresh the browser after editing.

---

## 📁 Project structure

```text
.
├── gamefile/
│   ├── Mainmenu.php / .css / .js     # Menu and game launcher
│   ├── in-game.php                   # Game HUD and panel markup
│   ├── api.php                       # Save/load endpoint
│   ├── login.php / register.php      # Account screens
│   ├── google-login.php              # Optional Google OAuth
│   ├── login_db.sql                  # Fresh MySQL schema
│   ├── upgrade_db.sql                # Existing-save migration
│   ├── db.example.php                # Copy to db.php
│   ├── css/bee-game.css              # Game styles
│   ├── js/
│   │   ├── main.js                   # Bootstrapper
│   │   ├── Game.js                   # Loop, purchases, rewards
│   │   ├── GameState.js              # v2 save model + v1 migration
│   │   ├── Economy.js                # Prices, costs, tips, upgrade math
│   │   ├── Scene.js                  # Restaurant, queue, delivery
│   │   ├── entities.js               # Bees and customers
│   │   ├── WorkerAI.js               # Pure job-selection logic
│   │   ├── missions.js               # 30 ordered missions
│   │   ├── MissionTracker.js         # Gating + auto-completion
│   │   ├── upgrades.js               # Upgrade definitions
│   │   ├── cosmetics.js              # Diamond cosmetics
│   │   ├── UpgradePanel.js           # Mission / station / shop UI
│   │   ├── DevTools.js               # Dev panel
│   │   └── SaveService.js            # Server + localStorage saves
│   └── src/
│       ├── Auth.php                  # Session guard
│       ├── SaveRepository.php        # Validation and persistence
│       ├── ApiController.php         # API dispatcher
│       ├── google-config.example.php # OAuth template
│       └── .htaccess                 # Blocks direct source access
├── tests/                            # Node + PHP tests
├── docs/GAMEPLAY.md                  # Design, formulas, tables
├── docs/TESTING.md                   # Manual QA checklist
├── CHANGELOG.md
├── package.json
└── README.md
```

---

## 🩺 Troubleshooting

**"Database connection failed"**
- Is MySQL running in XAMPP?
- Does `gamefile/db.php` exist? Copy it from `db.example.php`.
- Are the host, database name, user, and password correct?
- Did you import `gamefile/login_db.sql`?

**"Unknown column `level` / `work_lvl` / `profit_x2`"**
- Run `gamefile/upgrade_db.sql` against the existing database, or re-import `login_db.sql` for a fresh database.

**Emoji/menu insert fails during CLI import**
- Use `mysql --default-character-set=utf8mb4 ...`. `login_db.sql` now sets `SET NAMES utf8mb4` itself, so re-import after pulling this branch.

**Save status says "Save failed" or "Log in again"**
- The PHP session expired. Log out and log back in.
- Check the browser console and the Apache/PHP error log.

**Google button says "not configured"**
- That is expected until you create `gamefile/src/google-config.php` with real OAuth credentials. Username/password login still works.

**The game looks unstyled or modules do not load**
- Make sure you are opening the app through Apache/PHP, not by double-clicking the HTML file. ES modules require HTTP.
- Use a current browser.

---

## 👥 Contribution notes

- The integration branch is `feature/gameplay-expansion`; the plan is one branch and one pull request.
- Commit identity for this contribution: `Klein Rhee P. Sioson <s2010614@usls.edu.ph>`.
- Do not commit `gamefile/db.php`, `gamefile/src/google-config.php`, `node_modules/`, or local save files; they are ignored.
- Run `npm test` before committing gameplay changes.
- Set `$devMode = false` in `gamefile/in-game.php` if you want a release-style demo.

Questions or merge help: open the pull request and tag the group.
