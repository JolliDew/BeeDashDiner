# BeeDashDiner gameplay design

This is the reference for tuning and code review. The game is an idle bee café:
the player buys upgrades and the bees serve customers automatically.

---

## 1. Design rules

- **Workers are automatic.** The player only hires bees and upgrades stations/recipes.
- **Ten levels, three restaurants.** Meadow Stand (1–4), Hive Café (5–7), Royal Hive (8–10).
- **Missions gate levels.** Each level has three missions; the advance button unlocks only after all three.
- **Already-finished objectives auto-complete.** The tracker walks missions in order, so an out-of-order purchase never traps the player.
- **Global means restaurant-wide.** Global upgrades persist across restaurant moves; stations and staff reset so each restaurant is a fresh challenge.
- **Save v3 is compact.** Per-station worker counts and per-station late-game upgrades were replaced by one global staff count and global cook/profit upgrades.
- **The server re-validates saves.** Client-side clamps are convenience only; `SaveRepository` is authoritative.

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

Level rewards 1–9 are paid when the player presses **Advance**. The level 10 reward is paid automatically when the final mission completes.

Moving restaurants:

| Move | Cost | Extra requirement |
|---|---|---|
| Meadow → Hive (after level 4) | 6,500 honey | all Meadow stations unlocked |
| Hive → Royal (after level 7) | 48,000 honey | all Hive stations unlocked |

On a move:

- stations reset to the new restaurant's layout (first station unlocked);
- staff resets to **1 bee**;
- honey, diamonds, cosmetics, missions, stats, and **all global upgrades** carry over.

---

## 3. Economy formulas

All numbers live in `gamefile/js/config.js` and `gamefile/js/upgrades.js`.

### Dish price

```text
price(station, recipe) =
  basePrice[station]
  × 5 ^ location
  × (1 + 0.30 × recipe)
  × 2 ^ (profit milestones reached at recipe 4 and 8)
  × (Golden recipe bought ? 2 : 1)
```

### Cooking time

```text
cookTime = max(0.4s,
  baseCook[station]
  × 0.9 ^ recipe
  × (1 - 0.04 × cookSpeedLevel)
)
```

### Tips

```text
tipChance = min(0.28, 0.08 + 0.02 × tipJarLevel)
tipAmount = dishPrice × random(0.10 ... 0.30)
```

Tips count toward tip missions and total earnings.

### Walking and queue

```text
walkTime = max(0.8s, 1.6s × (1 - 0.05 × wingWorkoutLevel))
seats    = 4 + biggerWaitingAreaLevel
```

The HUD shows `🪑 waiting/seats`. Queue chairs are drawn under every waiting spot.

### Worker slots and staff cap

```text
slots(station) = 1 + number of slot milestones reached (2, 6, 10)
staffCap       = min(20, sum of slots on unlocked stations)
```

Hiring costs `40 × 1.5^(staff-1) × 6^location`. Staff is global; a bee can serve any station.

### Spawning

```text
capacity(station) = slots / (3 × walkTime + cookTime)
spawnInterval     = random(0.75 ... 1.25) / (1.3 × totalCapacity)
```

The first guest arrives 1.8 s after the game starts. Every later guest waits
`max(1.8 s, spawnInterval)`, so the doorway is never crowded and a busy
restaurant stays calm. When every chair is taken, the game retries after 0.6 s.

---

## 4. Recipe milestones

| Recipe level | Effect |
|---|---|
| 2 | +1 worker slot |
| 4 | 2× station profit |
| 6 | +1 worker slot |
| 8 | 2× station profit |
| 10 | +1 worker slot |

Recipe upgrades also add +30% price and −10% cooking time per level. The station popup shows the current level, worker slots, price, cook time, milestone list, and the **next milestone**.

---

## 5. Global upgrades

| Id | Name | Unlocks | Max | Effect |
|---|---|---|---|---|
| `tipChance` | Tip jar | 2 | 10 | +2% tip chance per level, cap 28% |
| `queue` | Bigger waiting area | 3 | 10 | +1 queue chair per level |
| `walkSpeed` | Wing workout | 4 | 5 | −5% walking time per level (33% faster walking at level 5) |
| `cookSpeed` | Kitchen drills | 8 | 5 | −4% cooking time per level (25% faster cooking at level 5) |
| `profitX2` | Golden recipe | 9 | 1 | every dish worth double |

Costs use `baseCost × growth^level × 6^location`. The shop text and the simulation both call the helpers in `gamefile/js/config.js` (`tipChanceAt`, `walkSpeedBonus`, `cookSpeedBonus`), so the number the player reads is the number the game applies.

---

## 6. Worker AI

`gamefile/js/WorkerAI.js` is intentionally small:

1. Count how many bees are already committed to each station (`claimedBy`).
2. Keep customers that are waiting, unclaimed, and below that station's slot count.
3. Prefer customers at the bee's **home station**.
4. If home is empty/full, choose the **longest-waiting** eligible customer anywhere.
5. Ties keep the first customer, which keeps movement stable.

Homes are assigned round-robin over the currently unlocked stations in `Scene.syncBees()`. A bee working away from home gets the `.helping` gold glow. Station badges show `🐝 busy/slots`, and the station modal shows the same count.

---

## 7. Missions

Three missions per level, checked strictly in order. A mission is paid once; `done` is rebuilt from the mission index when a save loads, so fake/duplicate ids cannot replay a reward.

| Level | Mission 1 | Mission 2 | Mission 3 |
|---|---|---|---|
| 1 | Serve 5 (100 🍯) | Recipe level 2 (100 🍯 + 1 💎) | 2 bees (80 🍯 + 1 💎) |
| 2 | Unlock station 2 (150 🍯) | Serve 20 (1 💎) | 3 tips (1 💎) |
| 3 | Unlock station 3 (250 🍯) | Recipe 5 (2 💎) | Earn 2,000 (1 💎) |
| 4 | Serve 30 (300 🍯) | 3 bees (2 💎) | Earn 5,000 (1 💎) |
| 5 | Serve 40 (500 🍯) | Recipe 5 (2 💎) | 10 tips (1 💎) |
| 6 | Unlock all 4 Hive stations (700 🍯) | 4 bees (3 💎) | Earn 20,000 (2 💎) |
| 7 | 8 bees (1,000 🍯) | Master any recipe (3 💎) | Earn 50,000 (2 💎) |
| 8 | Serve 70 (1,500 🍯) | 25 tips (3 💎) | Buy 3 global levels (2 💎) |
| 9 | Unlock all 5 Royal stations (2,500 🍯) | Master 2 recipes (3 💎) | Earn 250,000 (3 💎) |
| 10 | Serve 100 (4,000 🍯) | Master 3 recipes (4 💎) | Earn 500,000 (5 💎) |

“Earn” counts honey added by serving and tips (dev-panel honey is deliberately excluded). “Master” means recipe level 10.

---

## 8. Cosmetics

| Item | Kind | Cost | Effect |
|---|---|---|---|
| 🎀 Little bow | bee | 6 💎 | bow on every bee |
| 🕶️ Cool shades | bee | 10 💎 | shades on every bee |
| 🎩 Tiny top hat | bee | 20 💎 | top hat on every bee |
| 👑 Royal crown | bee | 30 💎 | crown on every bee |

Only one bee accessory is equipped at a time. Cosmetics are purely visual; they never change income or speed.

---

## 9. Save format v3

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
    "tipChance": 2, "queue": 1, "walkSpeed": 1, "cookSpeed": 0, "profitX2": 0
  },
  "missions": { "index": 15, "done": [], "finished": false },
  "stats": { "served": 42, "earned": 9000, "tips": 9, "tipHoney": 77 },
  "cosmetics": { "owned": [], "equipped": { "bee": "", "theme": "" } }
}
```

- `staff` is global and stored inside the existing `upgrades` JSON column on the server.
- `stations` contains only `unlocked` and `recipe`.
- The legacy `player_stations.staff`, `work_lvl`, and `profit_x2` columns are still read for migration but new saves write zeroes.
- The client clamps staff to open slots; the server clamps it again.
- The server rejects wrong station counts and repairs skipped station unlocks.

### Migration

| Old data | New location |
|---|---|
| v1 location-only save | matching starting level (Hive = 5, Royal = 8) |
| per-station staff | summed into global `staff` |
| per-station `workLvl` | max becomes global `cookSpeed` |
| per-station `profitX2` | max becomes global `profitX2` |
| old `workerSlot` upgrade | dropped (slots now come from recipe milestones) |

---

## 10. Tuning checklist

When changing balance:

1. Update `gamefile/js/config.js` first (it is the authority).
2. Keep `gamefile/src/SaveRepository.php` clamps in sync (recipe max, slot milestones, global max levels).
3. Update the docs tables above.
4. Run `npm test`.
5. If you change the schema, update `gamefile/login_db.sql`, `gamefile/login_db_pg.sql`, the repository root `database.sql` and `gamefile/upgrade_db.sql`.
