/**
 * Pick the next waiting customer for a bee.
 *
 * `slots` is one worker capacity per station (0 for locked stations). A bee
 * checks its home station first and only helps elsewhere when home has no open
 * customer. Ties keep the first customer, so animations stay stable.
 */
export function pickJob(customers, slots, home = null) {
  if (!Array.isArray(customers) || !Array.isArray(slots)) return null;

  const busy = slots.map(() => 0);
  for (const c of customers) {
    if (c.state === 'wait' && c.claimedBy) busy[c.item]++;
  }

  const open = customers.filter(c =>
    c.state === 'wait' && !c.claimedBy && busy[c.item] < (slots[c.item] || 0));
  if (!open.length) return null;

  const atHome = Number.isInteger(home) && home >= 0
    ? open.filter(c => c.item === home)
    : [];
  const pool = atHome.length ? atHome : open;

  return pool.reduce(
    (best, c) => ((c.waitTime || 0) > (best.waitTime || 0) ? c : best),
    pool[0]
  );
}
