import { ITEMS, BALANCE as B } from './config.js';

export class Station {
  constructor(unlocked = false, staff = 0, recipe = 0) {
    this.unlocked = unlocked;
    this.staff = staff;
    this.recipe = recipe;
  }
}

/** Everything that is saved: honey, current location and its stations. */
export class GameState {
  constructor() {
    this.honey = B.startHoney;
    this.location = 0;
    this.stations = GameState.freshStations(0);
    this.infinite = false; // dev only, never saved
  }
  static freshStations(loc) { return ITEMS[loc].map((_, i) => new Station(i === 0, i === 0 ? 1 : 0, 0)); }
  static isValid(d) {
    return !!d && Number.isInteger(d.location) && !!ITEMS[d.location] &&
      Array.isArray(d.stations) && d.stations.length === ITEMS[d.location].length;
  }
  static fromJSON(d) {
    const s = new GameState();
    if (!GameState.isValid(d)) return s;
    const clamp = (v, max) => Math.max(0, Math.min(max, v | 0));
    s.honey = Math.max(0, +d.honey || 0);
    s.location = d.location;
    s.stations = d.stations.map(x => new Station(!!x.unlocked, clamp(x.staff, B.maxBees), clamp(x.recipe, B.maxRecipe)));
    return s;
  }
  toJSON() { return { honey: this.honey, location: this.location, stations: this.stations }; }
  canAfford(cost) { return this.infinite || this.honey >= cost; }
  spend(cost) { if (!this.infinite) this.honey -= cost; }
  setLocation(loc) {
    this.location = Math.max(0, Math.min(ITEMS.length - 1, loc));
    this.stations = GameState.freshStations(this.location);
  }
  reset() {
    const f = new GameState();
    this.honey = f.honey; this.location = 0; this.stations = f.stations;
  }
}
