/** Developer panel (shown when in-game.php has $devMode = true). */
export class DevTools {
  constructor(root, game) {
    this.game = game;
    this.panel = root.querySelector('#dev');
    this.toggle = root.querySelector('#devbtn');
    this.toggle.hidden = false;
    // The toggle opens a panel, so it reports whether that panel is open.
    this.toggle.setAttribute('aria-expanded', 'false');
    this.toggle.setAttribute('aria-controls', 'dev');
    this.panel.setAttribute('role', 'group');
    this.panel.setAttribute('aria-label', 'Developer tools');
    this.panel.innerHTML = `<b>DEV</b>
      <button data-d="honey1000">+1k 🍯</button><button data-d="honey100000">+100k 🍯</button><button data-d="honey10000000">+10M 🍯</button>
      <button data-d="dia10">+10 💎</button>
      <button data-d="inf">∞ honey</button>
      <button data-d="lvlprev">◀ Level</button><button data-d="lvlnext">Level ▶</button>
      <button data-d="missions">Complete missions</button>
      <button data-d="unlock">Unlock all</button><button data-d="max">Max all</button>
      <button data-d="x1" class="on">×1</button><button data-d="x5">×5</button><button data-d="x20">×20</button>
      <button data-d="reset">Reset save</button>`;
    this.toggle.onclick = () => {
      const open = this.panel.hidden;
      this.panel.hidden = !open;
      this.toggle.setAttribute('aria-expanded', String(open));
    };
    this.panel.addEventListener('click', e => this.onClick(e));
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset.d, g = this.game, st = g.state;
    if (d.startsWith('honey')) st.honey += +d.slice(5);       // plain honey: does not count as "earned" for missions
    else if (d.startsWith('dia')) st.diamonds += +d.slice(3);
    else if (d === 'inf') { st.infinite = !st.infinite; b.classList.toggle('on', st.infinite); }
    else if (d === 'lvlprev') g.devSetLevel(st.level - 1);
    else if (d === 'lvlnext') g.devSetLevel(st.level + 1);
    else if (d === 'missions') g.devCompleteMissions();
    else if (d === 'unlock' || d === 'max') g.devUpgradeAll(d === 'max');
    else if (d[0] === 'x') {
      g.timeScale = +d.slice(1);
      this.panel.querySelectorAll('[data-d^=x]').forEach(x => x.classList.toggle('on', x === b));
    } else if (d === 'reset') g.resetProgress();
    g.changed();
  }
}
