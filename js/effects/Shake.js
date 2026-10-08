export class Shake {
  constructor() {
    this.trauma = 0;
  }

  reset() {
    this.trauma = 0;
  }

  add(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
  }

  offset() {
    const magnitude = this.trauma * this.trauma * 18;
    if (magnitude < 0.25) {
      return { x: 0, y: 0 };
    }
    return {
      x: (Math.random() * 2 - 1) * magnitude,
      y: (Math.random() * 2 - 1) * magnitude,
    };
  }
}
