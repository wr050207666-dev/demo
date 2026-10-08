import { CONFIG } from '../config.js';
import { clamp } from '../math.js';

export class Enemy {
  constructor(kind, x, y) {
    const spec = CONFIG.enemies[kind];
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.hp = spec.hp;
    this.maxHp = spec.hp;
    this.speed = spec.speed;
    this.radius = spec.radius;
    this.contact = spec.contact;
    this.xp = spec.xp;
    this.color = spec.color;
    this.accent = spec.accent;
    this.alive = true;
    this.attackTimer = kind === 'boss' ? 1.35 : 0;
    this.flash = 0;
    this.facing = 0;
  }

  hurt(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  /** Boss 攻击冷却结束时返回 true，由 Game 生成弹幕。 */
  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.facing = Math.atan2(dy, dx);
    this.x += (dx / distance) * this.speed * dt;
    this.y += (dy / distance) * this.speed * dt;
    this.x = clamp(this.x, this.radius, CONFIG.worldWidth - this.radius);
    this.y = clamp(this.y, this.radius, CONFIG.worldHeight - this.radius);
    this.flash = Math.max(0, this.flash - dt);
    if (this.kind !== 'boss') {
      return false;
    }
    this.attackTimer -= dt;
    if (this.attackTimer > 0) {
      return false;
    }
    this.attackTimer = CONFIG.boss.attackEvery;
    this.flash = 0.16;
    return true;
  }

  draw(ctx, camera) {
    const spec = CONFIG.enemies[this.kind];
    ctx.save();
    ctx.translate(this.x - camera.x, this.y - camera.y);
    ctx.rotate(this.facing);
    ctx.fillStyle = this.flash > 0 ? '#fff4f6' : spec.color;
    ctx.strokeStyle = spec.accent;
    ctx.lineWidth = this.kind === 'boss' ? 4 : 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (this.kind === 'boss') {
      polygon(ctx, 6, this.radius);
    } else if (this.kind === 'elite') {
      polygon(ctx, 4, this.radius);
    } else {
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(-this.radius * 0.8, this.radius * 0.75);
      ctx.lineTo(-this.radius * 0.8, -this.radius * 0.75);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    if (this.kind === 'boss') {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.restore();

    if (this.kind === 'elite') {
      const barWidth = this.radius * 2;
      const left = this.x - camera.x - barWidth / 2;
      const top = this.y - camera.y - this.radius - 12;
      const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(left, top, barWidth, 4);
      ctx.fillStyle = '#ffc14a';
      ctx.fillRect(left, top, barWidth * ratio, 4);
    }
  }
}

function polygon(ctx, sides, radius) {
  for (let index = 0; index < sides; index += 1) {
    const angle = -Math.PI / 2 + (index / sides) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}
