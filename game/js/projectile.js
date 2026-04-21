import { Entity } from "./entity.js";
import { COLORS } from "./constants.js";

export class Projectile extends Entity {
  constructor({ x, y, dirX, dirY, speed, radius, damage, owner }) {
    super(x, y, radius);
    this.vx = dirX * speed;
    this.vy = dirY * speed;
    this.damage = damage;
    this.owner = owner;
    this.life = 1.8;
    this.color = owner === "player" ? COLORS.projectile : COLORS.enemyProjectile;
  }

  update(dt, walls) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.moveAndSlide(dt, walls);
  }
}
