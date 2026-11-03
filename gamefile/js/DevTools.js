/** Developer panel: free honey, infinite honey, jump between locations, speed up time. */
export class DevTools {
  constructor(root, game) {
    this.game = game;
    this.panel = root.querySelector('#dev');
    this.toggle = root.querySelector('#devbtn');
    this.toggle.hidden = false;
    this.panel.innerHTML = `<b>DEV</b>
      <button data-d="add1000">+1k</button><button data-d="add100000">+100k</button><button data-d="add10000000">+10M</button>
      <button data-d="inf">∞ honey</button>
      <button data-d="prev">◀ Location</button><button data-d="next">Location ▶</button>
      <button data-d="unlock">Unlock all</button><button data-d="max">Max all</button>
      <button data-d="x1" class="on">×1</button><button data-d="x5">×5</button><button data-d="x20">×20</button>
      <button data-d="reset">Reset save</button>`;
    this.toggle.onclick = () => { this.panel.hidden = !this.panel.hidden; };
    this.panel.addEventListener('click', e => this.onClick(e));
  }

  onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset.d, g = this.game, st = g.state;
    if (d.startsWith('add')) st.honey += +d.slice(3);
    else if (d === 'inf') { st.infinite = !st.infinite; b.classList.toggle('on', st.infinite); }
    else if (d === 'prev') g.goToLocation(st.location - 1);
    else if (d === 'next') g.goToLocation(st.location + 1);
    else if (d === 'unlock' || d === 'max') g.devUpgradeAll(d === 'max');
    else if (d[0] === 'x') {
      g.timeScale = +d.slice(1);
      this.panel.querySelectorAll('[data-d^=x]').forEach(x => x.classList.toggle('on', x === b));
    } else if (d === 'reset') g.resetProgress();
    g.changed();
  }
}
