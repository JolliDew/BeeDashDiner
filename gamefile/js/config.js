export const ASSETS = {
  bees: ['', '', '', '', ''],
  customers: ['', '', '', '', ''],
  stations: ['', '', '', '', ''],
  items: {},
  seat: '',   // queue chair drawn under every waiting customer (replaces the 🪑 emoji)
  honeyIcon: ''
};
export const art = (path, emoji) => path ? `<img class="art" src="${path}" alt="">` : emoji;
/** Short number for the HUD: 1.2k, 3.4M, 5.6B, 7.8T. */
export const fmt = n => {
  const v = Number(n) || 0;
  if (v >= 1e12) return (v / 1e12).toFixed(1) + 'T';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e4) return (v / 1e3).toFixed(1) + 'k';
  return Math.floor(v) + '';
};

export const ITEMS = [
  [['🌼', 'Nectar Sip'], ['🍞', 'Honey Toast'], ['🥣', 'Pollen Soup']],
  [['🍵', 'Honey Tea'], ['🥞', 'Pancakes'], ['🧁', 'Wax Muffin'], ['🍯', 'Royal Jelly']],
  [['🍰', 'Honey Cake'], ['🥧', 'Nectar Pie'], ['🍦', 'Sundae'], ['🍹', 'Mead Fizz'], ['👑', 'Queen Feast']]
];
export const LOCATIONS = ['Meadow Stand', 'Hive Café', 'Royal Hive'];
export const MAPS = [
  { id: 'meadow', menu: 'FARM MENU', plant: '🌻' },
  { id: 'hive', menu: 'CAFÉ MENU', plant: '🪴' },
  { id: 'royal', menu: 'ROYAL MENU', plant: '🏺' }
];
export const BEES = [
  { name: 'Forager', acc: '🧺', hue: 0 }, { name: 'Baker', acc: '🥖', hue: -30 },
  { name: 'Nurse', acc: '🩹', hue: 75 }, { name: 'Builder', acc: '🔧', hue: 165 },
  { name: 'Royal Chef', acc: '🎩', hue: 255 }
];
export const CUSTOMERS = ['🦋', '🐞', '🐛', '🐜', '🦗'];

export const LEVELS = [
  { level: 1,  location: 0, reward: { honey: 150,   diamonds: 1 } },
  { level: 2,  location: 0, reward: { honey: 250,   diamonds: 1 } },
  { level: 3,  location: 0, reward: { honey: 400,   diamonds: 1 } },
  { level: 4,  location: 0, reward: { honey: 750,   diamonds: 2 } },
  { level: 5,  location: 1, reward: { honey: 1200,  diamonds: 2 } },
  { level: 6,  location: 1, reward: { honey: 2000,  diamonds: 2 } },
  { level: 7,  location: 1, reward: { honey: 3500,  diamonds: 3 } },
  { level: 8,  location: 2, reward: { honey: 6000,  diamonds: 3 } },
  { level: 9,  location: 2, reward: { honey: 10000, diamonds: 4 } },
  { level: 10, location: 2, reward: { honey: 20000, diamonds: 10 } },
];
export const MAX_LEVEL = LEVELS.length;
export const levelLocation = level =>
  LEVELS[Math.max(1, Math.min(MAX_LEVEL, level)) - 1].location;
export const firstLevelForLocation = loc =>
  LEVELS.find(l => l.location === loc)?.level ?? 1;

export const BALANCE = {
  startHoney: 50,
  startStaff: 1,
  basePrice: [4, 10, 26, 60, 140], cookSecs: [2, 3.5, 5, 6.5, 8],
  unlockCost: [0, 80, 350, 1300, 4500], recipeCost: [20, 50, 115, 240, 510],
  staffCost: 40, staffGrowth: 1.5,
  priceX: 5, costX: 6,
  nextCost: [6500, 48000],
  seatBase: 4, cols: 5,
  maxRecipe: 10, maxBees: 20,
  recipeGrowth: 1.48,
  priceBonus: .3, cookDiscount: .9,
  milestoneProfit: 2,
  // The tip-jar upgrade reads these same numbers, so the UI and simulation
  // cannot drift apart (level 10 = 8% + 10 x 2% = 28%).
  tips: { baseChance: .08, chanceStep: .02, maxChance: .28, minPct: .1, maxPct: .3 },
  queueStep: 1,
  walkStep: .05,
  cookStep: .04,
  walk: 1.6,
  popTime: .25,
  happyTime: .9,
  demand: 1.3,
  firstCustomerDelay: 1.8,
  entryGap: 1.8
};

export const MILESTONES = [
  { recipe: 2,  type: 'slot' },
  { recipe: 4,  type: 'profit' },
  { recipe: 6,  type: 'slot' },
  { recipe: 8,  type: 'profit' },
  { recipe: 10, type: 'slot' },
];
export const MAX_SLOTS = 1 + MILESTONES.filter(m => m.type === 'slot').length;
export const milestonesReached = recipe => MILESTONES.filter(m => recipe >= m.recipe);
export const slotsAt = recipe => 1 + milestonesReached(recipe).filter(m => m.type === 'slot').length;
export const profitMultAt = recipe =>
  BALANCE.milestoneProfit ** milestonesReached(recipe).filter(m => m.type === 'profit').length;
export const nextMilestone = recipe => MILESTONES.find(m => recipe < m.recipe) || null;

/*
 * The upgrade panel shows the real effect of an upgrade, so the numbers in
 * the shop and the numbers in the simulation can never drift apart.
 */

/** The tip chance at a given tip-jar level (0-10). */
export const tipChanceAt = level =>
  Math.min(BALANCE.tips.maxChance, BALANCE.tips.baseChance + BALANCE.tips.chanceStep * level);

/** How long a walk takes at a given wing-workout level. */
export const walkTimeAt = level =>
  Math.max(.8, BALANCE.walk * (1 - BALANCE.walkStep * level));

/**
 * How much faster walking really is, as a percentage. The upgrade shortens
 * the walk, so the speed gain is larger than the time saved: 20% less time
 * is a 25% higher speed.
 */
export const walkSpeedBonus = level =>
  Math.round((BALANCE.walk / walkTimeAt(level) - 1) * 100);

/**
 * How much faster cooking really is, as a percentage. The shortest dish takes
 * two seconds, so the 0.4 second floor of the cooking time never applies and
 * the factor alone decides the speed.
 */
export const cookSpeedBonus = level =>
  Math.round((1 / (1 - BALANCE.cookStep * level) - 1) * 100);
