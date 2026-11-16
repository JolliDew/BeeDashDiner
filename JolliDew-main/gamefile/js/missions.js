import { totalGlobalLevels } from './upgrades.js';

const unlockedCount = s => s.stations.filter(x => x.unlocked).length;
const maxRecipe = s => Math.max(0, ...s.stations.map(x => x.recipe));
const masteredStations = s => s.stations.filter(x => x.unlocked && x.recipe >= 10).length;

export const MISSIONS = [
  { id: 'l1_serve5',  level: 1, text: 'Serve 5 customers',                         target: 5,  progress: s => s.stats.served, reward: { honey: 100, diamonds: 0 } },
  { id: 'l1_recipe2', level: 1, text: 'Upgrade a recipe to level 2 (opens a 2nd worker slot)', target: 2, progress: s => maxRecipe(s), reward: { honey: 100, diamonds: 1 } },
  { id: 'l1_hire2',   level: 1, text: 'Have 2 bees on staff',                      target: 2,  progress: s => s.staff,        reward: { honey: 80,  diamonds: 1 } },

  { id: 'l2_unlock2', level: 2, text: 'Unlock the 2nd station',                    target: 2,  progress: s => unlockedCount(s), reward: { honey: 150, diamonds: 0 } },
  { id: 'l2_serve20', level: 2, text: 'Serve 20 customers in total',               target: 20, progress: s => s.stats.served, reward: { honey: 0,   diamonds: 1 } },
  { id: 'l2_tips3',   level: 2, text: 'Collect 3 tips',                            target: 3,  progress: s => s.stats.tips,   reward: { honey: 0,   diamonds: 1 } },

  { id: 'l3_unlock3', level: 3, text: 'Unlock the 3rd station',                    target: 3,  progress: s => unlockedCount(s), reward: { honey: 250, diamonds: 0 } },
  { id: 'l3_recipe5', level: 3, text: 'Reach recipe level 5 on a station',         target: 5,  progress: s => maxRecipe(s),   reward: { honey: 0,   diamonds: 2 } },
  { id: 'l3_earn2k',  level: 3, text: 'Earn 2,000 honey in total',                 target: 2000, progress: s => s.stats.earned, reward: { honey: 0, diamonds: 1 } },

  { id: 'l4_serve30', level: 4, text: 'Serve 30 customers in total',               target: 30, progress: s => s.stats.served, reward: { honey: 300, diamonds: 0 } },
  { id: 'l4_staff3',  level: 4, text: 'Have 3 bees on staff',                      target: 3,  progress: s => s.staff,        reward: { honey: 0,   diamonds: 2 } },
  { id: 'l4_earn5k',  level: 4, text: 'Earn 5,000 honey in total',                 target: 5000, progress: s => s.stats.earned, reward: { honey: 0, diamonds: 1 } },

  { id: 'l5_serve40', level: 5, text: 'Serve 40 customers in total',               target: 40, progress: s => s.stats.served, reward: { honey: 500, diamonds: 0 } },
  { id: 'l5_recipe5', level: 5, text: 'Reach recipe level 5 on a station',         target: 5,  progress: s => maxRecipe(s),   reward: { honey: 0,   diamonds: 2 } },
  { id: 'l5_tips10',  level: 5, text: 'Collect 10 tips',                           target: 10, progress: s => s.stats.tips,   reward: { honey: 0,   diamonds: 1 } },

  { id: 'l6_unlock4', level: 6, text: 'Unlock all 4 Hive Cafe stations',           target: 4,  progress: s => unlockedCount(s), reward: { honey: 700, diamonds: 0 } },
  { id: 'l6_staff4',  level: 6, text: 'Have 4 bees on staff',                      target: 4,  progress: s => s.staff,        reward: { honey: 0,   diamonds: 3 } },
  { id: 'l6_earn20k', level: 6, text: 'Earn 20,000 honey in total',                target: 20000, progress: s => s.stats.earned, reward: { honey: 0, diamonds: 2 } },

  { id: 'l7_staff8',  level: 7, text: 'Have 8 bees on staff',                      target: 8,  progress: s => s.staff,        reward: { honey: 1000, diamonds: 0 } },
  { id: 'l7_recipe10', level: 7, text: 'Master any recipe (level 10)',             target: 10, progress: s => maxRecipe(s),   reward: { honey: 0,    diamonds: 3 } },
  { id: 'l7_earn50k', level: 7, text: 'Earn 50,000 honey in total',                target: 50000, progress: s => s.stats.earned, reward: { honey: 0, diamonds: 2 } },

  { id: 'l8_serve70', level: 8, text: 'Serve 70 customers in total',               target: 70, progress: s => s.stats.served, reward: { honey: 1500, diamonds: 0 } },
  { id: 'l8_tips25',  level: 8, text: 'Collect 25 tips',                           target: 25, progress: s => s.stats.tips,   reward: { honey: 0,    diamonds: 3 } },
  { id: 'l8_global3', level: 8, text: 'Buy 3 global upgrade levels',               target: 3,  progress: s => totalGlobalLevels(s), reward: { honey: 0, diamonds: 2 } },

  { id: 'l9_unlock5', level: 9, text: 'Unlock all 5 Royal Hive stations',          target: 5,  progress: s => unlockedCount(s), reward: { honey: 2500, diamonds: 0 } },
  { id: 'l9_recipe10', level: 9, text: 'Master 2 different recipes',               target: 2,  progress: s => masteredStations(s), reward: { honey: 0, diamonds: 3 } },
  { id: 'l9_earn250k', level: 9, text: 'Earn 250,000 honey in total',              target: 250000, progress: s => s.stats.earned, reward: { honey: 0, diamonds: 3 } },

  { id: 'l10_serve100', level: 10, text: 'Serve 100 customers in total',           target: 100, progress: s => s.stats.served, reward: { honey: 4000, diamonds: 0 } },
  { id: 'l10_master3',  level: 10, text: 'Master 3 different recipes',             target: 3,   progress: s => masteredStations(s), reward: { honey: 0, diamonds: 4 } },
  { id: 'l10_earn500k', level: 10, text: 'Earn 500,000 honey in total',            target: 500000, progress: s => s.stats.earned, reward: { honey: 0, diamonds: 5 } },
];

export const missionsForLevel = level => MISSIONS.filter(m => m.level === level);

export const firstMissionIndex = level => {
  const i = MISSIONS.findIndex(m => m.level >= level);
  return i === -1 ? MISSIONS.length : i;
};
