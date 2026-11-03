import { BALANCE as B } from './config.js';

/** Pure maths: prices, costs, cook times and customer demand for the current state. */
export class Economy {
  constructor(state) { this.state = state; }

  get priceMult() { return B.priceX ** this.state.location; }
  get costMult() { return B.costX ** this.state.location; }
  get seats() { return B.seatBase + B.seatStep * this.state.location; }
  get rows() { return this.seats / B.cols; }

  price(i, recipe = this.state.stations[i].recipe) { return B.basePrice[i] * this.priceMult * (1 + B.priceBonus * recipe); }
  cookTime(i, recipe = this.state.stations[i].recipe) { return B.cookSecs[i] * B.cookDiscount ** recipe; }
  /** One serve = 3 walking legs + cooking. */
  cycle(i, recipe = this.state.stations[i].recipe) { return 3 * B.walk + this.cookTime(i, recipe); }
  perMinute(i, staff, recipe = this.state.stations[i].recipe) { return Math.round(60 * staff / this.cycle(i, recipe)); }
  capacity(i) { const s = this.state.stations[i]; return s.staff / this.cycle(i, s.recipe); }
  totalCapacity() { return this.state.stations.reduce((a, s, i) => a + (s.unlocked ? this.capacity(i) : 0), 0); }
  spawnInterval() { return (.75 + Math.random() * .5) / (B.demand * this.totalCapacity()); }

  unlockCost(i) { return B.unlockCost[i] * this.costMult; }
  recipeCost(i) { return Math.round(B.recipeCost[i] * B.recipeGrowth ** this.state.stations[i].recipe * this.costMult); }
  beeCost(i) { return Math.round(B.beeCost[i] * B.beeGrowth ** (this.state.stations[i].staff - 1) * this.costMult); }
  nextCost() { return B.nextCost[this.state.location]; }
}
