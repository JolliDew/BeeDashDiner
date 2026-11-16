import { ITEMS, LOCATIONS, BEES, BALANCE as B, LEVELS, MAX_LEVEL, MAX_SLOTS, MILESTONES, levelLocation, ASSETS, art, fmt } from './config.js';
import { GLOBAL_UPGRADES } from './upgrades.js';
import { COSMETICS } from './cosmetics.js';

const BTN = 'style="white-space:pre-line;min-width:96px"';

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
    this.mountModals();
  }
  get state() { return this.game.state; }
  get eco() { return this.game.economy; }
  get tracker() { return this.game.tracker; }
  icon(i) { const it = ITEMS[this.state.location][i]; return art(ASSETS.items[it[1]], it[0]); }

  mountModals() {
    document.querySelectorAll('[data-bee-modals]').forEach(x => x.remove());
    const rows = GLOBAL_UPGRADES.map(def => `
      <div class="list-group-item" id="ug${def.id}">
        <div class="d-flex justify-content-between align-items-center">
          <div class="mr-3">
            <span class="mr-2">${def.icon}</span><strong>${def.name}</strong>
            <small class="text-muted ml-1" id="lg${def.id}"></small>
            <p class="small text-muted mb-0" id="dg${def.id}"></p>
          </div>
          <button type="button" class="btn btn-sm btn-warning" data-a="g${def.id}" id="bg${def.id}" ${BTN}></button>
        </div>
      </div>`).join('');
    this.modals = document.createElement('div');
    this.modals.setAttribute('data-bee-modals', '');
    this.modals.innerHTML =
      modalShell('stationModal', 'Station', '<div id="sm-body"></div>') +
      modalShell('globalModal', 'Global upgrades',
        `<p class="small text-muted">Shared by the whole restaurant.</p><div class="list-group">${rows}</div>`) +
      modalShell('cosmeticsModal', '🎨 Cosmetics',
        `<p class="small mb-2" id="cm-dia"></p><div class="list-group" id="cosmetics"></div>`);
    document.body.appendChild(this.modals);
    this.modals.addEventListener('click', e => this.onClick(e));
  }

  destroy() {
    this.modals?.remove();
    document.querySelectorAll('.modal-backdrop').forEach(x => x.remove());
    document.body.classList.remove('modal-open');
  }

  selectStation(i) {
    this.selected = i;
    this.refreshStationModal();
  }

  build() {
    this._missionSig = ''; this._cosSig = '';
    let h = `<div class="mission" id="mission">
      <div class="m-head"><span class="m-kicker">Mission</span><b id="m-title"></b></div>
      <div class="m-text" id="m-text"></div>
      <div class="m-bar"><i id="m-bar"></i></div>
      <div class="m-meta"><span id="m-progress"></span><span id="m-reward"></span></div>
      <div class="m-list" id="m-list"></div>
    </div>`;
    h += `<button id="next" data-a="n"></button><div class="note" id="next-note"></div>`;

    h += '<div class="section-title">Staff <small>bees work at any station</small></div>';
    h += `<div class="upg global">
      <div class="uh"><div class="ic">🐝</div><div class="nm">Hive bees<small id="staff-info"></small></div></div>
      <div class="ur"><button data-a="h" id="bh"></button><p class="ds" id="dh"></p></div>
    </div>`;

    h += '<div class="section-title">Upgrades</div>';
    h += `<div class="dock">
      <button type="button" class="btn btn-primary dock-btn" data-toggle="modal" data-target="#globalModal">✨ Global upgrades <span class="badge badge-success" id="dot-global" hidden>!</span></button>
      <button type="button" class="btn btn-info dock-btn" data-toggle="modal" data-target="#cosmeticsModal">🎨 Cosmetics <span class="badge badge-success" id="dot-cos" hidden>!</span></button>
    </div>`;
    h += '<div class="note">Tap a station in the kitchen to upgrade it.</div>';

    this.el.innerHTML = h;
    this.refresh();
  }

  text(id, t) {
    const e = document.getElementById(id);
    if (e && e.textContent !== t) e.textContent = t;
  }

  html(id, h) {
    const e = document.getElementById(id);
    if (e && e.innerHTML !== h) e.innerHTML = h;
  }

  button(id, t, disabled) {
    const b = document.getElementById(id);
    if (!b) return;
    this.text(id, t);
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

  refreshStaff() {
    const st = this.state, eco = this.eco, cap = eco.staffCap();
    this.text('staff-info', `${st.staff} bees · ${cap} worker slots open`);
    if (st.staff >= cap) {
      this.button('bh', `Bees ${st.staff}/${cap}\nMAX`, true);
      this.text('dh', cap >= B.maxBees
        ? 'The whole hive is working.'
        : 'Every worker slot has a bee. Reach recipe milestones to open more slots.');
    } else {
      const cost = eco.staffCost();
      this.button('bh', `Hire bee ${st.staff}/${cap}\n${fmt(cost)}`, !st.canAfford(cost));
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
        ? `<p class="mb-3" id="sm-info"></p>
           <div class="d-flex justify-content-between align-items-center mb-4">
             <p class="small text-muted mb-0 mr-3" id="sm-recipe-d"></p>
             <button type="button" class="btn btn-warning" data-a="s${i}" id="sm-recipe" ${BTN}></button>
           </div>
           <h6>Milestones</h6>
           <ul class="list-unstyled mb-0" id="sm-miles"></ul>`
        : `<div class="d-flex justify-content-between align-items-center">
             <p class="small text-muted mb-0 mr-3" id="sm-unlock-d"></p>
             <button type="button" class="btn btn-warning" data-a="u${i}" id="sm-unlock" ${BTN}></button>
           </div>`);
    }

    if (!s.unlocked) {
      this.button('sm-unlock', `Unlock\n${fmt(eco.unlockCost(i))}`,
        (i > 0 && !st.stations[i - 1].unlocked) || !st.canAfford(eco.unlockCost(i)));
      this.text('sm-unlock-d', `Opens a ${name} station with one worker slot. Needs the previous station first.`);
      return;
    }

    this.text('sm-info', `${kind.acc} ${kind.name} station · ${fmt(eco.price(i))} honey · ${eco.cookTime(i).toFixed(1)}s cook · ${eco.slots(i)}/${MAX_SLOTS} worker slots`);

    const maxed = s.recipe >= B.maxRecipe;
    this.button('sm-recipe', maxed ? `Recipe ${s.recipe}/${B.maxRecipe}\nMAX` : `Recipe ${s.recipe}/${B.maxRecipe}\n${fmt(eco.recipeCost(i))}`,
      maxed || !st.canAfford(eco.recipeCost(i)));
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
      this.text('lg' + def.id, `Lv ${level}/${def.maxLevel}`);
      if (!unlocked) {
        this.button('bg' + def.id, `Unlocks Lv ${def.unlockLevel}`, true);
        this.text('dg' + def.id, `Unlocks at level ${def.unlockLevel}. ${def.describe(level)}`);
      } else if (maxed) {
        this.button('bg' + def.id, `Lv ${level}/${def.maxLevel}\nMAX`, true);
        this.text('dg' + def.id, 'Fully upgraded.');
      } else {
        const cost = eco.globalCost(def);
        this.button('bg' + def.id, `Lv ${level}/${def.maxLevel}\n${fmt(cost)}`, !st.canAfford(cost));
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
      const label = isOn ? 'Unequip' : isOwned ? 'Equip' : `Buy\n💎 ${def.cost}`;
      const cls = isOn ? 'btn-outline-warning' : isOwned ? 'btn-success' : 'btn-warning';
      return `<div class="list-group-item d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center">
          <span class="mr-3" style="font-size:26px">${def.icon}</span>
          <div><strong>${def.name}</strong>
            <div class="small text-muted">${isOwned ? (isOn ? 'Equipped by every bee' : 'Owned') : def.blurb}</div></div>
        </div>
        <button type="button" class="btn btn-sm ${cls}" data-a="c${def.id}" ${BTN} ${!isOwned && !canBuy ? 'disabled' : ''}>${label}</button>
      </div>`;
    }).join(''));
  }

  /** "!" badges on the modal buttons when something inside is affordable. */
  refreshDots() {
    const st = this.state, eco = this.eco;
    const g = GLOBAL_UPGRADES.some(d => eco.globalUnlocked(d) && (st.upgrades[d.id] || 0) < d.maxLevel && st.canAfford(eco.globalCost(d)));
    const c = COSMETICS.some(d => !st.cosmetics.owned.includes(d.id) && st.diamonds >= d.cost);
    const eg = document.getElementById('dot-global'), ec = document.getElementById('dot-cos');
    if (eg) eg.hidden = !g;
    if (ec) ec.hidden = !c;
  }

  refreshNext() {
    const st = this.state;
    const nextLevel = st.level + 1;
    const nextLoc = levelLocation(nextLevel);
    const moving = st.level < MAX_LEVEL && nextLoc !== st.location;
    const note = document.getElementById('next-note');

    if (st.level >= MAX_LEVEL) {
      const done = st.missions.finished;
      this.button('next', done ? 'Game complete 🎉' : 'Finish the final missions', true);
      if (note) note.textContent = done ? 'Thanks for playing!' : 'The Royal Hive still has work to do.';
      return;
    }

    if (!this.tracker.levelComplete()) {
      this.button('next', `Complete all Level ${st.level} missions`, true);
      if (note) note.textContent = 'Missions are your guide. Finish them to unlock the next level.';
      return;
    }

    if (moving && !st.stations.every(s => s.unlocked)) {
      this.button('next', 'Unlock every station first', true);
      if (note) note.textContent = `Every station must be open before moving to ${LOCATIONS[nextLoc]}.`;
      return;
    }

    const cost = moving ? this.eco.nextCost() : 0;
    if (moving && !st.canAfford(cost)) {
      this.button('next', `Need ${fmt(cost)} honey to move`, true);
      if (note) note.textContent = `Save up for the move to ${LOCATIONS[nextLoc]}.`;
      return;
    }

    this.button('next', `Advance to Level ${nextLevel}${moving ? ` · Move to ${LOCATIONS[nextLoc]}` : ''}`, false);
    if (note) note.textContent = moving
      ? `Moving resets station recipes. Honey, bees and global upgrades carry over.`
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
