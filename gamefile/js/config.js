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

export const BALANCE = {
  startHoney: 50,
  basePrice: [4, 10, 26, 60, 140], cookSecs: [2, 3.5, 5, 6.5, 8],
  unlockCost: [0, 80, 350, 1300, 4500], recipeCost: [20, 50, 115, 240, 510], beeCost: [40, 95, 225, 480, 1025],
  priceX: 5, costX: 6,            // per location: prices x5, costs x6
  nextCost: [6500, 48000],        // honey needed to move on
  seatBase: 15, seatStep: 5, cols: 5, // queue spots: 15, 20, 25
  maxRecipe: 8, maxBees: 3,
  recipeGrowth: 1.55, beeGrowth: 2.4,
  priceBonus: .3, cookDiscount: .9, // per recipe level: +30% price, -10% cook time
  walk: 1.6,                      // every bee walking leg takes exactly this many seconds
  custIn: 1.8, custOut: 1.2,      // customer walk-in / walk-out seconds
  demand: 1.3,                    // arrivals vs bee capacity (>1 keeps bees busy)
  burstGap: .35                   // opening rush: one customer every 0.35s
};
