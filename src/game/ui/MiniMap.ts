import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { GAME_HEIGHT, GAME_WIDTH, WORLD_BOUNDS } from "../data/constants";
import { routeLocationForChunk, routeWorldPoint, ST_ANN_ROUTE_LOCATIONS } from "../data/jamaicaContent";
import { JAMAICA_PARISH_DESTINATIONS, JamaicaParishId, shoreWorldPoint } from "../data/jamaicaTravel";
import { parishRouteY } from "../world/Biomes";
import { CHUNK_SIZE } from "../world/ChunkTypes";

export type MiniMapLandmark = {
  x: number;
  y: number;
  label: string;
  kind: "route" | "market" | "nature" | "quest";
};

export type MiniMapState = {
  mode: "local" | "parish" | "island";
  areaName: string;
  worldX: number;
  worldY: number;
  chunkX?: number;
  chunkY?: number;
  biomeLabel?: string;
  locationName?: string;
  locationDetail?: string;
  currentParishId?: JamaicaParishId;
  visitedParishIds?: string[];
  discoveredChunks?: string[];
  landmarks?: MiniMapLandmark[];
  bounds?: MiniMapBounds;
  horse?: MiniMapTrackedMarker;
  boat?: MiniMapBoatMarker;
};

export type MiniMapBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type MiniMapTrackedMarker = {
  x: number;
  y: number;
  visible: boolean;
  tracked?: boolean;
};

export type MiniMapBoatMarker = {
  x: number;
  y: number;
  built: boolean;
  onboard: boolean;
};

const PANEL_X = GAME_WIDTH - 110;
const PANEL_Y = 88;
const MAP_X = GAME_WIDTH - 164;
const MAP_Y = 58;
const MAP_WIDTH = 108;
const MAP_HEIGHT = 66;
const ROUTE_START_CHUNK = -1;
const ROUTE_END_CHUNK = 29;
const ROUTE_MIN_Y = -3;
const ROUTE_MAX_Y = 4;

type ChunkProjection = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export class MiniMap {
  private readonly container: Phaser.GameObjects.Container;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly detail: Phaser.GameObjects.Text;
  private parishProjection?: ChunkProjection;

  constructor(private readonly scene: Phaser.Scene) {
    const panel = scene.add.rectangle(PANEL_X, PANEL_Y, 170, 142, Palette.darkPanel, 0.94)
      .setStrokeStyle(3, Palette.gold);
    const inner = scene.add.rectangle(PANEL_X, PANEL_Y + 8, 154, 106, Palette.panelBrown, 0.18)
      .setStrokeStyle(1, Palette.goldDark, 0.55);
    this.title = scene.add.text(PANEL_X, 36, "Mini Map", {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: PaletteCss.gold
    }).setOrigin(0.5);
    this.graphics = scene.add.graphics();
    this.detail = scene.add.text(PANEL_X, 144, "", {
      fontFamily: "Georgia",
      fontSize: "11px",
      color: PaletteCss.cream,
      align: "center",
      fixedWidth: 154
    }).setOrigin(0.5);
    const children: Phaser.GameObjects.GameObject[] = [panel, inner, this.graphics, this.title, this.detail];
    children.forEach((child) => {
      const fixed = child as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor;
      fixed.setScrollFactor?.(0);
    });
    this.container = scene.add.container(0, 0, children).setDepth(700).setScrollFactor(0);
  }

  update(state: MiniMapState): void {
    this.graphics.clear();
    this.drawFrame();
    if (state.mode === "island") this.drawIsland(state);
    else if (state.mode === "parish") this.drawParish(state);
    else this.drawLocal(state);
  }

  private drawFrame(): void {
    this.graphics.fillStyle(0x263f25, 0.98).fillRect(MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT);
    this.graphics.lineStyle(2, Palette.goldDark, 1).strokeRect(MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT);
  }

  private drawLocal(state: MiniMapState): void {
    const bounds = state.bounds ?? WORLD_BOUNDS;
    const player = this.mapBoundsWorld(state.worldX, state.worldY, bounds);
    this.graphics.lineStyle(3, 0xc89a55, 0.86)
      .lineBetween(MAP_X + 10, MAP_Y + MAP_HEIGHT * 0.58, MAP_X + MAP_WIDTH - 10, MAP_Y + MAP_HEIGHT * 0.42);
    this.drawBoatMarker(state.boat, (x, y) => this.mapBoundsWorld(x, y, bounds));
    this.drawHorseMarker(state.horse, (x, y) => this.mapBoundsWorld(x, y, bounds));
    this.graphics.fillStyle(Palette.gold, 1).fillCircle(player.x, player.y, 5);
    this.graphics.lineStyle(2, 0x15100a, 0.95).strokeCircle(player.x, player.y, 5);
    this.detail.setText(state.areaName);
  }

  private drawParish(state: MiniMapState): void {
    this.parishProjection = this.resolveParishProjection(state);
    this.drawRoute();
    this.drawDiscovered(state.discoveredChunks ?? []);
    this.drawRouteStops(state.chunkX ?? 0, state.discoveredChunks ?? []);
    this.drawLandmarks(state.landmarks ?? []);
    this.drawBoatMarker(state.boat, (x, y) => this.mapWorld(x, y));
    this.drawHorseMarker(state.horse, (x, y) => this.mapWorld(x, y));
    this.drawPlayer(state.worldX, state.worldY);
    this.parishProjection = undefined;
    const location = routeLocationForChunk(state.chunkX ?? Math.floor(state.worldX / CHUNK_SIZE));
    const tracker = state.horse?.tracked ? " | horse" : "";
    this.detail.setText(`${location.name}${tracker}\n${state.biomeLabel ?? "St Ann"}`);
  }

  private drawIsland(state: MiniMapState): void {
    const center = this.islandCenter();
    const outline = [...JAMAICA_PARISH_DESTINATIONS].sort((a, b) => (
      Math.atan2(a.chunkY - center.y, a.chunkX - center.x) - Math.atan2(b.chunkY - center.y, b.chunkX - center.x)
    ));
    const points = outline.map((destination) => this.mapIslandChunk(destination.chunkX, destination.chunkY));
    this.graphics.fillStyle(0x235c75, 1).fillRect(MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT);
    this.graphics.lineStyle(3, 0x5f8d5d, 0.86);
    for (let i = 0; i < points.length; i += 1) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      this.graphics.lineBetween(current.x, current.y, next.x, next.y);
    }
    this.graphics.fillStyle(0x315f34, 0.45);
    points.forEach((point) => this.graphics.fillCircle(point.x, point.y, 7));
    const visited = new Set(state.visitedParishIds ?? ["st-ann"]);
    JAMAICA_PARISH_DESTINATIONS.forEach((destination) => {
      const point = this.mapIslandChunk(destination.chunkX, destination.chunkY);
      const current = destination.id === state.currentParishId;
      const known = visited.has(destination.id);
      this.graphics.fillStyle(current ? Palette.gold : known ? 0xf5e6b8 : 0x7c8868, current ? 1 : known ? 0.76 : 0.32)
        .fillCircle(point.x, point.y, current ? 5 : 2.8);
    });
    const playerPoint = this.mapIslandWorld(state.worldX, state.worldY);
    this.drawBoatMarker(state.boat, (x, y) => this.mapIslandWorld(x, y));
    this.drawHorseMarker(state.horse, (x, y) => this.mapIslandWorld(x, y));
    this.graphics.fillStyle(0xfff3cf, 1).fillCircle(playerPoint.x, playerPoint.y, 4.5);
    this.graphics.lineStyle(2, 0x15100a, 1).strokeCircle(playerPoint.x, playerPoint.y, 4.5);
    this.detail.setText(`${state.locationName ?? state.areaName}\n${state.locationDetail ?? "Jamaica"}`);
  }

  private drawRoute(): void {
    this.graphics.lineStyle(4, 0x8b5b35, 0.92);
    let previous: { x: number; y: number } | undefined;
    for (let chunkX = ROUTE_START_CHUNK; chunkX <= ROUTE_END_CHUNK; chunkX += 1) {
      const point = this.mapChunk(chunkX, parishRouteY(chunkX));
      if (previous) this.graphics.lineBetween(previous.x, previous.y, point.x, point.y);
      previous = point;
    }
  }

  private drawDiscovered(chunks: string[]): void {
    this.graphics.fillStyle(0xe0c36f, 0.18);
    chunks.forEach((key) => {
      const [chunkX, chunkY] = key.split(",").map(Number);
      if (!Number.isFinite(chunkX) || !Number.isFinite(chunkY)) return;
      const point = this.mapChunk(chunkX, chunkY);
      this.graphics.fillRect(point.x - 2, point.y - 2, 4, 4);
    });
  }

  private drawRouteStops(currentChunkX: number, discoveredChunks: string[]): void {
    ST_ANN_ROUTE_LOCATIONS.forEach((location) => {
      const world = routeWorldPoint(location);
      const point = this.mapWorld(world.x, world.y);
      const discovered = this.isRouteStopDiscovered(location.chunkX, discoveredChunks, currentChunkX);
      const near = Math.abs(location.chunkX - currentChunkX) <= 1;
      this.graphics.fillStyle(
        near ? Palette.gold : discovered ? 0xf5e6b8 : 0x6f745d,
        near ? 1 : discovered ? 0.68 : 0.28
      ).fillCircle(point.x, point.y, near ? 3.5 : discovered ? 2.2 : 1.4);
    });
  }

  private isRouteStopDiscovered(locationChunkX: number, discoveredChunks: string[], currentChunkX: number): boolean {
    if (Math.abs(locationChunkX - currentChunkX) <= 1) return true;
    return discoveredChunks.some((key) => {
      const [chunkX, chunkY] = key.split(",").map(Number);
      return Number.isFinite(chunkX)
        && Number.isFinite(chunkY)
        && Math.abs(chunkX - locationChunkX) <= 1
        && Math.abs(chunkY - parishRouteY(locationChunkX)) <= 1;
    });
  }

  private drawLandmarks(landmarks: MiniMapLandmark[]): void {
    landmarks.slice(0, 12).forEach((landmark) => {
      const point = this.mapWorld(landmark.x, landmark.y);
      const color = landmark.kind === "market" ? 0xf0d45b : landmark.kind === "quest" ? 0x7ad7ff : landmark.kind === "nature" ? 0x9be07d : 0xffb46b;
      this.graphics.fillStyle(color, 0.9).fillRect(point.x - 2, point.y - 2, 4, 4);
    });
  }

  private drawPlayer(worldX: number, worldY: number): void {
    const point = this.mapWorld(worldX, worldY);
    this.graphics.fillStyle(0xfff3cf, 1).fillCircle(point.x, point.y, 5);
    this.graphics.lineStyle(2, 0x15100a, 1).strokeCircle(point.x, point.y, 5);
    this.graphics.fillStyle(Palette.gold, 1).fillCircle(point.x, point.y, 2);
  }

  private mapWorld(worldX: number, worldY: number): { x: number; y: number } {
    return this.mapChunk(worldX / CHUNK_SIZE, worldY / CHUNK_SIZE);
  }

  private mapChunk(chunkX: number, chunkY: number): { x: number; y: number } {
    const projection = this.parishProjection ?? { minX: ROUTE_START_CHUNK, maxX: ROUTE_END_CHUNK, minY: ROUTE_MIN_Y, maxY: ROUTE_MAX_Y };
    const x = MAP_X + Phaser.Math.Clamp((chunkX - projection.minX) / Math.max(1, projection.maxX - projection.minX), 0, 1) * MAP_WIDTH;
    const y = MAP_Y + Phaser.Math.Clamp((chunkY - projection.minY) / Math.max(1, projection.maxY - projection.minY), 0, 1) * MAP_HEIGHT;
    return { x, y };
  }

  private mapBoundsWorld(worldX: number, worldY: number, bounds: MiniMapBounds): { x: number; y: number } {
    return {
      x: MAP_X + Phaser.Math.Clamp((worldX - bounds.left) / Math.max(1, bounds.width), 0, 1) * MAP_WIDTH,
      y: MAP_Y + Phaser.Math.Clamp((worldY - bounds.top) / Math.max(1, bounds.height), 0, 1) * MAP_HEIGHT
    };
  }

  private mapIslandWorld(worldX: number, worldY: number): { x: number; y: number } {
    return this.mapIslandChunk(worldX / CHUNK_SIZE, worldY / CHUNK_SIZE);
  }

  private mapIslandChunk(chunkX: number, chunkY: number): { x: number; y: number } {
    const parishPoints = JAMAICA_PARISH_DESTINATIONS.map((destination) => shoreWorldPoint(destination));
    const xs = parishPoints.map((point) => point.chunkX);
    const ys = parishPoints.map((point) => point.chunkY);
    const minX = Math.min(...xs) - 240;
    const maxX = Math.max(...xs) + 240;
    const minY = Math.min(...ys) - 240;
    const maxY = Math.max(...ys) + 240;
    const x = MAP_X + Phaser.Math.Clamp((chunkX - minX) / (maxX - minX), 0, 1) * MAP_WIDTH;
    const y = MAP_Y + Phaser.Math.Clamp((chunkY - minY) / (maxY - minY), 0, 1) * MAP_HEIGHT;
    return { x, y };
  }

  private islandCenter(): { x: number; y: number } {
    const total = JAMAICA_PARISH_DESTINATIONS.reduce((sum, destination) => ({
      x: sum.x + destination.chunkX,
      y: sum.y + destination.chunkY
    }), { x: 0, y: 0 });
    return {
      x: total.x / JAMAICA_PARISH_DESTINATIONS.length,
      y: total.y / JAMAICA_PARISH_DESTINATIONS.length
    };
  }

  private drawHorseMarker(marker: MiniMapTrackedMarker | undefined, project: (x: number, y: number) => { x: number; y: number }): void {
    if (!marker || (!marker.visible && !marker.tracked)) return;
    const point = project(marker.x, marker.y);
    this.graphics.fillStyle(marker.visible ? 0xc47a35 : 0x9b6b42, marker.visible ? 1 : 0.62)
      .fillCircle(point.x, point.y, marker.tracked ? 4 : 3);
    this.graphics.lineStyle(1.5, 0x1b1008, 0.95).strokeCircle(point.x, point.y, marker.tracked ? 4 : 3);
    if (marker.tracked) {
      this.graphics.lineStyle(1, 0xffdf8d, 0.82).strokeCircle(point.x, point.y, 6);
    }
  }

  private drawBoatMarker(marker: MiniMapBoatMarker | undefined, project: (x: number, y: number) => { x: number; y: number }): void {
    if (!marker?.built) return;
    const point = project(marker.x, marker.y);
    this.graphics.fillStyle(0x64c7e6, marker.onboard ? 0.72 : 0.95).fillTriangle(
      point.x,
      point.y - 5,
      point.x - 5,
      point.y + 4,
      point.x + 5,
      point.y + 4
    );
    this.graphics.lineStyle(1.5, 0x102938, 0.95).strokeTriangle(
      point.x,
      point.y - 5,
      point.x - 5,
      point.y + 4,
      point.x + 5,
      point.y + 4
    );
  }

  private resolveParishProjection(state: MiniMapState): ChunkProjection {
    const xs: number[] = [];
    const ys: number[] = [];
    const addWorld = (x: number, y: number): void => {
      xs.push(x / CHUNK_SIZE);
      ys.push(y / CHUNK_SIZE);
    };
    addWorld(state.worldX, state.worldY);
    if (state.horse) addWorld(state.horse.x, state.horse.y);
    if (state.boat?.built) addWorld(state.boat.x, state.boat.y);
    (state.landmarks ?? []).forEach((landmark) => addWorld(landmark.x, landmark.y));
    ST_ANN_ROUTE_LOCATIONS.forEach((location) => {
      const point = routeWorldPoint(location);
      addWorld(point.x, point.y);
    });
    (state.discoveredChunks ?? []).slice(-90).forEach((key) => {
      const [chunkX, chunkY] = key.split(",").map(Number);
      if (Number.isFinite(chunkX) && Number.isFinite(chunkY)) {
        xs.push(chunkX);
        ys.push(chunkY);
      }
    });
    const minX = Math.min(...xs, ROUTE_START_CHUNK);
    const maxX = Math.max(...xs, ROUTE_END_CHUNK);
    const minY = Math.min(...ys, ROUTE_MIN_Y);
    const maxY = Math.max(...ys, ROUTE_MAX_Y);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const spanX = Math.max(36, maxX - minX + 8);
    const spanY = Math.max(12, maxY - minY + 6);
    return {
      minX: centerX - spanX / 2,
      maxX: centerX + spanX / 2,
      minY: centerY - spanY / 2,
      maxY: centerY + spanY / 2
    };
  }
}
