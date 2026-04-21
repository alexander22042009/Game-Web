import { LEVEL_CONFIG } from "./constants.js";
import { chance, randomRange } from "./utils.js";

export class LevelSystem {
  constructor() {
    this.level = 1;
    this.shardTarget = LEVEL_CONFIG.baseShardTarget;
    this.shardsCollected = 0;
    this.portalUnlocked = false;
    this.portal = { x: 0, y: 0, radius: 22 };
    this.walls = [];
    this.shards = [];
  }

  setup(level, worldWidth, worldHeight) {
    this.level = level;
    this.shardsCollected = 0;
    this.portalUnlocked = false;
    this.shardTarget = LEVEL_CONFIG.baseShardTarget + (level - 1) * LEVEL_CONFIG.shardGrowthPerLevel;
    this.walls = this.generateMazeWalls(worldWidth, worldHeight);
    this.shards = this.generateShards(worldWidth, worldHeight, this.shardTarget + 2);
    this.portal = { x: worldWidth - 70, y: worldHeight - 70, radius: 24 };
  }

  collectShard(shardId) {
    const shard = this.shards.find((item) => item.id === shardId);
    if (!shard || shard.collected) {
      return false;
    }
    shard.collected = true;
    this.shardsCollected += 1;
    if (this.shardsCollected >= this.shardTarget) {
      this.portalUnlocked = true;
    }
    return true;
  }

  generateMazeWalls(width, height) {
    const walls = [];
    const p = LEVEL_CONFIG.worldPadding;
    walls.push({ x: p, y: p, w: width - p * 2, h: 12 });
    walls.push({ x: p, y: height - p - 12, w: width - p * 2, h: 12 });
    walls.push({ x: p, y: p, w: 12, h: height - p * 2 });
    walls.push({ x: width - p - 12, y: p, w: 12, h: height - p * 2 });

    const columns = 8;
    const rows = 6;
    const cellW = (width - p * 2) / columns;
    const cellH = (height - p * 2) / rows;
    for (let y = 1; y < rows; y += 1) {
      for (let x = 1; x < columns; x += 1) {
        if (chance(0.48)) {
          const vertical = chance(0.5);
          if (vertical) {
            const wallH = randomRange(cellH * 0.6, cellH * 1.4);
            walls.push({
              x: p + x * cellW + randomRange(-8, 8),
              y: p + y * cellH - wallH / 2,
              w: 10,
              h: wallH,
            });
          } else {
            const wallW = randomRange(cellW * 0.6, cellW * 1.4);
            walls.push({
              x: p + x * cellW - wallW / 2,
              y: p + y * cellH + randomRange(-8, 8),
              w: wallW,
              h: 10,
            });
          }
        }
      }
    }
    return walls;
  }

  generateShards(width, height, count) {
    const shards = [];
    let id = 1;
    while (shards.length < count && id < count * 8) {
      const shard = {
        id: `shard-${id}`,
        x: randomRange(70, width - 70),
        y: randomRange(70, height - 70),
        radius: 10,
        collected: false,
      };
      const blocked = this.walls.some(
        (wall) =>
          shard.x > wall.x - 14 &&
          shard.x < wall.x + wall.w + 14 &&
          shard.y > wall.y - 14 &&
          shard.y < wall.y + wall.h + 14
      );
      if (!blocked) {
        shards.push(shard);
      }
      id += 1;
    }
    return shards;
  }
}
