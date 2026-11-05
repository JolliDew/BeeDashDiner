import test from 'node:test';
import assert from 'node:assert/strict';

import { GameState } from '../gamefile/js/GameState.js';
import { Economy } from '../gamefile/js/Economy.js';
import { BALANCE as B } from '../gamefile/js/config.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);

test('recipe price includes the level-5 milestone and the golden recipe', () => {
  const state = new GameState();
  const eco = new Economy(state);

  close(eco.price(0, 4), 4 * (1 + B.priceBonus * 4));
  close(eco.price(0, 5), 4 * (1 + B.priceBonus * 5) * (1 + B.milestone5Price));

  state.stations[0].profitX2 = 1;
  close(
    eco.price(0, 10),
    4 * (1 + B.priceBonus * 10) * (1 + B.milestone5Price) * 2
  );
});

test('recipe level 10 and kitchen drills shorten cooking, with a floor', () => {
  const state = new GameState();
  const eco = new Economy(state);

  close(eco.cookTime(0, 9), B.cookSecs[0] * B.cookDiscount ** 9);
  close(
    eco.cookTime(0, 10),
    B.cookSecs[0] * B.cookDiscount ** 10 * (1 - B.milestone10Cook)
  );

  state.stations[0].recipe = 10;
  state.stations[0].workLvl = 5;
  close(eco.cookTime(0), Math.max(.4, B.cookSecs[0] * B.cookDiscount ** 10 * (1 - B.milestone10Cook) * (1 - B.cookStep * 5)));
  assert.ok(eco.cookTime(0) >= .4);
});

test('tips scale with the tip-jar upgrade and stay in the configured range', () => {
  const state = new GameState();
  const eco = new Economy(state);

  close(eco.tipChance, B.tips.baseChance);
  state.upgrades.tipChance = 5;
  close(eco.tipChance, B.tips.baseChance + B.tips.chanceStep * 5);
  state.upgrades.tipChance = 99;
  close(eco.tipChance, B.tips.maxChance);

  close(eco.tipAmount(100, 0), 100 * B.tips.minPct);
  close(eco.tipAmount(100, 1), 100 * B.tips.maxPct);
});

test('worker cap starts at 3 and the extra-worker upgrade adds one', () => {
  const state = new GameState();
  const eco = new Economy(state);
  assert.equal(eco.workerCap(), B.baseBees);
  state.upgrades.workerSlot = 1;
  assert.equal(eco.workerCap(), B.maxBees);
  state.upgrades.workerSlot = 5;
  assert.equal(eco.workerCap(), B.maxBees);
});

test('queue and walking upgrades change seats and travel time', () => {
  const state = new GameState();
  const eco = new Economy(state);
  assert.equal(eco.seats, B.seatBase);
  state.upgrades.queue = 3;
  assert.equal(eco.seats, B.seatBase + B.queueStep * 3);

  close(eco.walkTime, B.walk);
  state.upgrades.walkSpeed = 5;
  close(eco.walkTime, B.walk * (1 - B.walkStep * 5));

  state.location = 2;
  assert.equal(eco.seats, B.seatBase + B.seatStep * 2 + B.queueStep * 3);
});

test('upgrade costs grow and scale with the location', () => {
  const state = new GameState();
  const eco = new Economy(state);
  const tip = eco.globalDefs.find(d => d.id === 'tipChance');

  assert.equal(eco.globalCost(tip), tip.baseCost);
  state.upgrades.tipChance = 1;
  assert.equal(eco.globalCost(tip), Math.round(tip.baseCost * tip.growth));

  state.location = 1;
  state.upgrades.tipChance = 0;
  assert.equal(eco.globalCost(tip), Math.round(tip.baseCost * B.costX));
});

test('station upgrades unlock at their configured level and get costlier per slot', () => {
  const state = new GameState();
  const eco = new Economy(state);
  const cook = eco.stationDefs.find(d => d.id === 'cookSpeed');
  const profit = eco.stationDefs.find(d => d.id === 'profitX2');

  assert.equal(eco.stationUpgradeUnlocked(cook), false);
  state.level = cook.unlockLevel;
  assert.equal(eco.stationUpgradeUnlocked(cook), true);

  const first = eco.stationUpgradeCost(0, cook);
  const second = eco.stationUpgradeCost(1, cook);
  assert.ok(second > first);

  state.stations[0].workLvl = 1;
  assert.ok(eco.stationUpgradeCost(0, cook) > first);
  assert.equal(profit.field, 'profitX2');
});
