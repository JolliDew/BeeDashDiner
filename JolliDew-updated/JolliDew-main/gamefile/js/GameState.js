import { ITEMS, BALANCE as B, MAX_LEVEL, levelLocation, firstLevelForLocation, slotsAt } from './config.js';
import { MISSIONS, firstMissionIndex } from './missions.js';

const int = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.trunc(n))) : min;
};
const num = (v, min, max) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
};
const cleanString = (v, max = 40) =>
  typeof v === 'string' && /^[a-z0-9_-]+$/i.test(v) ? v.slice(0, max) : '';

export class Station {
  constructor(unlocked = false, recipe = 0) {
    this.unlocked = unlocked;
    this.recipe = recipe;
  }
  toJSON() {
    return { unlocked: this.unlocked, recipe: this.recipe };
  }
}

export class GameState {
  constructor() {
    this.version = 3;
    this.level = 1;
    this.honey = B.startHoney;
    this.diamonds = 0;
    this.location = 0;
    this.staff = B.startStaff;
    this.stations = GameState.freshStations(0);
    this.upgrades = GameState.freshUpgrades();
    this.missions = { index: 0, done: [], finished: false };
    this.stats = { served: 0, earned: 0, tips: 0, tipHoney: 0 };
    this.cosmetics = { owned: [], equipped: { bee: '', theme: '' } };
    this.infinite = false;
  }

  static freshUpgrades() {
    return { tipChance: 0, queue: 0, walkSpeed: 0, cookSpeed: 0, profitX2: 0 };
  }

  static freshStations(loc) {
    return ITEMS[loc].map((_, i) => new Station(i === 0, 0));
  }

  static isValid(d) {
    if (!d || !Number.isInteger(d.location) || !ITEMS[d.location]) return false;
    if (!Array.isArray(d.stations) || d.stations.length !== ITEMS[d.location].length) return false;
    if (d.version >= 2 && d.level !== undefined &&
      (!Number.isInteger(d.level) || d.level < 1 || d.level > MAX_LEVEL)) return false;
    return true;
  }

  static fromJSON(d) {
    const s = new GameState();
    if (!GameState.isValid(d)) return s;

    const isV2 = (d.version | 0) >= 2;
    const loc = int(d.location, 0, ITEMS.length - 1);
    const savedLevel = isV2 ? int(d.level, 1, MAX_LEVEL) : 0;
    s.location = loc;
    s.level = isV2 && levelLocation(savedLevel) === loc
      ? savedLevel
      : firstLevelForLocation(loc);

    s.honey = num(d.honey, 0, 1e15);
    s.diamonds = int(d.diamonds, 0, 1e9);

    s.stations = d.stations.map(x => new Station(!!x.unlocked, int(x.recipe, 0, B.maxRecipe)));
    s.stations[0].unlocked = true;

    const legacyStaff = d.stations.reduce(
      (n, x) => n + (x.unlocked ? int(x.staff, 0, B.maxBees) : 0), 0);
    s.staff = int(d.staff !== undefined ? d.staff : legacyStaff, 1, B.maxBees);

    const up = isV2 && d.upgrades && typeof d.upgrades === 'object' ? d.upgrades : {};
    const legacy = key => Math.max(0, ...d.stations.map(x => int(x[key], 0, 5)));
    s.upgrades = {
      tipChance: int(up.tipChance, 0, 10),
      queue: int(up.queue, 0, 10),
      walkSpeed: int(up.walkSpeed, 0, 5),
      cookSpeed: int(up.cookSpeed !== undefined ? up.cookSpeed : legacy('workLvl'), 0, 5),
      profitX2: int(up.profitX2 !== undefined ? up.profitX2 : legacy('profitX2'), 0, 1),
    };

    const first = firstMissionIndex(s.level);
    const src = isV2 && d.missions && typeof d.missions === 'object' ? d.missions : null;
    let index = src ? int(src.index, 0, MISSIONS.length) : first;
    let done = src && Array.isArray(src.done)
      ? [...new Set(src.done.map(x => cleanString(x)).filter(Boolean))].slice(0, index)
      : MISSIONS.slice(0, index).map(m => m.id);

    if (index < first) {
      index = first;
      done = MISSIONS.slice(0, first).map(m => m.id);
    }
    while (done.length < index) done.push(MISSIONS[done.length].id);

    s.missions = {
      index,
      done,
      finished: !!(src && src.finished) || index >= MISSIONS.length,
    };

    const st = isV2 && d.stats && typeof d.stats === 'object' ? d.stats : {};
    s.stats = {
      served: int(st.served, 0, 1e9),
      earned: num(st.earned, 0, 1e15),
      tips: int(st.tips, 0, 1e9),
      tipHoney: num(st.tipHoney, 0, 1e15),
    };

    const cos = isV2 && d.cosmetics && typeof d.cosmetics === 'object' ? d.cosmetics : {};
    s.cosmetics = {
      owned: Array.isArray(cos.owned)
        ? [...new Set(cos.owned.map(x => cleanString(x)).filter(Boolean))].slice(0, 50)
        : [],
      equipped: {
        bee: cleanString(cos.equipped?.bee),
        theme: cleanString(cos.equipped?.theme),
      },
    };

    // Never keep more bees than there are worker slots. Heals saves hurt by the old
    // location-change bug (e.g. 12 bees but only 2 slots).
    const slots = s.stations.reduce((n, x) => n + (x.unlocked ? slotsAt(x.recipe) : 0), 0);
    s.staff = Math.max(1, Math.min(s.staff, B.maxBees, slots));

    return s;
  }

  toJSON() {
    return {
      version: 3,
      level: this.level,
      honey: this.honey,
      diamonds: this.diamonds,
      location: this.location,
      staff: this.staff,
      stations: this.stations.map(s => s.toJSON()),
      upgrades: { ...this.upgrades },
      missions: {
        index: this.missions.index,
        done: [...this.missions.done],
        finished: this.missions.finished,
      },
      stats: { ...this.stats },
      cosmetics: {
        owned: [...this.cosmetics.owned],
        equipped: { ...this.cosmetics.equipped },
      },
    };
  }

  canAfford(cost) {
    return this.infinite || this.honey >= cost;
  }

  spend(cost) {
    if (!this.infinite) this.honey = Math.max(0, this.honey - cost);
  }

  addHoney(amount) {
    this.honey += amount;
    this.stats.earned += amount;
  }

  setLocation(loc) {
    const l = int(loc, 0, ITEMS.length - 1);
    if (l === this.location) return;
    this.location = l;
    // A new location starts from scratch: stations, bees and global upgrades reset.
    // Honey, diamonds, cosmetics, missions and stats carry over.
    this.stations = GameState.freshStations(l);
    this.staff = B.startStaff;
    this.upgrades = GameState.freshUpgrades();
  }

  advanceLevel() {
    if (this.level >= MAX_LEVEL) return false;
    const next = this.level + 1;
    const loc = levelLocation(next);
    if (loc !== this.location) this.setLocation(loc);
    this.level = next;
    return true;
  }

  jumpToLevel(level) {
    this.level = int(level, 1, MAX_LEVEL);
    const loc = levelLocation(this.level);
    if (loc !== this.location) this.setLocation(loc);
    const first = firstMissionIndex(this.level);
    this.missions = {
      index: first,
      done: MISSIONS.slice(0, first).map(m => m.id),
      finished: first >= MISSIONS.length,
    };
  }

  reset() {
    Object.assign(this, new GameState());
  }
}
