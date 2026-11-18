import { GameState } from './GameState.js';

/** Saves to the server (api.php, tied to the logged-in account) with a local backup. */
export class SaveService {
  constructor({ url, userId, onStatus = () => {} }) {
    this.url = url;
    this.key = 'beediner:' + userId;
    this.onStatus = onStatus;
    // Saves run one at a time. Overlapping requests used to race each other,
    // so a late "Saved" could overwrite a newer "Saving…" in the HUD.
    this.queue = Promise.resolve();
  }

  async load() {
    try {
      const r = await fetch(this.url + '?action=load', { credentials: 'same-origin', cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (GameState.isValid(d)) { this.onStatus('Loaded'); return GameState.fromJSON(d); }
        this.onStatus('New game');
        return new GameState();
      }
    } catch (e) { /* offline: fall back to the local copy */ }
    try {
      const d = JSON.parse(localStorage.getItem(this.key));
      if (GameState.isValid(d)) { this.onStatus('Offline copy'); return GameState.fromJSON(d); }
    } catch (e) { /* ignore */ }
    this.onStatus('New game');
    return new GameState();
  }

  saveLocal(state) {
    try { localStorage.setItem(this.key, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  push(state, keepalive = false) {
    this.saveLocal(state);
    const job = this.queue.then(async () => {
      this.onStatus('Saving…');
      try {
        const r = await fetch(this.url + '?action=save', {
          method: 'POST', credentials: 'same-origin', keepalive,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state)
        });
        this.onStatus(r.ok ? 'Saved' : r.status === 401 ? 'Log in again' : 'Save failed');
        return r.ok;
      } catch (e) {
        this.onStatus('Offline');
        return false;
      }
    });
    // Keep the chain alive even if one job throws, without changing the
    // result the caller receives.
    this.queue = job.catch(() => false);
    return job;
  }
}
