# Changelog

All notable changes to JolliDew.

## [2.1.0] — Emman redesign fixes + admin CRUD

**Branch:** `fix/emman-redesign-admin`

This branch promotes Emman's newer redesign into the repository root, fixes its
regressions, and adds the full account administration required by the project
brief.

### Added

- **Admin panel (`admin.php`)**
  - account search and pagination;
  - create player/admin accounts;
  - edit username, email, and role;
  - reset passwords;
  - reset a player's saved progress;
  - delete an account and all of its rows;
  - audit log with actor/target username snapshots;
  - self-delete and last-admin guards.
- **First-admin CLI:** `php gamefile/bin/make-admin.php <username>`.
- **Roles and audit schema:** `users.role`, `admin_audit`, indexes; both MySQL
  and PostgreSQL files updated. `upgrade_db.sql` performs the MySQL migration.
- **CSRF protection** for login, registration, and every admin POST.
- **Secure session cookies:** `HttpOnly`, `SameSite=Lax`, `Secure` on HTTPS.
- **`Auth::refresh()`**: deleted users and changed roles take effect immediately.
- **Queue HUD:** `🪑 waiting/seats`.
- **Station keyboard access:** stations are focusable and open with Enter/Space.
- **Next-milestone text** in the station popup.
- **Docs:** `docs/ADMIN.md`, `docs/ARCHITECTURE.md`, rewritten `docs/GAMEPLAY.md`,
  `docs/TESTING.md`, README, and this changelog.
- **Tests:** rewritten JavaScript suite (45 tests), SaveRepository v3 checks, and
  an in-memory SQLite AdminRepository suite.

### Changed

- **Save format v3.**
  - `stations` now store only `unlocked` + `recipe`.
  - `staff` is one global number stored in the `upgrades` JSON.
  - `cookSpeed` and `profitX2` are global upgrades.
  - Old v1/v2 saves migrate automatically; per-station staff is summed and
    late-game per-station upgrades become global.
- **Global upgrades survive restaurant moves.** Stations and staff reset.
- **Tip jar cap is 28%.** The UI and `Economy.tipChance` read the same constants.
- **Queue:** starts at 4 chairs, +1 per *Bigger waiting area* level (max 10 levels).
- **Worker AI:** home-station preference, then longest-waiting customer anywhere.
- **CSS is flattened** (no native nesting) for wider browser support and reliable
  XAMPP demos.
- **Save validation:** stations must open in order; staff is clamped to open
  slots; missions `done` is rebuilt from the index to prevent duplicate rewards.
- **Google OAuth:** requires a verified email, uses the configured/exact redirect
  URI when supplied, generates unique usernames safely, and stores the role in
  the session.

### Fixed

- Station popup could point at a station index that no longer exists after a move.
- Staff could exceed the number of open worker slots in old saves.
- A locked station could keep a recipe or be unlocked out of order.
- Tip UI showed 28% while the simulation capped at 25%.
- Native CSS nesting could fail on older demo browsers.
- Google login no longer relies on any hardcoded client secret.
- Admin deletion works on databases without cascade foreign keys.
- Deleted users can no longer keep using an old session.

### Security

- Never commit `gamefile/db.php` or `gamefile/src/google-config.php`.
- **Rotate** the Supabase database password and Google client secret if they were
  ever committed. Removing them from the latest commit does not invalidate them.
- The admin page checks the role from the database on every request; the hidden
  menu link is not a security boundary.

### Verification

```text
45 JavaScript tests passing
PHP SaveRepository checks passing
PHP AdminRepository checks passing (in-memory SQLite)
PHP lint clean
```

Also verified on 2026-11-17:

- isolated MariaDB 10.4.28: schema imported twice, `upgrade_db.sql` applied to
  the live `origin/main` schema, register/login/admin CRUD/audit checks, and an
  API save round-trip;
- headless Chrome at 440×900: main menu → game → station modal (mouse and
  keyboard) → global/cosmetics modals → autosave → exit, with no JavaScript
  exceptions, console errors, or failed requests.

Manual checks are listed in `docs/TESTING.md`.

---

## [2.0.0] — initial gameplay expansion

Historical branch `feature/gameplay-expansion` (PR #1):

- 10 levels across three restaurants;
- missions, tips, diamonds, cosmetics;
- automatic workers;
- MySQL + PostgreSQL saves;
- initial tests and docs.

Its per-station worker/upgrade model was replaced by the global model in 2.1.0.
