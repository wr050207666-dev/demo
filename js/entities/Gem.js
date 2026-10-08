export class Gem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.alive = true;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 150 && distance > 0.001) {
      const speed = 70 + (1 - distance / 150) * 540;
      this.x += (dx / distance) * speed * dt;
      this.y += (dy / distance) * speed * dt;
    }
    return distance <= player.radius + 12;
  }

  draw(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#7dffe1';
    ctx.strokeStyle = '#e9fff8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.strokeRect(-5, -5, 10, 10);
    ctx.restore();
  }
}
