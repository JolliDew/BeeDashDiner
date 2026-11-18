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
    this.loadedFrom = 'new';
  }

  async load() {
    try {
      const r = await fetch(this.url + '?action=load', { credentials: 'same-origin', cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (GameState.isValid(d)) {
          this.loadedFrom = 'server';
          this.onStatus('Loaded');
          return GameState.fromJSON(d);
        }
      }
    } catch (e) { /* offline: fall back to the local copy */ }

    // A server with no row (or a malformed row) must not throw away a good
    // local backup. This is what made a quick refresh look like a reset.
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

  push(state, keepalive = false) {
    this.saveLocal(state);
    const job = this.queue.then(async () => {
      this.onStatus('Saving…');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const r = await fetch(this.url + '?action=save', {
          method: 'POST', credentials: 'same-origin', keepalive,
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state),
          signal: controller.signal
        });
        this.onStatus(r.ok ? 'Saved' : r.status === 401 ? 'Log in again' : 'Save failed');
        return r.ok;
      } catch (e) {
        this.onStatus(controller.signal.aborted ? 'Save timed out' : 'Offline');
        return false;
      } finally {
        clearTimeout(timer);
      }
    });
    // Keep the chain alive even if one job throws, without changing the
    // result the caller receives.
    this.queue = job.catch(() => false);
    return job;
  }

  /**
   * Fire-and-forget save that survives page hide/unload. It is not queued:
   * on `pagehide` there may be no time for an earlier request to finish.
   */
  pushNow(state) {
    this.saveLocal(state);
    try {
      fetch(this.url + '?action=save', {
        method: 'POST', credentials: 'same-origin', keepalive: true,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state)
      }).catch(() => {});
    } catch (e) { /* the local backup is already written */ }
  }
}
