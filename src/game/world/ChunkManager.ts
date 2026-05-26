import Phaser from "phaser";
import { biomeLabel } from "./Biomes";
import { generateChunk } from "./ChunkGenerator";
import { chunkKey, ChunkData, CHUNK_SIZE, RENDER_RADIUS, TILE_SIZE, TileData, TileType, UNLOAD_RADIUS, WorldObjectData, worldToChunk } from "./ChunkTypes";
import { ChunkRenderer, RenderedChunk } from "./ChunkRenderer";
import { StAnnAmbienceInput } from "../systems/WeatherSystem";
import { routeLocationForChunk } from "../data/jamaicaContent";
import { parishForChunk } from "../data/jamaicaTravel";

export type WorldInteraction = {
  object: WorldObjectData;
  worldX: number;
  worldY: number;
  distance: number;
};

export type LoadedWorldObject = {
  object: WorldObjectData;
  chunkKey: string;
  worldX: number;
  worldY: number;
};

export type TravelMode = "land" | "boat";

const INTERACTIVE_OBJECT_TYPES: WorldObjectData["type"][] = [
  "sign",
  "flower_patch",
  "pond_edge",
  "pond",
  "wild_horse",
  "landmark",
  "berry_bush",
  "mushroom_patch",
  "herb_patch",
  "wild_apple_tree",
  "tall_grass_graze_patch",
  "rock_cluster",
  "fallen_log",
  "route_marker",
  "beach_palms",
  "market_stall",
  "parish_caretaker",
  "fishing_boat",
  "jerk_drum",
  "fruit_stand",
  "banana_patch",
  "hibiscus_bush",
  "palm_cluster",
  "coconut_pile",
  "sugarcane_patch",
  "limestone_outcrop",
  "breadfruit_tree",
  "rain_puddle"
];

export class ChunkManager {
  readonly collisionGroup: Phaser.Physics.Arcade.StaticGroup;
  private readonly renderer: ChunkRenderer;
  private generated = new Map<string, ChunkData>();
  private rendered = new Map<string, RenderedChunk>();
  private currentChunkKey = "";

  constructor(private readonly scene: Phaser.Scene, private readonly seed: string) {
    this.collisionGroup = scene.physics.add.staticGroup();
    this.renderer = new ChunkRenderer(scene, this.collisionGroup);
  }

  setAmbience(ambience?: StAnnAmbienceInput): void {
    this.renderer.setAmbience(ambience);
  }

  update(worldX: number, worldY: number): boolean {
    const center = worldToChunk(worldX, worldY);
    const nextKey = chunkKey(center.chunkX, center.chunkY);
    const changed = nextKey !== this.currentChunkKey;
    this.currentChunkKey = nextKey;

    for (let y = center.chunkY - RENDER_RADIUS; y <= center.chunkY + RENDER_RADIUS; y += 1) {
      for (let x = center.chunkX - RENDER_RADIUS; x <= center.chunkX + RENDER_RADIUS; x += 1) {
        this.ensureRendered(x, y);
      }
    }
    this.unloadFar(center.chunkX, center.chunkY);
    return changed;
  }

  currentInfo(worldX: number, worldY: number): { chunkX: number; chunkY: number; biome: string; location: string; loaded: number } {
    const chunk = worldToChunk(worldX, worldY);
    const data = this.getChunk(chunk.chunkX, chunk.chunkY);
    const travelParish = parishForChunk(chunk.chunkX, chunk.chunkY);
    return {
      chunkX: chunk.chunkX,
      chunkY: chunk.chunkY,
      biome: biomeLabel(data.biome),
      location: travelParish ? `${travelParish.shoreName}, ${travelParish.name}` : routeLocationForChunk(chunk.chunkX).name,
      loaded: this.rendered.size
    };
  }

  markDiscovered(discovered: string[], worldX: number, worldY: number): string[] {
    const chunk = worldToChunk(worldX, worldY);
    const key = chunkKey(chunk.chunkX, chunk.chunkY);
    return discovered.includes(key) ? discovered : [...discovered, key];
  }

  nearestInteraction(worldX: number, worldY: number, maxDistance = 76): WorldInteraction | undefined {
    let nearest: WorldInteraction | undefined;
    this.rendered.forEach((rendered, key) => {
      const data = this.generated.get(key);
      if (!data) return;
      const baseX = data.chunkX * CHUNK_SIZE;
      const baseY = data.chunkY * CHUNK_SIZE;
      data.objects.forEach((object) => {
        if (!INTERACTIVE_OBJECT_TYPES.includes(object.type)) return;
        const objectWorldX = baseX + object.x;
        const objectWorldY = baseY + object.y;
        const distance = Phaser.Math.Distance.Between(worldX, worldY, objectWorldX, objectWorldY);
        if (distance <= maxDistance && (!nearest || distance < nearest.distance)) {
          nearest = { object, worldX: objectWorldX, worldY: objectWorldY, distance };
        }
      });
    });
    return nearest;
  }

  loadedObjects(): LoadedWorldObject[] {
    const objects: LoadedWorldObject[] = [];
    this.rendered.forEach((rendered, key) => {
      const data = this.generated.get(key);
      if (!data) return;
      const baseX = data.chunkX * CHUNK_SIZE;
      const baseY = data.chunkY * CHUNK_SIZE;
      data.objects.forEach((object) => {
        objects.push({
          object,
          chunkKey: rendered.key,
          worldX: baseX + object.x,
          worldY: baseY + object.y
        });
      });
    });
    return objects;
  }

  tileAtWorld(worldX: number, worldY: number): TileData | undefined {
    const chunk = worldToChunk(worldX, worldY);
    const data = this.getChunk(chunk.chunkX, chunk.chunkY);
    const localX = worldX - chunk.chunkX * CHUNK_SIZE;
    const localY = worldY - chunk.chunkY * CHUNK_SIZE;
    const tileX = Math.floor(localX / TILE_SIZE);
    const tileY = Math.floor(localY / TILE_SIZE);
    return data.tiles[tileY]?.[tileX];
  }

  isPassable(worldX: number, worldY: number, mode: TravelMode): boolean {
    const tile = this.tileAtWorld(worldX, worldY);
    if (!tile) return false;
    const tilePassable = mode === "boat" ? isBoatPassable(tile.type) : isLandPassable(tile.type);
    return tilePassable && !this.collidesAtWorld(worldX, worldY, mode === "boat" ? 4 : 6);
  }

  nearestPassablePoint(worldX: number, worldY: number, mode: TravelMode, maxRadiusTiles = 12): { x: number; y: number } {
    if (this.isPassable(worldX, worldY, mode)) return { x: worldX, y: worldY };
    const originChunk = worldToChunk(worldX, worldY);
    const originTileX = Math.floor(worldX / TILE_SIZE);
    const originTileY = Math.floor(worldY / TILE_SIZE);
    const searchRadius = Math.max(maxRadiusTiles, 48);
    for (let radius = 1; radius <= searchRadius; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const x = (originTileX + dx) * TILE_SIZE + TILE_SIZE / 2;
          const y = (originTileY + dy) * TILE_SIZE + TILE_SIZE / 2;
          if (this.isPassable(x, y, mode)) return { x, y };
        }
      }
    }
    const center = {
      x: originChunk.chunkX * CHUNK_SIZE + CHUNK_SIZE / 2,
      y: originChunk.chunkY * CHUNK_SIZE + CHUNK_SIZE / 2
    };
    return this.isPassable(center.x, center.y, mode) ? center : { x: worldX, y: worldY };
  }

  collisionAtWorld(worldX: number, worldY: number, padding = 0): boolean {
    return this.collidesAtWorld(worldX, worldY, padding);
  }

  destroy(): void {
    this.rendered.forEach((rendered) => {
      rendered.container.destroy(true);
      rendered.colliders.forEach((collider) => collider.destroy());
    });
    this.rendered.clear();
    this.collisionGroup.clear(true, true);
  }

  private getChunk(chunkX: number, chunkY: number): ChunkData {
    const key = chunkKey(chunkX, chunkY);
    let chunk = this.generated.get(key);
    if (!chunk) {
      chunk = generateChunk(this.seed, chunkX, chunkY);
      this.generated.set(key, chunk);
    }
    return chunk;
  }

  private collidesAtWorld(worldX: number, worldY: number, padding = 0): boolean {
    const center = worldToChunk(worldX, worldY);
    for (let chunkY = center.chunkY - 1; chunkY <= center.chunkY + 1; chunkY += 1) {
      for (let chunkX = center.chunkX - 1; chunkX <= center.chunkX + 1; chunkX += 1) {
        const data = this.getChunk(chunkX, chunkY);
        const baseX = data.chunkX * CHUNK_SIZE;
        const baseY = data.chunkY * CHUNK_SIZE;
        const hit = data.collisions.some((collision) => {
          const halfWidth = collision.width / 2 + padding;
          const halfHeight = collision.height / 2 + padding;
          return worldX >= baseX + collision.x - halfWidth
            && worldX <= baseX + collision.x + halfWidth
            && worldY >= baseY + collision.y - halfHeight
            && worldY <= baseY + collision.y + halfHeight;
        });
        if (hit) return true;
      }
    }
    return false;
  }

  private ensureRendered(chunkX: number, chunkY: number): void {
    const key = chunkKey(chunkX, chunkY);
    if (this.rendered.has(key)) return;
    const chunk = this.getChunk(chunkX, chunkY);
    this.rendered.set(key, this.renderer.render(chunk));
  }

  private unloadFar(centerX: number, centerY: number): void {
    this.rendered.forEach((rendered, key) => {
      const [x, y] = key.split(",").map(Number);
      if (Math.abs(x - centerX) <= UNLOAD_RADIUS && Math.abs(y - centerY) <= UNLOAD_RADIUS) return;
      rendered.container.destroy(true);
      rendered.colliders.forEach((collider) => collider.destroy());
      this.rendered.delete(key);
    });
    this.generated.forEach((_chunk, key) => {
      if (this.rendered.has(key)) return;
      const [x, y] = key.split(",").map(Number);
      if (Math.abs(x - centerX) <= UNLOAD_RADIUS + 2 && Math.abs(y - centerY) <= UNLOAD_RADIUS + 2) return;
      this.generated.delete(key);
    });
  }
}

function isLandPassable(tile: TileType): boolean {
  return tile !== "water" && tile !== "shallow_water";
}

function isBoatPassable(tile: TileType): boolean {
  return tile === "water"
    || tile === "shallow_water"
    || tile === "sand"
    || tile === "mud"
    || tile === "dirt_path";
}
