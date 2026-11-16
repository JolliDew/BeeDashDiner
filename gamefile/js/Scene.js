import { ASSETS, ITEMS, CUSTOMERS, BALANCE as B, art, fmt } from './config.js';
import { Bee, Customer } from './entities.js';
import { pickJob } from './WorkerAI.js';

export class Scene {
  constructor(host, state, economy) {
    this.host = host; this.state = state; this.economy = economy;
    this.bees = []; this.customers = []; this.seats = []; this.stationEls = []; this.seatEls = [];
    this.spawnTimer = 0; this.burst = 0; this.quiet = false;
    this.kitchenY = 26;
  }

  stationX(i) { return (i + .5) / this.state.stations.length * 100; }
  seatX(k) { return ((k % B.cols) + .5) / B.cols * 100; }
  seatY(k) { return 40 + (Math.floor(k / B.cols) + .5) * 58 / this.economy.rows; }
  itemIcon(i) { const it = ITEMS[this.state.location][i]; return art(ASSETS.items[it[1]], it[0]); }
  mk(cls, html = '') {
    const d = document.createElement('div');
    d.className = cls; d.innerHTML = html;
    if (cls !== 'stn') d.style.pointerEvents = 'none';
    this.host.appendChild(d);
    return d;
  }

  build() {
    this.host.innerHTML = '';
    this.bees = []; this.customers = []; this.stationEls = []; this.seatEls = [];
    this.seats = Array(this.economy.seats).fill(null);
    this.mk('kitchen').id = 'kitchen';
    this.state.stations.forEach((s, i) => {
      // .sup = "you can upgrade this" arrow, .slv = recipe level, .swk = bees working / worker slots
      const d = this.mk('stn', `<span class="mwrap"><span class="mach">${art(ASSETS.stations[i], ITEMS[this.state.location][i][0])}</span><span class="sup" hidden>⬆</span></span>`
        + `<span class="sinfo"><span class="slv"></span><span class="swk"></span></span>`);
      d.dataset.station = i;
      d.dataset.toggle = 'modal';
      d.dataset.target = '#stationModal';
      d.setAttribute('role', 'button');
      d.setAttribute('tabindex', '0');
      d.title = ITEMS[this.state.location][i][1];
      d.setAttribute('aria-label', `Upgrade ${ITEMS[this.state.location][i][1]}`);
      d.style.cursor = 'pointer';
      d.style.pointerEvents = 'auto';
      d.style.left = (i / this.state.stations.length * 100) + '%';
      d.style.width = (100 / this.state.stations.length) + '%';
      this.stationEls[i] = d;
    });
    this.renderSeats();
    this.syncBees();
    this.burst = Math.floor(this.economy.seats * .4);
    this.spawnTimer = 0;
  }

  syncSeats() {
    while (this.seats.length < this.economy.seats) this.seats.push(null);
    if (this.seatEls.length !== this.seats.length) this.renderSeats();
  }

  /** A chair under every queue spot, so you can see how many customers can wait. */
  renderSeats() {
    this.seatEls.forEach(e => e.remove());
    this.seatEls = this.seats.map((_, k) => {
      const d = this.mk('seat', art(ASSETS.seat, '🪑'));
      d.style.left = this.seatX(k) + '%';
      d.style.top = (this.seatY(k) + 2) + '%';
      return d;
    });
  }

  syncBees() {
    const staff = this.state.staff;
    while (this.bees.length < staff) {
      this.bees.push(new Bee(this.mk('ent'), this.stationX(0), this.kitchenY));
    }
    while (this.bees.length > staff) {
      const b = this.bees.pop();
      if (b.customer) b.customer.claimedBy = null;
      b.el.remove();
    }

    // Home stations are spread over the open stations. They are a preference,
    // not a restriction: pickJob still sends a bee anywhere that needs help.
    const homes = this.state.stations
      .map((s, i) => s.unlocked ? i : -1)
      .filter(i => i >= 0);
    this.bees.forEach((b, k) => {
      b.home = homes.length ? homes[k % homes.length] : 0;
      if (b.state === 'idle') b.slot = b.home;
      b.offset = ((k % 5) - 2) * 6;
    });
    this.refreshStations();
  }

  /** How many bees are cooking for station i right now. */
  workingAt(i) {
    let n = 0;
    for (const c of this.customers) if (c.claimedBy && c.state === 'wait' && c.item === i) n++;
    return n;
  }

  /** Station indicators: lock state, recipe level, bees working / worker slots, upgrade-available arrow. */
  refreshStations() {
    const st = this.state, eco = this.economy;
    const set = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };
    st.stations.forEach((s, i) => {
      const el = this.stationEls[i];
      if (!el) return;
      const prevOpen = i === 0 || st.stations[i - 1].unlocked;
      const can = s.unlocked
        ? s.recipe < B.maxRecipe && st.canAfford(eco.recipeCost(i))
        : prevOpen && st.canAfford(eco.unlockCost(i));
      const slots = s.unlocked ? eco.slots(i) : 0, busy = Math.min(this.workingAt(i), slots);
      el.classList.toggle('off', !s.unlocked);
      el.classList.toggle('can', !!can);
      const up = el.querySelector('.sup');
      if (up) up.hidden = !can;
      set(el.querySelector('.slv'), s.unlocked ? `Lv ${s.recipe}` : '🔒');
      const wk = el.querySelector('.swk');
      set(wk, s.unlocked ? `🐝 ${busy}/${slots}` : '');
      if (wk) wk.classList.toggle('full', s.unlocked && busy >= slots);
    });
    this.seatEls.forEach((e, k) => e.classList.toggle('taken', !!this.seats[k]));
  }

  findJob(bee) { return pickJob(this.customers, this.economy.slotList(), bee?.home ?? null); }

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
    this.syncSeats();
    const free = this.seats.map((v, k) => v ? -1 : k).filter(k => k >= 0);
    if (!free.length) return;
    const seat = free[Math.random() * free.length | 0], f = Math.random() * CUSTOMERS.length | 0;
    const face = art(ASSETS.customers[f], CUSTOMERS[f]);
    const c = new Customer(this.mk('ent', face), seat, this.pickItem(), face, this.seatX(seat), this.seatY(seat));
    this.seats[seat] = c; this.customers.push(c);
    c.render(this.host.clientWidth, this.host.clientHeight);
  }

  deliver(bee, customer) {
    const gain = this.economy.price(bee.slot);
    this.state.addHoney(gain);
    this.state.stats.served++;
    this.pop(bee.x, bee.y - 6, '+' + fmt(gain));

    if (Math.random() < this.economy.tipChance) {
      const tip = this.economy.tipAmount(gain);
      this.state.addHoney(tip);
      this.state.stats.tips++;
      this.state.stats.tipHoney += tip;
      customer.tip = tip;
      this.pop(bee.x + 4, bee.y - 11, '🪙 +' + fmt(tip), 'tip');
    }

    customer.leave();
    this.seats[customer.seat] = null;
  }

  pop(x, y, text, cls = '') {
    if (this.quiet) return;
    const d = this.mk('pop' + (cls ? ' ' + cls : ''), text);
    d.style.left = x + '%'; d.style.top = y + '%';
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
