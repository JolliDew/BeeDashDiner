import test from 'node:test';
import assert from 'node:assert/strict';

import { pickJob } from '../gamefile/js/WorkerAI.js';

const customer = (item, waitTime, extra = {}) => ({
  item,
  waitTime,
  state: 'wait',
  claimedBy: null,
  ...extra,
});

test('an idle worker with no customers gets no job', () => {
  assert.equal(pickJob([], 0), null);
  assert.equal(pickJob([customer(0, 2, { state: 'leave' })], 0), null);
  assert.equal(pickJob([customer(0, 2, { claimedBy: {} })], 0), null);
});

test('a worker serves its home station before helping elsewhere', () => {
  const own = customer(1, 1);
  const other = customer(0, 99);
  assert.equal(pickJob([other, own], 1), own);
});

test('when home is empty the worker helps the longest-waiting customer', () => {
  const short = customer(0, 1);
  const long = customer(2, 9);
  const medium = customer(1, 4);
  assert.equal(pickJob([short, long, medium], 3), long);
});

test('claimed and departing customers are ignored even at home', () => {
  const ownClaimed = customer(0, 50, { claimedBy: {} });
  const ownLeaving = customer(0, 40, { state: 'leave' });
  const other = customer(1, 3);
  assert.equal(pickJob([ownClaimed, ownLeaving, other], 0), other);
});

test('the first of equally long waits wins, so selection is stable', () => {
  const a = customer(0, 5);
  const b = customer(1, 5);
  assert.equal(pickJob([a, b], 2), a);
});

test('a customer walking in is not available yet', () => {
  const walking = customer(0, 0, { state: 'in' });
  const waiting = customer(1, 0.1);
  assert.equal(pickJob([walking, waiting], 0), waiting);
});
