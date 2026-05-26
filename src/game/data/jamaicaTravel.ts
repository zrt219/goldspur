import { BiomeId, CHUNK_SIZE } from "../world/ChunkTypes";

export const OPEN_WORLD_EXPANSION_MULTIPLIER = 5000;
export const EXPANDED_OPEN_WORLD_RADIUS = 120000 * OPEN_WORLD_EXPANSION_MULTIPLIER;
export const PARISH_REGION_RADIUS_CHUNKS = 96;
export const PROCEDURAL_WORLD_RADIUS_CHUNKS = 32768;

export type JamaicaParishId =
  | "hanover"
  | "st-elizabeth"
  | "st-james"
  | "trelawny"
  | "westmoreland"
  | "clarendon"
  | "manchester"
  | "st-ann"
  | "st-catherine"
  | "st-mary"
  | "kingston"
  | "portland"
  | "st-andrew"
  | "st-thomas";

export type JamaicaParishDestination = {
  id: JamaicaParishId;
  name: string;
  capital: string;
  shoreName: string;
  chunkX: number;
  chunkY: number;
  biome: BiomeId;
  summary: string;
  localEvent: string;
};

export const JAMAICA_PARISH_DESTINATIONS: JamaicaParishDestination[] = [
  {
    id: "hanover",
    name: "Hanover",
    capital: "Lucea",
    shoreName: "Lucea Harbour",
    chunkX: -4400,
    chunkY: 160,
    biome: "western_parish_beach",
    summary: "quiet west-coast harbour roads and fishing coves",
    localEvent: "Lucea Harbour craft day"
  },
  {
    id: "st-elizabeth",
    name: "St Elizabeth",
    capital: "Black River",
    shoreName: "Treasure Beach",
    chunkX: -1380,
    chunkY: 3920,
    biome: "south_coast_parish",
    summary: "dry south-coast fields, fishing beaches, and Black River country",
    localEvent: "Treasure Beach community cookout"
  },
  {
    id: "st-james",
    name: "St James",
    capital: "Montego Bay",
    shoreName: "Montego Bay Harbour",
    chunkX: -3020,
    chunkY: 40,
    biome: "western_parish_beach",
    summary: "busy harbour, beach road, and music-festival country",
    localEvent: "Reggae Sumfest week"
  },
  {
    id: "trelawny",
    name: "Trelawny",
    capital: "Falmouth",
    shoreName: "Falmouth Pier",
    chunkX: -1420,
    chunkY: -80,
    biome: "north_coast_parish",
    summary: "Georgian town streets, pier lights, and north-coast cane roads",
    localEvent: "Falmouth market fair"
  },
  {
    id: "westmoreland",
    name: "Westmoreland",
    capital: "Savanna-la-Mar",
    shoreName: "Negril Beach",
    chunkX: -3360,
    chunkY: 2200,
    biome: "western_parish_beach",
    summary: "long beach, cliffs, and Savanna-la-Mar road country",
    localEvent: "Reggae Marathon beach morning"
  },
  {
    id: "clarendon",
    name: "Clarendon",
    capital: "May Pen",
    shoreName: "Rocky Point",
    chunkX: 1180,
    chunkY: 3300,
    biome: "south_coast_parish",
    summary: "south-coast fishing villages below May Pen's market roads",
    localEvent: "Rocky Point fish fry"
  },
  {
    id: "manchester",
    name: "Manchester",
    capital: "Mandeville",
    shoreName: "Alligator Pond",
    chunkX: -120,
    chunkY: 3800,
    biome: "south_coast_parish",
    summary: "Alligator Pond shore below cool inland Mandeville hills",
    localEvent: "Alligator Pond seafood night"
  },
  {
    id: "st-ann",
    name: "St Ann",
    capital: "St Ann's Bay",
    shoreName: "Steer Town Landing",
    chunkX: 0,
    chunkY: 0,
    biome: "steer_town_groves",
    summary: "Goldspur's home parish, from Steer Town to Ocho Rios and Discovery Bay",
    localEvent: "Rebel Salute roots night"
  },
  {
    id: "st-catherine",
    name: "St Catherine",
    capital: "Spanish Town",
    shoreName: "Portmore Causeway",
    chunkX: 2440,
    chunkY: 2460,
    biome: "kingston_harbour",
    summary: "causeway water, Portmore shore, and Spanish Town history",
    localEvent: "Spanish Town heritage ride"
  },
  {
    id: "st-mary",
    name: "St Mary",
    capital: "Port Maria",
    shoreName: "Port Maria Bay",
    chunkX: 1320,
    chunkY: -260,
    biome: "north_coast_parish",
    summary: "green north-coast coves and Port Maria road bends",
    localEvent: "Port Maria market morning"
  },
  {
    id: "kingston",
    name: "Kingston",
    capital: "Kingston",
    shoreName: "Kingston Harbour",
    chunkX: 3260,
    chunkY: 2240,
    biome: "kingston_harbour",
    summary: "harbour lights, music streets, and festival crowds",
    localEvent: "Carnival road march"
  },
  {
    id: "portland",
    name: "Portland",
    capital: "Port Antonio",
    shoreName: "Port Antonio Harbour",
    chunkX: 2860,
    chunkY: -520,
    biome: "blue_mountain_parish",
    summary: "rainy blue-green coast, river mouths, and mountain mist",
    localEvent: "Port Antonio jerk and river day"
  },
  {
    id: "st-andrew",
    name: "St Andrew",
    capital: "Half Way Tree",
    shoreName: "Palisadoes Shore",
    chunkX: 3000,
    chunkY: 1780,
    biome: "kingston_harbour",
    summary: "Palisadoes water road below Half Way Tree and the Blue Mountain edge",
    localEvent: "Kingston food and drink night"
  },
  {
    id: "st-thomas",
    name: "St Thomas",
    capital: "Morant Bay",
    shoreName: "Morant Bay",
    chunkX: 4240,
    chunkY: 1760,
    biome: "blue_mountain_parish",
    summary: "eastern shore, Morant Bay, and mountain rain beyond the cane fields",
    localEvent: "Morant Bay heroes vigil"
  }
];

const OPEN_WORLD_PLAYABLE_MARGIN_CHUNKS = PARISH_REGION_RADIUS_CHUNKS + 640;
const OPEN_WORLD_MIN_CHUNK_X = Math.min(-PROCEDURAL_WORLD_RADIUS_CHUNKS, Math.min(...JAMAICA_PARISH_DESTINATIONS.map((destination) => destination.chunkX)) - OPEN_WORLD_PLAYABLE_MARGIN_CHUNKS);
const OPEN_WORLD_MAX_CHUNK_X = Math.max(PROCEDURAL_WORLD_RADIUS_CHUNKS, Math.max(...JAMAICA_PARISH_DESTINATIONS.map((destination) => destination.chunkX)) + OPEN_WORLD_PLAYABLE_MARGIN_CHUNKS);
const OPEN_WORLD_MIN_CHUNK_Y = Math.min(-PROCEDURAL_WORLD_RADIUS_CHUNKS, Math.min(...JAMAICA_PARISH_DESTINATIONS.map((destination) => destination.chunkY)) - OPEN_WORLD_PLAYABLE_MARGIN_CHUNKS);
const OPEN_WORLD_MAX_CHUNK_Y = Math.max(PROCEDURAL_WORLD_RADIUS_CHUNKS, Math.max(...JAMAICA_PARISH_DESTINATIONS.map((destination) => destination.chunkY)) + OPEN_WORLD_PLAYABLE_MARGIN_CHUNKS);

export const OPEN_WORLD_PLAYABLE_BOUNDS = {
  left: OPEN_WORLD_MIN_CHUNK_X * CHUNK_SIZE,
  top: OPEN_WORLD_MIN_CHUNK_Y * CHUNK_SIZE,
  right: (OPEN_WORLD_MAX_CHUNK_X + 1) * CHUNK_SIZE,
  bottom: (OPEN_WORLD_MAX_CHUNK_Y + 1) * CHUNK_SIZE,
  width: (OPEN_WORLD_MAX_CHUNK_X - OPEN_WORLD_MIN_CHUNK_X + 1) * CHUNK_SIZE,
  height: (OPEN_WORLD_MAX_CHUNK_Y - OPEN_WORLD_MIN_CHUNK_Y + 1) * CHUNK_SIZE
} as const;

export type BoatHullId = "blue" | "red" | "green" | "black";
export type BoatSailId = "cream" | "gold" | "stripe" | "festival";
export type BoatTrimId = "cedar" | "pimento" | "bamboo" | "mahogany";

export type BoatSaveData = {
  built: boolean;
  hull: BoatHullId;
  sail: BoatSailId;
  trim: BoatTrimId;
  name: string;
  x?: number;
  y?: number;
  chunkX?: number;
  chunkY?: number;
  onboard: boolean;
};

export const BOAT_HULLS: Array<{ id: BoatHullId; label: string; tint: number }> = [
  { id: "blue", label: "Blue Hull", tint: 0x2f6f83 },
  { id: "red", label: "Red Hull", tint: 0x9f4a36 },
  { id: "green", label: "Green Hull", tint: 0x3f7d45 },
  { id: "black", label: "Black Hull", tint: 0x242424 }
];

export const BOAT_SAILS: Array<{ id: BoatSailId; label: string }> = [
  { id: "cream", label: "Cream Sail" },
  { id: "gold", label: "Gold Sail" },
  { id: "stripe", label: "Green Stripe Sail" },
  { id: "festival", label: "Festival Sail" }
];

export const BOAT_TRIMS: Array<{ id: BoatTrimId; label: string }> = [
  { id: "cedar", label: "Cedar Trim" },
  { id: "pimento", label: "Pimento Trim" },
  { id: "bamboo", label: "Bamboo Trim" },
  { id: "mahogany", label: "Mahogany Trim" }
];

export const DEFAULT_BOAT_SAVE: BoatSaveData = {
  built: false,
  hull: "blue",
  sail: "cream",
  trim: "cedar",
  name: "Goldspur Skiff",
  onboard: false
};

export type JamaicaCelebration = {
  id: string;
  title: string;
  kind: "holiday" | "festival" | "community" | "sport";
  timing: string;
  parishId?: JamaicaParishId;
  summary: string;
};

export const JAMAICA_CELEBRATIONS: JamaicaCelebration[] = [
  { id: "new-year", title: "New Year's Day", kind: "holiday", timing: "January 1", summary: "a fresh start with beach cleanups, church bells, and family visits" },
  { id: "accompong", title: "Accompong Maroon Festival", kind: "community", timing: "January 6", parishId: "st-elizabeth", summary: "Maroon heritage, drumming, food, and community ceremony" },
  { id: "rebel-salute", title: "Rebel Salute", kind: "festival", timing: "January", parishId: "st-ann", summary: "roots reggae, cultural food stalls, and St Ann night rides" },
  { id: "carnival", title: "Carnival in Jamaica", kind: "festival", timing: "March or April", parishId: "kingston", summary: "costumes, road march, soca trucks, and downtown colour" },
  { id: "good-friday", title: "Good Friday", kind: "holiday", timing: "Easter season", summary: "quiet family visits and fish dinners before Easter weekend" },
  { id: "easter-monday", title: "Easter Monday", kind: "holiday", timing: "Easter season", summary: "kite flying, beach trips, and picnic rides" },
  { id: "labour-day", title: "Labour Day", kind: "holiday", timing: "May 23", summary: "community projects, painted walls, cleared roads, and shared work" },
  { id: "sumfest", title: "Reggae Sumfest", kind: "festival", timing: "July", parishId: "st-james", summary: "reggae and dancehall week around Montego Bay" },
  { id: "emancipation", title: "Emancipation Day", kind: "holiday", timing: "August 1", summary: "freedom vigils, drumming, and reflection across the island" },
  { id: "independence", title: "Independence Day", kind: "holiday", timing: "August 6", summary: "Jamaican flags, festival songs, parades, and national pride" },
  { id: "food-drink", title: "Jamaica Food and Drink Festival", kind: "festival", timing: "September or October", parishId: "st-andrew", summary: "Kingston tastings, chefs, street food, and market flavours" },
  { id: "heroes-day", title: "National Heroes' Day", kind: "holiday", timing: "third Monday in October", summary: "honouring national heroes and local service" },
  { id: "reggae-marathon", title: "Reggae Marathon", kind: "sport", timing: "December", parishId: "westmoreland", summary: "Negril running, music, beach mornings, and community cheers" },
  { id: "christmas", title: "Christmas Day", kind: "holiday", timing: "December 25", summary: "family food, sorrel, fruit cake, church, and home visits" },
  { id: "boxing-day", title: "Boxing Day", kind: "holiday", timing: "December 26", summary: "beach trips, leftovers, family games, and late-season markets" }
];

export function normalizeBoatSave(input: unknown): BoatSaveData {
  const raw = typeof input === "object" && input !== null ? input as Partial<BoatSaveData> : {};
  const built = raw.built === true;
  return {
    built,
    hull: isBoatHull(raw.hull) ? raw.hull : DEFAULT_BOAT_SAVE.hull,
    sail: isBoatSail(raw.sail) ? raw.sail : DEFAULT_BOAT_SAVE.sail,
    trim: isBoatTrim(raw.trim) ? raw.trim : DEFAULT_BOAT_SAVE.trim,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.slice(0, 28) : DEFAULT_BOAT_SAVE.name,
    x: finiteNumber(raw.x) ? raw.x : undefined,
    y: finiteNumber(raw.y) ? raw.y : undefined,
    chunkX: finiteNumber(raw.chunkX) ? Math.floor(raw.chunkX) : undefined,
    chunkY: finiteNumber(raw.chunkY) ? Math.floor(raw.chunkY) : undefined,
    onboard: built && raw.onboard === true
  };
}

export function destinationByParishId(id: string | undefined): JamaicaParishDestination {
  return JAMAICA_PARISH_DESTINATIONS.find((destination) => destination.id === id) ?? JAMAICA_PARISH_DESTINATIONS.find((destination) => destination.id === "st-ann")!;
}

export function shoreWorldPoint(destination: JamaicaParishDestination): { x: number; y: number; chunkX: number; chunkY: number } {
  return {
    x: destination.chunkX * CHUNK_SIZE + CHUNK_SIZE / 2,
    y: destination.chunkY * CHUNK_SIZE + CHUNK_SIZE / 2,
    chunkX: destination.chunkX,
    chunkY: destination.chunkY
  };
}

export function boatDockPoint(destination: JamaicaParishDestination): { x: number; y: number; chunkX: number; chunkY: number } {
  const shore = shoreWorldPoint(destination);
  const x = shore.x + 68;
  const y = shore.y + 42;
  return {
    x,
    y,
    chunkX: Math.floor(x / CHUNK_SIZE),
    chunkY: Math.floor(y / CHUNK_SIZE)
  };
}

export function parishForChunk(chunkX: number, chunkY: number): JamaicaParishDestination | undefined {
  let best: { destination: JamaicaParishDestination; distance: number } | undefined;
  JAMAICA_PARISH_DESTINATIONS.forEach((destination) => {
    const distance = Math.hypot(destination.chunkX - chunkX, destination.chunkY - chunkY);
    if (distance <= PARISH_REGION_RADIUS_CHUNKS && (!best || distance < best.distance)) {
      best = { destination, distance };
    }
  });
  return best?.destination;
}

export function parishForWorld(worldX: number, worldY: number): JamaicaParishDestination | undefined {
  return parishForChunk(Math.floor(worldX / CHUNK_SIZE), Math.floor(worldY / CHUNK_SIZE));
}

export function boatHullTint(hull: BoatHullId): number {
  return BOAT_HULLS.find((entry) => entry.id === hull)?.tint ?? BOAT_HULLS[0].tint;
}

export function boatSummary(boat: BoatSaveData): string {
  if (!boat.built) return "Boat: not built";
  return `${boat.name}: ${labelFor(BOAT_HULLS, boat.hull)}, ${labelFor(BOAT_SAILS, boat.sail)}, ${labelFor(BOAT_TRIMS, boat.trim)}`;
}

export function nextBoatHull(current: BoatHullId): BoatHullId {
  return nextId(BOAT_HULLS, current);
}

export function nextBoatSail(current: BoatSailId): BoatSailId {
  return nextId(BOAT_SAILS, current);
}

export function nextBoatTrim(current: BoatTrimId): BoatTrimId {
  return nextId(BOAT_TRIMS, current);
}

export function activeCelebrationForDay(day: number, parishId?: string): JamaicaCelebration {
  const safeDay = Math.max(1, Math.floor(day));
  const local = JAMAICA_CELEBRATIONS.filter((celebration) => celebration.parishId === parishId);
  if (local.length > 0 && safeDay % 3 === 0) return local[(safeDay - 1) % local.length];
  return JAMAICA_CELEBRATIONS[(safeDay - 1) % JAMAICA_CELEBRATIONS.length];
}

function labelFor<T extends { id: string; label: string }>(entries: readonly T[], id: string): string {
  return entries.find((entry) => entry.id === id)?.label ?? id;
}

function nextId<T extends { id: string }>(entries: readonly T[], current: T["id"]): T["id"] {
  const index = entries.findIndex((entry) => entry.id === current);
  return entries[(index + 1 + entries.length) % entries.length].id;
}

function isBoatHull(value: unknown): value is BoatHullId {
  return BOAT_HULLS.some((entry) => entry.id === value);
}

function isBoatSail(value: unknown): value is BoatSailId {
  return BOAT_SAILS.some((entry) => entry.id === value);
}

function isBoatTrim(value: unknown): value is BoatTrimId {
  return BOAT_TRIMS.some((entry) => entry.id === value);
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
