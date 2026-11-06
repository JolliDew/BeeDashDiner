import test from 'node:test';
import assert from 'node:assert/strict';

import { MISSIONS, missionsForLevel, firstMissionIndex } from '../gamefile/js/missions.js';
import { GameState } from '../gamefile/js/GameState.js';
import { MAX_LEVEL } from '../gamefile/js/config.js';

test('there are exactly three ordered missions for each of the ten levels', () => {
  assert.equal(MAX_LEVEL, 10);
  assert.equal(MISSIONS.length, 30);
  for (let level = 1; level <= MAX_LEVEL; level++) {
    assert.equal(missionsForLevel(level).length, 3, `level ${level}`);
    assert.equal(firstMissionIndex(level), (level - 1) * 3);
  }
  assert.equal(firstMissionIndex(MAX_LEVEL + 1), MISSIONS.length);
});

test('mission ids are unique and levels never go backwards', () => {
  const ids = new Set();
  let lastLevel = 0;
  for (const mission of MISSIONS) {
    assert.ok(!ids.has(mission.id), `duplicate id ${mission.id}`);
    ids.add(mission.id);
    assert.ok(mission.level >= lastLevel, `${mission.id} is out of order`);
    lastLevel = mission.level;
    assert.ok(mission.target > 0, `${mission.id} needs a positive target`);
    assert.ok(typeof mission.text === 'string' && mission.text.length > 0);
  }
});

test('every mission can read a fresh and a maxed state without throwing', () => {
  const fresh = new GameState();
  const maxed = new GameState();
  maxed.jumpToLevel(MAX_LEVEL);
  maxed.stats = { served: 1e9, earned: 1e12, tips: 1e9, tipHoney: 1e9 };
  maxed.upgrades = { tipChance: 10, queue: 5, walkSpeed: 5, workerSlot: 1 };
  maxed.stations.forEach(s => {
    s.unlocked = true;
    s.staff = 4;
    s.recipe = 10;
    s.workLvl = 5;
    s.profitX2 = 1;
  });

  for (const mission of MISSIONS) {
    for (const state of [fresh, maxed]) {
      const value = Number(mission.progress(state));
      assert.ok(Number.isFinite(value), `${mission.id} returned ${value}`);
      assert.ok(value >= 0, `${mission.id} returned a negative value`);
    }
  }
});
