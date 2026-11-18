import test from 'node:test';
import assert from 'node:assert/strict';

import { Customer } from '../gamefile/js/entities.js';

function fakeEl() {
  const classes = new Set();
  return {
    innerHTML: '',
    classes,
    classList: {
      add: c => classes.add(c),
      remove: c => classes.delete(c),
      toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
      contains: c => classes.has(c),
    },
    animate() {},
    remove() {},
  };
}

function fakeScene() {
  return {
    doorX: 7, doorY: 93, aisleX: 17, aisleY: 86,
    economy: { walkTime: .2 },
    seatX: () => 50,
    seatY: () => 70,
    itemIcon: () => '🍰',
    freed: null,
    freeSeat(c) { this.freed = c; },
    refreshStations() {},
  };
}

test('a guest walks in, waits, celebrates, and leaves through the door', () => {
  const el = fakeEl();
  const scene = fakeScene();
  const c = new Customer(el, 0, 1, '🦋', scene.doorX, scene.doorY);

  assert.equal(c.state, 'enter');
  assert.ok(el.classes.has('walking'), 'guests walk in instead of popping in');
  assert.equal(el.innerHTML.includes('bub'), false, 'no order bubble before seating');

  let steps = 0;
  while (c.state === 'enter' && steps++ < 100) c.update(.05, scene);
  assert.equal(c.state, 'wait');
  assert.equal(c.x, 50);
  assert.equal(c.y, 70);
  assert.ok(el.classes.has('walking') === false, 'walking stops at the chair');
  assert.ok(el.innerHTML.includes('bub'), 'the order bubble appears once seated');

  c.served(2);
  assert.equal(c.state, 'happy');
  assert.equal(c.tip, 2);
  c.update(.05, scene);
  assert.ok(el.innerHTML.includes('heart'));

  while (c.state === 'happy' && steps++ < 200) c.update(.05, scene);
  assert.equal(c.state, 'leave');
  assert.equal(scene.freed, null, 'the chair stays reserved while the guest walks out');

  while (scene.freed !== c && steps++ < 300) c.update(.05, scene);
  assert.equal(scene.freed, c, 'the chair is freed when the guest reaches the aisle');

  let alive = true;
  while (alive && steps++ < 500) alive = c.update(.05, scene);
  assert.equal(c.state, 'exit');
  assert.ok(steps < 500, 'the guest eventually leaves the scene');
});
