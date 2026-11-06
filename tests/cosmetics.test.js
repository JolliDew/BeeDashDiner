import test from 'node:test';
import assert from 'node:assert/strict';

import { COSMETICS, cosmeticDef, ownsCosmetic, equippedCosmetic } from '../gamefile/js/cosmetics.js';
import { GameState } from '../gamefile/js/GameState.js';
import { Game } from '../gamefile/js/Game.js';

test('cosmetic ids are unique and every item has a diamond price', () => {
  const ids = new Set();
  for (const item of COSMETICS) {
    assert.ok(!ids.has(item.id), `duplicate ${item.id}`);
    ids.add(item.id);
    assert.equal(item.kind, 'bee');
    assert.ok(Number.isInteger(item.cost) && item.cost > 0);
    assert.ok(item.icon && item.name && item.blurb);
    assert.equal(cosmeticDef(item.id), item);
  }
  assert.equal(cosmeticDef('missing'), undefined);
});

test('an equipped cosmetic only renders when the save owns it', () => {
  const state = new GameState();
  state.cosmetics.equipped.bee = 'bee_bow';
  assert.equal(equippedCosmetic(state, 'bee'), null);
  assert.equal(ownsCosmetic(state, 'bee_bow'), false);

  state.cosmetics.owned.push('bee_bow');
  assert.equal(ownsCosmetic(state, 'bee_bow'), true);
  assert.equal(equippedCosmetic(state, 'bee').id, 'bee_bow');
});

test('cosmetics can be bought, unequipped and re-equipped with diamonds', () => {
  const state = new GameState();
  state.diamonds = 50;
  let changed = 0;
  const game = Object.create(Game.prototype);
  game.state = state;
  game.toast = () => {};
  game.changed = () => { changed++; };

  game.cosmeticAction('bee_bow');
  assert.equal(state.diamonds, 42);
  assert.deepEqual(state.cosmetics.owned, ['bee_bow']);
  assert.equal(state.cosmetics.equipped.bee, 'bee_bow');
  assert.equal(changed, 1);

  game.cosmeticAction('bee_bow');
  assert.equal(state.cosmetics.equipped.bee, '');
  assert.equal(state.diamonds, 42);

  game.cosmeticAction('bee_bow');
  assert.equal(state.cosmetics.equipped.bee, 'bee_bow');
  assert.equal(state.diamonds, 42);

  game.cosmeticAction('bee_shades');
  assert.equal(state.diamonds, 30);
  assert.deepEqual(state.cosmetics.owned, ['bee_bow', 'bee_shades']);
  assert.equal(state.cosmetics.equipped.bee, 'bee_shades');
});

test('a cosmetic cannot be bought without enough diamonds', () => {
  const state = new GameState();
  state.diamonds = 5;
  const game = Object.create(Game.prototype);
  game.state = state;
  game.toast = () => {};
  game.changed = () => assert.fail('changed should not be called');

  game.cosmeticAction('bee_crown');
  assert.deepEqual(state.cosmetics.owned, []);
  assert.equal(state.cosmetics.equipped.bee, '');
  assert.equal(state.diamonds, 5);

  game.cosmeticAction('not_a_cosmetic');
  assert.equal(state.diamonds, 5);
});
