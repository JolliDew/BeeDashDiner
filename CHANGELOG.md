# Changelog

All notable changes to the JolliDew gameplay-expansion branch.

## [2.0.0] — gameplay expansion

**Branch:** `feature/gameplay-expansion`
**Scope:** 10-level progression, automatic workers, tips, missions, upgrades, diamonds, cosmetics, save migration, documentation, tests.

### Added

- **10-level progression** across the three existing restaurants:
  - levels 1–4: Meadow Stand
  - levels 5–7: Hive Café
  - levels 8–10: Royal Hive
- **Mission system** with three ordered missions per level and 30 total.
  - Missions gate the **Advance** button.
  - Already-satisfied missions auto-complete in order.
  - Out-of-order upgrades (for example, station 2 before station 1) are handled correctly.
  - Mission rewards include honey and diamonds.
- **Automatic cross-station workers.**
  - Workers always prefer their home station.
  - When home is empty, they help the longest-waiting customer anywhere.
  - “Helping” workers get a gold glow.
- **Tips.**
  - Base 8% chance, +2% per Tip jar level, capped at 25%.
  - Tip value is 10–30% of the dish price.
  - Tips and tip earnings are tracked for missions.
- **Recipe milestones and a higher recipe cap.**
  - Recipes now reach level 10.
  - Level 5 milestone: +25% station profit.
  - Level 10 milestone: −15% station cook time.
- **Global upgrades.**
  - Tip jar, bigger waiting area, faster walking, and a 4th worker slot.
  - Global upgrades persist across restaurant changes.
- **Per-station upgrades.**
  - Kitchen drills (faster cooking, unlocked at level 8).
  - Golden recipe (2× station profit, unlocked at level 9).
- **Diamonds and cosmetics.**
  - Four bee accessories: little bow, cool shades, tiny top hat, and royal crown.
  - Buy with diamonds, equip/unequip from the panel, and see the accessory on every bee.
  - Cosmetics are saved and survive restaurant changes/reloads.
- **Save format v2.**
  - New fields: level, diamonds, global upgrades, missions, stats, cosmetics, per-station work level, and profit multiplier.
  - Old location-only saves keep honey, staff, and recipe progress and migrate to the matching tier.
- **Database migration.**
  - `gamefile/upgrade_db.sql` upgrades an existing MySQL/MariaDB database.
  - `gamefile/login_db.sql` now creates the full v2 schema for fresh MySQL installs.
- **PostgreSQL/Supabase support.**
  - `gamefile/login_db_pg.sql` creates the full v2 schema, adds missing columns, and seeds reference data. Safe to re-run.
  - `gamefile/db.postgres.example.php` is the connection template for the Supabase pooler.
  - `SaveRepository` detects the driver and uses `ON CONFLICT` on PostgreSQL, `ON DUPLICATE KEY` on MySQL/MariaDB.
  - `register.php` checks duplicates with `fetch()` instead of `rowCount()` so it behaves the same on both drivers.
  - `npm run test:pg` runs a live PostgreSQL save/load round-trip and skips automatically on MySQL or a missing config.
- **Documentation.**
  - Rewritten `README.md` with setup, gameplay, migration, troubleshooting, and dev instructions.
  - `docs/GAMEPLAY.md` with formulas, full mission table, upgrade tables, and save format.
  - `docs/TESTING.md` with automated and manual QA coverage.
- **Automated tests.**
  - 37 Node.js tests for economy, saves, workers, missions, and cosmetics.
  - PHP save-validator checks with no database needed.
- **Local development setup improvements.**
  - `gamefile/db.example.php` template.
  - `gamefile/src/google-config.example.php` template.
  - `.gitignore` for local DB/credentials, OS files, and dependencies.
  - Google login falls back to a friendly “not configured” page.
  - `gamefile/src/.htaccess` blocks direct source access under Apache.

### Changed

- Recipe cap increased from 8 to **10**.
- Recipe cost growth reduced from 1.55 to **1.48** to keep level 10 reachable.
- Tip chance base increased from 5% to **8%**.
- Worker cap is now **3 by default**, with a level-6 global upgrade for a **4th** worker.
- Queue size, walking speed, cook speed, and station profit are now upgradeable.
- The game HUD shows the current level and restaurant plus a diamond counter.
- The mission card and **Advance** button are at the top of the panel so the level gate is visible.
- Moving restaurants resets that restaurant’s stations and per-station upgrades; honey, diamonds, cosmetics, and global upgrades carry over.
- The level 10 reward is paid automatically when the final mission is completed.
- Game screen HUD wraps on narrow/mobile widths.

### Fixed

- Fresh CLI imports of `login_db.sql` now set `utf8mb4`, so emoji menu data no longer fails under latin1 connections.
- Old saves no longer lose station progress when the level and location disagree; the location wins and the level is repaired.
- Unlocked stations are normalized to at least one worker on load.
- Bees removed by a reset/location change no longer leave stale sprites behind.
- The Google OAuth config is no longer committed; a placeholder template is used instead.
- A local `gamefile/db.php` is no longer required to be committed or shared.

### Database migration

#### MySQL/MariaDB

If your database existed before this branch:

```bash
mysql -u root -p jollidew_db < gamefile/upgrade_db.sql
```

Or import `gamefile/upgrade_db.sql` in phpMyAdmin. Fresh installs should import `gamefile/login_db.sql` instead.

The migration:

- adds `level`, `diamonds`, `upgrades`, mission fields, `stats`, and `cosmetics`;
- adds `work_lvl` and `profit_x2` to stations;
- sets old Hive/Royal saves to levels 5/8 so they do not replay earlier restaurants.

XAMPP’s MariaDB supports `ADD COLUMN IF NOT EXISTS`. On MySQL 8, remove `IF NOT EXISTS` and run the migration once, or add the columns manually. The script is safe to re-run on MariaDB.

#### PostgreSQL/Supabase

Run `gamefile/login_db_pg.sql` once in the Supabase SQL Editor (or with `psql -f`). It covers fresh installs and existing databases in one file:

- creates `player_progress`, `player_stations`, `locations`, and `menu_items` when missing;
- adds the v2 columns with `ADD COLUMN IF NOT EXISTS` for older installs;
- seeds the three locations and twelve menu items with `ON CONFLICT DO UPDATE`.

There is no separate PostgreSQL upgrade script, and the file is safe to re-run.

### Verification summary

Automated:

```text
37 JavaScript tests passing
PHP SaveRepository checks passing
13 live PostgreSQL SaveRepository checks passing (npm run test:pg)
```

Manual browser/API verification (MariaDB 10.4 and Supabase PostgreSQL):

- fresh schema import with emoji menu data on both engines, plus idempotent re-import;
- register → login → save → load API round-trip on both engines;
- v1-shaped row migration and re-running the MySQL migration script;
- PostgreSQL `ON CONFLICT` update path through a second save;
- login → play → load level 6 save;
- mission gating and dev “Missions ✓” completion;
- advance to level 7 and Royal Hive;
- buy/equip a cosmetic and see it on bees;
- exit and re-enter, confirming the server reloaded level, diamonds, and cosmetic;
- headless Chrome at 440×900 with no JavaScript errors (28/28 checks);
- logged-out API returns 401, malformed saves return 400, and Google login redirects or rejects bad state.

See `docs/TESTING.md` for the repeatable checklist.

### Notes

- The dev panel is enabled by default in `gamefile/in-game.php` (`$devMode = true`). Set it to `false` before a public/release build.
- `gamefile/db.php` and `gamefile/src/google-config.php` are intentionally ignored by git. Copy them from the provided examples (`db.example.php` for MySQL, `db.postgres.example.php` for PostgreSQL).
- Both database engines stay supported: PostgreSQL/Supabase for the group database, MySQL/MariaDB for XAMPP. Keep `login_db.sql` and `login_db_pg.sql` in sync when the schema changes.
- Restaurant themes are reserved in the save format but not implemented; only bee accessories ship.
- No npm runtime dependencies or build step are required.
