import { ASSETS, ITEMS, CUSTOMERS, BALANCE as B, art, fmt } from './config.js';
import { Bee, Customer } from './entities.js';

/** The restaurant: kitchen stations, bees, customers and the queue. */
export class Scene {
  constructor(host, state, economy) {
    this.host = host; this.state = state; this.economy = economy;
    this.bees = []; this.customers = []; this.seats = []; this.stationEls = [];
    this.spawnTimer = 0; this.burst = 0; this.quiet = false;
    this.kitchenY = 26; // where bees stand at their station
  }

  stationX(i) { return (i + .5) / this.state.stations.length * 100; }
  seatX(k) { return ((k % B.cols) + .5) / B.cols * 100; }
  seatY(k) { return 40 + (Math.floor(k / B.cols) + .5) * 58 / this.economy.rows; }
  itemIcon(i) { const it = ITEMS[this.state.location][i]; return art(ASSETS.items[it[1]], it[0]); }
  mk(cls, html = '') { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; this.host.appendChild(d); return d; }

  build() {
    this.host.innerHTML = '';
    this.bees = []; this.customers = []; this.stationEls = [];
    this.seats = Array(this.economy.seats).fill(null);
    this.mk('kitchen').id = 'kitchen';
    this.state.stations.forEach((s, i) => {
      const d = this.mk('stn', `<span class="mach">${art(ASSETS.stations[i], ITEMS[this.state.location][i][0])}</span>`);
      d.style.left = (i / this.state.stations.length * 100) + '%';
      d.style.width = (100 / this.state.stations.length) + '%';
      this.stationEls[i] = d;
    });
    this.syncBees();
    this.burst = Math.floor(this.economy.seats * .4); // opening rush walks in from the door
    this.spawnTimer = 0;
  }

  /** Make sure each unlocked station has as many bee sprites as its staff level. */
  syncBees() {
    this.state.stations.forEach((s, i) => {
      this.stationEls[i].classList.toggle('off', !s.unlocked);
      if (!s.unlocked) return;
      const mine = this.bees.filter(b => b.slot === i);
      while (mine.length < s.staff) {
        const b = new Bee(this.mk('ent'), i, this.stationX(i), this.kitchenY);
        this.bees.push(b); mine.push(b);
      }
      mine.forEach((b, k) => b.offset = (k - (mine.length - 1) / 2) * 7);
    });
  }

  findWaiting(item) { return this.customers.find(c => c.state === 'wait' && !c.claimedBy && c.item === item); }

  /** New customers join the station with the shortest line for its bee capacity, so queues stay balanced. */
  pickItem() {
    let best = 0, bestScore = Infinity;
    this.state.stations.forEach((s, i) => {
      if (!s.unlocked) return;
      const n = this.customers.filter(c => c.item === i && c.state !== 'leave').length;
      const score = (n + Math.random() * .9) / this.economy.capacity(i);
      if (score < bestScore) { bestScore = score; best = i; }
    });
    return best;
  }

  spawnCustomer() {
    const free = this.seats.map((v, k) => v ? -1 : k).filter(k => k >= 0);
    if (!free.length) return;
    const seat = free[Math.random() * free.length | 0], f = Math.random() * CUSTOMERS.length | 0;
    const face = art(ASSETS.customers[f], CUSTOMERS[f]);
    const c = new Customer(this.mk('ent', face), seat, this.pickItem(), face, -8, this.seatY(seat)); // starts at the door
    this.seats[seat] = c; this.customers.push(c);
  }

  deliver(bee, customer) {
    const gain = this.economy.price(bee.slot);
    this.state.honey += gain;
    this.pop(bee.x, bee.y - 6, '+' + fmt(gain));
    customer.state = 'leave';
    this.seats[customer.seat] = null;
  }

  pop(x, y, text) {
    if (this.quiet) return;
    const d = this.mk('pop', text); d.style.left = x + '%'; d.style.top = y + '%';
    setTimeout(() => d.remove(), 900);
  }

  update(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnCustomer();
      this.spawnTimer = this.burst > 0 ? (this.burst--, B.burstGap) : this.economy.spawnInterval();
    }
    this.bees.forEach(b => b.update(dt, this));
    for (const c of [...this.customers]) {
      if (!c.update(dt, this)) { c.el.remove(); this.customers.splice(this.customers.indexOf(c), 1); }
    }
  }

  render() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    this.bees.forEach(b => b.render(w, h));
    this.customers.forEach(c => c.render(w, h));
  }
}
