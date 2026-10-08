import { CONFIG } from '../config.js';

const BLOCK_SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

/** 键盘与鼠标输入。鼠标坐标已换成游戏逻辑分辨率，而不是 CSS 像素。 */
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = {
      x: CONFIG.viewWidth / 2,
      y: CONFIG.viewHeight / 2,
      inside: false,
      leftDown: false,
      shotQueued: false,
    };

    this.onKeyDown = (event) => {
      if (BLOCK_SCROLL_KEYS.has(event.code)) {
        event.preventDefault();
      }
      this.keys.add(event.code);
    };
    this.onKeyUp = (event) => {
      this.keys.delete(event.code);
    };
    this.onBlur = () => {
      this.keys.clear();
      this.mouse.leftDown = false;
    };
    this.onMouseDown = (event) => {
      if (event.button !== 0) {
        return;
      }
      this.mouse.leftDown = true;
      this.mouse.shotQueued = true;
    };
    this.onMouseUp = (event) => {
      if (event.button === 0) {
        this.mouse.leftDown = false;
      }
    };
    this.onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      this.mouse.inside = (
        event.clientX >= rect.left
        && event.clientX <= rect.right
        && event.clientY >= rect.top
        && event.clientY <= rect.bottom
      );
      this.mouse.x = (event.clientX - rect.left) * (CONFIG.viewWidth / rect.width);
      this.mouse.y = (event.clientY - rect.top) * (CONFIG.viewHeight / rect.height);
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  resetTransient() {
    this.mouse.leftDown = false;
    this.mouse.shotQueued = false;
  }

  isDown(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  /** 返回已归一化的移动方向，斜向移动不会比直线更快。 */
  getMoveAxis() {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyA', 'ArrowLeft')) x -= 1;
    if (this.isDown('KeyD', 'ArrowRight')) x += 1;
    if (this.isDown('KeyW', 'ArrowUp')) y -= 1;
    if (this.isDown('KeyS', 'ArrowDown')) y += 1;

    const length = Math.hypot(x, y);
    if (length > 0) {
      x /= length;
      y /= length;
    }
    return { x, y };
  }

  getAimWorld(camera) {
    return {
      x: this.mouse.x + camera.x,
      y: this.mouse.y + camera.y,
    };
  }
}
