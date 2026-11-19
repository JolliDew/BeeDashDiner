import test from 'node:test';
import assert from 'node:assert/strict';

import { GameState } from '../gamefile/js/GameState.js';
import { Economy } from '../gamefile/js/Economy.js';
import { GLOBAL_UPGRADES } from '../gamefile/js/upgrades.js';
import { BALANCE as B, MILESTONES, slotsAt, profitMultAt, fmt } from '../gamefile/js/config.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);

test('recipe milestones add slots at 2/6/10 and double profit at 4/8', () => {
  assert.deepEqual(MILESTONES.map(m => `${m.recipe}:${m.type}`), [
    '2:slot', '4:profit', '6:slot', '8:profit', '10:slot',
  ]);
  assert.equal(slotsAt(0), 1);
  assert.equal(slotsAt(2), 2);
  assert.equal(slotsAt(4), 2);
  assert.equal(slotsAt(6), 3);
  assert.equal(slotsAt(8), 3);
  assert.equal(slotsAt(10), 4);
  assert.equal(profitMultAt(0), 1);
  assert.equal(profitMultAt(4), 2);
  assert.equal(profitMultAt(8), 4);
  assert.equal(profitMultAt(10), 4);
});

test('recipe price includes the configured bonus, milestones and golden recipe', () => {
  const state = new GameState();
  const eco = new Economy(state);

  close(eco.price(0, 4), 4 * (1 + B.priceBonus * 4) * 2);
  close(eco.price(0, 8), 4 * (1 + B.priceBonus * 8) * 4);
  close(eco.price(0, 10), 4 * (1 + B.priceBonus * 10) * 4);

  state.upgrades.profitX2 = 1;
  close(eco.price(0, 10), 4 * (1 + B.priceBonus * 10) * 4 * 2);
});

test('recipe level 10 and kitchen drills shorten cooking, with a floor', () => {
  const state = new GameState();
  const eco = new Economy(state);

  close(eco.cookTime(0, 9), B.cookSecs[0] * B.cookDiscount ** 9);
  close(eco.cookTime(0, 10), B.cookSecs[0] * B.cookDiscount ** 10);

  state.stations[0].recipe = 10;
  state.upgrades.cookSpeed = 5;
  close(eco.cookTime(0), Math.max(.4, B.cookSecs[0] * B.cookDiscount ** 10 * (1 - B.cookStep * 5)));
  assert.ok(eco.cookTime(0) >= .4);
});

test('tips scale with the tip-jar upgrade and the UI shows the same 28% cap', () => {
  const state = new GameState();
  const eco = new Economy(state);

  close(eco.tipChance, B.tips.baseChance);
  state.upgrades.tipChance = 5;
  close(eco.tipChance, B.tips.baseChance + B.tips.chanceStep * 5);
  state.upgrades.tipChance = 10;
  close(eco.tipChance, .28);
  state.upgrades.tipChance = 99;
  close(eco.tipChance, B.tips.maxChance);

  close(eco.tipAmount(100, 0), 100 * B.tips.minPct);
  close(eco.tipAmount(100, 1), 100 * B.tips.maxPct);

  const tipJar = GLOBAL_UPGRADES.find(d => d.id === 'tipChance');
  assert.match(tipJar.effect(10), /28%/);
  assert.match(tipJar.describe(10), /28%/);
});

test('queue capacity starts at 4 customers and grows by one per upgrade', () => {
  const state = new GameState();
  const eco = new Economy(state);
  assert.equal(eco.seats, 4);
  state.upgrades.queue = 1;
  assert.equal(eco.seats, 5);
  state.upgrades.queue = 10;
  assert.equal(eco.seats, 14);
  state.location = 2;
  assert.equal(eco.seats, 14, 'the restaurant does not change queue capacity');
});

test('walking upgrades change travel time but never below 0.8s', () => {
  const state = new GameState();
  const eco = new Economy(state);
  close(eco.walkTime, B.walk);
  state.upgrades.walkSpeed = 5;
  close(eco.walkTime, Math.max(.8, B.walk * (1 - B.walkStep * 5)));
});

test('the shop shows the real speed gain of the walking and cooking upgrades', () => {
  const state = new GameState();
  const eco = new Economy(state);
  const wing = GLOBAL_UPGRADES.find(d => d.id === 'walkSpeed');
  const drills = GLOBAL_UPGRADES.find(d => d.id === 'cookSpeed');

  // The upgrade shortens the time, so the speed gain is bigger than the time
  // saved: 25% less walking time is a third more speed.
  state.upgrades.walkSpeed = 5;
  const walkFactor = B.walk / eco.walkTime;
  const walkPct = Math.round((walkFactor - 1) * 100);
  assert.match(wing.effect(5), new RegExp(`${walkPct}% faster walking`));
  assert.match(wing.describe(5), new RegExp(`${walkPct}% faster`));

  state.upgrades.walkSpeed = 0;
  state.upgrades.cookSpeed = 5;
  const cookFactor = B.cookSecs[0] / eco.cookTime(0);
  const cookPct = Math.round((cookFactor - 1) * 100);
  assert.match(drills.effect(5), new RegExp(`${cookPct}% faster cooking`));
  assert.match(drills.describe(5), new RegExp(`${cookPct}% faster`));
});

test('the number formatter keeps billions and trillions readable', () => {
  assert.equal(fmt(999), '999');
  assert.equal(fmt(1234), '1234');
  assert.equal(fmt(12345), '12.3k');
  assert.equal(fmt(1234567), '1.2M');
  assert.equal(fmt(1234567890), '1.2B');
  assert.equal(fmt(1234567890123), '1.2T');
});

test('worker cap is the number of open slots, capped by maxBees', () => {
  const state = new GameState();
  const eco = new Economy(state);
  assert.equal(eco.totalSlots(), 1);
  assert.equal(eco.staffCap(), 1);
  state.stations[0].recipe = 10;
  assert.equal(eco.staffCap(), 4);
  state.stations[1].unlocked = true;
  state.stations[1].recipe = 10;
  assert.equal(eco.staffCap(), 8);
  state.stations[2].unlocked = true;
  state.stations[2].recipe = 10;
  assert.equal(eco.staffCap(), 12);
});

test('upgrade costs grow and scale with the restaurant', () => {
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

test('global upgrades unlock at their configured level', () => {
  const state = new GameState();
  const eco = new Economy(state);
  const cook = eco.globalDefs.find(d => d.id === 'cookSpeed');
  const profit = eco.globalDefs.find(d => d.id === 'profitX2');

  assert.equal(eco.globalUnlocked(cook), false);
  state.level = cook.unlockLevel;
  assert.equal(eco.globalUnlocked(cook), true);
  assert.equal(eco.globalUnlocked(profit), false);
  state.level = 9;
  assert.equal(eco.globalUnlocked(profit), true);
});

test('station and staff costs are positive and rise with progress', () => {
  const state = new GameState();
  const eco = new Economy(state);
  assert.ok(eco.recipeCost(0) > 0);
  const first = eco.recipeCost(0);
  state.stations[0].recipe = 3;
  assert.ok(eco.recipeCost(0) > first);

  const staff1 = eco.staffCost();
  state.staff = 2;
  assert.ok(eco.staffCost() > staff1);

  assert.ok(eco.unlockCost(1) > eco.unlockCost(0));
  assert.ok(eco.nextCost() > 0);
  assert.ok(eco.spawnInterval() > 0);
});

test('total capacity respects the number of bees on staff', () => {
  const state = new GameState();
  const eco = new Economy(state);
  state.stations[0].recipe = 10;
  const full = eco.totalCapacity(4);
  assert.ok(full > 0);
  close(eco.totalCapacity(2), full / 2);
});
