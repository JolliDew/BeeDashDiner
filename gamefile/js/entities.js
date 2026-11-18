import { ASSETS, BEES, BALANCE as B, art } from './config.js';
import { equippedCosmetic } from './cosmetics.js';

class Walker {
  constructor(el, x, y) { this.el = el; this.x = x; this.y = y; this.leg = null; }

  walkTo(tx, ty, dt, dur = B.walk) {
    let g = this.leg;
    if (!g || g.tx !== tx || g.ty !== ty) {
      if (Math.abs(this.x - tx) + Math.abs(this.y - ty) < .05) { this.leg = null; return true; }
      this.el.classList.toggle('left', tx < this.x);
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
    this.state = 'enter';
    this.stage = 'aisle';
    this.taken = false;
    this.claimedBy = null;
    this.waitTime = 0;
    this.tip = 0;
    this.key = '';
    this.t = 0;
    this.el.innerHTML = `<span class="gface">${face}</span>`;
    this.el.classList.add('walking');
    if (el.animate) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }

  /** The bee has delivered: celebrate for a moment before walking out. */
  served(tip = 0) {
    this.tip = tip;
    this.state = 'happy';
    this.t = B.happyTime;
    this.el.classList.remove('walking');
    this.el.classList.add('happy');
  }

  update(dt, scene) {
    switch (this.state) {
      case 'enter': {
        const atAisle = this.stage === 'aisle';
        const tx = atAisle ? scene.aisleX : scene.seatX(this.seat);
        const ty = atAisle ? scene.aisleY : scene.seatY(this.seat);
        if (this.walkTo(tx, ty, dt, scene.economy.walkTime)) {
          if (atAisle) {
            this.stage = 'seat';
          } else {
            this.state = 'wait';
            this.x = scene.seatX(this.seat);
            this.y = scene.seatY(this.seat);
            this.el.classList.remove('walking');
          }
        }
        break;
      }
      case 'wait':
        this.x = scene.seatX(this.seat);
        this.y = scene.seatY(this.seat);
        this.waitTime += dt;
        break;
      case 'happy':
        this.t -= dt;
        if (this.t <= 0) {
          this.state = 'leave';
          this.stage = 'aisle';
          this.el.classList.remove('happy');
          this.el.classList.add('walking');
        }
        break;
      case 'leave': {
        const atAisle = this.stage === 'aisle';
        const tx = atAisle ? scene.aisleX : scene.doorX;
        const ty = atAisle ? scene.aisleY : scene.doorY;
        if (this.walkTo(tx, ty, dt, scene.economy.walkTime)) {
          if (atAisle) {
            // Free the chair only once the guest is out of the seating area,
            // so a new customer never walks through someone still standing up.
            scene.freeSeat(this);
            this.stage = 'door';
          } else {
            this.state = 'exit';
            this.t = B.popTime;
            this.el.classList.remove('walking');
            if (this.el.animate) {
              this.el.animate(
                [{ opacity: 1 }, { opacity: 0 }],
                { duration: B.popTime * 1000, fill: 'forwards' }
              );
            }
          }
        }
        break;
      }
      case 'exit':
        this.t -= dt;
        return this.t > 0;
    }
    this.paint(scene);
    return true;
  }

  paint(scene) {
    const bubble = this.state === 'wait'
      ? `<span class="bub${this.taken ? ' ok' : ''}">${scene.itemIcon(this.item)}</span>`
      : this.state === 'happy' ? '<span class="bub heart">💛</span>' : '';
    const k = this.state + (this.taken ? '|taken' : '') + bubble;
    if (k !== this.key) {
      this.key = k;
      this.el.innerHTML = `<span class="gface">${this.face}</span>` + bubble;
    }
  }
}

export class Bee extends Walker {
  constructor(el, x, y) {
    super(el, x, y);
    this.slot = 0;
    this.home = 0;
    this.offset = 0;
    this.offsetY = 0;
    this.state = 'idle';
    this.customer = null; this.t = 0; this.total = 1; this.key = null;
  }

  html(scene) {
    const kind = BEES[this.slot] || BEES[0], asset = ASSETS.bees[this.slot] || '';
    const cos = equippedCosmetic(scene.state, 'bee');
    return `<span style="${asset ? '' : `filter:hue-rotate(${kind.hue}deg)`}">${art(asset, '🐝')}</span>`
      + `<span class="acc">${kind.acc}</span>`
      + (cos ? `<span class="accessory" title="${cos.name}">${cos.icon}</span>` : '');
  }

  update(dt, scene) {
    const walk = scene.economy.walkTime;
    const stationX = scene.stationX(this.slot) + this.offset;
    const homeX = scene.stationX(this.home ?? this.slot) + this.offset;
    // A small per-bee vertical offset keeps a full hive from forming one
    // overlapping line along the kitchen counter.
    const hy = scene.kitchenY + (this.offsetY || 0), c = this.customer;

    switch (this.state) {
      case 'idle': {
        const job = scene.findJob(this);
        if (job) {
          job.claimedBy = this;
          this.customer = job;
          this.slot = job.item;
          this.state = 'order';
        } else {
          this.walkTo(homeX, hy, dt, walk);
        }
        break;
      }
      case 'order':
        if (this.walkTo(scene.seatX(c.seat) - 7, scene.seatY(c.seat), dt, walk)) {
          c.taken = true;
          this.state = 'fetch';
        }
        break;
      case 'fetch':
        if (this.walkTo(stationX, hy, dt, walk)) {
          this.state = 'cook';
          this.t = this.total = scene.economy.cookTime(this.slot);
        }
        break;
      case 'cook':
        this.t -= dt;
        if (this.t <= 0) this.state = 'serve';
        break;
      case 'serve':
        if (this.walkTo(scene.seatX(c.seat) - 7, scene.seatY(c.seat), dt, walk)) {
          scene.deliver(this, c);
          this.customer = null;
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
    const key = `${cos}|${this.slot}|${extra}`;
    if (key !== this.key) { this.key = key; this.el.innerHTML = this.html(scene) + extra; }
    this.el.classList.toggle('helping', this.state !== 'idle' && this.slot !== this.home);
    if (this.state === 'cook') this.el.querySelector('i').style.width = (1 - this.t / this.total) * 100 + '%';
  }
}
