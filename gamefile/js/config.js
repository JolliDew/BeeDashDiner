export const ASSETS = {
  bees: ['', '', '', '', ''],
  customers: ['', '', '', '', ''],
  stations: ['', '', '', '', ''],
  items: {},
  seat: '',   // queue chair drawn under every waiting customer (replaces the 🪑 emoji)
  honeyIcon: ''
};
export const art = (path, emoji) => path ? `<img class="art" src="${path}" alt="">` : emoji;
export const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : Math.floor(n) + '';

export const ITEMS = [
  [['🌼', 'Nectar Sip'], ['🍞', 'Honey Toast'], ['🥣', 'Pollen Soup']],
  [['🍵', 'Honey Tea'], ['🥞', 'Pancakes'], ['🧁', 'Wax Muffin'], ['🍯', 'Royal Jelly']],
  [['🍰', 'Honey Cake'], ['🥧', 'Nectar Pie'], ['🍦', 'Sundae'], ['🍹', 'Mead Fizz'], ['👑', 'Queen Feast']]
];
export const LOCATIONS = ['Meadow Stand', 'Hive Café', 'Royal Hive'];
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
export const LEVEL_LOCATIONS = LEVELS.map(l => l.location);
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
