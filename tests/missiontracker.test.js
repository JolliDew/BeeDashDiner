import test from 'node:test';
import assert from 'node:assert/strict';

import { GameState } from '../gamefile/js/GameState.js';
import { MissionTracker } from '../gamefile/js/MissionTracker.js';
import { MISSIONS } from '../gamefile/js/missions.js';

class FakeGame {
  constructor(state) {
    this.state = state;
    this.rewards = [];
  }
  grantReward(reward, label) {
    this.rewards.push({ reward, label });
    if (reward.honey) this.state.addHoney(reward.honey);
    if (reward.diamonds) this.state.diamonds += reward.diamonds;
  }
}

const trackerFor = state => {
  const game = new FakeGame(state);
  return { game, tracker: new MissionTracker(game) };
};

test('already-finished level 1 missions auto-complete and pay out once', () => {
  const state = new GameState();
  const { game, tracker } = trackerFor(state);

  state.stats.served = 5;
  state.staff = 2;
  state.stations[0].recipe = 2;

  assert.equal(tracker.check(), true);
  assert.equal(state.missions.index, 3);
  assert.deepEqual(state.missions.done, MISSIONS.slice(0, 3).map(m => m.id));
  assert.equal(tracker.levelComplete(1), true);
  assert.equal(state.diamonds, 2);
  assert.equal(state.honey, 50 + 100 + 100 + 80);
  assert.equal(game.rewards.length, 3);

  assert.equal(tracker.check(), false);
  assert.equal(game.rewards.length, 3);
});

test('missions for the next level wait until the player advances', () => {
  const state = new GameState();
  const { tracker } = trackerFor(state);

  state.stats.served = 1e6;
  state.stats.earned = 1e9;
  state.stats.tips = 1e6;
  state.stations.forEach(s => {
    s.unlocked = true;
    s.recipe = 10;
  });
  state.staff = 12;
  state.upgrades = { tipChance: 10, queue: 10, walkSpeed: 5, cookSpeed: 5, profitX2: 1 };

  tracker.check();
  assert.equal(state.missions.index, 3);
  assert.equal(tracker.levelComplete(1), true);
  assert.equal(tracker.levelComplete(2), false);

  state.advanceLevel();
  tracker.check();
  assert.equal(state.missions.index, 6);
  assert.equal(tracker.levelComplete(2), true);
  assert.equal(tracker.levelComplete(3), false);

  state.advanceLevel();
  tracker.check();
  assert.equal(state.missions.index, 9);
  assert.equal(tracker.levelComplete(3), true);

  state.advanceLevel();
  tracker.check();
  assert.equal(state.missions.index, 12);
  assert.equal(tracker.levelComplete(4), true);
});

test('a station upgraded out of order still completes its mission automatically', () => {
  const state = new GameState();
  state.jumpToLevel(10);
  const { tracker } = trackerFor(state);

  // The player mastered stations 2, 3 and 4 before station 1.
  state.stations.forEach((s, i) => {
    s.unlocked = true;
    if (i >= 1) s.recipe = 10;
  });
  state.staff = 12;
  state.stats.served = 100;
  state.stats.earned = 500000;

  tracker.check();
  assert.equal(tracker.levelComplete(10), true);
  assert.equal(state.missions.done.length, MISSIONS.length);
  assert.equal(state.missions.finished, true);
  assert.equal(state.stations[0].recipe, 0);
  assert.ok(state.missions.done.includes('l10_master3'));
});

test('finishing the last level pays the final reward exactly once', () => {
  const state = new GameState();
  state.jumpToLevel(10);
  const { game, tracker } = trackerFor(state);

  state.stations.forEach(s => {
    s.unlocked = true;
    s.recipe = 10;
  });
  state.staff = 12;
  state.stats.served = 1e6;
  state.stats.earned = 1e9;

  assert.equal(tracker.check(), true);
  const finalRewards = game.rewards.filter(r => r.label === 'Game complete!');
  assert.equal(finalRewards.length, 1);
  assert.equal(finalRewards[0].reward.honey, 20000);
  assert.equal(finalRewards[0].reward.diamonds, 10);

  assert.equal(tracker.check(), false);
  assert.equal(game.rewards.filter(r => r.label === 'Game complete!').length, 1);
});

test('progress is clamped to the mission target for the UI bar', () => {
  const state = new GameState();
  const { tracker } = trackerFor(state);
  state.stats.served = 999;
  const p = tracker.progress(tracker.current);
  assert.equal(p.current, tracker.current.target);
  assert.equal(p.target, tracker.current.target);
});

test('a save whose index points at an older tier skips it without paying twice', () => {
  const state = new GameState();
  state.level = 2;
  state.missions = { index: 0, done: [], finished: false };
  const { game, tracker } = trackerFor(state);

  tracker.check();
  assert.equal(state.missions.index, 3);
  assert.equal(game.rewards.length, 0);
  assert.equal(state.missions.done.length, 0);
});
