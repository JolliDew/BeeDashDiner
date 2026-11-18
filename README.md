# 🍯 JolliDew (BeeDashDiner)

A small idle restaurant game built with **vanilla JavaScript modules**, **PHP**, and **MySQL/MariaDB or PostgreSQL**. You run a bee café: hire automatic workers, improve recipes, complete missions, unlock new restaurants, and spend diamonds on cosmetics.

> **Branch:** `fix/emman-redesign-admin`
> **What it contains:** Emman's newer redesign (popup upgrade panels, global staff, station milestones, queue chairs, station indicators) plus bug fixes, security hardening, full admin CRUD, save format v3, and tests.

The backend uses **PDO** and supports both **MySQL/MariaDB** (XAMPP) and **PostgreSQL** (including Supabase). The gameplay and API code are identical on both engines.

---

## ✨ What changed

| System | What it does |
|---|---|
| **10 levels** | Levels 1–4 are Meadow Stand, 5–7 are Hive Café, 8–10 are Royal Hive. |
| **Automatic workers** | Bees prefer their home station, then help the longest-waiting customer anywhere. A bee helping away from home gets a gold glow. |
| **Global staff** | One hive team serves every station. Hire bees in the **Staff & global upgrades** popup. |
| **Queue** | Starts with **4 waiting chairs**; each *Bigger waiting area* level adds one chair. The HUD shows `🪑 waiting/seats`. |
| **Tips** | Customers sometimes leave a bonus (10–30% of the dish price). Tip chance starts at 8%, +2% per Tip jar level, capped at **28%**. |
| **Recipe milestones** | Recipes go to level 10. Milestones at **2/6/10** add a worker slot; milestones at **4/8** double that station's profit. |
| **Global upgrades** | Tip jar, bigger queue, faster walking, kitchen drills, and Golden recipe. They survive restaurant moves. |
| **Popup panels** | Tap/click a station to open its upgrade panel. Staff, global upgrades, and cosmetics each have their own modal. |
| **Missions** | Three missions per level. Missions must be finished before you advance. Already-satisfied missions auto-complete in order. |
| **Diamonds & cosmetics** | Mission/level rewards buy four bee accessories. Cosmetics are saved and shown on every bee. |
| **Admin panel** | Full user CRUD: search, paginate, create, edit role/email/username, reset password, reset progress, delete, and audit log. |
| **Save v3** | Global staff, global upgrades, and compact station records. Old v1/v2 saves migrate automatically. |
| **Security** | Config-driven Google OAuth with verified-email checks, CSRF-protected forms, secure session cookies, and no committed secrets. |

See **[docs/GAMEPLAY.md](docs/GAMEPLAY.md)** for formulas and the mission table, **[docs/ADMIN.md](docs/ADMIN.md)** for the admin workflow, **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the code map, and **[docs/TESTING.md](docs/TESTING.md)** for the test checklist.

---

## 🧰 Tech stack

- **Frontend:** HTML5, CSS3, flat vanilla JavaScript ES modules. No build step, no npm runtime dependencies.
- **Backend:** PHP 8+ with PDO and session authentication.
- **Database:** MySQL 5.7+/MariaDB 10.2+, or PostgreSQL 13+ (Supabase works). XAMPP ships MariaDB.
- **Bundled front-end libraries:** Bootstrap 4.6.2 and jQuery 3.7.1 are in `gamefile/vendor/`, so the game works offline under XAMPP.
- **Tests:** Node.js 20+ built-in test runner, plus dependency-free PHP scripts.

---

## 🚀 Setup

### 1. Get the branch

```bash
git clone https://github.com/JohnDavidMorandante/JolliDew.git
cd JolliDew
git switch fix/emman-redesign-admin
```

### 2. Create the database

Pick **one** database. The game works the same with either.

#### Option A — MySQL/MariaDB (XAMPP)

Start **Apache** and **MySQL** in XAMPP.

**Fresh install:**

- phpMyAdmin: **Import** → `gamefile/login_db.sql` → **Go**
- or:

```bash
mysql -u root -p < gamefile/login_db.sql
```

**Existing JolliDew database:** import `gamefile/upgrade_db.sql` once instead. It adds the admin role/audit tables and keeps old saves.

#### Option B — PostgreSQL/Supabase

Open **SQL Editor** in Supabase, paste `gamefile/login_db_pg.sql`, and run it. With a direct connection string:

```bash
psql "$DATABASE_URL" -f gamefile/login_db_pg.sql
```

`login_db_pg.sql` handles fresh and existing databases. It is safe to re-run.

### 3. Create your local database config

**MySQL/MariaDB:**

```bash
cp gamefile/db.example.php gamefile/db.php
```

**PostgreSQL/Supabase:**

```bash
cp gamefile/db.postgres.example.php gamefile/db.php
```

Fill in the real values. `gamefile/db.php` is ignored by git, so credentials are never committed.

### 4. Run the game

**XAMPP/Apache:** put the project in `htdocs`, for example `http://localhost/JolliDew/gamefile/login.php`.

**PHP built-in server:**

```bash
php -S 127.0.0.1:8000 -t gamefile
```

Then open <http://127.0.0.1:8000/login.php>.

### 5. Promote the first admin

Register a normal account in the browser, then run:

```bash
php gamefile/bin/make-admin.php your_username
```

Reload the main menu: an **Admin Panel** button appears for admins. Every later user can be promoted or demoted from `admin.php`.

### 6. Optional Google sign-in

```bash
cp gamefile/src/google-config.example.php gamefile/src/google-config.php
```

Put the client ID and secret in `google-config.php`. Register the exact redirect URI in Google Cloud Console:

```text
http://127.0.0.1:8000/google-login.php
```

or, for XAMPP:

```text
http://localhost/JolliDew/gamefile/google-login.php
```

If the automatic URI does not match, set `redirect_uri` in `google-config.php` to the exact registered value. The login only accepts Google accounts whose email is verified.

---

## 🎮 How to play

1. **Register** and press **Play Game**.
2. Bees serve customers automatically. You never drag or assign them.
3. Tap a station to open its popup:
   - unlock it,
   - raise its recipe level,
   - see its worker slots and milestone list.
4. Open **Staff & global upgrades** to hire bees and buy restaurant-wide upgrades.
5. Open **Cosmetics** to spend diamonds.
6. Complete all three missions for your level, then press **Advance**.
7. Finish all 10 levels.

### Moving restaurants

| Move | Cost | Requirements |
|---|---|---|
| Meadow Stand → Hive Café (after level 4) | 6,500 honey | every Meadow station unlocked |
| Hive Café → Royal Hive (after level 7) | 48,000 honey | every Hive station unlocked |

A new restaurant starts with fresh stations and **one bee**. Honey, diamonds, cosmetics, missions, stats, and **global upgrades** carry over.

### Worker behaviour

- Each bee has a **home station**, spread across the open stations.
- It serves a waiting customer at home first.
- If home has no open customer, it takes the **longest-waiting customer anywhere**.
- A customer is claimed by exactly one bee.
- A bee working away from home gets a small gold glow; the station badge shows `🐝 busy/slots`.

### Tips

| Tip jar level | Tip chance |
|---|---|
| 0 | 8% |
| 1 | 10% |
| … | +2% per level |
| 10 | 28% (cap) |

A tip is worth **10–30%** of the dish price.

### Recipe milestones

| Recipe level | Effect |
|---|---|
| 2 | +1 worker slot |
| 4 | 2× station profit |
| 6 | +1 worker slot |
| 8 | 2× station profit |
| 10 | +1 worker slot |

Every recipe level also gives **+30% price** and **−10% cooking time**. Maximum recipe level is 10.

### Global upgrades

| Upgrade | Unlocks | Max | Effect |
|---|---|---|---|
| 🪙 Tip jar | Level 2 | 10 | +2% tip chance per level (cap 28%) |
| 🪑 Bigger waiting area | Level 3 | 10 | +1 queue chair per level |
| 💨 Wing workout | Level 4 | 5 | −5% walking time per level |
| ⏱️ Kitchen drills | Level 8 | 5 | −4% cooking time per level |
| ✨ Golden recipe | Level 9 | 1 | Every dish is worth double |

Global upgrade prices scale with the restaurant (`6×` per location).

### Cosmetics (diamonds)

| Cosmetic | Cost |
|---|---|
| 🎀 Little bow | 6 💎 |
| 🕶️ Cool shades | 10 💎 |
| 🎩 Tiny top hat | 20 💎 |
| 👑 Royal crown | 30 💎 |

One bee accessory can be equipped at a time. Cosmetics do not affect income or speed.

---

## 🛠 Admin panel

Open **Admin Panel** from the main menu (admins only), or go to `admin.php`.

Admins can:

- search and paginate accounts;
- create players or admins;
- edit username, email, and role;
- reset a password;
- reset a player's saved progress;
- delete an account and all of its progress;
- review the audit log.

Safety rules:

- You cannot delete your own account.
- You cannot demote or delete the last admin.
- Every action uses a POST form with a CSRF token.
- The database deletes progress and account rows explicitly, so behavior is the same on MySQL and PostgreSQL.

Full details: **[docs/ADMIN.md](docs/ADMIN.md)**.

---

## 💾 Save data

Saves are stored per account and mirrored to `localStorage` as an offline backup. Format **v3**:

```json
{
  "version": 3,
  "level": 6,
  "honey": 1234,
  "diamonds": 7,
  "location": 1,
  "staff": 3,
  "stations": [{ "unlocked": true, "recipe": 4 }],
  "upgrades": {
    "tipChance": 2,
    "queue": 1,
    "walkSpeed": 1,
    "cookSpeed": 0,
    "profitX2": 0
  },
  "missions": { "index": 15, "done": [], "finished": false },
  "stats": { "served": 42, "earned": 9000, "tips": 9, "tipHoney": 77 },
  "cosmetics": { "owned": [], "equipped": { "bee": "", "theme": "" } }
}
```

Old saves:

- **v1** (location + stations) moves to the matching level and keeps honey, recipes, and staff.
- **v2** per-station staff is summed into the global team; per-station `workLvl`/`profitX2` become the global `cookSpeed`/`profitX2` upgrades.
- Staff is clamped to the number of open worker slots, so an old over-hired save cannot break the UI.

The server is authoritative: `SaveRepository` re-clamps currencies, levels, station order, recipes, staff, missions, stats, and cosmetics on every save.

---

## 🧪 Tests

```bash
npm test          # JavaScript + PHP, no database required
npm run test:pg   # optional live PostgreSQL round-trip
```

Expected:

```text
50 JavaScript tests passing
PHP SaveRepository checks passing
PHP AdminRepository checks passing (in-memory SQLite)
```

See **[docs/TESTING.md](docs/TESTING.md)** for the manual browser checklist.

---

## 🔐 Secrets and rotation

These files must stay local and ignored:

- `gamefile/db.php`
- `gamefile/src/google-config.php`

If a database password or Google client secret was ever committed or shared, **rotate it** in Supabase/Google Cloud. Deleting the file from git history does not invalidate a leaked secret.

The project intentionally does **not** ship real credentials. `db.example.php`, `db.postgres.example.php`, and `google-config.example.php` contain placeholders only.

---

## 🧭 Troubleshooting

| Symptom | Fix |
|---|---|
| “Database connection failed” | Check `gamefile/db.php`, start MySQL, and import the schema. |
| Admin panel says the schema is missing | Run `login_db.sql`/`login_db_pg.sql` or `upgrade_db.sql`. |
| Google says `redirect_uri_mismatch` | Register the exact URI, or set `redirect_uri` in `google-config.php`. |
| Google says the email is not verified | Use a Google account with a verified email address. |
| Upgrades modal does not open | Confirm `vendor/bootstrap` and `vendor/jquery` exist; the game loads them from `Mainmenu.php`. |
| Old save does not appear | The server may have rejected a malformed payload; check the PHP log and the browser console. |

---

## 📄 License / attribution

Built by the JolliDew group. Inspiration: **NEPTUNE (TREEPLLA)** — *Cat Snack Bar*.
