# Testing checklist

There are two layers: dependency-free automated tests and a manual browser/API
checklist.

---

## 1. Automated tests

### Requirements

- Node.js **20 or newer**
- PHP **8.0 or newer**
- No Composer, npm packages, or database are required for `npm test`
- Optional: `pdo_pgsql` + a configured `gamefile/db.php` for the live PostgreSQL test

From the repository root:

```bash
npm test
```

This runs:

```text
npm run test:js     -> node --test tests/*.test.js
npm run test:php    -> php tests/SaveRepository.test.php
                       php tests/AdminRepository.test.php
```

Expected:

```text
45 JavaScript tests passing
PHP SaveRepository checks passing
PHP AdminRepository checks passing (in-memory SQLite)
```

The PHP admin test creates its own SQLite schema, so it never touches the real
database.

If PHP is not on your PATH under XAMPP:

```bash
/Applications/XAMPP/xamppfiles/bin/php tests/SaveRepository.test.php
/Applications/XAMPP/xamppfiles/bin/php tests/AdminRepository.test.php
```

### Optional live PostgreSQL round-trip

```bash
npm run test:pg
```

It uses `gamefile/db.php` and skips when the configured driver is not PostgreSQL.
Do not point it at a database you cannot write to.

---

## 2. JavaScript coverage

| File | What it protects |
|---|---|
| `gamestate.test.js` | v3 shape, v1/v2 migration, station chains, mission rebuild, global-upgrade persistence, staff clamping |
| `workerai.test.js` | home preference, global help, claimed/leaving customers, slot limits, stable ties |
| `economy.test.js` | prices, milestones, cook times, tip cap, seats, walk floor, staff cap, costs |
| `missions.test.js` | 30 ordered missions, unique ids, safe progress reads |
| `missiontracker.test.js` | one-time rewards, level gating, out-of-order completion, final reward |
| `cosmetics.test.js` | ids/prices, equip rules, diamond spending |

## 3. PHP coverage

| File | What it protects |
|---|---|
| `SaveRepository.test.php` | v3 save cleaning, legacy migration, unlock chain, staff/slot clamp, malformed payload rejection |
| `AdminRepository.test.php` | create/update/search/paginate/password/progress reset/delete, last-admin and self-delete guards, audit snapshots |

---

## 4. Manual browser checklist

Use a throwaway account and a throwaway database when possible.

### Setup

- [ ] Import `login_db.sql` (MySQL) or `login_db_pg.sql` (PostgreSQL).
- [ ] Import it a **second** time to prove it is safe to re-run.
- [ ] Copy `db.php` from an example; confirm it is ignored by `git status`.
- [ ] Start Apache/XAMPP or `php -S 127.0.0.1:8000 -t gamefile`.
- [ ] Register a new account.

### Player flow

- [ ] Login with username and with email.
- [ ] Main menu shows the player name; no Admin Panel link for a player.
- [ ] Play Game loads the HUD, scene, mission card, and station buttons.
- [ ] Queue HUD starts at `🪑 x/4`; buying *Bigger waiting area* adds a chair.
- [ ] Station popup opens by mouse and by keyboard (`Tab` to a station, `Enter`).
- [ ] Station popup shows recipe pips, worker slots, price, cook time, milestone list, and next milestone.
- [ ] Station badges show `Lv`, `🐝 busy/slots`, and the green upgrade arrow when affordable.
- [ ] Hire bees from **Staff & global upgrades**; staff is shared by all stations.
- [ ] A bee at a non-home station gets the gold `.helping` glow.
- [ ] Tip jar level 10 shows **28%**, matching the simulation.
- [ ] Each recipe milestone at 2/6/10 adds a slot; 4/8 doubles profit.
- [ ] Buy a cosmetic, equip/unequip it, and see it on every bee.
- [ ] Complete level 1 missions; Advance unlocks only after all three.
- [ ] Move to Hive Café: stations and staff reset, global upgrades remain.
- [ ] Reload the page: honey, level, staff, upgrades, cosmetics, and missions persist.
- [ ] Exit to menu and re-enter; the server save is loaded.

### Admin flow

- [ ] Run `php gamefile/bin/make-admin.php <username>`.
- [ ] Reload the main menu; **Admin Panel** appears.
- [ ] Open `admin.php`; stats, accounts, and audit sections render.
- [ ] Create a player and an admin.
- [ ] Search by username and by email; pagination works.
- [ ] Edit username/email/role; changes appear in the table.
- [ ] Reset a password; log in with the new password.
- [ ] Reset progress; the target starts a new game on next load.
- [ ] Delete a player; their progress rows are gone.
- [ ] Try to delete yourself: blocked with a message.
- [ ] Try to demote/delete the last admin: blocked with a message.
- [ ] Check the audit log records create/update/password/reset/delete.
- [ ] Open `admin.php` as a player: 403.
- [ ] Log in as a deleted user in an old tab: next API call returns 401 and the menu redirects.

### Google login (optional)

- [ ] Add the exact redirect URI in Google Cloud Console.
- [ ] `google-config.php` has real values and is ignored.
- [ ] Google login creates an account on first use and reuses it on the second.
- [ ] An unverified Google email is rejected.
- [ ] Bad/missing `state` is rejected.
- [ ] The redirected username is unique.

### Security checks

- [ ] `git status` does not show `gamefile/db.php` or `gamefile/src/google-config.php`.
- [ ] `git grep` finds no real Supabase password or Google secret.
- [ ] Logged-out `api.php?action=load` returns 401 JSON.
- [ ] A malformed save returns 400.
- [ ] POSTing an admin form without a CSRF token is rejected.
- [ ] Session cookie is `HttpOnly` and `SameSite=Lax` (check DevTools).

### Responsive/accessibility

- [ ] 440×900 browser: HUD wraps, panel scrolls, modals fit.
- [ ] Keyboard: station buttons have a visible focus ring; modal close buttons work.
- [ ] `prefers-reduced-motion` disables the rise/toast animations.
- [ ] No JavaScript errors in the console during a 2-minute idle run.

---

## 5. Regression commands

```bash
# PHP syntax
find gamefile tests -name '*.php' -print0 | xargs -0 -n1 php -l

# JavaScript syntax (Node)
for f in gamefile/js/*.js; do node --check "$f"; done

# Whitespace / conflict markers
git diff --check
git grep -nE '<<<<<<<|=======|>>>>>>>' || true
```

---

## 6. Last verified

On **2026-11-17**, the branch was checked with:

- PHP 8.5.0 and Node.js 24.21.0;
- an isolated **MariaDB 10.4.28** instance (XAMPP binaries, temporary data dir);
- **Chrome headless** at 440×900.

Results:

- `npm test`: 45 JavaScript tests and both PHP suites pass;
- `login_db.sql` imports cleanly twice;
- `upgrade_db.sql` applies to the live `origin/main` schema and is re-runnable;
- register → login → CLI promotion → admin create/edit/password/reset/delete,
  CSRF rejection, player 403, last-admin guards, audit rows, API save round-trip;
- main menu → game → station modal (mouse and keyboard) → global/cosmetics
  modals → autosave → exit, with no JavaScript exceptions or failed requests;
- an unmigrated database still plays the game, while `admin.php` shows the
  migration message instead of a misleading 403.

The live Supabase database was **not** modified. Run the migration there before
deploying.

## 7. Known test limitations

- `npm test` does not start a browser; the manual checklist covers rendering.
- The admin repository test uses SQLite for speed. The SQL is portable, but the
  live PostgreSQL/MySQL paths should still be checked before a release.
- Google OAuth needs real credentials and a registered redirect URI; it cannot
  be exercised by the dependency-free suite.
