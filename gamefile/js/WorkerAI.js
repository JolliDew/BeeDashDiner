/**
 * Pick the next customer for a worker.
 *
 * Priority:
 *   1. a customer waiting at the worker's home station;
 *   2. otherwise the customer who has waited the longest anywhere else.
 *
 * This is a pure function so it can be unit-tested without a browser.
 * Customers already claimed by another bee are skipped.
 */
export function pickJob(customers, homeSlot) {
  const waiting = customers.filter(c => c.state === 'wait' && !c.claimedBy);
  if (!waiting.length) return null;

  const own = waiting.filter(c => c.item === homeSlot);
  const pool = own.length ? own : waiting;
  return pool.reduce(
    (best, c) => ((c.waitTime || 0) > (best.waitTime || 0) ? c : best),
    pool[0]
  );
}
