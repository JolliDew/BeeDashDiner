import { LOCATIONS, BALANCE as B, art, fmt, ASSETS } from './config.js';
import { Economy } from './Economy.js';
import { Scene } from './Scene.js';
import { UpgradePanel } from './UpgradePanel.js';
import { DevTools } from './DevTools.js';
import { SaveService } from './SaveService.js';

/** Owns the state, wires the parts together and runs the loop. */
export class Game {
  constructor(root, { devMode = false, userId = '0', apiUrl = 'api.php' } = {}) {
    this.root = root; this.devMode = devMode; this.timeScale = 1;
    this.hud = {
      honey: root.querySelector('#hud-honey'),
      location: root.querySelector('#hud-location'),
      save: root.querySelector('#hud-save')
    };
    this.saves = new SaveService({ url: apiUrl, userId, onStatus: s => { this.hud.save.textContent = s; } });
  }

  async start() {
    this.state = await this.saves.load();
    this.economy = new Economy(this.state);
    this.scene = new Scene(this.root.querySelector('#scene'), this.state, this.economy);
    this.panel = new UpgradePanel(this.root.querySelector('#panel'), this);
    if (this.devMode) this.dev = new DevTools(this.root, this);
    this.scene.build();
    this.panel.build();
    this.autosave = setInterval(() => this.saves.push(this.state), 5000);
    this.last = performance.now(); this.acc = 0; this.running = true;
    this.raf = requestAnimationFrame(t => this.loop(t));
    return this;
  }

  loop(t) {
    if (!this.running) return;
    const dt = Math.min(.05, (t - this.last) / 1000);
    this.last = t;
    this.scene.quiet = this.timeScale > 1;
    for (let i = 0; i < this.timeScale; i++) this.scene.update(dt);
    this.scene.render();
    this.acc += dt;
    if (this.acc > .2) { this.acc = 0; this.panel.refresh(); this.refreshHud(); }
    this.raf = requestAnimationFrame(x => this.loop(x));
  }

  refreshHud() {
    this.hud.honey.innerHTML = art(ASSETS.honeyIcon, '🍯') + ' ' + (this.state.infinite ? '∞' : fmt(this.state.honey));
    this.hud.location.textContent = `Location ${this.state.location + 1}/${LOCATIONS.length}: ${LOCATIONS[this.state.location]}`;
  }

  /* ---- purchases ---- */
  unlockStation(i) {
    const s = this.state.stations[i], cost = this.economy.unlockCost(i);
    if (s.unlocked || !this.state.canAfford(cost)) return;
    this.state.spend(cost); s.unlocked = true; s.staff = 1;
    this.scene.syncBees(); this.panel.build(); this.changed();
  }
  hireBee(i) {
    const s = this.state.stations[i], cost = this.economy.beeCost(i);
    if (s.staff >= B.maxBees || !this.state.canAfford(cost)) return;
    this.state.spend(cost); s.staff++;
    this.scene.syncBees(); this.changed();
  }
  upgradeRecipe(i) {
    const s = this.state.stations[i], cost = this.economy.recipeCost(i);
    if (s.recipe >= B.maxRecipe || !this.state.canAfford(cost)) return;
    this.state.spend(cost); s.recipe++; this.changed();
  }
  advanceLocation() {
    const cost = this.economy.nextCost();
    if (this.state.location >= LOCATIONS.length - 1 || !this.state.canAfford(cost)) return;
    this.state.spend(cost); this.goToLocation(this.state.location + 1);
  }
  goToLocation(loc) {
    this.state.setLocation(loc);
    this.scene.build(); this.panel.build(); this.changed();
  }

  /* ---- dev helpers ---- */
  devUpgradeAll(max) {
    this.state.stations.forEach(s => {
      s.unlocked = true; s.staff = Math.max(s.staff, max ? B.maxBees : 1);
      if (max) s.recipe = B.maxRecipe;
    });
    this.scene.syncBees(); this.panel.build();
  }
  resetProgress() { this.state.reset(); this.scene.build(); this.panel.build(); }

  changed() { this.panel.refresh(); this.refreshHud(); this.saves.saveLocal(this.state); }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearInterval(this.autosave);
    if (this.state) this.saves.push(this.state, true);
  }
}
