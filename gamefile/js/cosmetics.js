/* Optional cosmetic rewards bought with diamonds. Cosmetics do not affect
   gameplay. Only one bee accessory can be equipped at a time. */

export const COSMETICS = [
  {
    id: 'bee_bow',
    name: 'Little bow',
    icon: '🎀',
    kind: 'bee',
    cost: 8,
    blurb: 'A tidy bow for the whole crew.',
  },
  {
    id: 'bee_shades',
    name: 'Cool shades',
    icon: '🕶️',
    kind: 'bee',
    cost: 12,
    blurb: 'Too cool for the honey queue.',
  },
  {
    id: 'bee_tophat',
    name: 'Tiny top hat',
    icon: '🎩',
    kind: 'bee',
    cost: 18,
    blurb: 'Fine dining, tiny hat.',
  },
  {
    id: 'bee_crown',
    name: 'Royal crown',
    icon: '👑',
    kind: 'bee',
    cost: 28,
    blurb: 'For the busiest bee in the hive.',
  },
];

export const cosmeticDef = id => COSMETICS.find(c => c.id === id);

/** True only when the save actually owns the cosmetic. */
export function ownsCosmetic(state, id) {
  return !!id && state.cosmetics.owned.includes(id);
}

/** The equipped cosmetic for a slot ('bee'), or null if none/invalid. */
export function equippedCosmetic(state, kind = 'bee') {
  const id = state.cosmetics.equipped?.[kind] || '';
  return ownsCosmetic(state, id) ? cosmeticDef(id) || null : null;
}
