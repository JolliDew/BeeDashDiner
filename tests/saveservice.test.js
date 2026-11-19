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
  assert.deepEqual(bodies.map(b => b.honey), [1, 2], 'both states are saved in order');
  assert.deepEqual(bodies.map(b => b.seq), [1, 2], 'every save carries a growing write number');
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

test('load uses the local copy when the server cannot be reached', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  const store = storage();
  globalThis.localStorage = store;
  const state = new GameState().toJSON();
  state.honey = 321;
  store.setItem('beediner:7', JSON.stringify(state));
  globalThis.fetch = async () => { throw new Error('offline'); };

  const statuses = [];
  const saves = new SaveService({ url: 'api.php', userId: '7', onStatus: s => statuses.push(s) });
  const loaded = await saves.load();
  assert.equal(loaded.honey, 321);
  assert.equal(saves.loadedFrom, 'local');
  assert.deepEqual(statuses, ['Offline copy']);
});

test('load starts a new game when the server has no save, even with a local copy', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  const store = storage();
  globalThis.localStorage = store;
  const state = new GameState().toJSON();
  state.honey = 5000;
  store.setItem('beediner:7', JSON.stringify(state));
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });

  const statuses = [];
  const saves = new SaveService({ url: 'api.php', userId: '7', onStatus: s => statuses.push(s) });
  const loaded = await saves.load();
  assert.equal(loaded.honey, 50, 'the stale local copy is not resurrected');
  assert.equal(loaded.level, 1);
  assert.equal(saves.loadedFrom, 'new');
  assert.deepEqual(statuses, ['New game']);
  assert.equal(store.getItem('beediner:7'), null, 'the stale local copy is deleted');
});

test('load takes the server save and its write number', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  globalThis.localStorage = storage();
  const state = new GameState().toJSON();
  state.honey = 900;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ...state, seq: 41 }) });

  const saves = new SaveService({ url: 'api.php', userId: '7' });
  const loaded = await saves.load();
  assert.equal(loaded.honey, 900);
  assert.equal(saves.loadedFrom, 'server');
  assert.equal(saves.seq, 41, 'the write number continues above the server value');
});

test('a save that is older than the stored one is not stored again', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  const bodies = [];
  globalThis.localStorage = storage();
  globalThis.fetch = async (url, options) => {
    bodies.push(JSON.parse(options.body));
    return { ok: false, status: 409, json: async () => ({ saved: false, stale: true, seq: 99 }) };
  };

  const statuses = [];
  const saves = new SaveService({ url: 'api.php', userId: '7', onStatus: s => statuses.push(s) });
  assert.equal(await saves.push({ honey: 1 }), true, 'the server keeps the newer save');
  assert.deepEqual(statuses, ['Saving…', 'Saved']);

  await saves.push({ honey: 2 });
  assert.ok(bodies[1].seq > 99, 'the next save uses a number above the one the server reported');
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

test('pushNow reports a failed keepalive so it can be retried', async t => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.localStorage;
  t.after(() => { globalThis.fetch = originalFetch; globalThis.localStorage = originalStorage; });
  globalThis.localStorage = storage();
  globalThis.fetch = async () => { throw new Error('offline'); };

  const statuses = [];
  const saves = new SaveService({ url: 'api.php', userId: '7', onStatus: s => statuses.push(s) });
  assert.equal(await saves.pushNow({ honey: 77 }), false);
  assert.deepEqual(statuses, ['Save failed']);
});
