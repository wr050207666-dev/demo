export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function circlesOverlap(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  const reach = ar + br;
  return dx * dx + dy * dy <= reach * reach;
}

/** 高速子弹在低帧率下会跳过目标，所以按这一帧的飞行线段做判定。 */
export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) {
    const ox = x1 - cx;
    const oy = y1 - cy;
    return ox * ox + oy * oy <= radius * radius;
  }
  const t = clamp(((cx - x1) * dx + (cy - y1) * dy) / lengthSq, 0, 1);
  const px = x1 + dx * t;
  const py = y1 + dy * t;
  const ox = px - cx;
  const oy = py - cy;
  return ox * ox + oy * oy <= radius * radius;
}

export function compact(list) {
  let write = 0;
  for (let index = 0; index < list.length; index += 1) {
    if (list[index].alive) {
      list[write] = list[index];
      write += 1;
    }
  }
  list.length = write;
}
