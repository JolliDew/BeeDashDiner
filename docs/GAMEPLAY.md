# JolliDew gameplay design

This document explains how the gameplay-expansion branch works: progression, workers, economy, missions, upgrades, cosmetics, and saves. It is the reference for tuning and code review.

---

## 1. Goals

The expansion had to add a full progression loop without changing the core fantasy: a bee café where the player builds a menu and hires automatic workers.

Design rules:

- **Workers are automatic.** The player only decides *hire a bee* or *upgrade a recipe*. There is no drag-and-drop or worker assignment.
- **Ten levels, three restaurants.** The existing three locations are stretched into 10 tiers instead of adding 10 new locations.
- **Missions gate levels.** Every level has three missions. The advance button is locked until all three are complete.
- **Already-finished objectives auto-complete.** Missions are checked in order, so an out-of-order upgrade or an early earnings target never traps the player.
- **Old saves keep progress.** Honey, staff, and recipe levels migrate into the new format.
- **Diamonds need a use.** Cosmetics provide a diamond sink and a visible late-game reward.

---

## 2. Progression map

| Level | Restaurant | Stations | Level reward |
|---|---|---|---|
| 1 | Meadow Stand | 3 | 150 honey + 1 💎 |
| 2 | Meadow Stand | 3 | 250 honey + 1 💎 |
| 3 | Meadow Stand | 3 | 400 honey + 1 💎 |
| 4 | Meadow Stand | 3 | 750 honey + 2 💎 |
| 5 | Hive Café | 4 | 1,200 honey + 2 💎 |
| 6 | Hive Café | 4 | 2,000 honey + 2 💎 |
| 7 | Hive Café | 4 | 3,500 honey + 3 💎 |
| 8 | Royal Hive | 5 | 6,000 honey + 3 💎 |
| 9 | Royal Hive | 5 | 10,000 honey + 4 💎 |
| 10 | Royal Hive | 5 | 20,000 honey + 10 💎 |

Level rewards for levels 1–9 are paid when the player presses **Advance**. The level 10 reward is paid automatically when the final mission is completed (there is no level 11 to advance to).

Moving restaurants:

| Move | Cost | Extra requirement |
|---|---|---|
| Meadow Stand → Hive Café | 6,500 honey | Every Meadow station unlocked |
| Hive Café → Royal Hive | 48,000 honey | Every Hive station unlocked |

Honey, diamonds, cosmetics, and **global** upgrade levels carry over. The destination restaurant starts with fresh stations, recipes, and per-station upgrades.

---

## 3. Core loop

1. Customers arrive and fill the waiting area.
2. Each customer orders the menu item from one station.
3. An idle bee claims work:
   - its own station first, then
   - the longest-waiting customer anywhere.
4. The bee takes the order, walks to the station, cooks, and delivers.
5. The player earns the dish price, plus a random tip.
6. Honey is spent on workers, recipes, stations, and global upgrades.
7. Missions track lifetime stats and current station progress.
8. When all three missions of the level are complete, **Advance** becomes available.
9. Moving to a new restaurant resets stations but keeps permanent progress.

The game is idle-friendly: workers keep serving without input, and the page autosaves every 5 seconds.

---

## 4. Worker AI

Implemented in `gamefile/js/WorkerAI.js` and used by `Scene.findJob()`.

`pickJob(customers, homeSlot)`:

1. Keep only customers whose state is `wait` and who are not already claimed.
2. Prefer customers whose order belongs to the bee's home station.
3. If there are none, choose the customer with the highest `waitTime`.
4. Return `null` if there is no work.

A bee's `homeSlot` is fixed when it is hired. Its `slot` changes while it helps another station, so the correct dish and station are used. The scene adds a gold glow while `slot !== homeSlot`.

This is intentionally simple and testable. It keeps queues moving without player micromanagement.

---

## 5. Economy formulas

Balance values live in `gamefile/js/config.js` (`BALANCE`). Costs are multiplied by the restaurant's cost multiplier:

```text
costMult = 6 ^ location     // Meadow 1, Hive 6, Royal 36
priceMult = 5 ^ location    // Meadow 1, Hive 5, Royal 25
```

### Price

```text
price = basePrice[station]
      * 5^location
      * (1 + 0.30 * recipe)
      * 1.25  (if recipe >= 5)
      * 2     (if golden recipe is owned)
```

### Cooking time

```text
cookTime = baseCook[station]
         * 0.9^recipe
         * 0.85  (if recipe >= 10)
         * (1 - 0.04 * workLvl)
minimum 0.4 seconds
```

### Walking and throughput

```text
walkTime = max(0.8, 1.6 * (1 - 0.05 * walkSpeedLevel))
cycle    = 3 * walkTime + cookTime       // order, fetch, serve
perMin   = 60 * staff / cycle
```

`Economy.spawnInterval()` uses total station capacity to keep a queue visible without flooding the scene.

### Tips

```text
tipChance = min(0.25, 0.08 + 0.02 * tipChanceLevel)
tip       = dishPrice * random(0.10, 0.30)
```

Tips count toward `stats.tips`, `stats.tipHoney`, and `stats.earned`.

### Workers and seats

```text
workerCap = min(4, 3 + extraWorkerUpgrade)   // 3 normally, 4 after level 6 upgrade
seats     = 15 + 5 * location + 2 * queueLevel
```

### Cost formulas

```text
unlockCost   = baseUnlock[station] * 6^location
recipeCost   = round(baseRecipe[station] * 1.48^recipe * 6^location)
beeCost      = round(baseBee[station] * 2.4^(staff - 1) * 6^location)

globalCost   = round(baseCost * growth^level * 6^location)
stationCost  = round(baseCost * growth^level * 6^location * (1 + 0.35 * stationIndex))
```

Recipe growth was reduced from **1.55** to **1.48** because recipes now reach level 10. The extra worker upgrade was reduced to a **1,200** base cost so the level-6 "4 workers" mission is reasonable in the Hive Café.

---

## 6. Upgrades

### Global upgrades

Stored in `state.upgrades` and shared by the whole restaurant. They are **not** reset when changing location.

| ID | Name | Unlock | Max | Base cost | Growth | Effect |
|---|---|---|---|---|---|---|
| `tipChance` | Tip jar | Level 2 | 10 | 150 | ×1.6 | +2% tip chance per level |
| `queue` | Bigger waiting area | Level 3 | 5 | 250 | ×1.9 | +2 seats per level |
| `walkSpeed` | Wing workout | Level 4 | 5 | 400 | ×1.9 | −5% walking time per level |
| `workerSlot` | Extra worker | Level 6 | 1 | 1,200 | — | 4th worker at every station |

Global costs are multiplied by `6^location`, so the same level costs more in the Hive Café and Royal Hive.

### Per-station upgrades

Stored on each station as `workLvl` or `profitX2`. They reset when the restaurant changes.

| ID | Name | Unlock | Max | Base cost | Growth | Effect |
|---|---|---|---|---|---|---|
| `cookSpeed` | Kitchen drills | Level 8 | 5 | 8,000 | ×2 | −4% cook time per level |
| `profitX2` | Golden recipe | Level 9 | 1 | 60,000 | — | Double that station's profit |

Station costs additionally scale with the station slot (`1 + 0.35 * index`), so the later menu items cost more to upgrade.

### Recipe milestones

| Recipe level | Effect |
|---|---|
| 5 | +25% profit at that station |
| 10 | −15% cook time at that station |

Recipe upgrades themselves also give +30% price and −10% cook time per level. The cap is 10.

---

## 7. Missions

Missions live in `gamefile/js/missions.js`. Each level has exactly three, in order. `MissionTracker` gates level advancement and completes already-satisfied missions.

### Full mission list

| Lv | Mission | Target | Reward |
|---:|---|---:|---|
| 1 | Serve 5 customers | 5 | 100 honey |
| 1 | Have 2 workers at one station | 2 | 80 honey + 1 💎 |
| 1 | Upgrade any recipe to level 2 | 2 | 100 honey + 1 💎 |
| 2 | Unlock the 2nd station | 2 | 150 honey |
| 2 | Serve 20 customers in total | 20 | 1 💎 |
| 2 | Collect 3 tips | 3 | 1 💎 |
| 3 | Unlock the 3rd station | 3 | 250 honey |
| 3 | Reach recipe level 5 on a station | 5 | 2 💎 |
| 3 | Earn 2,000 honey in total | 2,000 | 1 💎 |
| 4 | Serve 30 customers in total | 30 | 300 honey |
| 4 | Have 3 workers at one station | 3 | 2 💎 |
| 4 | Earn 5,000 honey in total | 5,000 | 1 💎 |
| 5 | Serve 40 customers in total | 40 | 500 honey |
| 5 | Reach recipe level 5 on a station | 5 | 2 💎 |
| 5 | Collect 10 tips | 10 | 1 💎 |
| 6 | Unlock all 4 Hive Café stations | 4 | 700 honey |
| 6 | Have 4 workers at one station | 4 | 3 💎 |
| 6 | Earn 20,000 honey in total | 20,000 | 2 💎 |
| 7 | Have 8 workers across the café | 8 | 1,000 honey |
| 7 | Master any recipe (level 10) | 10 | 3 💎 |
| 7 | Earn 50,000 honey in total | 50,000 | 2 💎 |
| 8 | Serve 70 customers in total | 70 | 1,500 honey |
| 8 | Collect 25 tips | 25 | 3 💎 |
| 8 | Buy 3 global upgrade levels | 3 | 2 💎 |
| 9 | Unlock all 5 Royal Hive stations | 5 | 2,500 honey |
| 9 | Master 2 different recipes | 2 | 3 💎 |
| 9 | Earn 250,000 honey in total | 250,000 | 3 💎 |
| 10 | Serve 100 customers in total | 100 | 4,000 honey |
| 10 | Master 3 different recipes | 3 | 4 💎 |
| 10 | Earn 500,000 honey in total | 500,000 | 5 💎 |

Mission diamonds total **43**. Level rewards add **29**, for **72 💎** available in a complete run. All four cosmetics cost **66 💎**, leaving a small surplus.

### Auto-completion rules

The tracker walks the ordered list from `state.missions.index`:

- If the current mission belongs to an **older** level, skip it without paying again.
- If it belongs to a **future** level, stop; the player must advance first.
- If it is satisfied, mark it done, pay its reward, advance the index, and loop.
- When the index reaches the end, mark `missions.finished` and pay the level 10 reward once.

This handles the group's requested case: if station 2 was upgraded before station 1, the later mission still completes as soon as it is checked. It also handles cumulative targets (tips, earnings, workers) that were met before the mission appeared.

`Game.changed()` calls the tracker after every purchase, load, dev action, and level change. The game loop also checks twice per second, so passive progress (served, earned, tips) completes missions without a click.

### Mission ordering and gating

- `MissionTracker.levelComplete()` checks only the current level's three missions.
- The **Advance** button is disabled until they are all done.
- The next level's missions are not consumed early.
- Moving restaurants requires every station in the current restaurant to be unlocked in addition to the honey cost.

---

## 8. Cosmetics

`gamefile/js/cosmetics.js` defines the shop. Cosmetics are stored in `state.cosmetics`:

```js
{
  owned: ['bee_bow'],
  equipped: { bee: 'bee_bow', theme: '' }
}
```

The `theme` slot is reserved for future restaurant themes; no themes ship in this branch.

Behaviour:

- Buying a cosmetic costs diamonds and auto-equips it.
- Clicking an equipped item unequips it.
- Clicking an owned item equips it.
- An equipped item only renders if it is also in `owned`, so hand-edited saves cannot show unpaid cosmetics.
- Every bee wears the same equipped accessory.
- Cosmetics do not affect income, speed, or missions.

Accessories are emoji overlays for now; the asset slots in `config.js` still support replacing the underlying bee art.

---

## 9. Save format

The JavaScript save is version **2**:

```json
{
  "version": 2,
  "level": 6,
  "honey": 4321.5,
  "diamonds": 7,
  "location": 1,
  "stations": [
    { "unlocked": true, "staff": 2, "recipe": 4, "workLvl": 1, "profitX2": 0 },
    { "unlocked": true, "staff": 1, "recipe": 2, "workLvl": 0, "profitX2": 0 },
    { "unlocked": false, "staff": 0, "recipe": 0, "workLvl": 0, "profitX2": 0 },
    { "unlocked": false, "staff": 0, "recipe": 0, "workLvl": 0, "profitX2": 0 }
  ],
  "upgrades": { "tipChance": 3, "queue": 2, "walkSpeed": 1, "workerSlot": 1 },
  "missions": {
    "index": 15,
    "done": ["l1_serve5", "l1_hire2", "l1_recipe2"],
    "finished": false
  },
  "stats": { "served": 42, "earned": 9000, "tips": 9, "tipHoney": 77 },
  "cosmetics": { "owned": [], "equipped": { "bee": "", "theme": "" } }
}
```

Important:

- JavaScript `location` is **0-based** (0, 1, 2). SQL `location_no` is **1-based** (1, 2, 3).
- The server validates and clamps every value in `SaveRepository::clean()`.
- `infinite` is a dev-only property and is never serialized.
- The 5-second autosave and the Exit button push to the server. `localStorage` keeps an offline copy.

### v1 migration

Old saves have no `version`, `level`, missions, or upgrades. On load:

1. The frontend infers the level from the location (`Meadow 1`, `Hive 5`, `Royal 8`).
2. The server does the same if an old database row has no level.
3. All missions before the inferred level are marked done without paying retroactive rewards.
4. Honey, staff, and recipe levels are preserved and clamped to the new limits.
5. The SQL migration adds the new columns and sets `level` for existing rows.

This avoids losing progress while keeping mission state consistent.

---

## 10. Tuning guide

Where to change things:

| Want to change | File |
|---|---|
| Prices, cook times, costs, tips, seats, walking speed, starting honey | `gamefile/js/config.js` |
| Level rewards and level-to-location mapping | `gamefile/js/config.js` (`LEVELS`) |
| Mission text, targets, rewards, order | `gamefile/js/missions.js` |
| Global/per-station upgrade unlocks, costs, effects | `gamefile/js/upgrades.js` |
| Cosmetic prices and definitions | `gamefile/js/cosmetics.js` |
| Save validation/clamps | `gamefile/src/SaveRepository.php` |
| Database schema | `gamefile/login_db.sql`, `gamefile/upgrade_db.sql` |

After changing missions or balance, run:

```bash
npm test
```

Then do a fresh-account browser run and an old-save load. The full manual checklist is in `docs/TESTING.md`.

### Balance notes

- Recipe growth is **1.48** because level 10 is now reachable. Raising it toward 1.55 makes late-game mastery significantly slower.
- The fourth worker is intentionally locked behind a level-6 global upgrade; level 6's "4 workers" mission is the tutorial for that system.
- Royal Hive missions require mastering multiple recipes. That is the intended late-game honey sink. Use dev tools for quick demos.
- If playtesting feels slow, lower `recipeGrowth` or the Royal Hive `nextCost` rather than removing missions.
- Do not lower the worker cap below the mission targets without also changing `l4_staff3`, `l6_staff4`, and `l7_staff8`.

---

## 11. Deliberate limitations

- No manual worker assignment; that is the point of the automatic design.
- Restaurant themes are not implemented; only bee accessories ship.
- Art is still emoji-based, with optional asset slots in `config.js`.
- No server-side anti-cheat beyond validation and clamping. This is a class project, not a competitive game.
- The dev panel is enabled by default in `in-game.php`; set `$devMode = false` for a release-style demo.
