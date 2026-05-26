export const TILE_SIZE = 32;
export const CHUNK_TILES = 16;
export const CHUNK_SIZE = TILE_SIZE * CHUNK_TILES;
export const RENDER_RADIUS = 2;
export const UNLOAD_RADIUS = 3;

export type TileType =
  | "grass"
  | "grass_dark"
  | "grass_light"
  | "dirt"
  | "dirt_path"
  | "mud"
  | "water"
  | "shallow_water"
  | "stone"
  | "flowers"
  | "forest_floor"
  | "sand"
  | "ranch_ground";

export type BiomeId =
  | "ranch_valley"
  | "meadow"
  | "forest"
  | "creek"
  | "hills"
  | "race_plains"
  | "steer_town_groves"
  | "ocho_rios_cove"
  | "runaway_bay_scrub"
  | "discovery_bay_limestone"
  | "discovery_bay_coast"
  | "north_coast_parish"
  | "western_parish_beach"
  | "south_coast_parish"
  | "kingston_harbour"
  | "blue_mountain_parish";

export type TileData = {
  type: TileType;
  variant: number;
};

export type BaseWorldObjectType =
  | "tree"
  | "rock"
  | "flower_patch"
  | "fence"
  | "barrel"
  | "sign"
  | "pond_edge"
  | "pond"
  | "log"
  | "fallen_log"
  | "rock_cluster"
  | "bush"
  | "tall_grass"
  | "stump"
  | "reeds"
  | "berry_bush"
  | "mushroom_patch"
  | "herb_patch"
  | "wild_apple_tree"
  | "tall_grass_graze_patch"
  | "rabbit_spawn"
  | "snake_spawn"
  | "coyote_spawn"
  | "bird_spawn"
  | "goat_spawn"
  | "mongoose_spawn"
  | "frigatebird_spawn"
  | "pelican_spawn"
  | "wild_horse"
  | "landmark"
  | "route_marker"
  | "beach_palms"
  | "market_stall"
  | "parish_caretaker"
  | "fishing_boat"
  | "jerk_drum"
  | "fruit_stand";

export type JamaicanSceneryObjectType =
  | "banana_patch"
  | "hibiscus_bush"
  | "palm_cluster"
  | "coconut_pile"
  | "sugarcane_patch"
  | "limestone_outcrop"
  | "breadfruit_tree"
  | "rain_puddle";

export type WorldObjectType =
  | BaseWorldObjectType
  | JamaicanSceneryObjectType;

export type WorldObjectData = {
  id: string;
  type: WorldObjectType;
  x: number;
  y: number;
  variant: number;
  collides: boolean;
};

export type PathData = {
  points: Array<{ x: number; y: number }>;
  width: number;
};

export type CollisionData = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChunkData = {
  chunkX: number;
  chunkY: number;
  biome: BiomeId;
  tiles: TileData[][];
  objects: WorldObjectData[];
  paths: PathData[];
  collisions: CollisionData[];
};

export function chunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX},${chunkY}`;
}

export function worldToChunk(worldX: number, worldY: number): { chunkX: number; chunkY: number } {
  return {
    chunkX: Math.floor(worldX / CHUNK_SIZE),
    chunkY: Math.floor(worldY / CHUNK_SIZE)
  };
}
