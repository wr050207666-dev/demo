const CAP = {
  projectiles: 7,
  fireRate: 11,
  damage: 64,
};

export const UPGRADE_LIST = [
  {
    id: 'projectiles',
    name: '分裂弹道',
    description: '每轮额外发射 1 颗子弹',
  },
  {
    id: 'fireRate',
    name: '超频射速',
    description: '缩短射击间隔',
  },
  {
    id: 'damage',
    name: '高能弹药',
    description: '每颗子弹的伤害提高',
  },
];

export function createWeapon() {
  return {
    projectiles: 1,
    fireRate: 4,
    damage: 10,
    spread: 0.14,
    cooldown: 0,
  };
}

export function applyUpgrade(weapon, id) {
  if (id === 'projectiles') {
    weapon.projectiles = Math.min(CAP.projectiles, weapon.projectiles + 1);
    return true;
  }
  if (id === 'fireRate') {
    const next = Math.round(weapon.fireRate * 1.18 * 10) / 10;
    weapon.fireRate = Math.min(CAP.fireRate, next);
    return true;
  }
  if (id === 'damage') {
    weapon.damage = Math.min(CAP.damage, weapon.damage + 6);
    return true;
  }
  return false;
}

export function upgradeValueText(weapon, id) {
  if (id === 'projectiles') {
    return `当前 ${weapon.projectiles} 发`;
  }
  if (id === 'fireRate') {
    return `当前 ${weapon.fireRate.toFixed(1)} / 秒`;
  }
  return `当前伤害 ${weapon.damage}`;
}

/** 以瞄准角为中心对称展开。单发时就是瞄准方向。 */
export function shotAngles(baseAngle, count, spread) {
  const total = Math.max(1, count);
  if (total === 1) {
    return [baseAngle];
  }
  const start = -spread * (total - 1) / 2;
  const angles = [];
  for (let index = 0; index < total; index += 1) {
    angles.push(baseAngle + start + spread * index);
  }
  return angles;
}
