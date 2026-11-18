import { ITEMS, LOCATIONS, BEES, BALANCE as B, LEVELS, MAX_LEVEL, MAX_SLOTS, MILESTONES, nextMilestone, levelLocation, ASSETS, art, fmt } from './config.js';
import { GLOBAL_UPGRADES } from './upgrades.js';
import { COSMETICS } from './cosmetics.js';

const BTN = 'style="white-space:pre-line;min-width:96px"';
const honey = () => art(ASSETS.honeyIcon, '🍯');
/** Currency shown inside upgrade buttons. */
const cost = c => `<span class="cost">${honey()} ${fmt(c)}</span>`;
/** Level indicator: a row of pips. Kept separate from the buttons. */
const pips = (n, max) => `<span class="pips">${Array.from({ length: max }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
const lvl = (label, n, max) => `<span class="lvl-label">${label}</span>${pips(n, max)}<b>${n}/${max}</b>`;

const modalShell = (id, title, body) => `
<div class="modal fade" id="${id}" tabindex="-1" role="dialog" aria-labelledby="${id}Title" aria-hidden="true">
  <div class="modal-dialog modal-dialog-scrollable" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="${id}Title">${title}</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>`;

const missionBody = `
<div class="mission" id="mission">
  <div class="m-head"><span class="m-kicker">Mission</span><b id="m-title"></b></div>
  <div class="m-text" id="m-text"></div>
  <div class="m-bar"><i id="m-bar"></i></div>
  <div class="m-meta"><span id="m-progress"></span><span id="m-reward"></span></div>
  <div class="m-list" id="m-list"></div>
</div>
<div class="mission-actions">
  <button type="button" id="next" data-a="n"></button>
  <div class="note" id="next-note"></div>
</div>`;

export class UpgradePanel {
  constructor(el, game) {
    this.el = el; this.game = game;
    this.selected = null;
    this._missionSig = ''; this._cosSig = ''; this._stationSig = ''; this._milesSig = '';
    el.addEventListener('click', e => this.onClick(e));
    game.scene.host.addEventListener('click', e => {
      const stn = e.target.closest('.stn');
      if (stn) this.selectStation(+stn.dataset.station);
    });
    // Stations are divs, so give keyboard users the same click behaviour.
    game.scene.host.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const stn = e.target.closest('.stn');
      if (!stn) return;
      e.preventDefault();
      this.selectStation(+stn.dataset.station);
      stn.click();
    });
    this.mountModals();
  }
  get state() { return this.game.state; }
  get eco() { return this.game.economy; }
  get tracker() { return this.game.tracker; }
  icon(i) { const it = ITEMS[this.state.location][i]; return art(ASSETS.items[it[1]], it[0]); }

  /** Station, global (staff + restaurant upgrades) and cosmetics modals live on <body>. */
  mountModals() {
    document.querySelectorAll('[data-bee-modals]').forEach(x => x.remove());
    const row = (icon, name, levelId, descId, btnId, action) => `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-center">
          <div class="mr-3 flex-grow-1">
            <span class="mr-2">${icon}</span><strong>${name}</strong>
            <div class="lvl" id="${levelId}"></div>
            <p class="small text-muted mb-0" id="${descId}"></p>
          </div>
          <button type="button" class="btn btn-sm btn-warning upbtn" data-a="${action}" id="${btnId}" ${BTN}></button>
        </div>
      </div>`;
    const staffRow = row('🐝', 'Hive bees', 'staff-lvl', 'dh', 'bh', 'h');
    const rows = GLOBAL_UPGRADES.map(def => row(def.icon, def.name, 'lg' + def.id, 'dg' + def.id, 'bg' + def.id, 'g' + def.id)).join('');
    this.modals = document.createElement('div');
    this.modals.setAttribute('data-bee-modals', '');
    this.modals.innerHTML =
      modalShell('stationModal', 'Station', '<div id="sm-body"></div>') +
      modalShell('missionModal', '🎯 Mission', missionBody) +
      modalShell('globalModal', '⬆️ Upgrades',
        `<p class="small text-muted">Tap a station in the kitchen to upgrade it. Staff and global upgrades below are shared by the whole restaurant.</p>
         <h6>Staff</h6><div class="list-group mb-3">${staffRow}</div>
         <h6>Global upgrades</h6><div class="list-group">${rows}</div>`) +
      modalShell('cosmeticsModal', '🛍️ Shop',
        `<p class="small mb-2" id="cm-dia"></p><div class="list-group" id="cosmetics"></div>`);
    document.body.appendChild(this.modals);
    this.modals.addEventListener('click', e => this.onClick(e));
    // Only one sheet/dialog may be visible at a time. UI clicks are already
    // blocked by the backdrop, but keyboard/programmatic opens should not
    // stack two modals on top of each other. Bootstrap bubbles this event
    // to document, so listen there and remove it again in destroy().
    this._onModalShow = e => {
      this.modals.querySelectorAll('.modal.show').forEach(m => {
        if (m !== e.target && window.jQuery) window.jQuery(m).modal('hide');
      });
    };
    // Bootstrap fires this through jQuery, so bind through jQuery as well.
    if (window.jQuery) window.jQuery(document).on('show.bs.modal', this._onModalShow);
  }

  destroy() {
    if (this._onModalShow && window.jQuery) window.jQuery(document).off('show.bs.modal', this._onModalShow);
    this.modals?.remove();
    document.querySelectorAll('.modal-backdrop').forEach(x => x.remove());
    document.body.classList.remove('modal-open');
  }

  selectStation(i) {
    this.selected = i;
    this.refreshStationModal();
  }

  build() {
    this._missionSig = ''; this._cosSig = ''; this._stationSig = '';
    // Moving to a restaurant with fewer stations must not leave the modal
    // pointed at an index that no longer exists.
    if (this.selected !== null && this.selected >= this.state.stations.length) this.selected = 0;
    this.el.innerHTML = `<div class="dock" role="group" aria-label="Game menus">
      <button type="button" class="dock-btn" data-toggle="modal" data-target="#missionModal">
        <span class="dock-ico" aria-hidden="true">🎯</span><span class="dock-label">Mission</span>
        <span class="badge badge-success dock-dot" id="dot-mission" hidden>!</span>
      </button>
      <button type="button" class="dock-btn" data-toggle="modal" data-target="#globalModal">
        <span class="dock-ico" aria-hidden="true">⬆️</span><span class="dock-label">Upgrades</span>
        <span class="badge badge-success dock-dot" id="dot-global" hidden>!</span>
      </button>
      <button type="button" class="dock-btn" data-toggle="modal" data-target="#cosmeticsModal">
        <span class="dock-ico" aria-hidden="true">🛍️</span><span class="dock-label">Shop</span>
        <span class="badge badge-success dock-dot" id="dot-cos" hidden>!</span>
      </button>
    </div>`;
    this.refresh();
  }

  text(id, t) { const e = document.getElementById(id); if (e && e.textContent !== t) e.textContent = t; }
  html(id, h) { const e = document.getElementById(id); if (e && e.innerHTML !== h) e.innerHTML = h; }
  /** Upgrade button: only the action and its price (with the currency icon). */
  btn(id, h, disabled) {
    const b = document.getElementById(id);
    if (!b) return;
    if (b.innerHTML !== h) b.innerHTML = h;
    b.disabled = !!disabled;
  }
  rewardText(r) {
    const parts = [];
    if (r?.honey) parts.push(`+${fmt(r.honey)} honey`);
    if (r?.diamonds) parts.push(`+${r.diamonds}💎`);
    return parts.join(' · ');
  }

  refresh() {
    this.refreshMission();
    this.refreshStaff();
    this.refreshStationModal();
    this.refreshGlobal();
    this.refreshCosmetics();
    this.refreshDots();
    this.refreshNext();
  }

  refreshMission() {
    const tr = this.tracker;
    const level = this.state.level;
    const list = tr.missionsForLevel(level);
    const done = list.filter(m => tr.isDone(m)).length;
    const complete = tr.levelComplete(level);

    if (complete) {
      const final = level >= MAX_LEVEL;
      this.text('m-title', final ? 'All 10 levels complete!' : `Level ${level} complete!`);
      this.text('m-text', final
        ? 'You finished the game. The restaurant is yours. 🎉'
        : `Advance to Level ${level + 1} when you are ready.`);
      this.text('m-progress', `${list.length}/${list.length}`);
      this.text('m-reward', this.rewardText(LEVELS[level - 1]?.reward));
      const bar = document.getElementById('m-bar');
      if (bar) bar.style.width = '100%';
    } else {
      const m = tr.current;
      const p = tr.progress(m);
      this.text('m-title', m ? m.text : '—');
      this.text('m-text', m ? `Reward: ${this.rewardText(m.reward) || 'progress'}` : '');
      this.text('m-progress', m ? `${p.current}/${p.target}` : '');
      this.text('m-reward', `Level ${level} · ${done}/${list.length} missions`);
      const bar = document.getElementById('m-bar');
      if (bar) bar.style.width = (m ? Math.min(100, p.current / p.target * 100) : 0) + '%';
    }

    const sig = `${level}|${tr.current?.id || 'done'}|${this.state.missions.done.length}|${complete}`;
    if (sig !== this._missionSig) {
      this._missionSig = sig;
      this.html('m-list', list.map(m => {
        const isDone = tr.isDone(m);
        const now = !complete && tr.current?.id === m.id;
        return `<div class="m-item${isDone ? ' done' : ''}${now ? ' now' : ''}">
          <span class="tick">${isDone ? '✓' : now ? '▸' : '○'}</span>${m.text}</div>`;
      }).join(''));
    }
  }

  /** Global staff: lives inside the Global upgrades modal. */
  refreshStaff() {
    const st = this.state, eco = this.eco, cap = eco.staffCap();
    this.html('staff-lvl', `<span class="lvl-label">Bees hired</span><b>${st.staff}/${cap}</b><span class="lvl-note">worker slots open</span>`);
    if (st.staff >= cap) {
      this.btn('bh', 'MAX', true);
      this.text('dh', cap >= B.maxBees
        ? 'The whole hive is working.'
        : 'Every worker slot has a bee. Upgrade recipes or unlock stations to open more slots.');
    } else {
      const c = eco.staffCost();
      this.btn('bh', `Hire${cost(c)}`, !st.canAfford(c));
      this.text('dh', `Bees work at any station. Serves ${eco.perMinute()} → ${eco.perMinute(st.staff + 1)} customers per minute.`);
    }
  }

  refreshStationModal() {
    const i = this.selected, st = this.state, eco = this.eco;
    const s = i === null ? null : st.stations[i];
    if (!s) return;
    const kind = BEES[i], name = ITEMS[st.location][i][1];

    const sig = `${st.location}|${i}|${s.unlocked}`;
    if (sig !== this._stationSig) {
      this._stationSig = sig; this._milesSig = '';
      this.html('stationModalTitle', `${this.icon(i)} ${name}`);
      this.html('sm-body', s.unlocked
        ? `<p class="mb-2" id="sm-info"></p>
           <div class="lvl" id="sm-lvl"></div>
           <div class="lvl" id="sm-slots"></div>
           <div class="lvl-note" id="sm-work"></div>
           <div class="lvl-note mb-3" id="sm-next"></div>
           <div class="d-flex justify-content-between align-items-center mb-4">
             <p class="small text-muted mb-0 mr-3" id="sm-recipe-d"></p>
             <button type="button" class="btn btn-warning upbtn" data-a="s${i}" id="sm-recipe" ${BTN}></button>
           </div>
           <h6>Milestones</h6>
           <ul class="list-unstyled mb-0" id="sm-miles"></ul>`
        : `<div class="d-flex justify-content-between align-items-center">
             <p class="small text-muted mb-0 mr-3" id="sm-unlock-d"></p>
             <button type="button" class="btn btn-warning upbtn" data-a="u${i}" id="sm-unlock" ${BTN}></button>
           </div>`);
    }

    if (!s.unlocked) {
      const c = eco.unlockCost(i);
      this.btn('sm-unlock', `Unlock${cost(c)}`, (i > 0 && !st.stations[i - 1].unlocked) || !st.canAfford(c));
      this.text('sm-unlock-d', `Opens a ${name} station with one worker slot. Needs the previous station first.`);
      return;
    }

    const slots = eco.slots(i), busy = Math.min(this.game.scene.workingAt(i), slots);
    this.text('sm-info', `${kind.acc} ${kind.name} station · ${fmt(eco.price(i))} honey per dish · ${eco.cookTime(i).toFixed(1)}s cook`);
    this.html('sm-lvl', lvl('Recipe level', s.recipe, B.maxRecipe));
    this.html('sm-slots', lvl('Worker slots', slots, MAX_SLOTS));
    this.text('sm-work', `🐝 ${busy}/${slots} bees working here right now`);

    const next = nextMilestone(s.recipe);
    this.text('sm-next', next
      ? `Next milestone at recipe ${next.recipe}: ${next.type === 'slot' ? '+1 worker slot' : '2x profit'}.`
      : 'All recipe milestones reached.');

    const maxed = s.recipe >= B.maxRecipe, c = eco.recipeCost(i);
    this.btn('sm-recipe', maxed ? 'MAX' : `Upgrade${cost(c)}`, maxed || !st.canAfford(c));
    this.text('sm-recipe-d', maxed ? 'Recipe fully perfected.'
      : `Better recipe: +30% price (${fmt(eco.price(i))} → ${fmt(eco.price(i, s.recipe + 1))}) and 10% faster cooking (${eco.cookTime(i).toFixed(1)}s → ${eco.cookTime(i, s.recipe + 1).toFixed(1)}s).`);

    if (this._milesSig !== String(s.recipe)) {
      this._milesSig = String(s.recipe);
      this.html('sm-miles', MILESTONES.map(m => {
        const got = s.recipe >= m.recipe;
        return `<li class="${got ? 'text-success' : 'text-muted'}">${got ? '✓' : '○'} Recipe ${m.recipe}: ${m.type === 'slot' ? '+1 worker slot' : 'x2 profit'}</li>`;
      }).join(''));
    }
  }

  refreshGlobal() {
    const st = this.state, eco = this.eco;
    GLOBAL_UPGRADES.forEach(def => {
      const level = st.upgrades[def.id] || 0;
      const unlocked = st.level >= def.unlockLevel;
      const maxed = level >= def.maxLevel;
      this.html('lg' + def.id, lvl('Level', level, def.maxLevel));
      if (!unlocked) {
        this.btn('bg' + def.id, `🔒 Lv ${def.unlockLevel}`, true);
        this.text('dg' + def.id, `Unlocks at level ${def.unlockLevel}. ${def.describe(level)}`);
      } else if (maxed) {
        this.btn('bg' + def.id, 'MAX', true);
        this.text('dg' + def.id, 'Fully upgraded.');
      } else {
        const c = eco.globalCost(def);
        this.btn('bg' + def.id, `Upgrade${cost(c)}`, !st.canAfford(c));
        this.text('dg' + def.id, `Now: ${def.effect(level)} → ${def.effect(level + 1)}. ${def.describe(level + 1)}`);
      }
    });
  }

  refreshCosmetics() {
    const cos = this.state.cosmetics;
    const owned = new Set(cos.owned);
    this.text('cm-dia', `💎 ${fmt(this.state.diamonds)} diamonds to spend`);
    const sig = `${this.state.diamonds}|${[...owned].sort().join(',')}|${JSON.stringify(cos.equipped)}`;
    if (sig === this._cosSig) return;
    this._cosSig = sig;

    this.html('cosmetics', COSMETICS.map(def => {
      const isOwned = owned.has(def.id);
      const isOn = (cos.equipped[def.kind] || '') === def.id;
      const canBuy = this.state.diamonds >= def.cost;
      const label = isOn ? 'Unequip' : isOwned ? 'Equip' : `Buy<span class="cost">💎 ${def.cost}</span>`;
      const cls = isOn ? 'btn-outline-warning' : isOwned ? 'btn-success' : 'btn-warning';
      return `<div class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <span class="mr-3" style="font-size:26px">${def.icon}</span>
          <div><strong>${def.name}</strong>
            <div class="small text-muted">${isOwned ? (isOn ? 'Equipped by every bee' : 'Owned') : def.blurb}</div></div>
        </div>
        <button type="button" class="btn btn-sm upbtn ${cls}" data-a="c${def.id}" ${BTN} ${!isOwned && !canBuy ? 'disabled' : ''}>${label}</button>
      </div>`;
    }).join(''));
  }

  /** "!" badges on the modal buttons when something inside is affordable. */
  refreshDots() {
    const st = this.state, eco = this.eco;
    const hire = st.staff < eco.staffCap() && st.canAfford(eco.staffCost());
    const g = hire || GLOBAL_UPGRADES.some(d => eco.globalUnlocked(d) && (st.upgrades[d.id] || 0) < d.maxLevel && st.canAfford(eco.globalCost(d)));
    const c = COSMETICS.some(d => !st.cosmetics.owned.includes(d.id) && st.diamonds >= d.cost);
    const m = this.tracker.levelComplete();
    const eg = document.getElementById('dot-global'), ec = document.getElementById('dot-cos');
    const em = document.getElementById('dot-mission');
    if (eg) eg.hidden = !g;
    if (ec) ec.hidden = !c;
    if (em) em.hidden = !m;
  }

  refreshNext() {
    const st = this.state;
    const nextLevel = st.level + 1;
    const nextLoc = levelLocation(nextLevel);
    const moving = st.level < MAX_LEVEL && nextLoc !== st.location;
    const note = document.getElementById('next-note');
    const set = (label, disabled) => {
      const b = document.getElementById('next');
      if (b) { if (b.textContent !== label) b.textContent = label; b.disabled = disabled; }
    };

    if (st.level >= MAX_LEVEL) {
      const done = st.missions.finished;
      set(done ? 'Game complete 🎉' : 'Finish the final missions', true);
      if (note) note.textContent = done ? 'Thanks for playing!' : 'The Royal Hive still has work to do.';
      return;
    }
    if (!this.tracker.levelComplete()) {
      set(`Complete all Level ${st.level} missions`, true);
      if (note) note.textContent = 'Missions are your guide. Finish them to unlock the next level.';
      return;
    }
    if (moving && !st.stations.every(s => s.unlocked)) {
      set('Unlock every station first', true);
      if (note) note.textContent = `Every station must be open before moving to ${LOCATIONS[nextLoc]}.`;
      return;
    }
    const c = moving ? this.eco.nextCost() : 0;
    if (moving && !st.canAfford(c)) {
      set(`Need ${fmt(c)} honey to move`, true);
      if (note) note.textContent = `Save up for the move to ${LOCATIONS[nextLoc]}.`;
      return;
    }
    set(`Advance to Level ${nextLevel}${moving ? ` · Move to ${LOCATIONS[nextLoc]}` : ''}`, false);
    if (note) note.textContent = moving
      ? 'A new restaurant starts with fresh stations and one bee. Honey, diamonds, cosmetics, missions and global upgrades carry over.'
      : `Level ${st.level} reward is paid when you advance.`;
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b || b.disabled || !b.dataset.a) return;
    const kind = b.dataset.a[0], rest = b.dataset.a.slice(1);
    if (kind === 'n') this.game.advanceLevel();
    else if (kind === 'u') this.game.unlockStation(+rest);
    else if (kind === 'h') this.game.hireBee();
    else if (kind === 's') this.game.upgradeRecipe(+rest);
    else if (kind === 'g') this.game.buyGlobal(rest);
    else if (kind === 'c') this.game.cosmeticAction(rest);
  }
}
