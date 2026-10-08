/** 1 级需求 16，之后每级 +18。返回值是这次实际升了几级。 */
export function nextXpRequirement(level) {
  return 16 + (level - 1) * 18;
}

export function grantXp(stats, amount) {
  if (amount <= 0) {
    return 0;
  }
  stats.xp += amount;
  let gained = 0;
  while (stats.xp >= stats.xpToNext && gained < 10) {
    stats.xp -= stats.xpToNext;
    stats.level += 1;
    gained += 1;
    stats.xpToNext = nextXpRequirement(stats.level);
  }
  return gained;
}
