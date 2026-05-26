import { chunkKey } from "./ChunkTypes";
import { destinationByParishId, JamaicaParishId, normalizeBoatSave, BoatSaveData } from "../data/jamaicaTravel";

export type OpenWorldPosition = {
  x: number;
  y: number;
  chunkX: number;
  chunkY: number;
};

export type WorldSaveData = {
  worldSeed: string;
  openWorldPosition?: OpenWorldPosition;
  horsePosition?: OpenWorldPosition;
  discoveredChunks: string[];
  interactedWorldObjects: string[];
  boat: BoatSaveData;
  currentParishId: JamaicaParishId;
  homeParishId: JamaicaParishId;
  visitedParishIds: JamaicaParishId[];
};

export function createWorldSeed(): string {
  const random = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
  return `goldspur-${random}-${Date.now().toString(36)}`;
}

export function normalizeWorldSave(input: unknown): WorldSaveData {
  const raw = typeof input === "object" && input !== null ? (input as Partial<WorldSaveData>) : {};
  return {
    worldSeed: typeof raw.worldSeed === "string" && raw.worldSeed.trim() ? raw.worldSeed : createWorldSeed(),
    openWorldPosition: normalizePosition(raw.openWorldPosition),
    horsePosition: normalizePosition(raw.horsePosition),
    discoveredChunks: normalizeStringList(raw.discoveredChunks, [chunkKey(0, 0)]),
    interactedWorldObjects: normalizeStringList(raw.interactedWorldObjects),
    boat: normalizeBoatSave(raw.boat),
    currentParishId: normalizeParishId(raw.currentParishId),
    homeParishId: normalizeParishId(raw.homeParishId),
    visitedParishIds: normalizeParishList(raw.visitedParishIds)
  };
}

function normalizePosition(input: unknown): OpenWorldPosition | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const raw = input as Partial<OpenWorldPosition>;
  const x = Number(raw.x);
  const y = Number(raw.y);
  const chunkX = Number(raw.chunkX);
  const chunkY = Number(raw.chunkY);
  if (![x, y, chunkX, chunkY].every(Number.isFinite)) return undefined;
  return {
    x: Math.round(x),
    y: Math.round(y),
    chunkX: Math.floor(chunkX),
    chunkY: Math.floor(chunkY)
  };
}

function normalizeStringList(input: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(input)) return [...fallback];
  return Array.from(new Set(input.filter((item): item is string => typeof item === "string")));
}

function normalizeParishId(input: unknown): JamaicaParishId {
  if (typeof input === "string") return destinationByParishId(input).id;
  return "st-ann";
}

function normalizeParishList(input: unknown): JamaicaParishId[] {
  const raw = Array.isArray(input) ? input : ["st-ann"];
  const normalized = raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => destinationByParishId(item).id);
  if (!normalized.includes("st-ann")) normalized.unshift("st-ann");
  return Array.from(new Set(normalized));
}
