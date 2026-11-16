/* Cosmetic shop: bee accessories bought with diamonds (four items, 66 diamonds in total).
   ASSET: replace `icon` with an <img> path later if you want custom art. */
export const COSMETICS = [
  { id: 'bee_bow',    kind: 'bee', name: 'Little bow',   icon: '🎀', cost: 6,  blurb: 'A tiny bow for every bee.' },
  { id: 'bee_shades', kind: 'bee', name: 'Cool shades',  icon: '🕶️', cost: 10, blurb: 'Too cool to buzz.' },
  { id: 'bee_tophat', kind: 'bee', name: 'Tiny top hat', icon: '🎩', cost: 20, blurb: 'Very fancy service.' },
  { id: 'bee_crown',  kind: 'bee', name: 'Royal crown',  icon: '👑', cost: 30, blurb: 'Fit for the queen.' },
];

export const cosmeticDef = id => COSMETICS.find(c => c.id === id) || null;

export const ownsCosmetic = (state, id) =>
  Array.isArray(state.cosmetics?.owned) && state.cosmetics.owned.includes(id);

/** The accessory to draw for `kind` ('bee'). Only counts if the player actually owns it. */
export function equippedCosmetic(state, kind) {
  const cos = state.cosmetics;
  const id = cos?.equipped?.[kind];
  if (!id || !ownsCosmetic(state, id)) return null;
  const def = cosmeticDef(id);
  return def && def.kind === kind ? def : null;
}
