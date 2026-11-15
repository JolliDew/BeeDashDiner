import { ITEMS, LOCATIONS, BEES, BALANCE as B, LEVELS, MAX_LEVEL, MAX_SLOTS, levelLocation, nextMilestone, ASSETS, art, fmt } from './config.js';
import { GLOBAL_UPGRADES } from './upgrades.js';
import { COSMETICS } from './cosmetics.js';

export class UpgradePanel {
  constructor(el, game) {
    this.el = el; this.game = game; this._missionSig = ''; this._cosSig = '';
    el.addEventListener('click', e => this.onClick(e));
  }
  get state() { return this.game.state; }
  get eco() { return this.game.economy; }
  get tracker() { return this.game.tracker; }
  icon(i) { const it = ITEMS[this.state.location][i]; return art(ASSETS.items[it[1]], it[0]); }

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

    h += '<div class="section-title">Stations</div>';
    this.state.stations.forEach((s, i) => {
      const name = ITEMS[this.state.location][i][1];
      const head = `<div class="uh"><div class="ic">${this.icon(i)}</div><div class="nm">${name}<small id="i${i}"></small></div></div>`;
      if (s.unlocked) {
        h += `<div class="upg">${head}
          <div class="ur"><button data-a="s${i}" id="bs${i}"></button><p class="ds" id="ds${i}"></p></div>
          <small class="ms" id="dm${i}"></small>
        </div>`;
      } else {
        h += `<div class="upg">${head}
          <div class="ur"><button data-a="u${i}" id="bu${i}"></button><p class="ds" id="du${i}"></p></div>
        </div>`;
      }
    });

    h += '<div class="section-title">Global upgrades <small>shared by the whole restaurant</small></div>';
    GLOBAL_UPGRADES.forEach(def => {
      h += `<div class="upg global" id="ug${def.id}">
        <div class="uh"><div class="ic">${def.icon}</div><div class="nm">${def.name}<small id="lg${def.id}"></small></div></div>
        <div class="ur"><button data-a="g${def.id}" id="bg${def.id}"></button><p class="ds" id="dg${def.id}"></p></div>
      </div>`;
    });

    h += '<div class="section-title">Cosmetics <small>spend diamonds</small></div>';
    h += '<div class="cosmetics" id="cosmetics"></div>';

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
    this.refreshStations();
    this.refreshGlobal();
    this.refreshCosmetics();
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

  refreshStations() {
    const st = this.state, eco = this.eco;
    st.stations.forEach((s, i) => {
      const kind = BEES[i], name = ITEMS[st.location][i][1];
      if (!s.unlocked) {
        this.text('i' + i, 'New station');
        this.button('bu' + i, `Unlock\n${fmt(eco.unlockCost(i))}`,
          (i > 0 && !st.stations[i - 1].unlocked) || !st.canAfford(eco.unlockCost(i)));
        this.text('du' + i, `Opens a ${name} station with one worker slot. Needs the previous station first.`);
        return;
      }

      this.text('i' + i, `${kind.acc} ${kind.name} station · ${fmt(eco.price(i))} honey · ${eco.cookTime(i).toFixed(1)}s cook · ${eco.slots(i)}/${MAX_SLOTS} slots`);

      const maxedRecipe = s.recipe >= B.maxRecipe;
      this.button('bs' + i, maxedRecipe ? `Recipe ${s.recipe}/${B.maxRecipe}\nMAX` : `Recipe ${s.recipe}/${B.maxRecipe}\n${fmt(eco.recipeCost(i))}`,
        maxedRecipe || !st.canAfford(eco.recipeCost(i)));
      this.text('ds' + i, maxedRecipe ? 'Recipe fully perfected.'
        : `Better recipe: +30% price (${fmt(eco.price(i))} → ${fmt(eco.price(i, s.recipe + 1))}) and 10% faster cooking (${eco.cookTime(i).toFixed(1)}s → ${eco.cookTime(i, s.recipe + 1).toFixed(1)}s).`);

      const next = nextMilestone(s.recipe);
      this.text('dm' + i, next
        ? `Next milestone at recipe ${next.recipe}: ${next.type === 'slot' ? '+1 worker slot' : 'x2 profit'}`
        : 'All milestones reached.');
    });
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
    const equipped = cos.equipped.bee || '';
    const sig = `${this.state.diamonds}|${[...owned].sort().join(',')}|${equipped}`;
    if (sig === this._cosSig) return;
    this._cosSig = sig;

    this.html('cosmetics', COSMETICS.map(def => {
      const isOwned = owned.has(def.id);
      const isEquipped = equipped === def.id;
      const canBuy = this.state.diamonds >= def.cost;
      const label = isEquipped ? 'Unequip' : isOwned ? 'Equip' : `Buy\n💎 ${def.cost}`;
      return `<div class="cos${isEquipped ? ' on' : ''}">
        <span class="ci">${def.icon}</span>
        <div class="cn">${def.name}<small>${isOwned ? (isEquipped ? 'Equipped by every bee' : 'Owned') : def.blurb}</small></div>
        <button data-a="c${def.id}" ${!isOwned && !canBuy ? 'disabled' : ''}>${label}</button>
      </div>`;
    }).join(''));
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
