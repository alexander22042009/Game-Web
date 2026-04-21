import { Entity } from "./entity.js";
import { PLAYER_CONFIG } from "./constants.js";
import { clamp, normalize } from "./utils.js";
import { Projectile } from "./projectile.js";

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, PLAYER_CONFIG.radius);
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.health = PLAYER_CONFIG.maxHealth;
    this.facing = { x: 1, y: 0 };
    this.weaponMode = "PISTOL";
    this.currentLevel = 1;
    this.weaponRecoilOffset = 0;
    this.weaponRecoilRecovery = 6;
    this.weaponRecoilQueue = [];
    this.akSpreadIndex = 0;
    this.fireTimer = 0;
    this.isFiring = false;
    this.invulnTimer = 0;
    this.dashTimer = 0;
    this.dashCooldownTimer = 0;
    this.decoyCooldownTimer = 0;
    this.decoy = null;
  }

  setWeaponByLevel(levelNumber) {
    this.currentLevel = levelNumber;
    if (levelNumber <= 1) {
      this.weaponMode = "PISTOL";
      return;
    }
    if (levelNumber === 2) {
      this.weaponMode = "SHOTGUN";
      return;
    }
    this.weaponMode = "AK-47";
  }

  update(dt, input, world, projectiles) {
    this.fireTimer -= dt;
    this.invulnTimer -= dt;
    this.dashTimer -= dt;
    this.dashCooldownTimer -= dt;
    this.decoyCooldownTimer -= dt;
    if (this.weaponRecoilQueue.length > 0) {
      this.weaponRecoilQueue[0].delay -= dt;
      while (this.weaponRecoilQueue.length > 0 && this.weaponRecoilQueue[0].delay <= 0) {
        const pulse = this.weaponRecoilQueue.shift();
        this.weaponRecoilOffset = Math.min(1, this.weaponRecoilOffset + pulse.power);
      }
    }
    this.weaponRecoilOffset = Math.max(0, this.weaponRecoilOffset - this.weaponRecoilRecovery * dt);

    const moveX = Number(input.isDown("ArrowRight") || input.isDown("KeyD")) - Number(input.isDown("ArrowLeft") || input.isDown("KeyA"));
    const moveY = Number(input.isDown("ArrowDown") || input.isDown("KeyS")) - Number(input.isDown("ArrowUp") || input.isDown("KeyW"));
    const moveDir = normalize(moveX, moveY);
    const wantsMove = moveX !== 0 || moveY !== 0;

    const speed = this.dashTimer > 0 ? PLAYER_CONFIG.dashSpeed : PLAYER_CONFIG.speed;
    this.vx = wantsMove ? moveDir.x * speed : 0;
    this.vy = wantsMove ? moveDir.y * speed : 0;
    const walls = world.level?.walls ?? world.walls ?? [];
    this.moveAndSlide(dt, walls);

    this.x = clamp(this.x, this.radius + 10, world.width - this.radius - 10);
    this.y = clamp(this.y, this.radius + 10, world.height - this.radius - 10);

    const dx = input.mouseWorldX - this.x;
    const dy = input.mouseWorldY - this.y;
    this.facing = normalize(dx, dy);
    this.setWeaponByLevel(world.level?.level ?? 1);

    if (this.isFiring) {
      this.tryShoot(projectiles);
    }
  }

  cycleWeapon(direction) {
    return direction;
  }

  tryShoot(projectiles) {
    if (this.fireTimer > 0) {
      return false;
    }

    if (this.currentLevel <= 1) {
      this.spawnProjectile(projectiles, this.facing.x, this.facing.y, PLAYER_CONFIG.projectileDamage, 5, PLAYER_CONFIG.projectileSpeed * 1.25);
      this.fireTimer = 1;
      this.queueRecoil(0.2);
      return true;
    }

    if (this.currentLevel === 2) {
      const spread = [-0.2, 0, 0.2];
      for (const angleOffset of spread) {
        const rotated = this.rotate(this.facing.x, this.facing.y, angleOffset);
        this.spawnProjectile(projectiles, rotated.x, rotated.y, PLAYER_CONFIG.projectileDamage * 0.68, 5, PLAYER_CONFIG.projectileSpeed * 0.95);
      }
      this.fireTimer = 0.8;
      this.queueRecoil(0.34);
      return true;
    }

    const akSpreadPattern = [-0.07, -0.035, 0, 0.035, 0.07];
    const spreadAngle = akSpreadPattern[this.akSpreadIndex % akSpreadPattern.length];
    this.akSpreadIndex += 1;
    const rotated = this.rotate(this.facing.x, this.facing.y, spreadAngle);
    this.spawnProjectile(projectiles, rotated.x, rotated.y, PLAYER_CONFIG.projectileDamage * 0.58, 4, PLAYER_CONFIG.projectileSpeed * 1.08);
    this.fireTimer = 0.2;
    this.queueRecoil(0.16, 0);
    return true;
  }

  queueRecoil(power, delay = 0) {
    this.weaponRecoilQueue.push({ power, delay });
  }

  spawnProjectile(projectiles, dirX, dirY, damage, radius = 5, speed = PLAYER_CONFIG.projectileSpeed) {
    projectiles.push(
      new Projectile({
        x: this.x + dirX * (this.radius + 5),
        y: this.y + dirY * (this.radius + 5),
        dirX,
        dirY,
        speed,
        radius,
        damage,
        owner: "player",
      })
    );
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0 || this.health <= 0) {
      return false;
    }
    this.health -= amount;
    this.invulnTimer = PLAYER_CONFIG.invulnDuration;
    return true;
  }

  triggerDash() {
    if (this.dashCooldownTimer > 0 || this.dashTimer > 0) {
      return false;
    }
    this.dashTimer = PLAYER_CONFIG.dashDuration;
    this.dashCooldownTimer = PLAYER_CONFIG.dashCooldown;
    return true;
  }

  canDeployDecoy() {
    return this.decoyCooldownTimer <= 0;
  }

  deployDecoy(targetX, targetY) {
    if (!this.canDeployDecoy()) {
      return null;
    }
    this.decoyCooldownTimer = PLAYER_CONFIG.decoyCooldown;
    this.decoy = {
      x: targetX,
      y: targetY,
      radius: PLAYER_CONFIG.decoyRadius,
      life: PLAYER_CONFIG.decoyDuration,
      pulse: 0,
    };
    return this.decoy;
  }

  updateDecoy(dt) {
    if (!this.decoy) {
      return;
    }
    this.decoy.life -= dt;
    this.decoy.pulse += dt * 4;
    if (this.decoy.life <= 0) {
      this.decoy = null;
    }
  }

  rotate(x, y, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: x * cos - y * sin, y: x * sin + y * cos };
  }
}
