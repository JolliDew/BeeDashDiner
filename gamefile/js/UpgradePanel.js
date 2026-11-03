import { ITEMS, LOCATIONS, BEES, BALANCE as B, ASSETS, art, fmt } from './config.js';

/** The upgrade list under the scene. Buttons call purchase methods on Game. */
export class UpgradePanel {
  constructor(el, game) {
    this.el = el; this.game = game;
    el.addEventListener('click', e => this.onClick(e));
  }
  get state() { return this.game.state; }
  get eco() { return this.game.economy; }
  icon(i) { const it = ITEMS[this.state.location][i]; return art(ASSETS.items[it[1]], it[0]); }

  build() {
    let h = '';
    this.state.stations.forEach((s, i) => {
      const name = ITEMS[this.state.location][i][1];
      const head = `<div class="uh"><div class="ic">${this.icon(i)}</div><div class="nm">${name}<small id="i${i}"></small></div></div>`;
      h += `<div class="upg">${head}` + (s.unlocked
        ? `<div class="ur"><button data-a="f${i}" id="bf${i}"></button><p class="ds" id="df${i}"></p></div>
           <div class="ur"><button data-a="s${i}" id="bs${i}"></button><p class="ds" id="ds${i}"></p></div>`
        : `<div class="ur"><button data-a="u${i}" id="bu${i}"></button><p class="ds" id="du${i}"></p></div>`) + '</div>';
    });
    h += this.state.location < LOCATIONS.length - 1
      ? `<button id="next" data-a="n"></button><div class="note">Moving on resets stations and upgrades. Honey carries over.</div>`
      : `<div class="note">You've reached the Royal Hive, the final location.</div>`;
    this.el.innerHTML = h;
    this.refresh();
  }

  text(id, t) { const e = document.getElementById(id); if (e && e.textContent !== t) e.textContent = t; }
  button(id, t, disabled) { const b = document.getElementById(id); if (!b) return; this.text(id, t); b.disabled = !!disabled; }

  refresh() {
    const st = this.state, eco = this.eco;
    st.stations.forEach((s, i) => {
      const kind = BEES[i], name = ITEMS[st.location][i][1];
      if (s.unlocked) {
        this.text('i' + i, `${kind.acc} ${kind.name} bees · ${fmt(eco.price(i))} honey · ${eco.cookTime(i).toFixed(1)}s cook`);
        const maxedBees = s.staff >= B.maxBees, maxedRecipe = s.recipe >= B.maxRecipe;
        this.button('bf' + i, maxedBees ? `Bees ${s.staff}/${B.maxBees}\nMAX` : `Hire bee ${s.staff}/${B.maxBees}\n${fmt(eco.beeCost(i))}`, maxedBees || !st.canAfford(eco.beeCost(i)));
        this.text('df' + i, maxedBees ? `All ${B.maxBees} ${kind.name} bees are working here.`
          : `Hire another ${kind.name} bee to cook here. Serves ${eco.perMinute(i, s.staff)} → ${eco.perMinute(i, s.staff + 1)} customers per minute.`);
        this.button('bs' + i, maxedRecipe ? `Recipe ${s.recipe}/${B.maxRecipe}\nMAX` : `Recipe ${s.recipe}/${B.maxRecipe}\n${fmt(eco.recipeCost(i))}`, maxedRecipe || !st.canAfford(eco.recipeCost(i)));
        this.text('ds' + i, maxedRecipe ? 'Recipe fully perfected.'
          : `Better recipe: +30% price (${fmt(eco.price(i))} → ${fmt(eco.price(i, s.recipe + 1))}) and 10% faster cooking (${eco.cookTime(i).toFixed(1)}s → ${eco.cookTime(i, s.recipe + 1).toFixed(1)}s).`);
      } else {
        this.text('i' + i, 'New station');
        this.button('bu' + i, `Unlock\n${fmt(eco.unlockCost(i))}`, !st.stations[i - 1].unlocked || !st.canAfford(eco.unlockCost(i)));
        this.text('du' + i, `Opens a ${name} station with one ${kind.name} bee. Needs the previous station first.`);
      }
    });
    if (st.location < LOCATIONS.length - 1) {
      const all = st.stations.every(s => s.unlocked);
      this.button('next', all ? `Move to ${LOCATIONS[st.location + 1]} · ${fmt(eco.nextCost())}` : 'Unlock every station to move on', !all || !st.canAfford(eco.nextCost()));
    }
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const kind = b.dataset.a[0], i = +b.dataset.a.slice(1);
    if (kind === 'n') this.game.advanceLocation();
    else if (kind === 'u') this.game.unlockStation(i);
    else if (kind === 'f') this.game.hireBee(i);
    else if (kind === 's') this.game.upgradeRecipe(i);
  }
}
