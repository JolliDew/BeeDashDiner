import { GameState } from './GameState.js';

/** Saves to the server (MySQL via api.php, tied to the logged-in account) with a local backup. */
export class SaveService {
  constructor({ url, userId, onStatus = () => {} }) { this.url = url; this.key = 'beediner:' + userId; this.onStatus = onStatus; }

  async load() {
    try {
      const r = await fetch(this.url + '?action=load', { credentials: 'same-origin' });
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

  saveLocal(state) { try { localStorage.setItem(this.key, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  async push(state, keepalive = false) {
    this.saveLocal(state);
    try {
      const r = await fetch(this.url + '?action=save', {
        method: 'POST', credentials: 'same-origin', keepalive,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state)
      });
      this.onStatus(r.ok ? 'Saved' : r.status === 401 ? 'Log in again' : 'Save failed');
    } catch (e) { this.onStatus('Offline'); }
  }
}
