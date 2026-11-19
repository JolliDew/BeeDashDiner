import test from 'node:test';
import assert from 'node:assert/strict';

import { GameState, Station } from '../gamefile/js/GameState.js';
import { BALANCE as B, firstLevelForLocation } from '../gamefile/js/config.js';
import { MISSIONS, firstMissionIndex } from '../gamefile/js/missions.js';

const upgrades = (over = {}) => ({
  tipChance: 0, queue: 0, walkSpeed: 0, cookSpeed: 0, profitX2: 0, ...over,
});

function v1Save(location, stations) {
  return {
    honey: 1234,
    location,
    stations: stations.map(([unlocked, staff, recipe]) => ({ unlocked, staff, recipe })),
  };
}

test('a new game starts at level 1 with one worker and no upgrades', () => {
  const s = new GameState();
  assert.equal(s.version, 3);
  assert.equal(s.level, 1);
  assert.equal(s.location, 0);
  assert.equal(s.diamonds, 0);
  assert.equal(s.staff, 1);
  assert.equal(s.missions.index, 0);
  assert.deepEqual(s.upgrades, upgrades());
  assert.deepEqual(s.stats, { served: 0, earned: 0, tips: 0, tipHoney: 0 });
  assert.equal(s.stations[0].unlocked, true);
  assert.deepEqual(s.stations[0].toJSON(), { unlocked: true, recipe: 0 });
});

test('a v3 save round-trips through JSON without losing anything', () => {
  const s = new GameState();
  s.level = 6;
  s.setLocation(1);
  s.honey = 4321.5;
  s.diamonds = 7;
  s.staff = 3;
  s.upgrades = upgrades({ tipChance: 3, queue: 2, walkSpeed: 1, cookSpeed: 2, profitX2: 1 });
  s.missions = { index: 15, done: MISSIONS.slice(0, 15).map(m => m.id), finished: false };
  s.stats = { served: 42, earned: 9000, tips: 9, tipHoney: 77 };
  s.cosmetics = { owned: ['bee_bow'], equipped: { bee: 'bee_bow', theme: '' } };
  s.stations[0].recipe = 4;
  s.stations[1].unlocked = true;
  s.stations[1].recipe = 2;

  const copy = GameState.fromJSON(JSON.parse(JSON.stringify(s)));
  assert.equal(copy.level, 6);
  assert.equal(copy.location, 1);
  assert.equal(copy.honey, 4321.5);
  assert.equal(copy.diamonds, 7);
  assert.equal(copy.staff, 3);
  assert.deepEqual(copy.upgrades, s.upgrades);
  assert.deepEqual(copy.stats, s.stats);
  assert.deepEqual(copy.cosmetics, s.cosmetics);
  assert.equal(copy.stations.length, 4);
  assert.equal(copy.stations[0].recipe, 4);
  assert.deepEqual(copy.stations[0].toJSON(), { unlocked: true, recipe: 4 });
});

test('old per-station saves migrate staff and late-game upgrades to the global model', () => {
  const hive = GameState.fromJSON(v1Save(1, [[true, 2, 3], [true, 1, 1], [false, 0, 0], [false, 0, 0]]));
  assert.equal(hive.level, firstLevelForLocation(1));
  assert.equal(hive.location, 1);
  assert.equal(hive.honey, 1234);
  assert.equal(hive.staff, 3);
  assert.equal(hive.stations[0].recipe, 3);
  assert.equal(hive.missions.index, firstMissionIndex(hive.level));
  assert.deepEqual(hive.upgrades, upgrades());

  const legacyV2 = GameState.fromJSON({
    version: 2,
    level: 6,
    location: 1,
    honey: 10,
    stations: [
      { unlocked: true, staff: 2, recipe: 6, workLvl: 2, profitX2: 1 },
      { unlocked: true, staff: 1, recipe: 2, workLvl: 4, profitX2: 0 },
      { unlocked: false, staff: 0, recipe: 0 },
      { unlocked: false, staff: 0, recipe: 0 },
    ],
    upgrades: { tipChance: 2, queue: 1, walkSpeed: 1, workerSlot: 1 },
  });
  assert.equal(legacyV2.staff, 3);
  assert.equal(legacyV2.upgrades.tipChance, 2);
  assert.equal(legacyV2.upgrades.cookSpeed, 4);
  assert.equal(legacyV2.upgrades.profitX2, 1);
  assert.equal('workerSlot' in legacyV2.upgrades, false);
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
    version: 3,
    level: 8,
    location: 0,
    honey: 10,
    stations: [
      { unlocked: true, recipe: 9 },
      { unlocked: true, recipe: 2 },
      { unlocked: true, recipe: 1 }
    ]
  });
  assert.equal(s.level, 1);
  assert.equal(s.location, 0);
  assert.equal(s.stations[0].recipe, 9);
});

test('stations open in order and staff never exceeds the open worker slots', () => {
  const s = GameState.fromJSON({
    version: 3,
    level: 1,
    location: 0,
    honey: -50,
    diamonds: -2,
    staff: 99,
    stations: [
      { unlocked: true, recipe: 10 },
      { unlocked: false, recipe: 9 },
      { unlocked: true, recipe: 10 }
    ],
    stats: { served: -1, earned: -1, tips: -1, tipHoney: -1 }
  });

  assert.equal(s.honey, 0);
  assert.equal(s.diamonds, 0);
  assert.equal(s.stations[0].unlocked, true);
  assert.equal(s.stations[0].recipe, B.maxRecipe);
  assert.equal(s.stations[1].unlocked, false);
  assert.equal(s.stations[1].recipe, 0);
  assert.equal(s.stations[2].unlocked, false, 'a later station cannot skip a locked one');
  assert.equal(s.staff, 4, 'recipe 10 opens 4 slots');
  assert.deepEqual(s.stats, { served: 0, earned: 0, tips: 0, tipHoney: 0 });
});

test('mission ids are rebuilt from the index so old fake ids cannot repay a reward', () => {
  const s = GameState.fromJSON({
    version: 3,
    level: 3,
    location: 0,
    stations: [
      { unlocked: true, recipe: 1 },
      { unlocked: true, recipe: 1 },
      { unlocked: true, recipe: 1 }
    ],
    missions: { index: 7, done: ['fake', 'l1_serve5', 'fake'], finished: true }
  });
  assert.equal(s.missions.index, 7);
  assert.deepEqual(s.missions.done, MISSIONS.slice(0, 7).map(m => m.id));
  assert.equal(s.missions.finished, false);
});

test('a stale mission index below the current level is repaired', () => {
  const s = GameState.fromJSON({
    version: 3,
    level: 3,
    location: 0,
    stations: [
      { unlocked: true, recipe: 1 },
      { unlocked: true, recipe: 1 },
      { unlocked: true, recipe: 1 }
    ],
    missions: { index: 0, done: [] }
  });
  assert.equal(s.missions.index, firstMissionIndex(3));
  assert.equal(s.missions.finished, false);
});

test('a crafted mission index cannot jump past the missions of the current level', () => {
  const s = GameState.fromJSON({
    version: 3,
    level: 1,
    location: 0,
    stations: [
      { unlocked: true, recipe: 1 },
      { unlocked: false, recipe: 0 },
      { unlocked: false, recipe: 0 }
    ],
    missions: { index: 30, done: [], finished: true }
  });
  assert.equal(s.missions.index, 3, 'only the three missions of level 1 may be done');
  assert.equal(s.missions.done.length, 3);
  assert.equal(s.missions.finished, false, 'the game is not complete after one level');
});

test('a save with a hole in the station list is rejected', () => {
  const broken = {
    version: 3,
    level: 1,
    location: 0,
    honey: 10,
    stations: [
      { unlocked: true, recipe: 1 },
      null,
      { unlocked: false, recipe: 0 }
    ]
  };
  assert.equal(GameState.isValid(broken), false);
  const s = GameState.fromJSON(broken);
  assert.equal(s.level, 1);
  assert.equal(s.honey, 50, 'a broken save falls back to a fresh game');
});

test('moving restaurants resets stations and staff but keeps global upgrades', () => {
  const s = new GameState();
  s.honey = 100;
  s.diamonds = 4;
  s.staff = 3;
  s.upgrades = upgrades({ queue: 2, walkSpeed: 1 });
  s.stations[0].recipe = 4;
  s.cosmetics.owned.push('bee_bow');

  s.level = 4;
  assert.equal(s.advanceLevel(), true);
  assert.equal(s.level, 5);
  assert.equal(s.location, 1);
  assert.equal(s.stations.length, 4);
  assert.equal(s.stations[0].unlocked, true);
  assert.equal(s.stations[0].recipe, 0);
  assert.equal(s.staff, B.startStaff);
  assert.deepEqual(s.upgrades, upgrades({ queue: 2, walkSpeed: 1 }));
  assert.equal(s.honey, 100);
  assert.equal(s.diamonds, 4);
  assert.deepEqual(s.cosmetics.owned, ['bee_bow']);

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
  assert.equal(json.version, 3);
});

test('station serialization only contains unlocked and recipe', () => {
  const st = new Station(true, 2, 3, 4, 1);
  assert.deepEqual(st.toJSON(), { unlocked: true, recipe: 2 });
});
