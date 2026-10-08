const MAX_PARTICLES = 320;

export class Particles {
  constructor() {
    this.items = [];
  }

  reset() {
    this.items.length = 0;
  }

  burst(x, y, color, count, speed, life) {
    const room = MAX_PARTICLES - this.items.length;
    const amount = Math.min(count, room);
    for (let index = 0; index < amount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.65);
      const duration = life * (0.55 + Math.random() * 0.45);
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: duration,
        max: duration,
        color,
        size: 1.6 + Math.random() * 2.4,
        alive: true,
      });
    }
  }

  update(dt) {
    for (const particle of this.items) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      particle.life -= dt;
      if (particle.life <= 0) {
        particle.alive = false;
      }
    }
    let write = 0;
    for (let index = 0; index < this.items.length; index += 1) {
      if (this.items[index].alive) {
        this.items[write] = this.items[index];
        write += 1;
      }
    }
    this.items.length = write;
  }

  draw(ctx, camera) {
    ctx.save();
    for (const particle of this.items) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.max);
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x - camera.x - particle.size / 2,
        particle.y - camera.y - particle.size / 2,
        particle.size,
        particle.size,
      );
    }
    ctx.restore();
  }
}
