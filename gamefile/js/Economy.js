import { BALANCE as B, slotsAt, profitMultAt } from './config.js';
import { GLOBAL_UPGRADES } from './upgrades.js';

export class Economy {
  constructor(state) { this.state = state; }

  get priceMult() { return B.priceX ** this.state.location; }
  get costMult() { return B.costX ** this.state.location; }
  get level() { return this.state.level; }

  get seats() { return B.seatBase + B.queueStep * (this.state.upgrades.queue || 0); }
  get rows() { return Math.ceil(this.seats / B.cols); }

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

  globalLevel(id) { return this.state.upgrades[id] || 0; }

  slots(i) { return slotsAt(this.state.stations[i].recipe); }
  slotList() { return this.state.stations.map((s, i) => s.unlocked ? this.slots(i) : 0); }
  totalSlots() { return this.slotList().reduce((a, b) => a + b, 0); }
  staffCap() { return Math.min(B.maxBees, this.totalSlots()); }

  price(i, recipe = this.state.stations[i].recipe) {
    let mult = (1 + B.priceBonus * recipe) * profitMultAt(recipe);
    if (this.globalLevel('profitX2')) mult *= 2;
    return B.basePrice[i] * this.priceMult * mult;
  }

  cookTime(i, recipe = this.state.stations[i].recipe) {
    let time = B.cookSecs[i] * B.cookDiscount ** recipe;
    time *= 1 - B.cookStep * this.globalLevel('cookSpeed');
    return Math.max(.4, time);
  }

  cycle(i, recipe = this.state.stations[i].recipe) {
    return 3 * this.walkTime + this.cookTime(i, recipe);
  }

  capacity(i) { return this.slots(i) / this.cycle(i); }

  totalCapacity(staff = this.state.staff) {
    const slots = this.totalSlots();
    if (!slots) return 0;
    const open = this.state.stations.reduce((a, s, i) => a + (s.unlocked ? this.capacity(i) : 0), 0);
    return open * Math.min(1, staff / slots);
  }

  perMinute(staff = this.state.staff) { return Math.round(60 * this.totalCapacity(staff)); }

  spawnInterval() {
    const cap = Math.max(.001, this.totalCapacity());
    return (.75 + Math.random() * .5) / (B.demand * cap);
  }

  unlockCost(i) { return B.unlockCost[i] * this.costMult; }
  recipeCost(i) { return Math.round(B.recipeCost[i] * B.recipeGrowth ** this.state.stations[i].recipe * this.costMult); }
  staffCost() { return Math.round(B.staffCost * B.staffGrowth ** (this.state.staff - 1) * this.costMult); }
  nextCost() { return B.nextCost[this.state.location] ?? Infinity; }

  globalCost(def) {
    return Math.round(def.baseCost * def.growth ** this.globalLevel(def.id) * this.costMult);
  }

  globalUnlocked(def) { return this.state.level >= def.unlockLevel; }

  get globalDefs() { return GLOBAL_UPGRADES; }
}
