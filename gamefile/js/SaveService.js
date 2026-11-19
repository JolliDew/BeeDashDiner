import { GameState } from './GameState.js';

/** Saves to the server (api.php, tied to the logged-in account) with a local backup. */
export class SaveService {
  constructor({ url, userId, csrf = '', onStatus = () => {} }) {
    this.url = url;
    // The save endpoint rejects a POST without this token, so a malicious
    // page cannot overwrite the signed-in player's progress.
    this.csrf = csrf;
    this.key = 'beediner:' + userId;
    this.seqKey = this.key + ':seq';
    this.onStatus = onStatus;
    // Saves run one at a time. Overlapping requests used to race each other,
    // so a late "Saved" could overwrite a newer "Saving…" in the HUD.
    this.queue = Promise.resolve();
    this.loadedFrom = 'new';
    // Every save carries a number that only ever grows. The server keeps the
    // newest number it has seen, so a slow request that arrives late can no
    // longer undo a more recent save.
    this.seq = this.readSeq();
  }

  /* ----------------------------------------------------------- write number */

  /** The last write number this browser knows about. */
  readSeq() {
    try {
      const n = parseInt(localStorage.getItem(this.seqKey) || '0', 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch (e) { return 0; }
  }

  /** Never go backwards. The server's number wins when it is higher. */
  rememberSeq(seq) {
    const n = Math.trunc(Number(seq)) || 0;
    if (n > this.seq) {
      this.seq = n;
      try { localStorage.setItem(this.seqKey, String(n)); } catch (e) { /* ignore */ }
    }
    return this.seq;
  }

  /** The number for the next save. It always grows. */
  nextSeq() {
    this.rememberSeq(this.readSeq());
    return this.rememberSeq(this.seq + 1);
  }

  /* ------------------------------------------------------------------ load */

  async load() {
    let payload = null;
    let answered = false;
    try {
      const r = await fetch(this.url + '?action=load', { credentials: 'same-origin', cache: 'no-store' });
      if (r.ok) {
        payload = await r.json();
        answered = true;
      }
    } catch (e) { /* offline: fall back to the local copy */ }

    if (answered) {
      if (GameState.isValid(payload)) {
        this.rememberSeq(payload.seq);
        this.loadedFrom = 'server';
        this.onStatus('Loaded');
        return GameState.fromJSON(payload);
      }
      // The server answered and has no usable row, so it is the truth. Any
      // local copy is stale (after "Restart progress", for example) and must
      // not be resurrected.
      this.clearLocal();
      this.loadedFrom = 'new';
      this.onStatus('New game');
      return new GameState();
    }

    // The server could not be reached, so the local backup is the best copy.
    try {
      const d = JSON.parse(localStorage.getItem(this.key));
      if (GameState.isValid(d)) {
        this.loadedFrom = 'local';
        this.onStatus('Offline copy');
        return GameState.fromJSON(d);
      }
    } catch (e) { /* ignore */ }
    this.loadedFrom = 'new';
    this.onStatus('New game');
    return new GameState();
  }

  saveLocal(state) {
    try { localStorage.setItem(this.key, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  clearLocal() {
    try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ }
  }

  /* ------------------------------------------------------------------ save */

  push(state) {
    this.saveLocal(state);
    const seq = this.nextSeq();
    const job = this.queue.then(() => this.send(state, seq));
    // Keep the chain alive even if one job throws, without changing the
    // result the caller receives.
    this.queue = job.catch(() => false);
    return job;
  }

  /**
   * Fire-and-forget save that survives page hide/unload. It is not queued:
   * on `pagehide` there may be no time for an earlier request to finish.
   * The write number keeps it safe: the server ignores it when a newer save
   * has already landed.
   */
  pushNow(state) {
    this.saveLocal(state);
    const seq = this.nextSeq();
    let request;
    try {
      request = fetch(this.url + '?action=save', {
        method: 'POST', credentials: 'same-origin', keepalive: true,
        headers: this.headers(), body: this.body(state, seq)
      });
    } catch (e) {
      return Promise.resolve(false); // the local backup is already written
    }
    return request.then(r => this.handleResponse(r)).catch(() => {
      this.onStatus('Save failed');
      return false;
    });
  }

  /** One save request. Resolves to true when the server accepted the save. */
  async send(state, seq) {
    this.onStatus('Saving…');
    let controller = null;
    let timer = null;
    try {
      controller = new AbortController();
      timer = setTimeout(() => controller.abort(), 12000);
      const r = await fetch(this.url + '?action=save', {
        method: 'POST', credentials: 'same-origin',
        headers: this.headers(), body: this.body(state, seq),
        signal: controller.signal
      });
      return await this.handleResponse(r);
    } catch (e) {
      this.onStatus(controller && controller.signal.aborted ? 'Save timed out' : 'Offline');
      return false;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** JSON plus the session's CSRF token when the page supplied one. */
  headers() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.csrf) headers['X-CSRF-Token'] = this.csrf;
    return headers;
  }

  /** The request body: the plain save plus the write number. */
  body(state, seq) {
    const plain = state && typeof state.toJSON === 'function' ? state.toJSON() : state;
    return JSON.stringify({ ...plain, seq });
  }

  /** Turn a save response into "the server accepted it". */
  async handleResponse(r) {
    if (r.status === 409) {
      // A newer save already reached the server, so this one was too old to
      // store. Take the server's number so the next save is newer too. The
      // server still holds a save, so the HUD stays calm.
      let data = null;
      try { data = await r.json(); } catch (e) { /* ignore */ }
      if (data && data.seq !== undefined) this.rememberSeq(data.seq);
      this.onStatus('Saved');
      return true;
    }
    this.onStatus(r.ok ? 'Saved' : r.status === 401 ? 'Log in again' : 'Save failed');
    return r.ok;
  }
}
