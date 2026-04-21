import {
  ENEMY_ARCHETYPES,
  ENEMY_STATE,
  EVENT_NAMES,
  GAME_STATE,
  LEVEL_CONFIG,
} from "./constants.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { LevelSystem } from "./level.js";
import { hitCircle, hitRect } from "./collision.js";
import { randomRange } from "./utils.js";

const ARCHETYPE_ORDER = ["SCOUT", "HUNTER", "TANK", "ALARM", "REBOOT"];
const MAX_LEVEL = 3;

export class Game {
  constructor({ canvas, renderer, input, ui, audio }) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.input = input;
    this.ui = ui;
    this.audio = audio;

    this.state = GAME_STATE.MENU;
    this.width = canvas.width;
    this.height = canvas.height;
    this.time = 0;
    this.lastFrame = 0;
    this.rafId = 0;

    this.levelNumber = 1;
    this.score = 0;
    this.highestLevel = 1;
    this.autoPaused = false;
    this.portalEventSent = false;

    this.level = new LevelSystem();
    this.player = new Player(120, 120);
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.ambientPulse = 0;

    this.bindSystemEvents();
  }

  getWorld() {
    return {
      width: this.width,
      height: this.height,
      time: this.time,
      level: this.level,
      player: this.player,
      enemies: this.enemies,
      projectiles: this.projectiles,
      enemyProjectiles: this.enemyProjectiles,
      input: this.input,
    };
  }

  bindSystemEvents() {
    window.addEventListener("resize", () => this.handleResize());
    window.addEventListener("focus", () => this.onFocus());
    window.addEventListener("blur", () => this.onBlur());
    document.addEventListener("visibilitychange", () => this.onVisibilityChange());

    window.addEventListener(EVENT_NAMES.ENEMY_DESTROYED, () => {
      this.score += 120;
      this.audio.playEnemyDeath();
    });

    this.scoreTimer = setInterval(() => {
      if (this.state === GAME_STATE.PLAYING) {
        this.score += 3 + this.levelNumber * 0.4;
      }
    }, 400);

    this.ambientTimer = setInterval(() => {
      if (this.state === GAME_STATE.PLAYING) {
        this.ambientPulse = randomRange(0.2, 1);
      }
    }, 900);
  }

  init() {
    this.handleResize();
    this.level.setup(this.levelNumber, this.width, this.height);
    this.spawnPlayer();
    this.spawnEnemies();
    this.ui.update(this);
    this.loop(0);
  }

  startGame() {
    this.state = GAME_STATE.PLAYING;
    this.levelNumber = 1;
    this.score = 0;
    this.highestLevel = 1;
    this.audio.startMusic();
    this.audio.ensureContext();
    this.beginLevel(this.levelNumber);
    window.dispatchEvent(new CustomEvent(EVENT_NAMES.GAME_START));
  }

  restartGame() {
    this.startGame();
  }

  beginLevel(levelNumber) {
    this.levelNumber = levelNumber;
    this.highestLevel = Math.max(this.highestLevel, levelNumber);
    this.level.setup(levelNumber, this.width, this.height);
    this.spawnPlayer();
    this.spawnEnemies();
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.portalEventSent = false;
    this.state = GAME_STATE.PLAYING;
  }

  spawnPlayer() {
    this.player = new Player(90, 90);
  }

  spawnEnemies() {
    this.enemies = [];
    const count = LEVEL_CONFIG.baseEnemyCount + (this.levelNumber - 1) * LEVEL_CONFIG.enemyGrowthPerLevel;
    for (let i = 0; i < count; i += 1) {
      const typeKey = ARCHETYPE_ORDER[i % ARCHETYPE_ORDER.length];
      const archetype = ENEMY_ARCHETYPES[typeKey];
      const levelBoost = 1 + (this.levelNumber - 1) * 0.08;
      const enemy = new Enemy({
        id: `enemy-${this.levelNumber}-${i}`,
        x: randomRange(this.width * 0.3, this.width - 80),
        y: randomRange(this.height * 0.25, this.height - 80),
        archetype: {
          ...archetype,
          speed: archetype.speed * levelBoost,
          detectionRadius: archetype.detectionRadius + this.levelNumber * 6,
          attackCooldown: Math.max(0.6, archetype.attackCooldown - this.levelNumber * 0.03),
        },
        world: this.getWorld(),
      });
      this.enemies.push(enemy);
    }
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.width = width;
    this.height = height;
    this.renderer.resize(width, height);
    this.player.x = Math.min(this.player.x, this.width - 50);
    this.player.y = Math.min(this.player.y, this.height - 50);
  }

  togglePause(forceValue = null) {
    if (this.state !== GAME_STATE.PLAYING && this.state !== GAME_STATE.PAUSED) {
      return;
    }
    const shouldPause = forceValue === null ? this.state === GAME_STATE.PLAYING : forceValue;
    this.state = shouldPause ? GAME_STATE.PAUSED : GAME_STATE.PLAYING;
    window.dispatchEvent(
      new CustomEvent(EVENT_NAMES.PAUSE_TOGGLED, {
        detail: { paused: this.state === GAME_STATE.PAUSED },
      })
    );
  }

  onBlur() {
    if (this.state === GAME_STATE.PLAYING) {
      this.autoPaused = true;
      this.togglePause(true);
    }
  }

  onFocus() {
    if (this.state === GAME_STATE.PAUSED && this.autoPaused) {
      this.togglePause(false);
      this.autoPaused = false;
    }
  }

  onVisibilityChange() {
    if (document.hidden && this.state === GAME_STATE.PLAYING) {
      this.autoPaused = true;
      this.togglePause(true);
    }
  }

  onKeyDown(event) {
    if (event.code === "Escape") {
      this.togglePause();
      return;
    }
    if (this.state !== GAME_STATE.PLAYING) {
      return;
    }
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      this.player.triggerDash();
    }
    if (event.code === "KeyM") {
      const muted = this.audio.toggleMute();
      this.ui.updateMuteLabel(muted);
    }
  }

  onKeyUp(_event) {}

  onKeyPress(event) {
    if (event.key.toLowerCase() === "h") {
      this.ui.toggleHelp();
    }
  }

  onMouseMove(_event) {}

  onClick(event) {
    if (this.state !== GAME_STATE.PLAYING) {
      return;
    }
    if (event.button === 0) {
      const didShoot = this.player.tryShoot(this.projectiles);
      if (didShoot) {
        this.audio.playWeaponShoot(this.player.weaponMode);
      }
    }
  }

  onMouseDown(event) {
    if (this.state !== GAME_STATE.PLAYING) {
      return;
    }
    if (event.button === 0) {
      this.player.isFiring = true;
      const fired = this.player.tryShoot(this.projectiles);
      if (fired) {
        this.audio.playWeaponShoot(this.player.weaponMode);
      }
    }
  }

  onMouseUp(event) {
    if (event.button === 0) {
      this.player.isFiring = false;
    }
  }

  onContextMenu() {
    if (this.state !== GAME_STATE.PLAYING) {
      return;
    }
    const decoy = this.player.deployDecoy(this.input.mouseWorldX, this.input.mouseWorldY);
    if (decoy) {
      this.audio.playUiClick();
    }
  }

  onWheel(event) {
    if (this.state !== GAME_STATE.PLAYING) {
      return;
    }
    const direction = event.deltaY > 0 ? 1 : -1;
    this.player.cycleWeapon(direction);
  }

  update(dt) {
    this.time += dt;
    if (this.state !== GAME_STATE.PLAYING) {
      return;
    }

    this.player.update(dt, this.input, this.getWorld(), this.projectiles);
    this.player.updateDecoy(dt);

    for (const projectile of this.projectiles) {
      projectile.update(dt, this.level.walls);
      if (this.level.walls.some((wall) => hitRect(projectile, wall))) {
        projectile.alive = false;
      }
    }
    for (const projectile of this.enemyProjectiles) {
      projectile.update(dt, this.level.walls);
      if (this.level.walls.some((wall) => hitRect(projectile, wall))) {
        projectile.alive = false;
      }
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.getWorld(), this.enemyProjectiles);
    }

    this.handleCombatCollisions();
    this.handleCollectibles();
    this.cleanup();

    if (this.player.health <= 0) {
      this.state = GAME_STATE.GAME_OVER;
      this.ui.showGameOver(this.score, this.highestLevel);
      window.dispatchEvent(new CustomEvent(EVENT_NAMES.GAME_OVER, { detail: { score: this.score } }));
    }
  }

  handleCombatCollisions() {
    for (const shot of this.projectiles) {
      if (!shot.alive) {
        continue;
      }
      for (const enemy of this.enemies) {
        if (enemy.fsm.currentState === ENEMY_STATE.DEAD || enemy.fsm.currentState === ENEMY_STATE.RESPAWN) {
          continue;
        }
        if (hitCircle(shot, enemy)) {
          shot.alive = false;
          const damaged = enemy.takeDamage(shot.damage);
          if (damaged) {
            this.audio.playHit();
          }
          break;
        }
      }
    }

    for (const shot of this.enemyProjectiles) {
      if (!shot.alive) {
        continue;
      }
      if (hitCircle(shot, this.player)) {
        shot.alive = false;
        const damaged = this.player.takeDamage(shot.damage);
        if (damaged) {
          this.audio.playHit();
          window.dispatchEvent(new CustomEvent(EVENT_NAMES.PLAYER_DAMAGED, { detail: { health: this.player.health } }));
        }
      }
    }
  }

  handleCollectibles() {
    for (const shard of this.level.shards) {
      if (shard.collected) {
        continue;
      }
      if (hitCircle(shard, this.player)) {
        const collected = this.level.collectShard(shard.id);
        if (collected) {
          this.score += 70;
          this.player.health = Math.min(this.player.maxHealth, this.player.health + this.player.maxHealth * 0.1);
          this.audio.playPickup();
        }
      }
    }

    if (this.level.portalUnlocked && !this.portalEventSent) {
      this.portalEventSent = true;
      window.dispatchEvent(new CustomEvent(EVENT_NAMES.PORTAL_UNLOCKED));
      this.audio.playPortalUnlocked();
    }

    if (this.level.portalUnlocked && hitCircle(this.level.portal, this.player)) {
      this.score += 250;
      if (this.levelNumber >= MAX_LEVEL) {
        this.state = GAME_STATE.GAME_OVER;
        this.ui.showGameOver(this.score, this.levelNumber, true);
        window.dispatchEvent(
          new CustomEvent(EVENT_NAMES.GAME_OVER, {
            detail: { score: this.score, won: true, level: this.levelNumber },
          })
        );
        return;
      }
      this.levelNumber += 1;
      this.portalEventSent = false;
      window.dispatchEvent(new CustomEvent(EVENT_NAMES.LEVEL_UP, { detail: { level: this.levelNumber } }));
      this.beginLevel(this.levelNumber);
    }
  }

  cleanup() {
    this.projectiles = this.projectiles.filter((p) => p.alive);
    this.enemyProjectiles = this.enemyProjectiles.filter((p) => p.alive);
    this.enemies = this.enemies.filter((enemy) => !(enemy.fsm.currentState === ENEMY_STATE.DEAD && !enemy.canRespawn));
  }

  loop(timestamp) {
    const dt = Math.min(0.033, (timestamp - this.lastFrame) / 1000 || 0);
    this.lastFrame = timestamp;
    this.update(dt);
    this.renderer.render(this.getWorld());
    this.ui.update(this);
    this.rafId = requestAnimationFrame((nextTs) => this.loop(nextTs));
  }
}
