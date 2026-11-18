import test from 'node:test';
import assert from 'node:assert/strict';

import { SaveService } from '../gamefile/js/SaveService.js';
import { GameState } from '../gamefile/js/GameState.js';

const storage = () => {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
};

test('saves run one at a time and the queued state is sent afterwards', async t => {
  const bodies = [];
  let releaseFirst;
  const firstReply = new Promise(resolve => { releaseFirst = () => resolve({ ok: true, status: 200 }); });
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  globalThis.localStorage = storage();
  globalThis.fetch = async (url, options) => {
    bodies.push(JSON.parse(options.body));
    return bodies.length === 1 ? firstReply : { ok: true, status: 200 };
  };

  const statuses = [];
  const saves = new SaveService({ url: 'api.php', userId: '7', onStatus: s => statuses.push(s) });
  const first = saves.push({ honey: 1 });
  const second = saves.push({ honey: 2 });

  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bodies.length, 1, 'the second request waits for the first');
  releaseFirst();
  assert.equal(await first, true);
  assert.equal(await second, true);
  assert.deepEqual(bodies, [{ honey: 1 }, { honey: 2 }], 'both states are saved in order');
  assert.deepEqual(statuses, ['Saving…', 'Saved', 'Saving…', 'Saved']);
});

test('a failed save returns false and reports the failure', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  globalThis.localStorage = storage();
  globalThis.fetch = async () => ({ ok: false, status: 500 });

  const statuses = [];
  const saves = new SaveService({ url: 'api.php', userId: '7', onStatus: s => statuses.push(s) });
  assert.equal(await saves.push({ honey: 1 }), false);
  assert.deepEqual(statuses, ['Saving…', 'Save failed']);
});

test('load falls back to the local copy when the server has no valid save', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  const store = storage();
  globalThis.localStorage = store;
  const state = new GameState().toJSON();
  state.honey = 321;
  store.setItem('beediner:7', JSON.stringify(state));
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });

  const statuses = [];
  const saves = new SaveService({ url: 'api.php', userId: '7', onStatus: s => statuses.push(s) });
  const loaded = await saves.load();
  assert.equal(loaded.honey, 321);
  assert.equal(saves.loadedFrom, 'local');
  assert.deepEqual(statuses, ['Offline copy']);
});

test('pushNow sends a keepalive request and writes the local backup', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  const store = storage();
  globalThis.localStorage = store;
  let captured = null;
  globalThis.fetch = async (url, options) => { captured = { url, options }; return { ok: true }; };

  const saves = new SaveService({ url: 'api.php', userId: '7' });
  saves.pushNow({ honey: 77 });
  assert.equal(captured.options.keepalive, true);
  assert.equal(JSON.parse(captured.options.body).honey, 77);
  assert.equal(JSON.parse(store.getItem('beediner:7')).honey, 77);
});
