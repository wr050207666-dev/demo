import { CONFIG } from '../config.js';

/** 玩家只负责移动、朝向和自身绘制。生命和等级放在 Game 上。 */
export class Player {
  constructor() {
    this.radius = CONFIG.player.radius;
    this.speed = CONFIG.player.speed;
    this.x = CONFIG.worldWidth / 2;
    this.y = CONFIG.worldHeight / 2;
    this.angle = -Math.PI / 2;
    this.invuln = 0;
    this.muzzle = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this.invuln = 0;
    this.muzzle = 0;
  }

  tick(dt) {
    this.invuln = Math.max(0, this.invuln - dt);
    this.muzzle = Math.max(0, this.muzzle - dt);
  }

  move(dt, axis) {
    this.x += axis.x * this.speed * dt;
    this.y += axis.y * this.speed * dt;

    const minX = this.radius;
    const minY = this.radius;
    const maxX = CONFIG.worldWidth - this.radius;
    const maxY = CONFIG.worldHeight - this.radius;
    this.x = Math.max(minX, Math.min(maxX, this.x));
    this.y = Math.max(minY, Math.min(maxY, this.y));
  }

  aimAt(worldPoint) {
    const dx = worldPoint.x - this.x;
    const dy = worldPoint.y - this.y;
    if (dx * dx + dy * dy < 1) {
      return;
    }
    this.angle = Math.atan2(dy, dx);
  }

  draw(ctx, camera) {
    const colors = CONFIG.colors;
    ctx.save();
    ctx.translate(this.x - camera.x, this.y - camera.y);
    if (this.invuln > 0) {
      ctx.globalAlpha = 0.45 + (Math.sin(this.invuln * 28) + 1) * 0.25;
    }

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = colors.playerRing;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.rotate(this.angle);
    ctx.shadowColor = 'rgba(62, 224, 255, 0.85)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = colors.playerFill;
    ctx.strokeStyle = colors.playerStroke;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-12, 11);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, -11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (this.muzzle > 0) {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = Math.min(1, this.muzzle / 0.05);
      ctx.fillStyle = '#e7ffff';
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(36, 6);
      ctx.lineTo(36, -6);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.invuln > 0 ? ctx.globalAlpha : 1;
    ctx.beginPath();
    ctx.arc(-2, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = colors.playerCore;
    ctx.fill();
    ctx.restore();
  }
}
