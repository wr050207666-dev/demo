import { CONFIG } from '../config.js';

export class Bullet {
  constructor({ x, y, angle, speed, damage, radius, team, color, life }) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.prevX = x;
    this.prevY = y;
    this.damage = damage;
    this.radius = radius;
    this.team = team;
    this.color = color;
    this.life = life;
    this.alive = true;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    const outside = (
      this.x < -60
      || this.y < -60
      || this.x > CONFIG.worldWidth + 60
      || this.y > CONFIG.worldHeight + 60
    );
    if (this.life <= 0 || outside) {
      this.alive = false;
    }
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    const speed = Math.hypot(this.vx, this.vy) || 1;
    const tail = this.team === 'player' ? 16 : 12;
    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = this.team === 'player' ? 3 : 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(screenX - (this.vx / speed) * tail, screenY - (this.vy / speed) * tail);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f7feff';
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
