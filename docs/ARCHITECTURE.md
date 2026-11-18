# Architecture

A short map for reviewers. The game is a PHP page shell plus ES modules; there is
no build step.

---

## 1. Request flow

```text
index.php (public landing) ── Play/Create account ──► login.php / register.php
        │                                                │  session (Auth)
        │◄──────────────── Log out ─────────────────────┘
        ▼
Mainmenu.php ── Play Game ──► fetch in-game.php
        │                         │
        │                         └─ js/main.js ─► Game
        │                                            │
        │                                            ├─ SaveService ─► api.php
        │                                            │                  │
        │                                            │                  ├─ Auth::refresh()
        │                                            │                  ├─ SaveRepository
        │                                            │                  └─ player_progress / player_stations
        │                                            │
        │                                            └─ Scene, Economy, UpgradePanel, MissionTracker, DevTools
        │
        └─ Admin Panel ─► admin.php ─► AdminRepository ─► users / player_* / admin_audit
```

---

## 2. Front-end modules

| File | Responsibility |
|---|---|
| `js/main.js` | Boots `Game` after `Mainmenu.js` injects `in-game.php`. |
| `js/Game.js` | Game loop, hiring, unlocking, upgrades, advancing, autosave, HUD. |
| `js/GameState.js` | Save model v3, validation/migration, level/location rules. |
| `js/config.js` | Menu, balance, milestones, queue, locations (gameplay authority). |
| `js/Economy.js` | Prices, cook times, seats, slots, costs, capacity. |
| `js/upgrades.js` | Global upgrade definitions (including cook speed and Golden recipe). |
| `js/WorkerAI.js` | Home-station preference and global longest-wait job picker. |
| `js/Scene.js` | DOM scene, food stalls, entrance, queue chairs, spawning, delivery. |
| `js/entities.js` | Bee and Customer movement, claiming, cooking, tips, cosmetics. |
| `js/UpgradePanel.js` | Dock, mission/station/global/cosmetics modals, keyboard access. |
| `js/MissionTracker.js` | Ordered mission completion and one-time rewards. |
| `js/SaveService.js` | Serialized server save/load with a `localStorage` backup. |
| `js/Sound.js` | Procedural Web Audio SFX and ambient music; no sample files. |
| `js/DevTools.js` | Optional developer panel (`$devMode` in `in-game.php`). |
| `js/cosmetics.js` | Cosmetic definitions and equip rules. |
| `css/bee-game.css`, `css/bee-modals.css` | Flat-scoped game and modal styles. |

### Worker loop in one paragraph

`Scene.update()` spawns customers and updates each bee. An idle bee asks
`pickJob(customers, slots, home)`. `pickJob` counts claimed customers per station,
drops full/locked stations, prefers the bee's home, and otherwise returns the
longest-waiting customer. The bee walks to the customer, then the station, cooks,
delivers, records the sale/tip, and returns to idle at its home station.

---

## 3. Back-end modules

| File | Responsibility |
|---|---|
| `db.php` | Local PDO connection (ignored by git). |
| `api.php` | JSON load/save endpoint, attached to the logged-in account. |
| `src/ApiController.php` | Routes `?action=load` and `?action=save`. |
| `src/SaveRepository.php` | Validates/clamps saves, migrates v1/v2 shapes, reads/writes both drivers. |
| `src/Auth.php` | Session cookie settings, login/logout, role, `refresh()`. |
| `src/Csrf.php` | Per-session CSRF token for forms. |
| `src/AdminRepository.php` | User CRUD, pagination, progress reset, deletion, audit. |
| `google-login.php` | OAuth 2.0 code flow with state + verified email. |
| `admin.php` | Admin UI and POST actions. |
| `profile.php` | Account summary, avatar upload, password change. |
| `help.php` | Rules, controls, win condition and restart guidance. |
| `denied.php` | 403 access-denied page for blocked roles. |
| `restart.php` | CSRF-protected deletion of only the current player's save. |
| `includes/nav.php` | Shared role-aware navigation for every page. |
| `css/site-nav.css`, `css/pages.css` | Shared navigation and page styles. |
| `db.container.php` | Environment-driven PDO connection copied to `db.php` in Docker. |
| `bin/make-admin.php` | CLI-only first-admin promotion. |

---

## 4. Data model

```text
users
  id, username, email, password, role, avatar,
  auth_provider (local|google), password_set (0/1), created_at

player_progress
  user_id (PK/FK), honey, location_no, level, diamonds,
  upgrades (JSON), mission_index, missions_done (JSON),
  missions_finished, stats (JSON), cosmetics (JSON), updated_at

player_stations
  user_id, slot (PK), unlocked, recipe_lvl,
  staff, work_lvl, profit_x2   ← legacy, written as 0 by save v3

admin_audit
  id, actor_id, actor_username, action,
  target_user_id, target_username, details, created_at
```

`upgrades` is JSON text, so no new columns are needed for new global upgrades.
It also carries `staff`, the global hive team size.

---

## 5. Server authority

`SaveRepository::clean()` is the source of truth for a save:

- location must match an existing restaurant;
- level must match the location (repairs mismatches);
- station count must be exact;
- stations open in order, and locked stations lose recipes;
- recipes, currencies, stats, mission ids, cosmetics, and global levels are clamped;
- staff is clamped to the sum of open slots;
- mission `done` is capped to the mission index.

This protects against crafted localStorage, a stale client, and old saves.

---

## 6. Authentication and roles

- Passwords use `password_hash()`/`password_verify()`; login rehashes when PHP's
  default algorithm changes.
- Sessions use `HttpOnly`, `SameSite=Lax`, and `Secure` when HTTPS is detected.
- `Auth::refresh($pdo)` re-reads the account on every game/API/admin request.
  This makes deletion and role changes effective immediately.
- `role` is `player` or `admin`; only `admin.php` checks for `admin`.
- Google login requires a verified email (`email_verified`/`verified_email`) and
  uses an OAuth `state` value checked with `hash_equals`.
- All login/register/admin forms carry a CSRF token.

---

## 7. Security boundaries

- Hiding the Admin Panel link is UX only. The real check is `Auth::refresh()` +
  `role === 'admin'` in `admin.php`.
- `gamefile/src/.htaccess` denies direct Apache access to PHP helpers and
  credentials.
- No real database or Google credentials are committed. `db.php` and
  `google-config.php` are ignored.
- The server never trusts client-side clamping or the `infinite` dev flag
  (`infinite` is not serialized).

---

## 8. Extending the game

To add a menu item or location:

1. Add it to `gamefile/js/config.js` (`ITEMS`, `LEVELS`, `BALANCE`).
2. Update the per-location station count in `SaveRepository::STATIONS_PER_LOCATION`.
3. Update `LEVELS_PER_LOCATION` if the level-to-restaurant mapping changes.
4. Update `locations`/`menu_items` seed data in both SQL files.
5. Add tests. The server rejects a station count that does not match.

To add a global upgrade:

1. Add it to `GLOBAL_UPGRADES` with an id, max level, cost, and effect text.
2. Add the id/max to `SaveRepository::GLOBAL_MAX`.
3. Use `state.upgrades[id]` in `Economy`.
4. Add a test and update `docs/GAMEPLAY.md`.

To add an admin action:

1. Put database logic in `AdminRepository` (portable SQL).
2. Add a POST branch in `admin.php` with CSRF + `audit()`.
3. Add a repository test in `tests/AdminRepository.test.php`.
