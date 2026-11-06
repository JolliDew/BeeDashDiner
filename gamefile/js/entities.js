import { ASSETS, BEES, BALANCE as B, art } from './config.js';
import { equippedCosmetic } from './cosmetics.js';

/** Anything that walks around the scene. Positions are percentages of the scene size. */
class Walker {
  constructor(el, x, y) { this.el = el; this.x = x; this.y = y; this.leg = null; }

  /** Fixed-duration leg with ease in/out: the trip takes `dur` seconds whatever the distance. */
  walkTo(tx, ty, dt, dur = B.walk) {
    let g = this.leg;
    if (!g || g.tx !== tx || g.ty !== ty) {
      if (Math.abs(this.x - tx) + Math.abs(this.y - ty) < .05) { this.leg = null; return true; }
      g = this.leg = { sx: this.x, sy: this.y, tx, ty, t: 0, d: dur };
    }
    g.t += dt;
    const p = Math.min(1, g.t / g.d), q = p * p * (3 - 2 * p);
    this.x = g.sx + (tx - g.sx) * q;
    this.y = g.sy + (ty - g.sy) * q;
    if (p >= 1) { this.leg = null; return true; }
    return false;
  }

  render(w, h) { this.el.style.transform = `translate(${this.x * w / 100}px,${this.y * h / 100}px) translate(-50%,-50%)`; }
}

export class Customer extends Walker {
  constructor(el, seat, item, face, x, y) {
    super(el, x, y);
    this.seat = seat; this.item = item; this.face = face;
    this.state = 'in';          // in -> wait -> leave
    this.taken = false;         // order has been taken
    this.claimedBy = null;      // bee handling this customer
    this.waitTime = 0;          // used to send idle bees to the longest wait
    this.tip = 0;               // dev/UI only
    this.key = '';
  }

  /** Returns false once the customer has left the screen. */
  update(dt, scene) {
    if (this.state === 'in') {
      if (this.walkTo(scene.seatX(this.seat), scene.seatY(this.seat), dt, B.custIn)) this.state = 'wait';
    } else if (this.state === 'leave' && this.walkTo(112, this.y, dt, B.custOut)) {
      return false;
    }
    if (this.state === 'wait') this.waitTime += dt;
    const k = this.state === 'wait' ? 'w' + (this.taken ? 1 : 0) : this.state === 'in' ? 'i' : 'x';
    if (k !== this.key) {
      this.key = k;
      this.el.innerHTML = this.face + (this.state === 'wait'
        ? `<span class="bub${this.taken ? ' ok' : ''}">${scene.itemIcon(this.item)}</span>` : '');
    }
    return true;
  }
}

export class Bee extends Walker {
  constructor(el, homeSlot, x, y) {
    super(el, x, y);
    this.homeSlot = homeSlot;
    this.slot = homeSlot;       // station currently being served (may be another one)
    this.offset = 0;
    this.state = 'idle';        // idle -> order -> fetch -> cook -> serve -> idle
    this.customer = null; this.t = 0; this.total = 1; this.key = null;
  }

  html(scene) {
    const kind = BEES[this.homeSlot], asset = ASSETS.bees[this.homeSlot];
    const cos = equippedCosmetic(scene.state, 'bee');
    return `<span style="${asset ? '' : `filter:hue-rotate(${kind.hue}deg)`}">${art(asset, '🐝')}</span>`
      + `<span class="acc">${kind.acc}</span>`
      + (cos ? `<span class="accessory" title="${cos.name}">${cos.icon}</span>` : '');
  }

  update(dt, scene) {
    const walk = scene.economy.walkTime;
    const homeX = scene.stationX(this.homeSlot) + this.offset;
    const stationX = scene.stationX(this.slot) + this.offset;
    const hy = scene.kitchenY, c = this.customer;

    switch (this.state) {
      case 'idle': {
        // Own station first; if it is empty the bee helps the longest wait
        // anywhere else. Fully automatic - the player never assigns workers.
        const job = scene.findJob(this.homeSlot);
        if (job) {
          job.claimedBy = this;
          this.customer = job;
          this.slot = job.item;
          this.state = 'order';
        } else {
          this.slot = this.homeSlot;
          this.walkTo(homeX, hy, dt, walk);
        }
        break;
      }
      case 'order':   // walk to the customer and take the order
        if (this.walkTo(scene.seatX(c.seat) - 7, scene.seatY(c.seat), dt, walk)) {
          c.taken = true;
          this.state = 'fetch';
        }
        break;
      case 'fetch':   // walk to the station that owns this order
        if (this.walkTo(stationX, hy, dt, walk)) {
          this.state = 'cook';
          this.t = this.total = scene.economy.cookTime(this.slot);
        }
        break;
      case 'cook':
        this.t -= dt;
        if (this.t <= 0) this.state = 'serve';
        break;
      case 'serve':   // deliver the dish
        if (this.walkTo(scene.seatX(c.seat) - 7, scene.seatY(c.seat), dt, walk)) {
          scene.deliver(this, c);
          this.customer = null;
          this.slot = this.homeSlot;
          this.state = 'idle';
        }
        break;
    }
    this.paint(scene);
  }

  paint(scene) {
    const extra = this.state === 'serve' ? `<span class="bub">${scene.itemIcon(this.slot)}</span>`
      : this.state === 'cook' ? '<span class="bar"><i></i></span>' : '';
    const cos = equippedCosmetic(scene.state, 'bee')?.id || '';
    const key = cos + '|' + extra;
    if (key !== this.key) { this.key = key; this.el.innerHTML = this.html(scene) + extra; }
    if (this.state === 'cook') this.el.querySelector('i').style.width = (1 - this.t / this.total) * 100 + '%';
    this.el.classList.toggle('helping', this.slot !== this.homeSlot);
  }
}
