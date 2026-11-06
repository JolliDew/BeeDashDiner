import { BALANCE as B } from './config.js';
import { GLOBAL_UPGRADES, STATION_UPGRADES } from './upgrades.js';

/** Pure maths: prices, costs, cook times, tips and upgrade effects. */
export class Economy {
  constructor(state) { this.state = state; }

  get priceMult() { return B.priceX ** this.state.location; }
  get costMult() { return B.costX ** this.state.location; }
  get level() { return this.state.level; }

  get seats() {
    return B.seatBase + B.seatStep * this.state.location +
      B.queueStep * (this.state.upgrades.queue || 0);
  }
  get rows() { return Math.ceil(this.seats / B.cols); }

  /** Walking leg duration after the movement-speed upgrade. */
  get walkTime() {
    return Math.max(.8, B.walk * (1 - B.walkStep * (this.state.upgrades.walkSpeed || 0)));
  }

  get tipChance() {
    const t = B.tips;
    return Math.min(t.maxChance, t.baseChance + t.chanceStep * (this.state.upgrades.tipChance || 0));
  }

  tipAmount(price, rng = Math.random()) {
    const t = B.tips;
    return price * (t.minPct + rng * (t.maxPct - t.minPct));
  }

  maxBees() { return B.maxBees; }
  maxRecipe() { return B.maxRecipe; }

  /** Workers allowed at one station: 3 normally, 4 after the extra-worker upgrade. */
  workerCap() {
    return Math.min(B.maxBees, B.baseBees + (this.state.upgrades.workerSlot || 0));
  }

  price(i, recipe = this.state.stations[i].recipe) {
    const s = this.state.stations[i];
    let mult = 1 + B.priceBonus * recipe;
    if (recipe >= 5) mult *= 1 + B.milestone5Price;
    if (s.profitX2) mult *= 2;
    return B.basePrice[i] * this.priceMult * mult;
  }

  cookTime(i, recipe = this.state.stations[i].recipe) {
    const s = this.state.stations[i];
    let time = B.cookSecs[i] * B.cookDiscount ** recipe;
    if (recipe >= B.maxRecipe) time *= 1 - B.milestone10Cook;
    time *= 1 - B.cookStep * (s.workLvl || 0);
    return Math.max(.4, time);
  }

  /** One serve = 3 walking legs + cooking. */
  cycle(i, recipe = this.state.stations[i].recipe) {
    return 3 * this.walkTime + this.cookTime(i, recipe);
  }

  perMinute(i, staff, recipe = this.state.stations[i].recipe) {
    return Math.round(60 * staff / this.cycle(i, recipe));
  }

  capacity(i) {
    const s = this.state.stations[i];
    return s.staff / this.cycle(i, s.recipe);
  }

  totalCapacity() {
    return this.state.stations.reduce((a, s, i) => a + (s.unlocked ? this.capacity(i) : 0), 0);
  }

  spawnInterval() {
    const cap = Math.max(.001, this.totalCapacity());
    return (.75 + Math.random() * .5) / (B.demand * cap);
  }

  unlockCost(i) { return B.unlockCost[i] * this.costMult; }
  recipeCost(i) { return Math.round(B.recipeCost[i] * B.recipeGrowth ** this.state.stations[i].recipe * this.costMult); }
  beeCost(i) { return Math.round(B.beeCost[i] * B.beeGrowth ** (this.state.stations[i].staff - 1) * this.costMult); }
  nextCost() { return B.nextCost[this.state.location] ?? Infinity; }

  /* ---- global upgrades (shared by the restaurant) ---- */
  globalLevel(id) { return this.state.upgrades[id] || 0; }

  globalCost(def) {
    return Math.round(def.baseCost * def.growth ** this.globalLevel(def.id) * this.costMult);
  }

  globalUnlocked(def) { return this.state.level >= def.unlockLevel; }

  /* ---- per-station late-game upgrades ---- */
  stationLevel(i, def) { return this.state.stations[i][def.field] || 0; }

  stationUpgradeCost(i, def) {
    const scale = 1 + i * .35;
    return Math.round(def.baseCost * def.growth ** this.stationLevel(i, def) * this.costMult * scale);
  }

  stationUpgradeUnlocked(def) { return this.state.level >= def.unlockLevel; }

  /** Convenience lists used by the panel and tests. */
  get globalDefs() { return GLOBAL_UPGRADES; }
  get stationDefs() { return STATION_UPGRADES; }
}
