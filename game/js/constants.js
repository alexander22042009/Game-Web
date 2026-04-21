export const GAME_STATE = Object.freeze({
  MENU: "MENU",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
});

export const ENEMY_STATE = Object.freeze({
  IDLE: "IDLE",
  PATROL: "PATROL",
  CHASE: "CHASE",
  ATTACK: "ATTACK",
  RETREAT: "RETREAT",
  DEAD: "DEAD",
  RESPAWN: "RESPAWN",
});

export const WEAPON_MODE = Object.freeze({
  SINGLE: "SINGLE",
  BURST: "BURST",
  OVERCHARGE: "OVERCHARGE",
});

export const COLORS = Object.freeze({
  bg: "#060b16",
  gridMajor: "rgba(61,248,255,0.12)",
  gridMinor: "rgba(61,248,255,0.04)",
  wall: "rgba(89,109,146,0.7)",
  wallGlow: "rgba(61,248,255,0.2)",
  player: "#3df8ff",
  decoy: "#99ff5e",
  projectile: "#ff3df2",
  enemyProjectile: "#ff9f43",
  shard: "#6affd6",
  portalLocked: "#d87bff",
  portalOpen: "#99ff5e",
  damage: "#ff4d6d",
});

export const PLAYER_CONFIG = Object.freeze({
  radius: 14,
  maxHealth: 100,
  speed: 240,
  dashSpeed: 520,
  dashDuration: 0.16,
  dashCooldown: 1.15,
  fireRate: 0.2,
  burstFireRate: 0.34,
  overchargeFireRate: 0.46,
  projectileSpeed: 560,
  projectileDamage: 24,
  invulnDuration: 0.75,
  decoyCooldown: 8,
  decoyDuration: 4.5,
  decoyRadius: 90,
});

export const ENEMY_ARCHETYPES = Object.freeze({
  SCOUT: {
    label: "Scout Drone",
    color: "#8ef3ff",
    radius: 11,
    maxHealth: 50,
    speed: 155,
    detectionRadius: 260,
    attackRange: 160,
    attackCooldown: 1.4,
    damage: 8,
    canRespawn: false,
    rebootDelay: 0,
  },
  HUNTER: {
    label: "Hunter Drone",
    color: "#ff8ef9",
    radius: 13,
    maxHealth: 76,
    speed: 130,
    detectionRadius: 230,
    attackRange: 170,
    attackCooldown: 1.12,
    damage: 11,
    canRespawn: false,
    rebootDelay: 0,
  },
  TANK: {
    label: "Tank Drone",
    color: "#ff6f6f",
    radius: 18,
    maxHealth: 140,
    speed: 92,
    detectionRadius: 200,
    attackRange: 150,
    attackCooldown: 1.7,
    damage: 16,
    canRespawn: false,
    rebootDelay: 0,
  },
  ALARM: {
    label: "Alarm Drone",
    color: "#ffe066",
    radius: 12,
    maxHealth: 58,
    speed: 118,
    detectionRadius: 270,
    attackRange: 150,
    attackCooldown: 1.45,
    damage: 9,
    canRespawn: false,
    rebootDelay: 0,
  },
  REBOOT: {
    label: "Reboot Drone",
    color: "#99ff5e",
    radius: 12,
    maxHealth: 60,
    speed: 126,
    detectionRadius: 220,
    attackRange: 155,
    attackCooldown: 1.35,
    damage: 10,
    canRespawn: true,
    rebootDelay: 4.5,
  },
});

export const LEVEL_CONFIG = Object.freeze({
  baseShardTarget: 5,
  shardGrowthPerLevel: 2,
  baseEnemyCount: 5,
  enemyGrowthPerLevel: 2,
  worldPadding: 36,
});

export const EVENT_NAMES = Object.freeze({
  GAME_START: "gameStart",
  GAME_OVER: "gameOver",
  LEVEL_UP: "levelUp",
  PORTAL_UNLOCKED: "portalUnlocked",
  ENEMY_DESTROYED: "enemyDestroyed",
  PAUSE_TOGGLED: "pauseToggled",
  PLAYER_DAMAGED: "playerDamaged",
});
