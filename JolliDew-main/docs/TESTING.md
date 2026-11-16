# Testing checklist

Two layers of testing ship with this branch: dependency-free automated tests and a manual browser/API checklist.

---

## 1. Automated tests

### Requirements

- Node.js **20 or newer**
- PHP **8.0 or newer** (only for the save-validator checks)
- No Composer, npm packages, or database are required for `npm test`
- The optional live PostgreSQL test needs a configured `gamefile/db.php` and `pdo_pgsql`

From the repository root:

```bash
npm test
```

This runs:

```text
npm run test:js     -> node --test tests/*.test.js
npm run test:php    -> php tests/SaveRepository.test.php
```

Expected result:

```text
37 JavaScript tests passing
PHP SaveRepository checks passing
```

If PHP is not on your PATH under XAMPP:

```bash
/Applications/XAMPP/xamppfiles/bin/php tests/SaveRepository.test.php
```

### Live PostgreSQL check (optional)

```bash
npm run test:pg
```

`tests/SaveRepositoryPg.test.php` creates a temporary account, saves twice (exercising `INSERT ... ON CONFLICT DO UPDATE`), verifies every field round-trips, and deletes its rows even if a check fails. It prints `skip` and exits successfully when `gamefile/db.php` is missing or points at MySQL, so it never breaks a XAMPP-only checkout.

Expected result against Supabase:

```text
13 live PostgreSQL SaveRepository checks passing
```

### What the JavaScript tests cover

| File | Coverage |
|---|---|
| `tests/economy.test.js` | prices, recipe milestones, cook time, tips, worker cap, seats, walking speed, upgrade cost growth |
| `tests/gamestate.test.js` | fresh state, v2 round-trip, v1 migration, invalid data, level/location repair, clamping, mission repair, level transitions, serialization |
| `tests/workerai.test.js` | home-station priority, longest wait, claimed/departing/walking customers, stable selection |
| `tests/missions.test.js` | exactly 3 missions × 10 levels, unique IDs, ordering, safe progress functions |
| `tests/missiontracker.test.js` | cascade completion, next-level gating, out-of-order upgrades, final reward once, clamped progress, old index repair |
| `tests/cosmetics.test.js` | unique definitions, ownership-gated rendering, buy/unequip/re-equip, insufficient diamonds |

### What the PHP checks cover

`tests/SaveRepository.test.php` calls `SaveRepository::clean()` directly:

- complete v2 payload acceptance
- old location-only payload defaults
- level/location repair
- clamping of honey, diamonds, upgrades, stations, mission IDs, and cosmetics
- forced first station with at least one worker
- malformed payload rejection

### What the PostgreSQL check covers

`tests/SaveRepositoryPg.test.php` runs against a real PostgreSQL/Supabase connection:

- temporary account creation and `lastInsertId()`;
- v2 payload acceptance and first save (`INSERT`);
- level, location, currency, station, upgrade, mission, and cosmetic round-trips;
- second save updating the same row (`ON CONFLICT DO UPDATE`);
- late-game fields (`recipe_lvl = 10`, `work_lvl`, `profit_x2`, `missions_finished`);
- cleanup of the temporary user, progress row, and station rows.

### Syntax checks

PHP:

```bash
find gamefile -name '*.php' -print0 | xargs -0 -n1 php -l
```

JavaScript modules are imported by the tests. A quick import smoke test is:

```bash
node -e "import('./gamefile/js/Game.js').then(() => console.log('modules load'))"
```

`Game` imports the UI modules, but no DOM is touched until a `Game` instance is created.

---

## 2. Manual browser checklist

### Setup

1. Start the web server: Apache/XAMPP, or `php -S 127.0.0.1:8000 -t gamefile`.
2. Choose one database:
   - **MySQL/MariaDB:** start MySQL in XAMPP, copy `gamefile/db.example.php` to `gamefile/db.php`, and import `gamefile/login_db.sql`.
   - **PostgreSQL/Supabase:** copy `gamefile/db.postgres.example.php` to `gamefile/db.php`, fill in the pooler credentials, and run `gamefile/login_db_pg.sql` once in the Supabase SQL Editor.
3. Open `gamefile/login.php` or `http://127.0.0.1:8000/login.php`.
4. Register a fresh test account.
5. Keep the dev panel enabled (`$devMode = true`) for faster testing.
6. If you test against the shared Supabase database, use a throwaway account and delete it plus its `player_progress`/`player_stations` rows when you finish. Never modify the two existing production accounts.

### A. New game

- [ ] Login succeeds and **Play Game** opens the café.
- [ ] HUD shows `Level 1/10 · Meadow Stand`, 🍯 50, 💎 0.
- [ ] Mission card shows **Serve 5 customers**, progress `0/5`.
- [ ] **Advance** is disabled and says “Complete all Level 1 missions”.
- [ ] The first station has one bee and customers begin arriving.
- [ ] A served customer adds honey and the mission counter increases.

### B. Hiring, recipes, stations

- [ ] **Hire bee** increases staff and the bee count in the scene.
- [ ] The 4th hire is blocked until the level-6 Extra worker upgrade.
- [ ] **Recipe** increases price and reduces cook time in the description.
- [ ] Reaching recipe 5 shows the +25% profit milestone toast and card text.
- [ ] Reaching recipe 10 shows the −15% cook-time milestone toast and card text.
- [ ] Unlocking station 2 works; station 3 requires station 2 first.

### C. Tips

- [ ] Deliveries occasionally show a `🪙 +N` pop.
- [ ] Tip chance is 8% at level 0 and increases with the Tip jar upgrade.
- [ ] The level-2 “Collect 3 tips” mission progresses from tips only.
- [ ] Tip honey counts toward earned-honey missions.

### D. Automatic cross-station help

- [ ] Open two stations and hire bees at both.
- [ ] When one station has no waiting customer, its bee walks to the other station’s queue.
- [ ] A helping bee has a gold glow (`.helping`).
- [ ] The customer is never served by two bees at once.

### E. Mission gating and auto-completion

- [ ] Finishing all three current missions enables **Advance**.
- [ ] Pressing **Advance** pays the level reward and moves to the next level.
- [ ] If a level’s missions are already satisfied when it starts, they complete immediately in a cascade.
- [ ] Pre-satisfied lifetime targets (served, earned, tips) auto-complete.
- [ ] **Out-of-order station check:** use dev tools/money to make station 2 recipe 10 before station 1. When the matching mastery mission becomes current, it completes without asking the player to redo it.
- [ ] Missions for the next level stay locked until **Advance** is pressed.

### F. Level transitions

- [ ] Level 4 → 5 moves to Hive Café only after all Meadow stations are open and 6,500 honey is paid.
- [ ] Level 5 starts with a fresh 4-station Hive Café; honey, diamonds, cosmetics, and global upgrades remain.
- [ ] Level 7 → 8 moves to Royal Hive after all Hive stations are open and 48,000 honey is paid.
- [ ] Royal Hive has 5 stations.
- [ ] Per-station upgrades reset on a move; global upgrades do not.
- [ ] Completing the level-10 missions sets `missions.finished` and pays the final reward once.

### G. Diamonds and cosmetics

- [ ] Mission/level rewards increase the 💎 counter.
- [ ] The Cosmetics section is below Global upgrades.
- [ ] A cosmetic cannot be bought without enough diamonds.
- [ ] Buying deducts diamonds and auto-equips the item.
- [ ] Every bee shows the accessory.
- [ ] Clicking the equipped item unequips it; clicking an owned item re-equips it.
- [ ] The cosmetic survives a restaurant move, Exit/Play, and a page reload.

### H. Save and load

- [ ] The HUD save status shows `Loaded`, `Saved`, or `Offline copy`.
- [ ] Wait 5 seconds or press **Exit**, then re-enter; level, honey, diamonds, staff, recipes, missions, and cosmetics are restored.
- [ ] Refreshing the browser restores the same state.
- [ ] Logging out and back in restores the same state.
- [ ] A different account gets its own fresh save.

### I. Old-save migration

Test on a copy of a pre-branch database, not your only copy:

- [ ] Import the old schema and create a row with `location_no = 2` (Hive) or `3` (Royal).
- [ ] Run `gamefile/upgrade_db.sql` once.
- [ ] Confirm the old row now has `level = 5` or `8`.
- [ ] Re-run the migration on MariaDB; it should not error.
- [ ] Load that account in the game; honey/staff/recipe progress is preserved and earlier missions are marked done without duplicate rewards.

PostgreSQL/Supabase:

- [ ] Re-run `gamefile/login_db_pg.sql`; it should not error and seed rows should keep their values.
- [ ] On an existing row, the script adds any missing columns without touching stored progress.
- [ ] `npm run test:pg` passes and leaves no temporary rows behind.

### J. Responsive/layout

- [ ] At roughly 440 px wide, the HUD wraps without covering the level/location.
- [ ] The mission card and **Advance** button are visible near the top of the panel.
- [ ] Stations, global upgrades, and cosmetics scroll cleanly.
- [ ] The cosmetics shop does not float over the HUD (a CSS class collision we fixed during testing).

---

## 3. API smoke test (optional)

The game uses:

```text
GET  api.php?action=load
POST api.php?action=save   (JSON body, requires login session)
```

To test by hand:

1. Log in through the browser.
2. Open DevTools → Network.
3. Watch the `load` and `save` calls while playing.
4. A logged-out request to `api.php?action=load` should return **401**.
5. A malformed save should return **400** with `{"error":"bad data"}`.

The server validates shape and clamps values; it is not intended as a competitive anti-cheat system.

---

## 4. What was tested for this branch

- **37** Node.js tests passing.
- PHP `SaveRepository` checks passing.
- PHP lint across every `gamefile/**/*.php`.
- Fresh MariaDB 10.4 import, including emoji menu rows.
- Fresh Supabase import: 5 tables created, 3 locations and 12 menu items seeded, re-import idempotent.
- Register → login → API save → API load round-trip on MariaDB and on Supabase.
- Old-schema migration and repeat migration (MariaDB).
- **13** live PostgreSQL checks passing with cleanup verified (`npm run test:pg`).
- Logged-out API returns 401; malformed save returns 400; Google login redirects to Google and rejects a bad state.
- Headless Chrome (440×900) run against Supabase:
  - login and render the saved level-6 Hive Café;
  - mission gate and dev completion;
  - advance to level 7 and Royal Hive;
  - buy/equip a bee cosmetic;
  - exit/re-enter and confirm the server restored level, diamonds, and cosmetic;
  - 28/28 checks, no JavaScript errors.
- Screenshot review caught and fixed the `.cos` CSS collision.

The automated suite does not require a database; the browser/API checks above do. Run the manual checklist after changing the schema, save format, or progression.
