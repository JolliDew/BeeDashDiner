/* Upgrade definitions. Costs are multiplied by the current location's
   cost multiplier, so the same upgrade gets more expensive in later
   restaurants.

   GLOBAL_UPGRADES are shared by the whole restaurant and live in
   state.upgrades. STATION_UPGRADES are bought separately for each station
   and live on that station (workLvl / profitX2). */

export const GLOBAL_UPGRADES = [
  {
    id: 'tipChance',
    name: 'Tip jar',
    icon: '🪙',
    unlockLevel: 2,
    maxLevel: 10,
    baseCost: 150,
    growth: 1.6,
    effect: l => `+${l * 2}% tip chance`,
    describe: l => `Tip chance is now ${8 + l * 2}%.`,
  },
  {
    id: 'queue',
    name: 'Bigger waiting area',
    icon: '🪑',
    unlockLevel: 3,
    maxLevel: 5,
    baseCost: 250,
    growth: 1.9,
    effect: l => `+${l * 2} queue seats`,
    describe: l => `The restaurant can hold ${l * 2} more waiting customers.`,
  },
  {
    id: 'walkSpeed',
    name: 'Wing workout',
    icon: '💨',
    unlockLevel: 4,
    maxLevel: 5,
    baseCost: 400,
    growth: 1.9,
    effect: l => `${l * 5}% faster walking`,
    describe: l => `Workers move ${l * 5}% faster between stations and tables.`,
  },
  {
    id: 'workerSlot',
    name: 'Extra worker',
    icon: '🐝',
    unlockLevel: 6,
    maxLevel: 1,
    baseCost: 1200,
    growth: 1,
    effect: () => '4th worker slot',
    describe: () => 'Every station can now hold a 4th worker.',
  },
];

export const STATION_UPGRADES = [
  {
    id: 'cookSpeed',
    name: 'Kitchen drills',
    icon: '⏱️',
    unlockLevel: 8,
    maxLevel: 5,
    baseCost: 8000,
    growth: 2,
    field: 'workLvl',
    effect: l => `${l * 4}% faster cooking`,
    describe: l => `This station cooks ${l * 4}% faster.`,
  },
  {
    id: 'profitX2',
    name: 'Golden recipe',
    icon: '✨',
    unlockLevel: 9,
    maxLevel: 1,
    baseCost: 60000,
    growth: 1,
    field: 'profitX2',
    effect: () => '2x station profit',
    describe: () => 'Every dish from this station is worth double.',
  },
];

export const globalDef = id => GLOBAL_UPGRADES.find(u => u.id === id);
export const stationDef = id => STATION_UPGRADES.find(u => u.id === id);

export function totalGlobalLevels(state) {
  return GLOBAL_UPGRADES.reduce((sum, def) => sum + (state.upgrades[def.id] || 0), 0);
}
