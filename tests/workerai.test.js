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
  assert.equal(pickJob([], [1, 1], 0), null);
  assert.equal(pickJob([customer(0, 2, { state: 'leave' })], [1, 1], 0), null);
  assert.equal(pickJob([customer(0, 2, { claimedBy: {} })], [1, 1], 0), null);
});

test('a worker serves its home station before helping elsewhere', () => {
  const own = customer(1, 1);
  const other = customer(0, 99);
  assert.equal(pickJob([other, own], [2, 2], 1), own);
});

test('when home is empty the worker helps the longest-waiting customer', () => {
  const short = customer(0, 1);
  const long = customer(2, 9);
  const medium = customer(2, 4);
  // Home is station 1, which has no customers.
  assert.equal(pickJob([short, long, medium], [1, 1, 1], 1), long);
});

test('when home is full the worker helps another station', () => {
  const home = customer(0, 50);
  const helper = customer(1, 2);
  // Station 0 has one slot and this customer already fills it.
  home.claimedBy = {};
  assert.equal(pickJob([home, helper], [1, 1], 0), helper);
});

test('claimed and departing customers are ignored even at home', () => {
  const ownClaimed = customer(0, 50, { claimedBy: {} });
  const ownLeaving = customer(0, 40, { state: 'leave' });
  const other = customer(1, 3);
  assert.equal(pickJob([ownClaimed, ownLeaving, other], [2, 2], 0), other);
});

test('the first of equally long waits wins, so selection is stable', () => {
  const a = customer(0, 5);
  const b = customer(1, 5);
  assert.equal(pickJob([a, b], [1, 1], null), a);
});

test('a customer walking in is not available yet', () => {
  const walking = customer(0, 0, { state: 'in' });
  const waiting = customer(1, 0.1);
  assert.equal(pickJob([walking, waiting], [1, 1], 0), waiting);
});

test('locked stations (zero slots) never receive a job', () => {
  const locked = customer(2, 99);
  const open = customer(0, 1);
  assert.equal(pickJob([locked, open], [1, 1, 0], 0), open);
  assert.equal(pickJob([locked], [1, 1, 0], 2), null);
});

test('bad input is ignored instead of throwing', () => {
  assert.equal(pickJob(null, [1], 0), null);
  assert.equal(pickJob([], null, 0), null);
});
