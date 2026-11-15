import { MISSIONS, missionsForLevel } from './missions.js';
import { LEVELS } from './config.js';

export class MissionTracker {
  constructor(game) { this.game = game; }

  get state() { return this.game.state; }
  get current() { return MISSIONS[this.state.missions.index] || null; }

  missionsForLevel(level = this.state.level) { return missionsForLevel(level); }

  isDone(mission) { return MISSIONS.indexOf(mission) < this.state.missions.index; }

  levelComplete(level = this.state.level) {
    return this.missionsForLevel(level).every(m => this.isDone(m));
  }

  progress(mission = this.current) {
    if (!mission) return { current: 1, target: 1 };
    const raw = Number(mission.progress(this.state)) || 0;
    return {
      current: Math.min(mission.target, Math.max(0, raw)),
      target: mission.target,
    };
  }

  check() {
    let advanced = false;

    while (this.state.missions.index < MISSIONS.length) {
      const mission = MISSIONS[this.state.missions.index];

      if (mission.level < this.state.level) {
        this.state.missions.index++;
        advanced = true;
        continue;
      }
      if (mission.level > this.state.level) break;
      if (mission.progress(this.state) < mission.target) break;

      const paid = this.state.missions.done.includes(mission.id);
      this.state.missions.index++;
      if (!paid) {
        this.state.missions.done.push(mission.id);
        this.game.grantReward(mission.reward, `Mission complete: ${mission.text}`);
      }
      advanced = true;
    }

    if (!this.state.missions.finished && this.state.missions.index >= MISSIONS.length) {
      this.state.missions.finished = true;
      const final = LEVELS[LEVELS.length - 1]?.reward;
      if (final) this.game.grantReward(final, 'Game complete!');
      advanced = true;
    }

    return advanced;
  }
}
