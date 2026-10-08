import { CONFIG } from '../config.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Bullet } from '../entities/Bullet.js';
import { Gem } from '../entities/Gem.js';
import { Particles } from '../effects/Particles.js';
import { Shake } from '../effects/Shake.js';
import { Director, bossDue } from '../director/Director.js';
import { createWeapon, applyUpgrade, shotAngles } from '../weapon.js';
import { grantXp, nextXpRequirement } from '../progress.js';
import { pointOutsideView } from '../spawn.js';
import { circlesOverlap, compact, segmentHitsCircle } from '../math.js';

/**
 * 对局状态、主循环和战斗调度。
 * state: 'menu' | 'playing' | 'paused' | 'upgrade' | 'result'
 */
export class Game {
  constructor({ canvas, input, ui }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.ui = ui;
    this.player = new Player();
    this.camera = { x: 0, y: 0 };
    this.particles = new Particles();
    this.shake = new Shake();
    this.director = new Director();
    this.state = 'menu';
    this.lastTime = 0;
    this.onFrame = (time) => this.frame(time);
    this.stats = this.createStats();
    this.weapon = createWeapon();
    this.enemies = [];
    this.bullets = [];
    this.gems = [];
    this.boss = null;
    this.bossSpawned = false;
    this.pendingLevels = 0;
    this.spawnTimer = 0.7;

    this.setupCanvas();
    this.resetRun();
    this.ui.sync(this.state);
  }

  createStats() {
    return {
      hp: CONFIG.player.maxHp,
      maxHp: CONFIG.player.maxHp,
      level: 1,
      xp: 0,
      xpToNext: nextXpRequirement(1),
      kills: 0,
      time: 0,
    };
  }

  setupCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(CONFIG.viewWidth * dpr);
    this.canvas.height = Math.round(CONFIG.viewHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  startLoop() {
    requestAnimationFrame(this.onFrame);
  }

  frame(time) {
    if (this.lastTime === 0) {
      this.lastTime = time;
    }
    const dt = Math.min((time - this.lastTime) / 1000, CONFIG.maxDeltaTime);
    this.lastTime = time;
    this.update(dt);
    this.render();
    requestAnimationFrame(this.onFrame);
  }

  start() {
    if (this.state !== 'menu') {
      return;
    }
    this.resetRun();
    this.setState('playing');
  }

  togglePause() {
    if (this.state === 'playing') {
      this.setState('paused');
    } else if (this.state === 'paused') {
      this.setState('playing');
    }
  }

  restart() {
    this.resetRun();
    this.setState('playing');
  }

  backToMenu() {
    this.resetRun();
    this.setState('menu');
  }

  chooseUpgrade(id) {
    if (this.state !== 'upgrade') {
      return;
    }
    if (!applyUpgrade(this.weapon, id)) {
      return;
    }
    this.pendingLevels -= 1;
    this.ui.updateHud(this.stats, this.weapon, this.director);
    if (this.pendingLevels > 0) {
      this.ui.showUpgrades(this.weapon);
      return;
    }
    this.setState('playing');
  }

  setState(next) {
    this.state = next;
    this.ui.sync(next);
  }

  resetRun() {
    this.stats = this.createStats();
    this.player.reset(CONFIG.worldWidth / 2, CONFIG.worldHeight / 2);
    this.weapon = createWeapon();
    this.director.reset();
    this.particles.reset();
    this.shake.reset();
    this.enemies.length = 0;
    this.bullets.length = 0;
    this.gems.length = 0;
    this.boss = null;
    this.bossSpawned = false;
    this.pendingLevels = 0;
    this.spawnTimer = 0.7;
    this.input.resetTransient();
    this.updateCamera();
    this.ui.hideBanner();
    this.ui.setBoss(null);
    this.ui.updateHud(this.stats, this.weapon, this.director);
  }

  update(dt) {
    this.shake.update(dt);
    if (this.state !== 'playing') {
      if (this.state !== 'menu') {
        this.ui.updateHud(this.stats, this.weapon, this.director);
      }
      return;
    }

    this.stats.time += dt;
    this.player.tick(dt);
    this.director.update(dt, this.stats);
    this.trySpawnBoss();
    this.player.move(dt, this.input.getMoveAxis());
    this.player.aimAt(this.input.getAimWorld(this.camera));
    this.updateCamera();
    this.fire(dt);
    this.updateSpawns(dt);
    this.updateEnemies(dt);
    this.separateEnemies();
    this.keepEnemiesInside();
    this.updateBullets(dt);
    this.handleCombat();
    this.updateGems(dt);
    this.particles.update(dt);
    this.finishFrame();
    this.ui.updateHud(this.stats, this.weapon, this.director);
    this.ui.setBoss(this.boss && this.boss.alive ? this.boss : null);
  }

  trySpawnBoss() {
    if (!bossDue(this.stats.time, this.bossSpawned)) {
      return;
    }
    this.bossSpawned = true;
    const point = pointOutsideView(this.player, this.camera, 120);
    const boss = new Enemy('boss', point.x, point.y);
    this.enemies.push(boss);
    this.boss = boss;
    this.shake.add(0.8);
    this.particles.burst(point.x, point.y, '#ff5570', 36, 240, 0.7);
    this.ui.showBanner('Boss 来了');
  }

  fire(dt) {
    this.weapon.cooldown -= dt;
    const shooting = this.input.mouse.leftDown || this.input.mouse.shotQueued;
    if (!shooting) {
      this.weapon.cooldown = Math.max(0, this.weapon.cooldown);
      return;
    }
    if (this.weapon.cooldown > 0) {
      return;
    }
    this.input.mouse.shotQueued = false;
    this.weapon.cooldown = 1 / this.weapon.fireRate;
    this.player.muzzle = 0.06;

    const angles = shotAngles(this.player.angle, this.weapon.projectiles, this.weapon.spread);
    const nose = 20;
    for (const angle of angles) {
      this.bullets.push(new Bullet({
        x: this.player.x + Math.cos(angle) * nose,
        y: this.player.y + Math.sin(angle) * nose,
        angle,
        speed: CONFIG.bullet.speed,
        damage: this.weapon.damage,
        radius: 4.2,
        team: 'player',
        color: '#9aefff',
        life: CONFIG.bullet.life,
      }));
    }
    this.particles.burst(
      this.player.x + Math.cos(this.player.angle) * nose,
      this.player.y + Math.sin(this.player.angle) * nose,
      '#d7fbff',
      5,
      90,
      0.16,
    );
  }

  updateSpawns(dt) {
    if (this.boss) {
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) {
      return;
    }
    this.spawnTimer = this.director.spawnInterval();
    let alive = 0;
    for (const enemy of this.enemies) {
      if (enemy.alive && enemy.kind !== 'boss') {
        alive += 1;
      }
    }
    if (alive >= this.director.maxAlive()) {
      return;
    }
    const kind = Math.random() < this.director.eliteChance() ? 'elite' : 'normal';
    const point = pointOutsideView(this.player, this.camera);
    this.enemies.push(new Enemy(kind, point.x, point.y));
  }

  updateEnemies(dt) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }
      const shooting = enemy.update(dt, this.player);
      if (shooting) {
        this.fireBossRing(enemy);
      }
    }
  }

  fireBossRing(boss) {
    const count = CONFIG.boss.ringBullets;
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + this.stats.time;
      this.bullets.push(new Bullet({
        x: boss.x + Math.cos(angle) * (boss.radius + 10),
        y: boss.y + Math.sin(angle) * (boss.radius + 10),
        angle,
        speed: CONFIG.boss.bulletSpeed,
        damage: CONFIG.boss.bulletDamage,
        radius: 5,
        team: 'enemy',
        color: '#ffb3c2',
        life: 3.4,
      }));
    }
    this.shake.add(0.18);
  }

  keepEnemiesInside() {
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }
      enemy.x = Math.max(enemy.radius, Math.min(CONFIG.worldWidth - enemy.radius, enemy.x));
      enemy.y = Math.max(enemy.radius, Math.min(CONFIG.worldHeight - enemy.radius, enemy.y));
    }
  }

  separateEnemies() {
    for (let i = 0; i < this.enemies.length; i += 1) {
      const left = this.enemies[i];
      if (!left.alive) {
        continue;
      }
      for (let j = i + 1; j < this.enemies.length; j += 1) {
        const right = this.enemies[j];
        if (!right.alive) {
          continue;
        }
        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        const minDistance = left.radius + right.radius;
        if (distance >= minDistance) {
          continue;
        }
        const push = (minDistance - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;
        left.x -= nx * push;
        left.y -= ny * push;
        right.x += nx * push;
        right.y += ny * push;
      }
    }
  }

  updateBullets(dt) {
    for (const bullet of this.bullets) {
      if (bullet.alive) {
        bullet.update(dt);
      }
    }
  }

  handleCombat() {
    for (const enemy of this.enemies) {
      if (!enemy.alive) {
        continue;
      }
      if (this.player.invuln <= 0 && circlesOverlap(
        enemy.x, enemy.y, enemy.radius,
        this.player.x, this.player.y, this.player.radius,
      )) {
        this.hurtPlayer(enemy.contact);
      }
      for (const bullet of this.bullets) {
        if (!bullet.alive || !enemy.alive || bullet.team !== 'player') {
          continue;
        }
        if (!segmentHitsCircle(
          bullet.prevX, bullet.prevY, bullet.x, bullet.y,
          enemy.x, enemy.y, enemy.radius + bullet.radius,
        )) {
          continue;
        }
        bullet.alive = false;
        const killed = enemy.hurt(bullet.damage);
        this.particles.burst(bullet.x, bullet.y, '#fff4cf', 4, 120, 0.18);
        if (enemy.kind === 'boss') {
          this.shake.add(0.08);
        }
        if (killed) {
          this.killEnemy(enemy);
        }
      }
    }

    if (this.player.invuln <= 0) {
      for (const bullet of this.bullets) {
        if (!bullet.alive || bullet.team !== 'enemy') {
          continue;
        }
        if (!segmentHitsCircle(
          bullet.prevX, bullet.prevY, bullet.x, bullet.y,
          this.player.x, this.player.y, this.player.radius + bullet.radius,
        )) {
          continue;
        }
        bullet.alive = false;
        this.hurtPlayer(bullet.damage);
      }
    }
  }

  hurtPlayer(amount) {
    if (this.player.invuln > 0 || this.stats.hp <= 0) {
      return;
    }
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.player.invuln = CONFIG.player.invuln;
    this.director.noteDamage(amount);
    this.shake.add(0.42);
    this.particles.burst(this.player.x, this.player.y, '#ff8aa3', 12, 160, 0.32);
  }

  killEnemy(enemy) {
    this.stats.kills += 1;
    this.director.noteKill();
    if (enemy.xp > 0) {
      this.gems.push(new Gem(enemy.x, enemy.y, enemy.xp));
    }
    const color = enemy.kind === 'elite' ? '#ffc14a' : '#ff5d7a';
    const count = enemy.kind === 'boss' ? 48 : enemy.kind === 'elite' ? 18 : 8;
    this.particles.burst(enemy.x, enemy.y, color, count, enemy.kind === 'boss' ? 280 : 160, 0.45);
    if (enemy.kind === 'elite') {
      this.shake.add(0.28);
    } else if (enemy.kind === 'boss') {
      this.shake.add(1);
    }
  }

  updateGems(dt) {
    for (const gem of this.gems) {
      if (!gem.alive) {
        continue;
      }
      if (!gem.update(dt, this.player)) {
        continue;
      }
      gem.alive = false;
      this.particles.burst(gem.x, gem.y, '#9dffe8', 5, 70, 0.2);
      this.pendingLevels += grantXp(this.stats, gem.value);
    }
  }

  finishFrame() {
    compact(this.enemies);
    compact(this.bullets);
    compact(this.gems);
    if (this.boss && !this.boss.alive) {
      this.boss = null;
    }

    if (this.bossSpawned && !this.boss) {
      this.endRun(true);
      return;
    }
    if (this.stats.hp <= 0) {
      this.endRun(false);
      return;
    }
    if (this.pendingLevels > 0) {
      this.setState('upgrade');
      this.ui.showUpgrades(this.weapon);
    }
  }

  endRun(victory) {
    if (this.state === 'result') {
      return;
    }
    this.ui.hideBanner();
    this.ui.setBoss(null);
    this.ui.showResult({
      victory,
      time: this.stats.time,
      kills: this.stats.kills,
      level: this.stats.level,
      weapon: this.weapon,
      pressure: this.director.pressure,
    });
    this.setState('result');
  }

  updateCamera() {
    const x = this.player.x - CONFIG.viewWidth / 2;
    const y = this.player.y - CONFIG.viewHeight / 2;
    const maxX = Math.max(0, CONFIG.worldWidth - CONFIG.viewWidth);
    const maxY = Math.max(0, CONFIG.worldHeight - CONFIG.viewHeight);
    this.camera.x = Math.max(0, Math.min(maxX, x));
    this.camera.y = Math.max(0, Math.min(maxY, y));
  }

  render() {
    const ctx = this.ctx;
    const shake = this.shake.offset();
    ctx.save();
    ctx.translate(shake.x, shake.y);
    this.drawBackground(ctx);
    this.drawGrid(ctx);
    this.drawWorldBorder(ctx);
    for (const gem of this.gems) {
      gem.draw(ctx, this.camera);
    }
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        enemy.draw(ctx, this.camera);
      }
    }
    this.player.draw(ctx, this.camera);
    for (const bullet of this.bullets) {
      if (bullet.alive) {
        bullet.draw(ctx, this.camera);
      }
    }
    this.particles.draw(ctx, this.camera);
    this.drawVignette(ctx);
    this.drawHurtFlash(ctx);
    ctx.restore();
    if (this.state === 'playing') {
      this.drawCrosshair(ctx);
      this.drawBossPointer(ctx);
    }
  }

  drawHurtFlash(ctx) {
    if (this.player.invuln <= 0) {
      return;
    }
    const alpha = Math.min(0.28, this.player.invuln * 0.35);
    const { viewWidth, viewHeight } = CONFIG;
    const gradient = ctx.createRadialGradient(
      viewWidth / 2,
      viewHeight / 2,
      viewWidth * 0.2,
      viewWidth / 2,
      viewHeight / 2,
      viewWidth * 0.7,
    );
    gradient.addColorStop(0, 'rgba(255, 40, 70, 0)');
    gradient.addColorStop(1, `rgba(255, 30, 60, ${alpha})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
  }

  drawBossPointer(ctx) {
    if (!this.boss || !this.boss.alive) {
      return;
    }
    const screenX = this.boss.x - this.camera.x;
    const screenY = this.boss.y - this.camera.y;
    const { viewWidth, viewHeight } = CONFIG;
    if (screenX > 28 && screenX < viewWidth - 28 && screenY > 28 && screenY < viewHeight - 28) {
      return;
    }
    const centerX = viewWidth / 2;
    const centerY = viewHeight / 2;
    const angle = Math.atan2(screenY - centerY, screenX - centerX);
    const x = Math.max(28, Math.min(viewWidth - 28, screenX));
    const y = Math.max(28, Math.min(viewHeight - 28, screenY));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = '#ff5d78';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 7);
    ctx.lineTo(-8, -7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawBackground(ctx) {
    const { viewWidth, viewHeight, colors } = CONFIG;
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    const glow = ctx.createRadialGradient(
      viewWidth / 2,
      viewHeight / 2,
      80,
      viewWidth / 2,
      viewHeight / 2,
      viewWidth * 0.62,
    );
    glow.addColorStop(0, 'rgba(16, 52, 78, 0.45)');
    glow.addColorStop(1, 'rgba(7, 11, 20, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
  }

  drawGrid(ctx) {
    const { viewWidth, viewHeight, gridSize, colors } = CONFIG;
    const left = this.camera.x;
    const top = this.camera.y;
    const right = left + viewWidth;
    const bottom = top + viewHeight;

    const strokeGrid = (step, color) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      const xStart = Math.floor(left / step) * step;
      for (let x = xStart; x <= right; x += step) {
        const screenX = x - left;
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, viewHeight);
      }
      const yStart = Math.floor(top / step) * step;
      for (let y = yStart; y <= bottom; y += step) {
        const screenY = y - top;
        ctx.moveTo(0, screenY);
        ctx.lineTo(viewWidth, screenY);
      }
      ctx.stroke();
    };

    strokeGrid(gridSize, colors.grid);
    strokeGrid(gridSize * 4, colors.gridMajor);
  }

  drawWorldBorder(ctx) {
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.border;
    ctx.lineWidth = 3;
    ctx.strokeRect(
      -this.camera.x + 1.5,
      -this.camera.y + 1.5,
      CONFIG.worldWidth - 3,
      CONFIG.worldHeight - 3,
    );
    ctx.restore();
  }

  drawVignette(ctx) {
    const { viewWidth, viewHeight } = CONFIG;
    const vignette = ctx.createRadialGradient(
      viewWidth / 2,
      viewHeight / 2,
      viewWidth * 0.25,
      viewWidth / 2,
      viewHeight / 2,
      viewWidth * 0.72,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.48)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, viewWidth, viewHeight);
  }

  drawCrosshair(ctx) {
    const { x, y, inside } = this.input.mouse;
    if (!inside) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.aim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x - 5, y);
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 18, y);
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y - 5);
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x, y + 18);
    ctx.stroke();
    ctx.restore();
  }
}
