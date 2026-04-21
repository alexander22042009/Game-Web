export class Entity {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
  }

  moveAndSlide(dt, walls) {
    this.x += this.vx * dt;
    this.resolveWallCollision(walls, true);
    this.y += this.vy * dt;
    this.resolveWallCollision(walls, false);
  }

  resolveWallCollision(walls, horizontal) {
    for (const wall of walls) {
      const closestX = Math.max(wall.x, Math.min(this.x, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(this.y, wall.y + wall.h));
      const dx = this.x - closestX;
      const dy = this.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq < this.radius * this.radius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = this.radius - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        if (horizontal) {
          this.x += nx * overlap;
        } else {
          this.y += ny * overlap;
        }
      }
    }
  }
}
