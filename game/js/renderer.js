import { COLORS, ENEMY_STATE } from "./constants.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.playerFacing = "right";
    this.enemyFacingById = new Map();
    this.sprites = {
      heroLeft: null,
      heroRight: null,
      enemyLeft: null,
      enemyRight: null,
      pistolLeft: null,
      shotgunRight: null,
      ak47Left: null,
    };
    this.loadDirectionalSprites();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  loadDirectionalSprites() {
    this.tryLoadSprite("hero_left", (img) => {
      this.sprites.heroLeft = img;
    });
    this.tryLoadSprite("hero_right", (img) => {
      this.sprites.heroRight = img;
    });
    this.tryLoadSprite("enemy_left", (img) => {
      this.sprites.enemyLeft = img;
    });
    this.tryLoadSprite("enemy_right", (img) => {
      this.sprites.enemyRight = img;
    });
    this.tryLoadSpriteFromCandidates(["pistol_left-removebg-preview", "pistol_left"], (img) => {
      this.sprites.pistolLeft = img;
    });
    this.tryLoadSpriteFromCandidates(["shotgun_right-removebg-preview", "shotgun_right"], (img) => {
      this.sprites.shotgunRight = img;
    });
    this.tryLoadSpriteFromCandidates(["ak-47_left-removebg-preview", "ak47_left-removebg-preview", "ak-47_left", "ak47_left"], (img) => {
      this.sprites.ak47Left = img;
    });
  }

  tryLoadSprite(baseName, onSuccess, onFail = () => {}) {
    const extensions = ["png", "webp", "jpg", "jpeg"];
    const probe = (index) => {
      if (index >= extensions.length) {
        onFail();
        return;
      }
      const candidate = new Image();
      candidate.onload = () => onSuccess(candidate);
      candidate.onerror = () => probe(index + 1);
      const url = new URL(`../assets/images/${baseName}.${extensions[index]}`, import.meta.url).href;
      candidate.src = url;
    };
    probe(0);
  }

  tryLoadSpriteFromCandidates(candidates, onSuccess) {
    const attempt = (index) => {
      if (index >= candidates.length) {
        return;
      }
      this.tryLoadSprite(candidates[index], (img) => {
        onSuccess(img);
      }, () => attempt(index + 1));
    };
    attempt(0);
  }

  drawDirectionalSprite(image, x, y, size, glowColor, alpha = 1) {
    if (!image || !image.complete || image.naturalWidth <= 0) {
      return false;
    }
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowBlur = 18;
    ctx.shadowColor = glowColor;
    ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
    ctx.restore();
    return true;
  }

  render(world) {
    const { ctx } = this;
    const { width, height } = world;

    ctx.clearRect(0, 0, width, height);
    this.drawBackdrop(world.time, width, height);
    this.drawWalls(world.level.walls);
    this.drawPortal(world.level.portal, world.level.portalUnlocked);
    this.drawShards(world.level.shards);
    this.drawDecoy(world.player.decoy);
    this.drawProjectiles(world.projectiles);
    this.drawProjectiles(world.enemyProjectiles, true);
    this.drawEnemies(world.enemies);
    this.drawPlayer(world.player, world.level.level);
    this.drawCrosshair(world.input.mouseWorldX, world.input.mouseWorldY);
  }

  drawBackdrop(time, width, height) {
    const { ctx } = this;
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 40, width * 0.5, height * 0.5, width * 0.7);
    gradient.addColorStop(0, "#0b1428");
    gradient.addColorStop(1, COLORS.bg);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const major = 80;
    const minor = 20;
    const pulse = Math.sin(time * 0.8) * 0.5 + 0.5;
    ctx.strokeStyle = COLORS.gridMinor;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += minor) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += minor) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(61,248,255,${0.08 + pulse * 0.1})`;
    ctx.lineWidth = 1.4;
    for (let x = 0; x < width; x += major) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += major) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  drawWalls(walls) {
    const { ctx } = this;
    for (const wall of walls) {
      ctx.shadowBlur = 14;
      ctx.shadowColor = COLORS.wallGlow;
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.shadowBlur = 0;
    }
  }

  drawPlayer(player, levelNumber) {
    const { ctx } = this;
    const invulnAlpha = player.invulnTimer > 0 ? 0.55 + Math.sin(performance.now() * 0.03) * 0.22 : 1;
    const horizontalThreshold = 3;
    if (player.vx < -horizontalThreshold) {
      this.playerFacing = "left";
    } else if (player.vx > horizontalThreshold) {
      this.playerFacing = "right";
    } else if (player.facing.x < -0.2) {
      this.playerFacing = "left";
    } else if (player.facing.x > 0.2) {
      this.playerFacing = "right";
    }

    const sprite = this.playerFacing === "left" ? this.sprites.heroLeft : this.sprites.heroRight;
    const size = player.radius * 3.35;
    const drewSprite = this.drawDirectionalSprite(sprite, player.x, player.y, size, COLORS.player, invulnAlpha);

    if (!drewSprite) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.globalAlpha = invulnAlpha;
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.player;
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    this.drawPlayerWeapon(player, size, levelNumber);

    this.drawPlayerHealthBar(player, size);
  }

  drawPlayerWeapon(player, playerSize, levelNumber) {
    const { sprite, flipOnRight, flipOnLeft } = this.getWeaponSpriteConfig(levelNumber);
    if (!sprite || !sprite.complete || sprite.naturalWidth <= 0) {
      return;
    }

    const { ctx } = this;
    const direction = this.playerFacing === "left" ? -1 : 1;
    const weaponSize = levelNumber === 1 ? player.radius * 2.7 : levelNumber === 2 ? player.radius * 2.95 : player.radius * 3.1;
    const recoil = player.weaponRecoilOffset ?? 0;
    const recoilDistance = (8 + levelNumber * 3) * recoil;
    const offsetX = player.radius * 1.15 * direction - recoilDistance * direction;
    const offsetY = playerSize * 0.08 + recoil * (2 + levelNumber * 0.8);
    const shouldFlip = (this.playerFacing === "right" && flipOnRight) || (this.playerFacing === "left" && flipOnLeft);
    const drawX = player.x + offsetX;
    const drawY = player.y + offsetY;
    const maxTiltUp = Math.PI / 12;
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,255,255,0.28)";
    ctx.translate(drawX, drawY);
    if (shouldFlip) {
      ctx.scale(-1, 1);
    }
    const muzzleDirection = shouldFlip ? -1 : 1;
    const kickAngle = -muzzleDirection * maxTiltUp * Math.min(1, recoil);
    ctx.rotate(kickAngle);
    ctx.drawImage(sprite, -weaponSize / 2, -weaponSize / 2, weaponSize, weaponSize);
    if (recoil > 0.06) {
      const flashStrength = Math.min(1, recoil * 2.4);
      const muzzleX = weaponSize * 0.46 * (shouldFlip ? -1 : 1);
      const muzzleY = -weaponSize * 0.02;
      ctx.globalAlpha = flashStrength;
      ctx.shadowBlur = 24;
      ctx.shadowColor = "#ffd78f";
      ctx.fillStyle = "#ffe6a8";
      ctx.beginPath();
      ctx.arc(muzzleX, muzzleY, 3 + 6 * flashStrength, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  getWeaponSpriteConfig(levelNumber) {
    if (levelNumber <= 1) {
      return {
        sprite: this.sprites.pistolLeft,
        flipOnRight: true,
        flipOnLeft: false,
      };
    }
    if (levelNumber === 2) {
      return {
        sprite: this.sprites.shotgunRight,
        flipOnRight: false,
        flipOnLeft: true,
      };
    }
    return {
      sprite: this.sprites.ak47Left,
      flipOnRight: true,
      flipOnLeft: false,
    };
  }

  drawPlayerHealthBar(player, spriteSize) {
    const { ctx } = this;
    const ratio = Math.max(0, Math.min(1, player.health / player.maxHealth));
    const width = 62;
    const height = 8;
    const yOffset = spriteSize * 0.58;
    const x = player.x - width / 2;
    const y = player.y - yOffset;

    const isCritical = player.health < 20;
    const flash = Math.sin(performance.now() * 0.02) * 0.5 + 0.5;

    ctx.save();
    ctx.fillStyle = "rgba(8, 14, 24, 0.9)";
    ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

    if (isCritical) {
      const redPulse = 0.4 + flash * 0.6;
      ctx.fillStyle = `rgba(255, 45, 79, ${redPulse.toFixed(3)})`;
      ctx.shadowBlur = 10 + flash * 12;
      ctx.shadowColor = "#ff2d4f";
    } else {
      ctx.fillStyle = ratio > 0.5 ? "#65ff96" : "#ffb74d";
      ctx.shadowBlur = 8;
      ctx.shadowColor = ratio > 0.5 ? "#65ff96" : "#ffb74d";
    }

    ctx.fillRect(x, y, width * ratio, height);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }

  drawEnemies(enemies) {
    const { ctx } = this;
    for (const enemy of enemies) {
      if (enemy.fsm.currentState === ENEMY_STATE.DEAD) {
        continue;
      }
      if (enemy.fsm.currentState === ENEMY_STATE.RESPAWN) {
        const alpha = 0.35 + Math.sin(performance.now() * 0.02) * 0.2;
        ctx.globalAlpha = alpha;
      }

      const previousFacing = this.enemyFacingById.get(enemy.id) ?? "right";
      let facing = previousFacing;
      if (enemy.vx < -2) {
        facing = "left";
      } else if (enemy.vx > 2) {
        facing = "right";
      }
      this.enemyFacingById.set(enemy.id, facing);
      const sprite = facing === "left" ? this.sprites.enemyLeft : this.sprites.enemyRight;
      const spriteAlpha = ctx.globalAlpha;
      const size = enemy.radius * 3.15;
      const drewSprite = this.drawDirectionalSprite(sprite, enemy.x, enemy.y, size, enemy.color, spriteAlpha);
      if (!drewSprite) {
        ctx.shadowBlur = 16;
        ctx.shadowColor = enemy.color;
        ctx.fillStyle = enemy.flash > 0 ? COLORS.damage : enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (enemy.flash > 0 && drewSprite) {
        ctx.globalAlpha = Math.min(0.6, enemy.flash);
        ctx.fillStyle = COLORS.damage;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const ratio = Math.max(0, enemy.health / enemy.maxHealth);
      ctx.fillStyle = "rgba(10,14,20,0.8)";
      ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 12, 32, 4);
      ctx.fillStyle = ratio > 0.3 ? "#8bff8b" : "#ff9f43";
      ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 12, 32 * ratio, 4);
    }
  }

  drawProjectiles(projectiles, hostile = false) {
    const { ctx } = this;
    for (const shot of projectiles) {
      ctx.shadowBlur = hostile ? 12 : 16;
      ctx.shadowColor = shot.color;
      ctx.fillStyle = shot.color;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  drawShards(shards) {
    const { ctx } = this;
    for (const shard of shards) {
      if (shard.collected) {
        continue;
      }
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(performance.now() * 0.0018);
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.shard;
      ctx.fillStyle = COLORS.shard;
      ctx.beginPath();
      ctx.moveTo(0, -shard.radius);
      ctx.lineTo(shard.radius * 0.6, 0);
      ctx.lineTo(0, shard.radius);
      ctx.lineTo(-shard.radius * 0.6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawPortal(portal, unlocked) {
    const { ctx } = this;
    ctx.shadowBlur = 22;
    ctx.shadowColor = unlocked ? COLORS.portalOpen : COLORS.portalLocked;
    ctx.strokeStyle = unlocked ? COLORS.portalOpen : COLORS.portalLocked;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(portal.x, portal.y, portal.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  drawDecoy(decoy) {
    if (!decoy) {
      return;
    }
    const { ctx } = this;
    const pulse = Math.sin(decoy.pulse) * 0.5 + 0.5;
    ctx.strokeStyle = COLORS.decoy;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(decoy.x, decoy.y, 14 + pulse * 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.23;
    ctx.beginPath();
    ctx.arc(decoy.x, decoy.y, decoy.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.decoy;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawCrosshair(x, y) {
    const { ctx } = this;
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x - 5, y);
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 14, y);
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x, y - 5);
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x, y + 14);
    ctx.stroke();
  }
}
