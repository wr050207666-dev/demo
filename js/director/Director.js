import { CONFIG } from '../config.js';
import { clamp } from '../math.js';

/** 威胁越高刷得越快。连杀会加压，残血和连续受伤会减压。Boss 仍按固定时间出现。 */
export class Director {
  constructor() {
    this.reset();
  }

  reset() {
    this.pressure = 0.22;
    this.killRate = 0;
    this.hurtRate = 0;
  }

  noteKill() {
    this.killRate += 1;
  }

  noteDamage(amount) {
    this.hurtRate += amount;
  }

  update(dt, stats) {
    const decay = Math.exp(-dt / 4);
    this.killRate *= decay;
    this.hurtRate *= decay;

    const killScore = clamp(this.killRate / 4, 0, 1);
    const hurtScore = clamp(this.hurtRate / 30, 0, 1);
    const hpRatio = stats.maxHp > 0 ? clamp(stats.hp / stats.maxHp, 0, 1) : 0;
    const levelScore = clamp((stats.level - 1) / 6, 0, 1);
    const timeScore = clamp(stats.time / CONFIG.boss.spawnAt, 0, 1);
    const target = clamp(
      0.16
        + killScore * 0.36
        + levelScore * 0.14
        + timeScore * 0.24
        - hurtScore * 0.34
        - (1 - hpRatio) * 0.36,
      0.08,
      0.94,
    );
    const follow = 1 - Math.exp(-dt * 0.7);
    this.pressure += (target - this.pressure) * follow;
    return this.pressure;
  }

  spawnInterval() {
    return 1.2 + (0.36 - 1.2) * this.pressure;
  }

  maxAlive() {
    return Math.round(6 + (16 - 6) * this.pressure);
  }

  eliteChance() {
    return clamp((this.pressure - 0.36) * 0.8, 0, 0.4);
  }
}

export function pressureLabel(pressure) {
  if (pressure < 0.34) return '低压';
  if (pressure < 0.55) return '中等';
  if (pressure < 0.75) return '高压';
  return '极高';
}

export function bossDue(time, spawned) {
  return !spawned && time >= CONFIG.boss.spawnAt;
}
