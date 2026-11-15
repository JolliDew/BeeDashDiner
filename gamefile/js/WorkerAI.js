export function pickJob(customers, slots) {
  const busy = slots.map(() => 0);
  for (const c of customers) {
    if (c.state === 'wait' && c.claimedBy) busy[c.item]++;
  }
  const open = customers.filter(c =>
    c.state === 'wait' && !c.claimedBy && busy[c.item] < slots[c.item]);
  if (!open.length) return null;
  return open.reduce(
    (best, c) => ((c.waitTime || 0) > (best.waitTime || 0) ? c : best),
    open[0]
  );
}
