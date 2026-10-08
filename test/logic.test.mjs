import assert from 'node:assert/strict';
import { Player } from '../js/entities/Player.js';
import { Enemy } from '../js/entities/Enemy.js';
import { circlesOverlap, segmentHitsCircle } from '../js/math.js';
import { grantXp, nextXpRequirement } from '../js/progress.js';
import { applyUpgrade, createWeapon, shotAngles } from '../js/weapon.js';
import { Director, bossDue, pressureLabel } from '../js/director/Director.js';
import { CONFIG } from '../js/config.js';

const player = new Player();
const originX = player.x;
player.move(0.5, { x: 1, y: 0 });
assert.equal(player.x, originX + CONFIG.player.speed * 0.5);
player.move(30, { x: 1, y: 1 });
assert.equal(player.x, CONFIG.worldWidth - player.radius);
assert.equal(player.y, CONFIG.worldHeight - player.radius);
player.move(30, { x: -1, y: -1 });
assert.equal(player.x, player.radius);
assert.equal(player.y, player.radius);
player.aimAt({ x: player.x + 30, y: player.y });
assert.ok(Math.abs(player.angle) < 0.001);

assert.equal(circlesOverlap(0, 0, 10, 15, 0, 10), true);
assert.equal(circlesOverlap(0, 0, 10, 30, 0, 10), false);
assert.equal(segmentHitsCircle(0, 0, 100, 0, 50, 0, 10), true);
assert.equal(circlesOverlap(0, 0, 0, 50, 0, 10), false);
assert.equal(circlesOverlap(100, 0, 0, 50, 0, 10), false);
assert.equal(segmentHitsCircle(0, 0, 100, 0, 50, 40, 10), false);

const stats = { level: 1, xp: 0, xpToNext: nextXpRequirement(1) };
assert.equal(grantXp(stats, 16), 1);
assert.equal(stats.level, 2);
assert.equal(stats.xp, 0);
assert.equal(stats.xpToNext, 34);
assert.equal(grantXp(stats, 100), 2);
assert.equal(stats.level, 4);
assert.equal(stats.xp, 14);
assert.equal(stats.xpToNext, 70);

const weapon = createWeapon();
assert.deepEqual(shotAngles(0, 1, 0.14), [0]);
assert.deepEqual(shotAngles(0, 3, 0.14), [-0.14, 0, 0.14]);
for (let index = 0; index < 12; index += 1) {
  applyUpgrade(weapon, 'projectiles');
  applyUpgrade(weapon, 'fireRate');
  applyUpgrade(weapon, 'damage');
}
assert.equal(weapon.projectiles, 7);
assert.ok(weapon.fireRate <= 11);
assert.equal(weapon.damage, 64);
assert.equal(applyUpgrade(weapon, 'unknown'), false);

const normal = new Enemy('normal', 0, 0);
assert.equal(normal.hurt(10), false);
assert.equal(normal.alive, true);
assert.equal(normal.hurt(10), true);
assert.equal(normal.alive, false);
const boss = new Enemy('boss', 0, 0);
assert.equal(boss.hurt(10), false);
assert.equal(boss.hp, CONFIG.enemies.boss.hp - 10);

assert.equal(bossDue(44, false), false);
assert.equal(bossDue(45, false), true);
assert.equal(bossDue(45, true), false);

const farming = new Director();
const farmStats = { hp: 100, maxHp: 100, level: 1, time: 0 };
for (let step = 0; step < 16; step += 1) {
  farmStats.time += 0.5;
  farming.noteKill();
  farming.noteKill();
  farming.noteKill();
  farming.update(0.5, farmStats);
}
assert.ok(farming.pressure > 0.45, `farming pressure ${farming.pressure}`);
assert.ok(farming.eliteChance() > 0);
assert.ok(farming.spawnInterval() < 0.8);
assert.ok(farming.maxAlive() >= 10);

const struggling = new Director();
const hurtStats = { hp: 25, maxHp: 100, level: 1, time: 10 };
for (let step = 0; step < 16; step += 1) {
  struggling.noteDamage(15);
  struggling.update(0.5, hurtStats);
}
assert.ok(struggling.pressure < 0.2, `hurt pressure ${struggling.pressure}`);
assert.equal(struggling.eliteChance(), 0);
assert.ok(struggling.spawnInterval() > farming.spawnInterval());
assert.equal(pressureLabel(0.2), '低压');
assert.equal(pressureLabel(0.9), '极高');

console.log('logic checks ok');
