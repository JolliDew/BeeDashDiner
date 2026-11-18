import test from 'node:test';
import assert from 'node:assert/strict';

import { SaveService } from '../gamefile/js/SaveService.js';

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
