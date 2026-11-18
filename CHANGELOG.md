# Changelog

All notable changes to JolliDew.

## [2.2.0] — scene-first UI

**Branch:** `feat/scene-first-ui`

The playfield is now the main screen, with the persistent UI reduced to a small
HUD and a three-button dock.

### Added

- **Guest lifecycle:** guests walk in through the bottom-left door, sit, order,
  celebrate when served, and walk back out. Chairs are reserved while a guest
  walks in and freed when a leaving guest reaches the aisle.
- **Mission modal:** the mission card moved off the playfield into a dedicated
  sheet/dialog. The dock shows a notification dot when a mission is complete.
- **Food stalls:** every station is a stall with a striped awning, serving
  window, wooden counter, sign, level/worker plaque and a shuttered locked
  state. Clicking one still opens its upgrade sheet.
- **Café entrance:** a lit door with a handle, threshold mat, floor glow and a
  hanging OPEN sign in the bottom-left corner.
- **Room furnishing:** tiled kitchen wall, jar shelf, pendant lamps, a MENU
  board, a soft rug and plants around the dining room.
- **Procedural audio:** Web Audio sounds for UI clicks, guests arriving and
  ordering, serving, coins and tips, station unlocks, upgrades, purchases,
  missions and level-ups, plus a slow ambient loop. The speaker panel has
  separate Sound effects / Music volume sliders, saved in `localStorage`.
- **Shared navigation:** one role-aware menu on every page (Game, How to play,
  Profile, Admin for admins, Log out).
- **Profile and media:** avatar upload with type, size and image checks; password
  change; saved level/honey summary.
- **Restart and win copy:** an explicit Level 10 win condition, a confirmation
  restart that deletes only the current player's save, and a completed-game
  banner.
- **Access-denied page:** a proper 403 page for players who open admin URLs.
- **Render deployment package:** Dockerfile, port-aware entrypoint, env-based
  database connection, `render.yaml` and a deployment guide.
- **Seat-layout tests** for full and short chair rows.

### Changed

- **Scene-first layout:** the scene fills about 86% of a phone screen and grows
  to a 1000px playfield on tablets/desktops.
- **Compact dock:** Mission, Upgrades and Shop replace the old inline upgrade
  rows. The dock is icon-first on phones and a slim icon-and-label row from
  760px up. Panels open as bottom sheets on phones and centered dialogs on
  desktop.
- **Grouped HUD:** honey, diamonds and seats share one segmented bar; Exit is a
  40px icon button with a tooltip and `aria-label`.
- **Dynamic chair rows:** four chairs fill the first row evenly; a short last
  row is centered instead of left-aligned.
- **Bee spacing:** bees get small vertical offsets so a full hive does not form
  one overlapping line.
- **Save feedback:** `Saving…` → `Saved`, then fades out after 2.2 seconds.
  Autosave runs every 10s only when the state changed, requests are serialized,
  page-hide sends a keepalive save, and a missing server save falls back to the
  local backup. A welcome-back toast confirms the resume.
- **Calm arrivals:** the opening customer burst was removed; the first guest is
  delayed and a minimum door gap keeps guests from piling onto one pixel.
- **Workers report in:** new bees start at the wall hive and fly to their home
  station instead of appearing already distributed.
- **Audio mixing:** compressor/limiter, shared reverb, perceptual SFX/music
  sliders, softer sine/triangle timbres, slow Cmaj7/Am7/Fmaj7/G6 ambience,
  music ducking and tab-hide suspension.
- **Fresh builds:** game HTML is fetched with `no-store`, PHP sends no-cache
  headers, and CSS URLs are versioned by file modification time.

### Fixed

- Reward toasts no longer inherit Bootstrap's `flex-basis: 350px` (which made a
  one-line toast 350px tall) and no longer fade out when the entrance animation
  ends.
- Toasts sit above the dock instead of covering it.
- The main-menu title no longer clips: gradient-clipped text is sized with
  `clamp()` and allowed to wrap.
- Menu, login and register pages scroll on short screens instead of clipping
  the buttons and fields.
- Bee offsets scale to the station width, so edge workers no longer start
  off-screen.
- Short landscape screens use compact stalls; normal phones keep station names.

### Verification

- 52 JavaScript tests and all PHP checks pass.
- XAMPP (Apache) at 390×844, 440×900 and 1440×900: scene 86.4%/85.7%/85.1%,
  dock fits, mission sheet on phones, centered desktop dialog, no JS errors.
- Reduced motion disables guest bobbing; a served guest reaches `happy`, then
  leaves and frees its chair.
- Temporary visual-test account and save rows were removed; the live database
  is back to 6 users, 1 admin and 5 saves.

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
