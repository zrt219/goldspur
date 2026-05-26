import { BIOMES, parishRouteY, routeDistance, selectBiome, selectParishRouteRegion } from "./Biomes";
import { parishForChunk } from "../data/jamaicaTravel";
import {
  CHUNK_SIZE,
  CHUNK_TILES,
  ChunkData,
  CollisionData,
  TILE_SIZE,
  TileData,
  TileType,
  WorldObjectData
} from "./ChunkTypes";
import { valueNoise2D } from "./Noise";
import { randomForChunk } from "./SeededRandom";

export function generateChunk(seed: string, chunkX: number, chunkY: number): ChunkData {
  const biome = selectBiome(seed, chunkX, chunkY);
  const definition = BIOMES[biome];
  const rng = randomForChunk(seed, chunkX, chunkY);
  const tiles: TileData[][] = [];
  const objects: WorldObjectData[] = [];
  const collisions: CollisionData[] = [];

  for (let y = 0; y < CHUNK_TILES; y += 1) {
    const row: TileData[] = [];
    for (let x = 0; x < CHUNK_TILES; x += 1) {
      const globalTileX = chunkX * CHUNK_TILES + x;
      const globalTileY = chunkY * CHUNK_TILES + y;
      row.push({
        type: tileFor(seed, biome, definition.baseTile, definition.accentTiles, globalTileX, globalTileY),
        variant: Math.floor(valueNoise2D(seed, globalTileX, globalTileY, 0.85, "tile-variant") * 6)
      });
    }
    tiles.push(row);
  }

  addTrailTiles(seed, chunkX, chunkY, tiles);
  protectParishSpawnTiles(chunkX, chunkY, tiles);
  addObjects(seed, chunkX, chunkY, objects, collisions, tiles);
  addLandmark(seed, chunkX, chunkY, objects, collisions);

  return {
    chunkX,
    chunkY,
    biome,
    tiles,
    objects,
    paths: [],
    collisions
  };
}

function tileFor(
  seed: string,
  biome: string,
  base: TileType,
  accents: TileType[],
  globalTileX: number,
  globalTileY: number
): TileType {
  const detail = valueNoise2D(seed, globalTileX, globalTileY, 4.5, "tile-detail");
  const wet = valueNoise2D(seed, globalTileX + 29, globalTileY - 13, 5.2, "tile-wet");
  const stone = valueNoise2D(seed, globalTileX - 9, globalTileY + 34, 3.2, "tile-stone");

  if (biome === "creek" && wet > 0.72) return wet > 0.86 ? "water" : "shallow_water";
  if (isCoastalBiome(biome)) {
    const beachBand = Math.sin(globalTileX / 18) * 1.7 + Math.sin(globalTileX / 43) * 2.2 - 5.5;
    if (globalTileY < beachBand - 1.5 && wet > 0.36) return wet > 0.72 ? "water" : "shallow_water";
    if (globalTileY < beachBand + 3.5 || detail > 0.82) return "sand";
  }
  if (biome === "steer_town_groves" && detail > 0.76) return detail > 0.9 ? "flowers" : "grass";
  if (biome === "steer_town_groves" && wet > 0.82) return wet > 0.93 ? "mud" : "grass_dark";
  if (biome === "ocho_rios_cove" && detail > 0.78 && wet < 0.62) return detail > 0.9 ? "flowers" : "grass_light";
  if (biome === "runaway_bay_scrub" && detail > 0.74) return rnglessPick(["sand", "dirt", "grass"], globalTileX, globalTileY);
  if (biome === "runaway_bay_scrub" && wet > 0.84) return "mud";
  if (biome === "discovery_bay_limestone" && stone > 0.54) return stone > 0.74 ? "stone" : "dirt";
  if (biome === "discovery_bay_coast" && wet > 0.6) return wet > 0.83 ? "water" : "shallow_water";
  if (biome === "north_coast_parish" && wet > 0.68) return wet > 0.86 ? "water" : "shallow_water";
  if (biome === "western_parish_beach") {
    if (wet > 0.7) return wet > 0.88 ? "water" : "shallow_water";
    if (detail > 0.72) return "sand";
  }
  if (biome === "south_coast_parish" && detail > 0.76) return rnglessPick(["sand", "dirt", "grass_light"], globalTileX, globalTileY);
  if (biome === "kingston_harbour" && wet > 0.58) return wet > 0.82 ? "water" : "shallow_water";
  if (biome === "blue_mountain_parish" && wet > 0.68) return wet > 0.9 ? "shallow_water" : "mud";
  if (biome === "hills" && stone > 0.7) return "stone";
  if (detail > 0.9) return accents[Math.floor(detail * accents.length) % accents.length];
  if (detail < 0.08) return accents[0] ?? base;
  return base;
}

function rnglessPick<T>(items: readonly T[], globalTileX: number, globalTileY: number): T {
  const index = ((globalTileX * 31 + globalTileY * 17) % items.length + items.length) % items.length;
  return items[index];
}

function isParishBiome(biome: string): boolean {
  return biome === "steer_town_groves"
    || biome === "ocho_rios_cove"
    || biome === "runaway_bay_scrub"
    || biome === "discovery_bay_limestone"
    || biome === "discovery_bay_coast"
    || biome === "north_coast_parish"
    || biome === "western_parish_beach"
    || biome === "south_coast_parish"
    || biome === "kingston_harbour"
    || biome === "blue_mountain_parish";
}

function isCoastalBiome(biome: string): boolean {
  return biome === "ocho_rios_cove"
    || biome === "runaway_bay_scrub"
    || biome === "discovery_bay_limestone"
    || biome === "discovery_bay_coast"
    || biome === "north_coast_parish"
    || biome === "western_parish_beach"
    || biome === "south_coast_parish"
    || biome === "kingston_harbour";
}

function parishObjectType(
  biome: ReturnType<typeof selectBiome>,
  rng: ReturnType<typeof randomForChunk>
): WorldObjectData["type"] {
  if (biome === "steer_town_groves") return rng.pick(["wild_apple_tree", "breadfruit_tree", "banana_patch", "fruit_stand", "market_stall", "parish_caretaker", "goat_spawn", "fence"] as const);
  if (biome === "ocho_rios_cove") return rng.pick(["palm_cluster", "beach_palms", "fishing_boat", "jerk_drum", "fruit_stand", "parish_caretaker", "pelican_spawn", "coconut_pile"] as const);
  if (biome === "runaway_bay_scrub") return rng.pick(["palm_cluster", "beach_palms", "sugarcane_patch", "tall_grass", "mongoose_spawn", "goat_spawn", "route_marker", "parish_caretaker"] as const);
  if (biome === "discovery_bay_limestone") return rng.pick(["limestone_outcrop", "rock_cluster", "route_marker", "mongoose_spawn", "frigatebird_spawn", "fallen_log"] as const);
  if (biome === "discovery_bay_coast") return rng.pick(["palm_cluster", "beach_palms", "fishing_boat", "pelican_spawn", "frigatebird_spawn", "jerk_drum", "coconut_pile"] as const);
  if (biome === "north_coast_parish") return rng.pick(["palm_cluster", "fruit_stand", "market_stall", "fishing_boat", "route_marker", "parish_caretaker", "goat_spawn", "coconut_pile"] as const);
  if (biome === "western_parish_beach") return rng.pick(["beach_palms", "palm_cluster", "fishing_boat", "jerk_drum", "pelican_spawn", "coconut_pile", "fruit_stand", "parish_caretaker"] as const);
  if (biome === "south_coast_parish") return rng.pick(["sugarcane_patch", "banana_patch", "goat_spawn", "fishing_boat", "fruit_stand", "route_marker", "limestone_outcrop", "parish_caretaker"] as const);
  if (biome === "kingston_harbour") return rng.pick(["market_stall", "jerk_drum", "fishing_boat", "route_marker", "palm_cluster", "fruit_stand", "rock_cluster", "parish_caretaker"] as const);
  if (biome === "blue_mountain_parish") return rng.pick(["hibiscus_bush", "breadfruit_tree", "banana_patch", "rain_puddle", "goat_spawn", "route_marker", "fruit_stand", "parish_caretaker"] as const);
  return rng.pick(["tall_grass", "bush", "fallen_log"] as const);
}

function parishObjectCollides(type: WorldObjectData["type"]): boolean {
  return type === "beach_palms"
    || type === "palm_cluster"
    || type === "market_stall"
    || type === "fruit_stand"
    || type === "fishing_boat"
    || type === "jerk_drum"
    || type === "route_marker"
    || type === "wild_apple_tree"
    || type === "breadfruit_tree"
    || type === "limestone_outcrop"
    || type === "fence"
    || type === "rock_cluster";
}

function addTrailTiles(seed: string, chunkX: number, chunkY: number, tiles: TileData[][]): void {
  const travelParish = parishForChunk(chunkX, chunkY);
  for (let y = 0; y < CHUNK_TILES; y += 1) {
    for (let x = 0; x < CHUNK_TILES; x += 1) {
      const globalTileX = chunkX * CHUNK_TILES + x;
      const globalTileY = chunkY * CHUNK_TILES + y;
      const mainTrailY = Math.sin(globalTileX / 10) * 1.8 + Math.sin(globalTileX / 25) * 2.4;
      const branchTrailX = Math.cos(globalTileY / 15) * 1.6;
      const parishRoute = parishRouteY(Math.floor(globalTileX / CHUNK_TILES)) * CHUNK_TILES + 7;
      const routeWander = Math.sin(globalTileX / 14) * 1.4 + Math.sin(globalTileX / 37) * 2.1;
      const nearMain = Math.abs(globalTileY - mainTrailY) < 1.25;
      const nearParishRoad = globalTileX >= -CHUNK_TILES * 2 && globalTileX <= CHUNK_TILES * 29
        && Math.abs(globalTileY - parishRoute - routeWander) < 1.35;
      const parishHarbourRoad = travelParish
        && Math.abs(globalTileX - (travelParish.chunkX * CHUNK_TILES + CHUNK_TILES / 2)) < CHUNK_TILES * 12
        && Math.abs(globalTileY - (travelParish.chunkY * CHUNK_TILES + CHUNK_TILES / 2) - routeWander) < 1.45;
      const nearBranch = Math.abs(globalTileX - branchTrailX) < 0.85 && Math.abs(globalTileY) < 38;
      const racePlainTrail = valueNoise2D(seed, Math.floor(globalTileX / 11), Math.floor(globalTileY / 11), 2.8, "trail-net") > 0.9;
      const nearSeededTrail = seededTrailDistance(seed, globalTileX, globalTileY) < 1.18;
      if (nearMain || nearParishRoad || parishHarbourRoad || nearBranch || racePlainTrail || nearSeededTrail) {
        tiles[y][x] = { type: "dirt_path", variant: (x + y) % 5 };
      }
    }
  }
}

function seededTrailDistance(seed: string, globalTileX: number, globalTileY: number): number {
  const grid = CHUNK_TILES * 12;
  const cellX = Math.round(globalTileX / grid);
  const cellY = Math.round(globalTileY / grid);
  const horizontalY = cellY * grid
    + (valueNoise2D(seed, cellX, cellY, 2.4, "wilderness-trail-y") - 0.5) * CHUNK_TILES * 5
    + Math.sin(globalTileX / 41) * 2.2;
  const verticalX = cellX * grid
    + (valueNoise2D(seed, cellX, cellY, 2.4, "wilderness-trail-x") - 0.5) * CHUNK_TILES * 5
    + Math.sin(globalTileY / 37) * 2.2;
  const horizontalEnabled = valueNoise2D(seed, cellX, cellY, 1.9, "wilderness-trail-h-enabled") > 0.18;
  const verticalEnabled = valueNoise2D(seed, cellX, cellY, 1.9, "wilderness-trail-v-enabled") > 0.28;
  const horizontalDistance = horizontalEnabled ? Math.abs(globalTileY - horizontalY) : Number.POSITIVE_INFINITY;
  const verticalDistance = verticalEnabled ? Math.abs(globalTileX - verticalX) : Number.POSITIVE_INFINITY;
  return Math.min(horizontalDistance, verticalDistance);
}

function addObjects(
  seed: string,
  chunkX: number,
  chunkY: number,
  objects: WorldObjectData[],
  collisions: CollisionData[],
  tiles: TileData[][]
): void {
  const biome = selectBiome(seed, chunkX, chunkY);
  const definition = BIOMES[biome];
  const rng = randomForChunk(seed, chunkX, chunkY, "objects");
  const attempts = biome === "forest" ? 74 : biome === "meadow" ? 58 : isParishBiome(biome) ? 64 : 48;
  const originChunk = chunkX === 0 && chunkY === 0;

  for (let i = 0; i < attempts && objects.length < 82; i += 1) {
    const x = rng.int(24, CHUNK_SIZE - 24);
    const y = rng.int(24, CHUNK_SIZE - 24);
    if (originChunk && Math.hypot(x - 256, y - 256) < 120) continue;
    if (isProtectedParishSpawn(chunkX, chunkY, x, y)) continue;
    const tile = tiles[Math.floor(y / TILE_SIZE)]?.[Math.floor(x / TILE_SIZE)];
    if (!tile || tile.type === "water" || tile.type === "shallow_water" || tile.type === "dirt_path") continue;

    const roll = rng.next();
    let object: WorldObjectData | undefined;
    if (roll < definition.treeDensity) object = objectData(seed, chunkX, chunkY, i, "tree", x, y, rng.int(0, 3), true);
    else if (roll < definition.treeDensity + definition.rockDensity) object = objectData(seed, chunkX, chunkY, i, rng.chance(0.35) ? "rock_cluster" : "rock", x, y, rng.int(0, 3), true);
    else if (roll < definition.treeDensity + definition.rockDensity + definition.flowerDensity) object = objectData(seed, chunkX, chunkY, i, rng.chance(0.28) ? "bush" : "flower_patch", x, y, rng.int(0, 4), false);
    else if (roll < definition.treeDensity + definition.rockDensity + definition.flowerDensity + definition.fenceDensity) object = objectData(seed, chunkX, chunkY, i, "fence", x, y, rng.int(0, 3), true);
    else if (roll < definition.treeDensity + definition.rockDensity + definition.flowerDensity + definition.fenceDensity + definition.waterDensity) object = objectData(seed, chunkX, chunkY, i, rng.chance(isCoastalBiome(biome) ? 0.45 : 0.72) ? "pond" : "pond_edge", x, y, rng.int(0, 2), false);
    else if (isParishBiome(biome) && rng.chance(0.38)) {
      const type = parishObjectType(biome, rng);
      object = objectData(seed, chunkX, chunkY, i, type, x, y, rng.int(0, 5), parishObjectCollides(type));
    }
    else if (rng.chance(biome === "forest" ? 0.42 : 0.3)) object = objectData(seed, chunkX, chunkY, i, rng.pick(["tall_grass", "stump", "fallen_log"] as const), x, y, rng.int(0, 3), false);

    if (object) {
      objects.push(object);
      addCollisionFor(object, collisions);
    }
  }

  addForage(seed, chunkX, chunkY, biome, objects, tiles);
  addWildlife(seed, chunkX, chunkY, biome, objects, tiles);
  addParishRoadside(seed, chunkX, chunkY, biome, objects, collisions, tiles);
  addHumidityDetails(seed, chunkX, chunkY, biome, objects, collisions, tiles);
}

function addForage(
  seed: string,
  chunkX: number,
  chunkY: number,
  biome: ReturnType<typeof selectBiome>,
  objects: WorldObjectData[],
  tiles: TileData[][]
): void {
  const rng = randomForChunk(seed, chunkX, chunkY, "forage");
  const forageChance = biome === "forest" ? 0.78 : biome === "meadow" ? 0.72 : biome === "creek" ? 0.56 : 0.42;
  const count = rng.chance(forageChance) ? rng.int(2, biome === "forest" || biome === "meadow" ? 5 : 3) : rng.int(0, 2);
  const choices = isParishBiome(biome)
    ? (["herb_patch", "wild_apple_tree", "breadfruit_tree", "banana_patch", "fruit_stand", "tall_grass_graze_patch", "berry_bush", "hibiscus_bush"] as const)
    : biome === "forest"
    ? (["berry_bush", "mushroom_patch", "herb_patch", "wild_apple_tree", "tall_grass_graze_patch"] as const)
    : (["berry_bush", "herb_patch", "tall_grass_graze_patch", "mushroom_patch"] as const);

  for (let i = 0; i < count && objects.length < 88; i += 1) {
    const point = safeObjectPoint(rng, tiles, chunkX, chunkY);
    if (!point) continue;
    const type = rng.pick(choices);
    objects.push(objectData(seed, chunkX, chunkY, 1200 + i, type, point.x, point.y, rng.int(0, 4), type === "wild_apple_tree"));
  }
}

function addWildlife(
  seed: string,
  chunkX: number,
  chunkY: number,
  biome: ReturnType<typeof selectBiome>,
  objects: WorldObjectData[],
  tiles: TileData[][]
): void {
  const rng = randomForChunk(seed, chunkX, chunkY, "wildlife");
  const rabbitCount = biome === "forest" || biome === "meadow" ? rng.int(1, 3) : rng.chance(0.45) ? 1 : 0;
  for (let i = 0; i < rabbitCount; i += 1) addSpawn(seed, chunkX, chunkY, objects, tiles, "rabbit_spawn", 1400 + i, rng);
  if ((biome === "forest" || biome === "hills") && rng.chance(0.42)) addSpawn(seed, chunkX, chunkY, objects, tiles, "snake_spawn", 1420, rng);
  if ((biome === "forest" || biome === "hills" || biome === "race_plains") && rng.chance(0.13)) addSpawn(seed, chunkX, chunkY, objects, tiles, "coyote_spawn", 1430, rng);
  const birds = biome === "forest" || biome === "meadow" ? rng.int(1, 3) : rng.chance(0.55) ? 1 : 0;
  for (let i = 0; i < birds; i += 1) addSpawn(seed, chunkX, chunkY, objects, tiles, "bird_spawn", 1440 + i, rng);
  if (isParishBiome(biome)) {
    if (rng.chance(biome === "steer_town_groves" ? 0.58 : 0.28)) addSpawn(seed, chunkX, chunkY, objects, tiles, "goat_spawn", 1460, rng);
    if (rng.chance(biome === "discovery_bay_limestone" || biome === "runaway_bay_scrub" ? 0.5 : 0.18)) addSpawn(seed, chunkX, chunkY, objects, tiles, "mongoose_spawn", 1461, rng);
    if (rng.chance(isCoastalBiome(biome) ? 0.62 : 0.22)) addSpawn(seed, chunkX, chunkY, objects, tiles, "frigatebird_spawn", 1462, rng);
    if (rng.chance(biome === "ocho_rios_cove" || biome === "discovery_bay_coast" ? 0.5 : 0.18)) addSpawn(seed, chunkX, chunkY, objects, tiles, "pelican_spawn", 1463, rng);
  }
}

function addParishRoadside(
  seed: string,
  chunkX: number,
  chunkY: number,
  biome: ReturnType<typeof selectBiome>,
  objects: WorldObjectData[],
  collisions: CollisionData[],
  tiles: TileData[][]
): void {
  const region = selectParishRouteRegion(seed, chunkX, chunkY);
  if (!region || routeDistance(chunkX, chunkY) > 1 || objects.length >= 94) return;

  const rng = randomForChunk(seed, chunkX, chunkY, "parish-roadside");
  const roadLocalY = Math.max(72, Math.min(CHUNK_SIZE - 72, (parishRouteY(chunkX) - chunkY) * CHUNK_SIZE + CHUNK_SIZE / 2));
  const guaranteed = parishWaypointType(chunkX);
  const count = guaranteed ? 2 : rng.chance(0.58) ? 1 : 0;

  for (let i = 0; i < count && objects.length < 96; i += 1) {
    const type = i === 0 && guaranteed ? guaranteed : parishObjectType(biome, rng);
    const x = rng.int(84, CHUNK_SIZE - 84);
    const y = Math.max(52, Math.min(CHUNK_SIZE - 52, roadLocalY + rng.int(-92, 92)));
    if (isProtectedParishSpawn(chunkX, chunkY, x, y)) continue;
    const tile = tiles[Math.floor(y / TILE_SIZE)]?.[Math.floor(x / TILE_SIZE)];
    if (!tile || tile.type === "water" || tile.type === "shallow_water") continue;
    const object = objectData(seed, chunkX, chunkY, 1700 + i, type, x, y, waypointVariant(chunkX, type, rng), parishObjectCollides(type));
    objects.push(object);
    addCollisionFor(object, collisions);
  }
}

function addHumidityDetails(
  seed: string,
  chunkX: number,
  chunkY: number,
  biome: ReturnType<typeof selectBiome>,
  objects: WorldObjectData[],
  collisions: CollisionData[],
  tiles: TileData[][]
): void {
  if (!isParishBiome(biome) && biome !== "creek" && biome !== "forest") return;
  const rng = randomForChunk(seed, chunkX, chunkY, "humidity-details");
  const detailCount = isParishBiome(biome) ? rng.int(2, 5) : rng.int(1, 3);
  const choices = isParishBiome(biome)
    ? (["hibiscus_bush", "banana_patch", "sugarcane_patch", "rain_puddle", "coconut_pile"] as const)
    : (["hibiscus_bush", "rain_puddle", "reeds"] as const);

  for (let i = 0; i < detailCount && objects.length < 100; i += 1) {
    const point = safeObjectPoint(rng, tiles, chunkX, chunkY);
    if (!point) continue;
    const tile = tiles[Math.floor(point.y / TILE_SIZE)]?.[Math.floor(point.x / TILE_SIZE)];
    const nearWetGround = tile?.type === "mud" || tile?.type === "forest_floor" || tile?.type === "grass_dark";
    const type = nearWetGround && rng.chance(0.35) ? "rain_puddle" : rng.pick(choices);
    const object = objectData(seed, chunkX, chunkY, 1900 + i, type, point.x, point.y, rng.int(0, 5), parishObjectCollides(type));
    objects.push(object);
    addCollisionFor(object, collisions);
  }
}

function parishWaypointType(chunkX: number): WorldObjectData["type"] | undefined {
  if (chunkX === 2) return "fruit_stand";
  if (chunkX === 6) return "route_marker";
  if (chunkX === 10) return "jerk_drum";
  if (chunkX === 15) return "fishing_boat";
  if (chunkX === 20) return "landmark";
  if (chunkX === 26) return "beach_palms";
  return undefined;
}

function waypointVariant(chunkX: number, type: WorldObjectData["type"], rng: ReturnType<typeof randomForChunk>): number {
  if (type === "route_marker") return chunkX <= 6 ? 1 : chunkX <= 14 ? 2 : chunkX <= 21 ? 3 : 4;
  if (type === "landmark") return 3;
  return rng.int(0, 5);
}

function addSpawn(
  seed: string,
  chunkX: number,
  chunkY: number,
  objects: WorldObjectData[],
  tiles: TileData[][],
  type: WorldObjectData["type"],
  index: number,
  rng: ReturnType<typeof randomForChunk>
): void {
  if (objects.length >= 92) return;
  const point = safeObjectPoint(rng, tiles, chunkX, chunkY);
  if (!point) return;
  objects.push(objectData(seed, chunkX, chunkY, index, type, point.x, point.y, rng.int(0, 4), false));
}

function safeObjectPoint(rng: ReturnType<typeof randomForChunk>, tiles: TileData[][], chunkX: number, chunkY: number): { x: number; y: number } | undefined {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const x = rng.int(28, CHUNK_SIZE - 28);
    const y = rng.int(28, CHUNK_SIZE - 28);
    if (isProtectedParishSpawn(chunkX, chunkY, x, y)) continue;
    const tile = tiles[Math.floor(y / TILE_SIZE)]?.[Math.floor(x / TILE_SIZE)];
    if (tile && tile.type !== "water" && tile.type !== "shallow_water" && tile.type !== "dirt_path") return { x, y };
  }
  return undefined;
}

function addLandmark(seed: string, chunkX: number, chunkY: number, objects: WorldObjectData[], collisions: CollisionData[]): void {
  const rng = randomForChunk(seed, chunkX, chunkY, "landmark");
  if (chunkX === 0 && chunkY === 0) {
    const sign = objectData(seed, chunkX, chunkY, 900, "sign", 144, 260, 0, true);
    objects.push(sign);
    addCollisionFor(sign, collisions);
    return;
  }

  const travelParish = parishForChunk(chunkX, chunkY);
  if (travelParish) {
    const anchor = chunkX === travelParish.chunkX && chunkY === travelParish.chunkY;
    const type = anchor
      ? "sign"
      : rng.chance(0.22)
      ? rng.pick(["route_marker", "market_stall", "fruit_stand", "fishing_boat"] as const)
      : undefined;
    if (type) {
      const x = anchor ? CHUNK_SIZE / 2 : rng.int(96, 416);
      const y = anchor ? 112 : rng.int(96, 416);
      if (!anchor && isProtectedParishSpawn(chunkX, chunkY, x, y)) return;
      const object = objectData(seed, chunkX, chunkY, 903, type, x, y, rng.int(0, 5), parishObjectCollides(type) || type === "sign");
      objects.push(object);
      addCollisionFor(object, collisions);
      return;
    }
  }

  const region = selectParishRouteRegion(seed, chunkX, chunkY);
  if (region && routeDistance(chunkX, chunkY) <= 1) {
    const type = parishWaypointType(chunkX) ?? (rng.chance(0.24) ? rng.pick(["sign", "route_marker", "market_stall", "fruit_stand"] as const) : undefined);
    if (type) {
      const object = objectData(seed, chunkX, chunkY, 902, type, rng.int(96, 416), rng.int(96, 416), waypointVariant(chunkX, type, rng), parishObjectCollides(type) || type === "sign" || type === "landmark");
      objects.push(object);
      addCollisionFor(object, collisions);
      return;
    }
  }

  if (!rng.chance(0.05)) return;
  const type = rng.pick(["sign", "wild_horse", "landmark", "log", "barrel", "pond", "rock_cluster"] as const);
  const object = objectData(seed, chunkX, chunkY, 901, type, rng.int(96, 416), rng.int(96, 416), rng.int(0, 4), type !== "wild_horse");
  objects.push(object);
  addCollisionFor(object, collisions);
}

function protectParishSpawnTiles(chunkX: number, chunkY: number, tiles: TileData[][]): void {
  const spawn = parishSpawnLocalPoint(chunkX, chunkY);
  if (!spawn) return;
  for (let y = 0; y < CHUNK_TILES; y += 1) {
    for (let x = 0; x < CHUNK_TILES; x += 1) {
      const tileX = x * TILE_SIZE + TILE_SIZE / 2;
      const tileY = y * TILE_SIZE + TILE_SIZE / 2;
      const distance = Math.hypot(tileX - spawn.x, tileY - spawn.y);
      if (distance < 54) tiles[y][x] = { type: "dirt_path", variant: (x + y) % 5 };
      else if (distance < 156) tiles[y][x] = { type: "sand", variant: (x + y) % 6 };
    }
  }
}

function isProtectedParishSpawn(chunkX: number, chunkY: number, x: number, y: number, radius = 152): boolean {
  const spawn = parishSpawnLocalPoint(chunkX, chunkY);
  return Boolean(spawn && Math.hypot(x - spawn.x, y - spawn.y) < radius);
}

function parishSpawnLocalPoint(chunkX: number, chunkY: number): { x: number; y: number } | undefined {
  const travelParish = parishForChunk(chunkX, chunkY);
  if (!travelParish || travelParish.chunkX !== chunkX || travelParish.chunkY !== chunkY) return undefined;
  return { x: CHUNK_SIZE / 2, y: CHUNK_SIZE / 2 };
}

function objectData(
  seed: string,
  chunkX: number,
  chunkY: number,
  index: number,
  type: WorldObjectData["type"],
  x: number,
  y: number,
  variant: number,
  collides: boolean
): WorldObjectData {
  return {
    id: `${seed}:${chunkX}:${chunkY}:${type}:${index}`,
    type,
    x,
    y,
    variant,
    collides
  };
}

function addCollisionFor(object: WorldObjectData, collisions: CollisionData[]): void {
  if (!object.collides) return;
  const sizes: Partial<Record<WorldObjectData["type"], [number, number]>> = {
    tree: [46, 38],
    rock: [42, 28],
    rock_cluster: [58, 34],
    fence: object.variant % 2 === 0 ? [84, 22] : [24, 84],
    sign: [66, 24],
    landmark: [110, 36],
    route_marker: [82, 28],
    beach_palms: [58, 40],
    palm_cluster: [66, 42],
    market_stall: [92, 42],
    fruit_stand: [86, 36],
    fishing_boat: [112, 34],
    jerk_drum: [30, 30],
    banana_patch: [52, 28],
    limestone_outcrop: [72, 34],
    breadfruit_tree: [52, 36],
    log: [62, 26],
    fallen_log: [62, 26],
    barrel: [26, 28]
  };
  const [width, height] = sizes[object.type] ?? [42, 28];
  collisions.push({ x: object.x, y: object.y, width, height });
}
