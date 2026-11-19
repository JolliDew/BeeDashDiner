import { tipChanceAt, walkSpeedBonus, cookSpeedBonus } from './config.js';

/** The tip chance shown in the UI, using the same formula as Economy. */
const tipChanceAtPct = level => Math.round(tipChanceAt(level) * 100);

export const GLOBAL_UPGRADES = [
  {
    id: 'tipChance',
    name: 'Tip jar',
    icon: '🪙',
    unlockLevel: 2,
    maxLevel: 10,
    baseCost: 150,
    growth: 1.6,
    effect: l => `${tipChanceAtPct(l)}% tip chance`,
    describe: l => `Tip chance is now ${tipChanceAtPct(l)}%.`,
  },
  {
    id: 'queue',
    name: 'Bigger waiting area',
    icon: '🪑',
    unlockLevel: 3,
    maxLevel: 10,
    baseCost: 250,
    growth: 1.6,
    effect: l => `+${l} queue seat${l === 1 ? '' : 's'}`,
    describe: l => `The restaurant can hold ${l} more waiting customer${l === 1 ? '' : 's'}.`,
  },
  {
    id: 'walkSpeed',
    name: 'Wing workout',
    icon: '💨',
    unlockLevel: 4,
    maxLevel: 5,
    baseCost: 400,
    growth: 1.9,
    effect: l => `${walkSpeedBonus(l)}% faster walking`,
    describe: l => `Workers move ${walkSpeedBonus(l)}% faster between stations and tables.`,
  },
  {
    id: 'cookSpeed',
    name: 'Kitchen drills',
    icon: '⏱️',
    unlockLevel: 8,
    maxLevel: 5,
    baseCost: 8000,
    growth: 2,
    effect: l => `${cookSpeedBonus(l)}% faster cooking`,
    describe: l => `Every station cooks ${cookSpeedBonus(l)}% faster.`,
  },
  {
    id: 'profitX2',
    name: 'Golden recipe',
    icon: '✨',
    unlockLevel: 9,
    maxLevel: 1,
    baseCost: 60000,
    growth: 1,
    effect: l => l ? '2x profit' : 'normal profit',
    describe: () => 'Every dish from every station is worth double.',
  },
];

export const globalDef = id => GLOBAL_UPGRADES.find(u => u.id === id);

export function totalGlobalLevels(state) {
  return GLOBAL_UPGRADES.reduce((sum, def) => sum + (state.upgrades[def.id] || 0), 0);
}
