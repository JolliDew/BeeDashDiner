import { BALANCE as B } from './config.js';

/** The actual tip chance shown in the UI, using the same formula as Economy. */
const tipChanceAt = level =>
  Math.round(Math.min(B.tips.maxChance, B.tips.baseChance + B.tips.chanceStep * level) * 100);

export const GLOBAL_UPGRADES = [
  {
    id: 'tipChance',
    name: 'Tip jar',
    icon: '🪙',
    unlockLevel: 2,
    maxLevel: 10,
    baseCost: 150,
    growth: 1.6,
    effect: l => `${tipChanceAt(l)}% tip chance`,
    describe: l => `Tip chance is now ${tipChanceAt(l)}%.`,
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
    effect: l => `${l * 5}% faster walking`,
    describe: l => `Workers move ${l * 5}% faster between stations and tables.`,
  },
  {
    id: 'cookSpeed',
    name: 'Kitchen drills',
    icon: '⏱️',
    unlockLevel: 8,
    maxLevel: 5,
    baseCost: 8000,
    growth: 2,
    effect: l => `${l * 4}% faster cooking`,
    describe: l => `Every station cooks ${l * 4}% faster.`,
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
