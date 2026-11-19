import { ASSETS, ITEMS, LOCATIONS, BALANCE as B, MAX_LEVEL, LEVELS, MILESTONES, levelLocation, art, fmt } from './config.js';
import { Economy } from './Economy.js';
import { Scene } from './Scene.js';
import { UpgradePanel } from './UpgradePanel.js';
import { MissionTracker } from './MissionTracker.js';
import { DevTools } from './DevTools.js';
import { SaveService } from './SaveService.js';
import { SoundEngine } from './Sound.js';
import { GLOBAL_UPGRADES, globalDef } from './upgrades.js';
import { cosmeticDef } from './cosmetics.js';

export class Game {
  constructor(root, { devMode = false, userId = '0', apiUrl = 'api.php' } = {}) {
    this.root = root; this.devMode = devMode; this.timeScale = 1;
    this.hud = {
      honey: root.querySelector('#hud-honey'),
      diamonds: root.querySelector('#hud-diamonds'),
      queue: root.querySelector('#hud-queue'),
      location: root.querySelector('#hud-location'),
      save: root.querySelector('#hud-save')
    };
    this.saveTimer = 0;
    this.saveDebounce = null;
    this.sound = new SoundEngine();
    this.soundBtn = null; this.audioMenu = null;
    this.saves = new SaveService({ url: apiUrl, userId, onStatus: s => this.setSaveStatus(s) });
  }

  /** Show save feedback briefly, but keep errors on screen. */
  setSaveStatus(text) {
    const el = this.hud.save;
    if (!el) return;
    el.textContent = text;
    el.classList.remove('is-idle');
    clearTimeout(this.saveTimer);
    if (['Loaded', 'New game', 'Offline copy', 'Saved'].includes(text)) {
      this.saveTimer = setTimeout(() => el.classList.add('is-idle'), 2200);
    }
  }

  async start() {
    this.state = await this.saves.load();
    // The player may have left (Exit) while the save was still loading.
    if (this.destroyed) return this;
    this.economy = new Economy(this.state);
    this.scene = new Scene(this.root.querySelector('#scene'), this.state, this.economy);
    this.scene.sound = this.sound;
    this.tracker = new MissionTracker(this);
    this.panel = new UpgradePanel(this.root.querySelector('#panel'), this);
    if (this.devMode) this.dev = new DevTools(this.root, this);

    this.scene.build();
    this.panel.build();
    this.setupAudio();
    // The baseline is the state that was loaded. Anything changed() does after
    // this (paying out a mission reward, for example) is a real change and
    // must still reach the server. Taking the baseline afterwards would mark
    // that change as already saved and let the reward be paid again on every
    // reload.
    this.lastSave = JSON.stringify(this.state);
    this.changed();

    // Saving must happen even when the player closes the tab or switches apps.
    this._onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        this.saveNow();
        this.sound?.pause();
      } else {
        this.sound?.resumeFromPause();
      }
    };
    this._onPageHide = () => this.saveNow();
    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('pagehide', this._onPageHide);

    if (this.saves.loadedFrom !== 'new') {
      this.toast(`Welcome back — Level ${this.state.level} · ${LOCATIONS[this.state.location]}`);
    }

    this.autosave = setInterval(() => this.saveIfDirty(), 10000);
    this.last = performance.now(); this.acc = 0; this.running = true;
    this.raf = requestAnimationFrame(t => this.loop(t));
    return this;
  }

  /** Wire the audio panel and the global UI click. */
  setupAudio() {
    this.sound?.start();
    this.sound?.attachUnlock();
    this.soundBtn = this.root.querySelector('#soundbtn');
    this.audioMenu = this.root.querySelector('#audio-menu');
    this.renderAudio();

    this._onSoundBtn = e => {
      e.stopPropagation();
      if (!this.audioMenu) return;
      const open = this.audioMenu.hidden;
      this.audioMenu.hidden = !open;
      this.soundBtn.setAttribute('aria-expanded', String(open));
      if (open) this.audioMenu.querySelector('button')?.focus();
      this.sound?.click();
    };
    this.soundBtn?.addEventListener('click', this._onSoundBtn);

    this._onAudioInput = e => {
      const input = e.target.closest('input[data-audio]');
      if (!input) return;
      const value = Number(input.value);
      if (input.dataset.audio === 'sfx') this.sound?.setSfxVol(value);
      else this.sound?.setMusicVol(value);
      this.renderAudio();
    };
    this.audioMenu?.addEventListener('input', this._onAudioInput);

    this._closeAudio = () => {
      if (!this.audioMenu) return;
      this.audioMenu.hidden = true;
      this.soundBtn?.setAttribute('aria-expanded', 'false');
    };
    this._onAudioOutside = e => {
      if (!this.audioMenu || this.audioMenu.hidden) return;
      if (this.audioMenu.contains(e.target) || this.soundBtn?.contains(e.target)) return;
      this._closeAudio();
    };
    this._onAudioKey = e => {
      if (e.key === 'Escape' && this.audioMenu && !this.audioMenu.hidden) {
        this._closeAudio();
        this.soundBtn?.focus();
      }
    };
    document.addEventListener('pointerdown', this._onAudioOutside);
    document.addEventListener('keydown', this._onAudioKey);

    this._onUiClick = e => {
      if (e.target.closest('#soundbtn, #audio-menu')) return;
      if (e.target.closest('.dock-btn, .stn, .exit-btn, #devbtn, .modal .close, .modal-footer .btn')) {
        this.sound?.click();
      }
    };
    document.addEventListener('click', this._onUiClick);
  }

  renderAudio() {
    if (!this.soundBtn) return;
    const sfx = this.sound?.sfxVol ?? 0;
    const music = this.sound?.musicVol ?? 0;
    const any = sfx > 0 || music > 0;
    this.soundBtn.textContent = any ? '🔊' : '🔇';
    this.soundBtn.setAttribute('aria-pressed', String(any));
    this.soundBtn.title = any ? 'Audio settings (on)' : 'Audio settings (muted)';
    if (!this.audioMenu) return;
    this.audioMenu.querySelectorAll('input[data-audio]').forEach(input => {
      const value = input.dataset.audio === 'sfx' ? sfx : music;
      input.value = value;
      const state = this.audioMenu.querySelector(`[data-state="${input.dataset.audio}"]`);
      if (state) state.textContent = value + '%';
    });
  }

  /** Save shortly after an action, instead of waiting for the 10s interval. */
  saveSoon() {
    if (!this.running) return;
    clearTimeout(this.saveDebounce);
    this.saveDebounce = setTimeout(() => this.saveIfDirty(), 700);
  }

  /**
   * Immediate keepalive save for page hide/unload and Exit.
   * Resolves to true only when the server confirmed the save, so a failed
   * keepalive stays "unsaved" and the next autosave tries again.
   */
  saveNow() {
    if (!this.state) return Promise.resolve(false);
    const snapshot = JSON.stringify(this.state);
    this.saves.saveLocal(this.state);
    return this.saves.pushNow(this.state).then(ok => {
      if (ok) this.lastSave = snapshot;
      return ok;
    }).catch(() => false);
  }

  /** Autosave only when the state actually changed since the last success. */
  async saveIfDirty() {
    if (!this.state) return;
    const snapshot = JSON.stringify(this.state);
    if (snapshot === this.lastSave) return;
    if (await this.saves.push(this.state)) this.lastSave = snapshot;
  }

  loop(t) {
    if (!this.running) return;
    const dt = Math.min(.05, (t - this.last) / 1000);
    this.last = t;
    this.scene.quiet = this.timeScale > 1;
    for (let i = 0; i < this.timeScale; i++) this.scene.update(dt);
    this.scene.render();
    this.acc += dt;
    if (this.acc > .2) {
      this.acc = 0;
      this.tracker.check();
      this.scene.refreshStations();
      this.panel.refresh();
      this.refreshHud();
    }
    this.raf = requestAnimationFrame(x => this.loop(x));
  }

  refreshHud() {
    const honey = this.state.infinite ? '∞' : fmt(this.state.honey);
    const diamonds = fmt(this.state.diamonds);
    this.hud.honey.innerHTML = art(ASSETS.honeyIcon, '🍯') + ' ' + honey;
    this.hud.honey.setAttribute('aria-label', `Honey: ${honey}`);
    if (this.hud.diamonds) {
      this.hud.diamonds.textContent = '💎 ' + diamonds;
      this.hud.diamonds.setAttribute('aria-label', `Diamonds: ${diamonds}`);
    }
    if (this.hud.queue) {
      // Count the reserved chairs, not only the guests who already reached
      // their table. A guest walking in still holds a seat.
      const waiting = this.scene.seats.filter(Boolean).length;
      this.hud.queue.textContent = `🪑 ${waiting}/${this.economy.seats}`;
      this.hud.queue.setAttribute('aria-label', `Seats occupied: ${waiting} of ${this.economy.seats}`);
    }
    this.hud.location.textContent = `Level ${this.state.level}/${MAX_LEVEL} · ${LOCATIONS[this.state.location]}`;
  }

  toast(message) {
    let host = this.root.querySelector('#toasts');
    if (!host) {
      host = document.createElement('div');
      host.id = 'toasts';
      this.root.appendChild(host);
    }
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = message;
    host.appendChild(d);
    setTimeout(() => d.remove(), 3200);
  }

  grantReward(reward, label) {
    if (!reward) return;
    const honey = Number(reward.honey) || 0;
    const diamonds = Number(reward.diamonds) || 0;
    if (honey) this.state.addHoney(honey);
    if (diamonds) this.state.diamonds += diamonds;
    const parts = [];
    if (honey) parts.push(`+${fmt(honey)} honey`);
    if (diamonds) parts.push(`+${diamonds}💎`);
    this.toast(parts.length ? `${label} · ${parts.join(' · ')}` : label);
  }

  unlockStation(i) {
    const s = this.state.stations[i], cost = this.economy.unlockCost(i);
    if (s.unlocked || (i > 0 && !this.state.stations[i - 1].unlocked) || !this.state.canAfford(cost)) return;
    this.state.spend(cost);
    s.unlocked = true; s.recipe = 0;
    this.scene.syncBees(); this.panel.build(); this.changed();
    this.sound?.stationUnlock();
  }

  hireBee() {
    const eco = this.economy;
    if (this.state.staff >= eco.staffCap()) return;
    const cost = eco.staffCost();
    if (!this.state.canAfford(cost)) return;
    this.state.spend(cost);
    this.state.staff++;
    this.scene.syncBees(); this.changed();
    this.sound?.purchase();
  }

  upgradeRecipe(i) {
    const s = this.state.stations[i], cost = this.economy.recipeCost(i);
    if (!s.unlocked || s.recipe >= B.maxRecipe || !this.state.canAfford(cost)) return;
    this.state.spend(cost); s.recipe++;
    const m = MILESTONES.find(x => x.recipe === s.recipe);
    if (m) {
      const name = ITEMS[this.state.location][i][1];
      this.toast(m.type === 'slot'
        ? `Milestone! ${name} gets another worker slot.`
        : `Milestone! ${name} profit is doubled.`);
    }
    this.changed();
    this.sound?.upgrade();
  }

  buyGlobal(id) {
    const def = globalDef(id);
    if (!def) return;
    const level = this.state.upgrades[id] || 0;
    if (!this.economy.globalUnlocked(def) || level >= def.maxLevel) return;
    const cost = this.economy.globalCost(def);
    if (!this.state.canAfford(cost)) return;
    this.state.spend(cost);
    this.state.upgrades[id] = level + 1;
    if (id === 'queue') this.scene.syncSeats();
    this.changed();
    this.sound?.purchase();
  }

  cosmeticAction(id) {
    const def = cosmeticDef(id);
    if (!def) return;
    const cos = this.state.cosmetics;
    const equipped = cos.equipped[def.kind] || '';
    const owned = cos.owned.includes(id);

    if (!owned) {
      if (this.state.diamonds < def.cost) return;
      this.state.diamonds -= def.cost;
      cos.owned.push(id);
      cos.equipped[def.kind] = id;
      this.toast(`Unlocked ${def.name}!`);
      this.sound?.purchase();
    } else if (equipped === id) {
      cos.equipped[def.kind] = '';
      this.sound?.click();
    } else {
      cos.equipped[def.kind] = id;
      this.sound?.click();
    }
    this.changed();
  }

  advanceLevel() {
    if (this.state.level >= MAX_LEVEL || !this.tracker.levelComplete()) return;

    const nextLevel = this.state.level + 1;
    const nextLoc = levelLocation(nextLevel);
    if (nextLoc !== this.state.location) {
      if (!this.state.stations.every(s => s.unlocked)) return;
      const cost = this.economy.nextCost();
      if (!this.state.canAfford(cost)) return;
      this.state.spend(cost);
    }

    const completedLevel = this.state.level;
    this.grantReward(LEVELS[completedLevel - 1]?.reward, `Level ${completedLevel} complete`);
    const oldLocation = this.state.location;
    this.state.advanceLevel();

    if (this.state.location !== oldLocation) {
      this.scene.build();
      this.toast(`Welcome to the ${LOCATIONS[this.state.location]}! Stations and staff reset; global upgrades carried over.`);
    } else { this.scene.syncBees(); this.scene.syncSeats(); }
    this.panel.build();
    this.changed();
    this.sound?.levelUp();
  }

  devSetLevel(level) {
    this.state.jumpToLevel(level);
    this.scene.build(); this.panel.build(); this.changed();
  }

  devCompleteMissions() {
    this.state.stats.served = 1e9;
    this.state.stats.earned = 1e15;
    this.state.stats.tips = 1e9;
    this.state.stations.forEach(s => { s.unlocked = true; s.recipe = B.maxRecipe; });
    GLOBAL_UPGRADES.forEach(def => { this.state.upgrades[def.id] = def.maxLevel; });
    this.state.staff = this.economy.staffCap();
    this.tracker.check();
    this.scene.syncBees(); this.scene.syncSeats();
    this.panel.build(); this.changed();
  }

  devUpgradeAll(max) {
    this.state.stations.forEach(s => {
      s.unlocked = true;
      if (max) s.recipe = B.maxRecipe;
    });
    if (max) {
      GLOBAL_UPGRADES.forEach(def => { this.state.upgrades[def.id] = def.maxLevel; });
      this.state.staff = this.economy.staffCap();
    }
    this.scene.syncBees(); this.scene.syncSeats(); this.panel.build(); this.changed();
  }

  resetProgress() {
    this.state.reset();
    this.scene.build(); this.panel.build(); this.changed();
  }

  changed() {
    this.tracker.check();
    this.scene.syncBees();
    this.scene.syncSeats();
    this.scene.refreshStations();
    this.panel.refresh();
    this.refreshHud();
    this.saves.saveLocal(this.state);
    this.saveSoon();
  }

  destroy() {
    // Exit can be pressed while the save is still loading. The flag stops
    // start() from booting a game loop that nobody can see any more.
    if (this.destroyed) return Promise.resolve(false);
    this.destroyed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearInterval(this.autosave);
    clearTimeout(this.saveTimer);
    this.sound?.stop();
    if (this.soundBtn && this._onSoundBtn) this.soundBtn.removeEventListener('click', this._onSoundBtn);
    if (this.audioMenu && this._onAudioInput) this.audioMenu.removeEventListener('input', this._onAudioInput);
    if (this._onAudioOutside) document.removeEventListener('pointerdown', this._onAudioOutside);
    if (this._onAudioKey) document.removeEventListener('keydown', this._onAudioKey);
    if (this._onUiClick) document.removeEventListener('click', this._onUiClick);
    clearTimeout(this.saveDebounce);
    if (this._onVisibility) document.removeEventListener('visibilitychange', this._onVisibility);
    if (this._onPageHide) window.removeEventListener('pagehide', this._onPageHide);
    const saved = this.saveNow();
    this.panel?.destroy();
    return saved;
  }
}
