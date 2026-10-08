import { CONFIG } from './config.js';
import { clamp } from './math.js';

/** 刷在当前视野外，并保证落在地图里。贴边时改放到玩家另一侧的地图边缘。 */
export function pointOutsideView(player, camera, margin = 80) {
  const left = camera.x - margin;
  const top = camera.y - margin;
  const right = camera.x + CONFIG.viewWidth + margin;
  const bottom = camera.y + CONFIG.viewHeight + margin;
  const side = Math.floor(Math.random() * 4);
  let x = left + Math.random() * (right - left);
  let y = top + Math.random() * (bottom - top);
  if (side === 0) x = left;
  else if (side === 1) x = right;
  else if (side === 2) y = top;
  else y = bottom;

  x = clamp(x, 40, CONFIG.worldWidth - 40);
  y = clamp(y, 40, CONFIG.worldHeight - 40);

  const insideView = (
    x > camera.x
    && x < camera.x + CONFIG.viewWidth
    && y > camera.y
    && y < camera.y + CONFIG.viewHeight
  );
  if (insideView) {
    x = player.x > CONFIG.worldWidth / 2 ? 40 : CONFIG.worldWidth - 40;
    y = clamp(y, 40, CONFIG.worldHeight - 40);
  }
  return { x, y };
}
