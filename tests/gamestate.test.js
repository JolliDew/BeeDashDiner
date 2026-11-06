import test from 'node:test';
import assert from 'node:assert/strict';

import { GameState, Station } from '../gamefile/js/GameState.js';
import { BALANCE as B, firstLevelForLocation } from '../gamefile/js/config.js';
import { firstMissionIndex } from '../gamefile/js/missions.js';

function v1Save(location, stations) {
  return {
    honey: 1234,
    location,
    stations: stations.map(([unlocked, staff, recipe]) => ({ unlocked, staff, recipe })),
  };
}

test('a new game starts at level 1 with one worker and no upgrades', () => {
  const s = new GameState();
  assert.equal(s.version, 2);
  assert.equal(s.level, 1);
  assert.equal(s.location, 0);
  assert.equal(s.diamonds, 0);
  assert.equal(s.missions.index, 0);
  assert.deepEqual(s.upgrades, { tipChance: 0, queue: 0, walkSpeed: 0, workerSlot: 0 });
  assert.deepEqual(s.stats, { served: 0, earned: 0, tips: 0, tipHoney: 0 });
  assert.equal(s.stations[0].unlocked, true);
  assert.equal(s.stations[0].staff, 1);
});

test('a v2 save round-trips through JSON without losing anything', () => {
  const s = new GameState();
  s.level = 6;
  s.setLocation(1); // creates the four Hive Cafe stations
  s.honey = 4321.5;
  s.diamonds = 7;
  s.upgrades = { tipChance: 3, queue: 2, walkSpeed: 1, workerSlot: 1 };
  s.missions = { index: 15, done: ['fake'], finished: false };
  s.stats = { served: 42, earned: 9000, tips: 9, tipHoney: 77 };
  s.cosmetics = { owned: ['hat_gold'], equipped: { bee: 'hat_gold', theme: '' } };
  s.stations[0].staff = 3;
  s.stations[0].recipe = 4;
  s.stations[0].workLvl = 2;
  s.stations[0].profitX2 = 1;

  const copy = GameState.fromJSON(JSON.parse(JSON.stringify(s)));
  assert.equal(copy.level, 6);
  assert.equal(copy.location, 1);
  assert.equal(copy.honey, 4321.5);
  assert.equal(copy.diamonds, 7);
  assert.deepEqual(copy.upgrades, s.upgrades);
  assert.deepEqual(copy.stats, s.stats);
  assert.deepEqual(copy.cosmetics, s.cosmetics);
  assert.equal(copy.stations.length, 4);
  assert.equal(copy.stations[0].staff, 3);
  assert.equal(copy.stations[0].recipe, 4);
  assert.equal(copy.stations[0].workLvl, 2);
  assert.equal(copy.stations[0].profitX2, 1);
});

test('old location-only saves migrate to the matching tier and keep progress', () => {
  const hive = GameState.fromJSON(v1Save(1, [[true, 2, 3], [true, 1, 1], [false, 0, 0], [false, 0, 0]]));
  assert.equal(hive.level, firstLevelForLocation(1));
  assert.equal(hive.location, 1);
  assert.equal(hive.honey, 1234);
  assert.equal(hive.stations[0].staff, 2);
  assert.equal(hive.stations[0].recipe, 3);
  assert.equal(hive.missions.index, firstMissionIndex(hive.level));
  assert.equal(hive.missions.done.length, firstMissionIndex(hive.level));
  assert.deepEqual(hive.upgrades, { tipChance: 0, queue: 0, walkSpeed: 0, workerSlot: 0 });

  const royal = GameState.fromJSON(v1Save(2, [
    [true, 3, 8], [true, 2, 5], [true, 1, 4], [true, 1, 2], [false, 0, 0]
  ]));
  assert.equal(royal.level, firstLevelForLocation(2));
  assert.equal(royal.stations[0].recipe, 8);
  assert.equal(royal.missions.index, firstMissionIndex(royal.level));
});

test('invalid saves fall back to a fresh game instead of throwing', () => {
  for (const bad of [null, {}, { location: 99, stations: [] }, { location: 0, stations: [] }]) {
    const s = GameState.fromJSON(bad);
    assert.equal(s.level, 1);
    assert.equal(s.location, 0);
    assert.equal(s.stations.length, 3);
  }
});

test('a level that does not match its location is repaired from the location', () => {
  const s = GameState.fromJSON({
    version: 2,
    level: 8,
    location: 0,
    honey: 10,
    stations: [
      { unlocked: true, staff: 3, recipe: 9 },
      { unlocked: true, staff: 1, recipe: 2 },
      { unlocked: true, staff: 1, recipe: 1 }
    ]
  });
  assert.equal(s.level, 1);
  assert.equal(s.location, 0);
  assert.equal(s.stations[0].recipe, 9);
});

test('open stations always get at least one worker and values are clamped', () => {
  const s = GameState.fromJSON({
    version: 2,
    level: 1,
    location: 0,
    honey: -50,
    diamonds: -2,
    stations: [
      { unlocked: false, staff: 0, recipe: 99, workLvl: 99, profitX2: 9 },
      { unlocked: true, staff: 0, recipe: -5, workLvl: -5, profitX2: -1 },
      { unlocked: false, staff: 9, recipe: 4, workLvl: 2, profitX2: 1 }
    ],
    stats: { served: -1, earned: -1, tips: -1, tipHoney: -1 }
  });

  assert.equal(s.honey, 0);
  assert.equal(s.diamonds, 0);
  assert.equal(s.stations[0].unlocked, true);
  assert.equal(s.stations[0].staff, 1);
  assert.equal(s.stations[0].recipe, B.maxRecipe);
  assert.equal(s.stations[0].workLvl, 5);
  assert.equal(s.stations[0].profitX2, 1);
  assert.equal(s.stations[1].staff, 1);
  assert.equal(s.stations[2].staff, 0);
  assert.deepEqual(s.stats, { served: 0, earned: 0, tips: 0, tipHoney: 0 });
});

test('a stale mission index below the current level is repaired without duplicate rewards', () => {
  const s = GameState.fromJSON({
    version: 2,
    level: 3,
    location: 0,
    stations: [
      { unlocked: true, staff: 1, recipe: 1 },
      { unlocked: true, staff: 1, recipe: 1 },
      { unlocked: true, staff: 1, recipe: 1 }
    ],
    missions: { index: 0, done: [] }
  });
  assert.equal(s.missions.index, firstMissionIndex(3));
  assert.equal(s.missions.done.length, firstMissionIndex(3));
  assert.equal(s.missions.finished, false);
});

test('advancing levels follows the 3-location layout and resets the restaurant', () => {
  const s = new GameState();
  assert.equal(s.advanceLevel(), true);
  assert.equal(s.level, 2);
  assert.equal(s.location, 0);

  s.level = 4;
  assert.equal(s.advanceLevel(), true);
  assert.equal(s.level, 5);
  assert.equal(s.location, 1);
  assert.equal(s.stations.length, 4);
  assert.equal(s.stations[0].unlocked, true);

  s.level = 7;
  assert.equal(s.advanceLevel(), true);
  assert.equal(s.level, 8);
  assert.equal(s.location, 2);
  assert.equal(s.stations.length, 5);

  s.level = 10;
  assert.equal(s.advanceLevel(), false);
});

test('jumpToLevel keeps level, location and missions consistent', () => {
  const s = new GameState();
  s.jumpToLevel(9);
  assert.equal(s.level, 9);
  assert.equal(s.location, 2);
  assert.equal(s.missions.index, firstMissionIndex(9));
  assert.equal(s.missions.done.length, firstMissionIndex(9));
  assert.equal(s.missions.finished, false);
});

test('saving never includes the dev-only infinite money flag', () => {
  const s = new GameState();
  s.infinite = true;
  const json = s.toJSON();
  assert.equal('infinite' in json, false);
  assert.equal(json.version, 2);
});

test('station serialization includes the new per-station fields', () => {
  const st = new Station(true, 2, 3, 4, 1);
  assert.deepEqual(st.toJSON(), {
    unlocked: true, staff: 2, recipe: 3, workLvl: 4, profitX2: 1
  });
});
