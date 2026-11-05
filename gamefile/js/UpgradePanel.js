import { ITEMS, LOCATIONS, BEES, BALANCE as B, LEVELS, MAX_LEVEL, levelLocation, ASSETS, art, fmt } from './config.js';
import { GLOBAL_UPGRADES } from './upgrades.js';
import { COSMETICS } from './cosmetics.js';

/** The mission card, station upgrades, global upgrades and the advance button. */
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

    h += '<div class="section-title">Stations</div>';
    this.state.stations.forEach((s, i) => {
      const name = ITEMS[this.state.location][i][1];
      const head = `<div class="uh"><div class="ic">${this.icon(i)}</div><div class="nm">${name}<small id="i${i}"></small></div></div>`;
      if (s.unlocked) {
        h += `<div class="upg">${head}
          <div class="ur"><button data-a="f${i}" id="bf${i}"></button><p class="ds" id="df${i}"></p></div>
          <div class="ur"><button data-a="s${i}" id="bs${i}"></button><p class="ds" id="ds${i}"></p></div>
          <small class="ms" id="dm${i}"></small>
          <div class="ur late" id="rw${i}" hidden><button data-a="w${i}" id="bw${i}"></button><p class="ds" id="dw${i}"></p></div>
          <div class="ur late" id="rp${i}" hidden><button data-a="p${i}" id="bp${i}"></button><p class="ds" id="dp${i}"></p></div>
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

  hidden(id, value) {
    const e = document.getElementById(id);
    if (e) e.hidden = !!value;
  }

  rewardText(r) {
    const parts = [];
    if (r?.honey) parts.push(`+${fmt(r.honey)} honey`);
    if (r?.diamonds) parts.push(`+${r.diamonds}💎`);
    return parts.join(' · ');
  }

  refresh() {
    this.refreshMission();
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

  refreshStations() {
    const st = this.state, eco = this.eco;
    st.stations.forEach((s, i) => {
      const kind = BEES[i], name = ITEMS[st.location][i][1];
      if (!s.unlocked) {
        this.text('i' + i, 'New station');
        this.button('bu' + i, `Unlock\n${fmt(eco.unlockCost(i))}`,
          (i > 0 && !st.stations[i - 1].unlocked) || !st.canAfford(eco.unlockCost(i)));
        this.text('du' + i, `Opens a ${name} station with one ${kind.name} bee. Needs the previous station first.`);
        return;
      }

      const cap = eco.workerCap();
      this.text('i' + i, `${kind.acc} ${kind.name} bees · ${fmt(eco.price(i))} honey · ${eco.cookTime(i).toFixed(1)}s cook`);
      const maxedBees = s.staff >= cap, maxedRecipe = s.recipe >= B.maxRecipe;
      this.button('bf' + i, maxedBees ? `Bees ${s.staff}/${cap}\nMAX` : `Hire bee ${s.staff}/${cap}\n${fmt(eco.beeCost(i))}`,
        maxedBees || !st.canAfford(eco.beeCost(i)));
      this.text('df' + i, maxedBees
        ? `All ${cap} ${kind.name} bees are working here.`
        : `Hire another ${kind.name} bee. Serves ${eco.perMinute(i, s.staff)} → ${eco.perMinute(i, s.staff + 1)} customers per minute.`);

      this.button('bs' + i, maxedRecipe ? `Recipe ${s.recipe}/${B.maxRecipe}\nMAX` : `Recipe ${s.recipe}/${B.maxRecipe}\n${fmt(eco.recipeCost(i))}`,
        maxedRecipe || !st.canAfford(eco.recipeCost(i)));
      this.text('ds' + i, maxedRecipe ? 'Recipe fully perfected.'
        : `Better recipe: +30% price (${fmt(eco.price(i))} → ${fmt(eco.price(i, s.recipe + 1))}) and 10% faster cooking (${eco.cookTime(i).toFixed(1)}s → ${eco.cookTime(i, s.recipe + 1).toFixed(1)}s).`);

      this.text('dm' + i, s.recipe < 5
        ? 'Milestone 5: +25% profit · Milestone 10: −15% cook time'
        : s.recipe < B.maxRecipe
          ? 'Milestone 5 reached (+25% profit) · Milestone 10 at recipe 10'
          : 'Mastered: both milestones reached.');

      // Per-station late upgrades appear on the card after their unlock level.
      const work = this.eco.stationDefs.find(d => d.id === 'cookSpeed');
      const profit = this.eco.stationDefs.find(d => d.id === 'profitX2');
      this.hidden('rw' + i, st.level < work.unlockLevel);
      if (st.level >= work.unlockLevel) {
        const lvl = s.workLvl || 0, maxed = lvl >= work.maxLevel;
        this.button('bw' + i, maxed ? `Kitchen ${lvl}/${work.maxLevel}\nMAX` : `Kitchen ${lvl}/${work.maxLevel}\n${fmt(eco.stationUpgradeCost(i, work))}`,
          maxed || !st.canAfford(eco.stationUpgradeCost(i, work)));
        this.text('dw' + i, maxed ? 'This station is as fast as it gets.'
          : `Cooking ${lvl * 4}% faster now · next level ${(lvl + 1) * 4}% faster.`);
      }

      this.hidden('rp' + i, st.level < profit.unlockLevel);
      if (st.level >= profit.unlockLevel) {
        const bought = !!s.profitX2;
        this.button('bp' + i, bought ? 'Golden recipe\nMAX' : `Golden recipe\n${fmt(eco.stationUpgradeCost(i, profit))}`,
          bought || !st.canAfford(eco.stationUpgradeCost(i, profit)));
        this.text('dp' + i, bought ? 'Every dish from this station is worth double.' : 'Double this station\'s profit forever.');
      }
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
      ? `Moving resets this restaurant's stations and upgrades. Honey carries over.`
      : `Level ${st.level} reward is paid when you advance.`;
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b || b.disabled || !b.dataset.a) return;
    const kind = b.dataset.a[0], rest = b.dataset.a.slice(1);
    if (kind === 'n') this.game.advanceLevel();
    else if (kind === 'u') this.game.unlockStation(+rest);
    else if (kind === 'f') this.game.hireBee(+rest);
    else if (kind === 's') this.game.upgradeRecipe(+rest);
    else if (kind === 'w') this.game.buyStationUpgrade(+rest, 'cookSpeed');
    else if (kind === 'p') this.game.buyStationUpgrade(+rest, 'profitX2');
    else if (kind === 'g') this.game.buyGlobal(rest);
    else if (kind === 'c') this.game.cosmeticAction(rest);
  }
}
