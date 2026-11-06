/* All content and balance numbers live here. */

/* ===================== ASSET SLOTS =====================
   Everything is emoji for now. To use your own art, put a file path in a slot
   (e.g. 'assets/bees/forager.png'). An empty string keeps the emoji.
   Sprites are drawn about 24px tall, so square PNG or SVG files work best.
   Backgrounds (kitchen and floor) are the --kitchen-bg and --floor-bg variables in css/bee-game.css. */
export const ASSETS = {
  bees: ['', '', '', '', ''],       // one sprite per station: Forager, Baker, Nurse, Builder, Royal Chef
  customers: ['', '', '', '', ''],  // customer sprites, picked at random
  stations: ['', '', '', '', ''],   // station machines by slot (0-4)
  items: {},                        // by item name, e.g. {'Honey Toast': 'assets/items/toast.png'}
  honeyIcon: ''                     // HUD currency icon
};
export const art = (path, emoji) => path ? `<img class="art" src="${path}" alt="">` : emoji;
export const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : Math.floor(n) + '';

export const ITEMS = [
  [['🌼', 'Nectar Sip'], ['🍞', 'Honey Toast'], ['🥣', 'Pollen Soup']],
  [['🍵', 'Honey Tea'], ['🥞', 'Pancakes'], ['🧁', 'Wax Muffin'], ['🍯', 'Royal Jelly']],
  [['🍰', 'Honey Cake'], ['🥧', 'Nectar Pie'], ['🍦', 'Sundae'], ['🍹', 'Mead Fizz'], ['👑', 'Queen Feast']]
];
export const LOCATIONS = ['Meadow Stand', 'Hive Café', 'Royal Hive'];
// One bee kind per station slot. hue tints the 🐝 emoji; acc is the tool it carries.
export const BEES = [
  { name: 'Forager', acc: '🧺', hue: 0 }, { name: 'Baker', acc: '🥖', hue: -30 },
  { name: 'Nurse', acc: '🩹', hue: 75 }, { name: 'Builder', acc: '🔧', hue: 165 },
  { name: 'Royal Chef', acc: '🎩', hue: 255 }
];
export const CUSTOMERS = ['🦋', '🐞', '🐛', '🐜', '🦗'];

/* The 10 progression tiers. Locations still change at levels 5 and 8, so a
   single run visits all three restaurants. `reward` is paid when that level's
   missions are finished and the player advances past it. */
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
  basePrice: [4, 10, 26, 60, 140], cookSecs: [2, 3.5, 5, 6.5, 8],
  unlockCost: [0, 80, 350, 1300, 4500], recipeCost: [20, 50, 115, 240, 510], beeCost: [40, 95, 225, 480, 1025],
  priceX: 5, costX: 6,            // per location: prices x5, costs x6
  nextCost: [6500, 48000],        // honey needed to move on
  seatBase: 15, seatStep: 5, cols: 5, // queue spots: 15, 20, 25
  maxRecipe: 10, baseBees: 3, maxBees: 4,
  milestone5Price: .25,           // recipe 5: +25% profit at that station
  milestone10Cook: .15,           // recipe 10: -15% cook time at that station
  recipeGrowth: 1.48, beeGrowth: 2.4, // gentler than v1 because recipes now reach 10
  priceBonus: .3, cookDiscount: .9, // per recipe level: +30% price, -10% cook time
  tips: { baseChance: .08, chanceStep: .02, maxChance: .25, minPct: .1, maxPct: .3 },
  queueStep: 2,                   // +2 seats per queue upgrade level
  walkStep: .05,                  // -5% walking time per speed upgrade level
  cookStep: .04,                  // -4% cook time per station work upgrade level
  walk: 1.6,                      // every bee walking leg takes exactly this many seconds
  custIn: 1.8, custOut: 1.2,      // customer walk-in / walk-out seconds
  demand: 1.3,                    // arrivals vs bee capacity (>1 keeps bees busy)
  burstGap: .35                   // opening rush: one customer every 0.35s
};
