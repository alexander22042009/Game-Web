import { Entity } from "./entity.js";
import { ENEMY_STATE, EVENT_NAMES } from "./constants.js";
import { FiniteStateMachine } from "./fsm.js";
import { distance, normalize, randomRange } from "./utils.js";
import { hasLineOfSight } from "./collision.js";
import { Projectile } from "./projectile.js";

const HEALTH_RETREAT_RATIO = 0.2;

export class Enemy extends Entity {
  constructor({ x, y, archetype, world, id }) {
    super(x, y, archetype.radius);
    this.id = id;
    this.spawn = { x, y };
    this.world = world;
    this.label = archetype.label;
    this.color = archetype.color;
    this.maxHealth = archetype.maxHealth;
    this.health = archetype.maxHealth;
    this.speed = archetype.speed;
    this.detectionRadius = archetype.detectionRadius;
    this.attackRange = archetype.attackRange;
    this.attackCooldown = archetype.attackCooldown;
    this.damage = archetype.damage;
    this.canRespawn = archetype.canRespawn;
    this.rebootDelay = archetype.rebootDelay;

    this.target = null;
    this.attackTimer = randomRange(0.1, this.attackCooldown);
    this.idleTimer = randomRange(0.4, 1.2);
    this.patrolTimer = randomRange(1.2, 2.4);
    this.lostSightTimer = 0;
    this.retreatTimer = 0;
    this.respawnTimer = 0;
    this.patrolPoint = this.pickPatrolPoint();
    this.removed = false;
    this.flash = 0;

    this.fsm = this.buildFsm();
  }

  buildFsm() {
    const fsm = new FiniteStateMachine(ENEMY_STATE.IDLE, this);
    fsm
      .addState(ENEMY_STATE.IDLE, {
        onEnter: (ctx) => {
          ctx.idleTimer = randomRange(0.5, 1.6);
          ctx.vx = 0;
          ctx.vy = 0;
        },
        onUpdate: (ctx, dt) => {
          ctx.idleTimer -= dt;
        },
        transitions: [
          { to: ENEMY_STATE.DEAD, when: (ctx) => ctx.health <= 0 },
          { to: ENEMY_STATE.CHASE, when: (ctx) => ctx.canSeeTarget() },
          { to: ENEMY_STATE.PATROL, when: (ctx) => ctx.idleTimer <= 0 },
        ],
      })
      .addState(ENEMY_STATE.PATROL, {
        onEnter: (ctx) => {
          ctx.patrolTimer = randomRange(1.4, 2.8);
          ctx.patrolPoint = ctx.pickPatrolPoint();
        },
        onUpdate: (ctx, dt) => {
          ctx.patrolTimer -= dt;
          ctx.moveTo(ctx.patrolPoint.x, ctx.patrolPoint.y, dt, ctx.speed * 0.92);
          if (distance(ctx.x, ctx.y, ctx.patrolPoint.x, ctx.patrolPoint.y) < 10 || ctx.patrolTimer <= 0) {
            ctx.patrolPoint = ctx.pickPatrolPoint();
            ctx.patrolTimer = randomRange(1.4, 2.8);
          }
        },
        transitions: [
          { to: ENEMY_STATE.DEAD, when: (ctx) => ctx.health <= 0 },
          { to: ENEMY_STATE.RETREAT, when: (ctx) => ctx.healthRatio() < HEALTH_RETREAT_RATIO },
          { to: ENEMY_STATE.CHASE, when: (ctx) => ctx.canSeeTarget() },
        ],
      })
      .addState(ENEMY_STATE.CHASE, {
        onEnter: (ctx) => {
          ctx.lostSightTimer = 0;
        },
        onUpdate: (ctx, dt) => {
          const target = ctx.getPriorityTarget();
          if (!target) {
            return;
          }
          ctx.moveTo(target.x, target.y, dt, ctx.speed * 1.14);
          if (!ctx.canSeeTarget()) {
            ctx.lostSightTimer += dt;
          } else {
            ctx.lostSightTimer = 0;
          }
        },
        transitions: [
          { to: ENEMY_STATE.DEAD, when: (ctx) => ctx.health <= 0 },
          { to: ENEMY_STATE.RETREAT, when: (ctx) => ctx.healthRatio() < HEALTH_RETREAT_RATIO },
          { to: ENEMY_STATE.ATTACK, when: (ctx) => ctx.inAttackRange() && ctx.canSeeTarget() },
          { to: ENEMY_STATE.PATROL, when: (ctx) => ctx.lostSightTimer > 2.5 },
        ],
      })
      .addState(ENEMY_STATE.ATTACK, {
        onUpdate: (ctx, dt) => {
          ctx.vx *= 0.7;
          ctx.vy *= 0.7;
          ctx.attackTimer -= dt;
          if (ctx.attackTimer <= 0) {
            ctx.attackTimer = ctx.attackCooldown;
            ctx.fireAtTarget();
          }
        },
        transitions: [
          { to: ENEMY_STATE.DEAD, when: (ctx) => ctx.health <= 0 },
          { to: ENEMY_STATE.RETREAT, when: (ctx) => ctx.healthRatio() < HEALTH_RETREAT_RATIO },
          { to: ENEMY_STATE.CHASE, when: (ctx) => !ctx.inAttackRange() },
        ],
      })
      .addState(ENEMY_STATE.RETREAT, {
        onEnter: (ctx) => {
          ctx.retreatTimer = randomRange(1.2, 2.6);
        },
        onUpdate: (ctx, dt) => {
          ctx.retreatTimer -= dt;
          const target = ctx.getPriorityTarget();
          if (!target) {
            return;
          }
          const away = normalize(ctx.x - target.x, ctx.y - target.y);
          ctx.vx = away.x * ctx.speed * 1.16;
          ctx.vy = away.y * ctx.speed * 1.16;
          ctx.moveAndSlide(dt, ctx.world.level.walls);
        },
        transitions: [
          { to: ENEMY_STATE.DEAD, when: (ctx) => ctx.health <= 0 },
          {
            to: ENEMY_STATE.PATROL,
            when: (ctx) => {
              const target = ctx.getPriorityTarget();
              if (!target) {
                return true;
              }
              const safeDistance = distance(ctx.x, ctx.y, target.x, target.y) > ctx.detectionRadius * 1.1;
              return safeDistance || ctx.retreatTimer <= 0;
            },
          },
        ],
      })
      .addState(ENEMY_STATE.DEAD, {
        onEnter: (ctx) => {
          ctx.vx = 0;
          ctx.vy = 0;
          ctx.respawnTimer = ctx.rebootDelay;
          window.dispatchEvent(new CustomEvent(EVENT_NAMES.ENEMY_DESTROYED, { detail: { enemyId: ctx.id } }));
        },
        transitions: [
          { to: ENEMY_STATE.RESPAWN, when: (ctx) => ctx.canRespawn },
        ],
      })
      .addState(ENEMY_STATE.RESPAWN, {
        onEnter: (ctx) => {
          setTimeout(() => {
            if (ctx.fsm.currentState === ENEMY_STATE.RESPAWN) {
              ctx.respawnTimer = 0;
            }
          }, ctx.rebootDelay * 1000);
        },
        onUpdate: (ctx, dt) => {
          ctx.respawnTimer -= dt;
        },
        transitions: [
          { to: ENEMY_STATE.PATROL, when: (ctx) => ctx.respawnTimer <= 0 },
        ],
      });
    return fsm;
  }

  update(dt, world, enemyProjectiles) {
    this.world = world;
    this.enemyProjectiles = enemyProjectiles;
    this.flash = Math.max(0, this.flash - dt * 3);

    if (this.fsm.currentState === ENEMY_STATE.RESPAWN && this.respawnTimer <= 0) {
      this.health = this.maxHealth;
      this.x = this.spawn.x + randomRange(-20, 20);
      this.y = this.spawn.y + randomRange(-20, 20);
    }

    this.fsm.update(dt);
    if (this.fsm.currentState !== ENEMY_STATE.RESPAWN && this.fsm.currentState !== ENEMY_STATE.DEAD) {
      this.moveAndSlide(dt, world.level.walls);
    }

    if (this.fsm.currentState === ENEMY_STATE.ATTACK) {
      this.tryContactDamage(world.player, dt);
    }
  }

  takeDamage(amount) {
    if (this.fsm.currentState === ENEMY_STATE.DEAD || this.fsm.currentState === ENEMY_STATE.RESPAWN) {
      return false;
    }
    this.health -= amount;
    this.flash = 1;
    return true;
  }

  healthRatio() {
    return this.health / this.maxHealth;
  }

  getPriorityTarget() {
    const decoy = this.world.player.decoy;
    if (decoy && distance(this.x, this.y, decoy.x, decoy.y) < this.detectionRadius * 0.95) {
      return decoy;
    }
    return this.world.player;
  }

  canSeeTarget() {
    const target = this.getPriorityTarget();
    const withinRange = distance(this.x, this.y, target.x, target.y) < this.detectionRadius;
    if (!withinRange) {
      return false;
    }
    return hasLineOfSight(this, target, this.world.level.walls);
  }

  inAttackRange() {
    const target = this.getPriorityTarget();
    return distance(this.x, this.y, target.x, target.y) < this.attackRange;
  }

  moveTo(tx, ty, dt, speed) {
    const direction = normalize(tx - this.x, ty - this.y);
    this.vx = direction.x * speed;
    this.vy = direction.y * speed;
    this.moveAndSlide(dt, this.world.level.walls);
  }

  pickPatrolPoint() {
    return {
      x: this.spawn.x + randomRange(-120, 120),
      y: this.spawn.y + randomRange(-120, 120),
    };
  }

  fireAtTarget() {
    const target = this.getPriorityTarget();
    if (!target || !this.enemyProjectiles) {
      return;
    }
    const direction = normalize(target.x - this.x, target.y - this.y);
    this.enemyProjectiles.push(
      new Projectile({
        x: this.x + direction.x * (this.radius + 6),
        y: this.y + direction.y * (this.radius + 6),
        dirX: direction.x,
        dirY: direction.y,
        speed: 380,
        radius: 4,
        damage: this.damage,
        owner: "enemy",
      })
    );
  }

  tryContactDamage(player, dt) {
    const touching = distance(this.x, this.y, player.x, player.y) < this.radius + player.radius + 1;
    if (touching) {
      player.takeDamage(this.damage * dt * 1.8);
    }
  }
}
