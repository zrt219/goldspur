import { CHUNK_SIZE } from "../world/ChunkTypes";
import { parishRouteY } from "../world/Biomes";

export type StAnnRouteLocation = {
  id: string;
  name: string;
  chunkX: number;
  chunkY: number;
  summary: string;
};

export const ST_ANN_ROUTE_LOCATIONS: StAnnRouteLocation[] = [
  { id: "steer-town", name: "Steer Town", chunkX: 0, chunkY: 0, summary: "home roads above Mammee Bay" },
  { id: "mammee-bay", name: "Mammee Bay", chunkX: 2, chunkY: 0, summary: "north-coast beach road near Steer Town" },
  { id: "drax-hall", name: "Drax Hall", chunkX: 3, chunkY: 0, summary: "busy St Ann corridor west of Ocho Rios" },
  { id: "st-anns-bay", name: "St Ann's Bay", chunkX: 5, chunkY: 0, summary: "parish capital and market town" },
  { id: "seville", name: "Seville", chunkX: 6, chunkY: 0, summary: "heritage country near St Ann's Bay" },
  { id: "priory", name: "Priory", chunkX: 7, chunkY: 0, summary: "coastal village west of St Ann's Bay" },
  { id: "richmond", name: "Richmond", chunkX: 8, chunkY: 0, summary: "hillside community above the coast" },
  { id: "llandovery", name: "Llandovery", chunkX: 9, chunkY: 0, summary: "rural St Ann road country" },
  { id: "ocho-rios", name: "Ocho Rios", chunkX: 11, chunkY: 0, summary: "north-coast town known locally as Ochi" },
  { id: "dunns-river", name: "Dunn's River", chunkX: 12, chunkY: 0, summary: "waterfall country near Ocho Rios" },
  { id: "shaw-park", name: "Shaw Park", chunkX: 13, chunkY: 0, summary: "garden hillside above Ocho Rios" },
  { id: "fern-gully", name: "Fern Gully", chunkX: 14, chunkY: 0, summary: "green ravine road inland from Ocho Rios" },
  { id: "runaway-bay", name: "Runaway Bay", chunkX: 16, chunkY: 0, summary: "coastal town west of Ocho Rios" },
  { id: "salem", name: "Salem", chunkX: 17, chunkY: 0, summary: "north-coast community near Runaway Bay" },
  { id: "discovery-bay", name: "Discovery Bay", chunkX: 20, chunkY: 0, summary: "limestone bay on St Ann's west coast" },
  { id: "puerto-seco", name: "Puerto Seco", chunkX: 21, chunkY: 0, summary: "Discovery Bay beach landmark" },
  { id: "browns-town", name: "Brown's Town", chunkX: 23, chunkY: 1, summary: "historic inland market town" },
  { id: "alexandria", name: "Alexandria", chunkX: 24, chunkY: 1, summary: "inland St Ann town" },
  { id: "claremont", name: "Claremont", chunkX: 25, chunkY: 1, summary: "central St Ann town" },
  { id: "moneague", name: "Moneague", chunkX: 26, chunkY: 1, summary: "highland town near the lake plain" },
  { id: "nine-mile", name: "Nine Mile", chunkX: 28, chunkY: 1, summary: "mountain community in St Ann" }
];

export const JAMAICAN_FOODS = [
  "ackee and saltfish",
  "jerk chicken",
  "jerk pork",
  "curry goat",
  "brown stew chicken",
  "oxtail",
  "stew peas",
  "rice and peas",
  "escovitch fish",
  "run down",
  "pepper shrimp",
  "mannish water",
  "red peas soup",
  "fish tea",
  "cow foot",
  "fricassee chicken",
  "roast fish",
  "salt mackerel",
  "saltfish fritters",
  "stamp and go",
  "bammy",
  "festival",
  "fried dumpling",
  "boiled green banana",
  "yellow yam",
  "coco",
  "dasheen",
  "breadfruit",
  "roasted breadfruit",
  "fried plantain",
  "callaloo",
  "callaloo and saltfish",
  "Jamaican patty",
  "coco bread",
  "hard dough bread",
  "bulla cake",
  "gizzada",
  "grater cake",
  "coconut drops",
  "peanut drops",
  "duckunoo",
  "sweet potato pudding",
  "cornmeal pudding",
  "black cake",
  "spice bun and cheese",
  "plantain tart",
  "blue drawers",
  "toto",
  "soursop",
  "guinep",
  "naseberry",
  "June plum",
  "Otaheite apple",
  "star apple",
  "jackfruit",
  "mango",
  "pawpaw",
  "guava",
  "sorrel drink",
  "ginger beer",
  "Irish moss",
  "Blue Mountain coffee"
] as const;

export const JAMAICAN_BIRDS = [
  "red-billed streamertail",
  "black-billed streamertail",
  "Jamaican mango",
  "Jamaican tody",
  "Jamaican woodpecker",
  "Jamaican owl",
  "Jamaican euphonia",
  "Jamaican vireo",
  "Jamaican becard",
  "Jamaican crow",
  "Jamaican blackbird",
  "Jamaican oriole",
  "Jamaican elaenia",
  "Jamaican pewee",
  "Jamaican spindalis",
  "Jamaican lizard cuckoo",
  "chestnut-bellied cuckoo",
  "crested quail-dove",
  "ring-tailed pigeon",
  "white-crowned pigeon",
  "Caribbean dove",
  "zenaida dove",
  "smooth-billed ani",
  "northern potoo",
  "American kestrel",
  "red-tailed hawk",
  "great egret",
  "cattle egret",
  "brown pelican",
  "magnificent frigatebird",
  "bananaquit",
  "yellow warbler",
  "great-tailed grackle",
  "loggerhead kingbird",
  "sad flycatcher",
  "vervain hummingbird"
] as const;

export const JAMAICAN_TREES = [
  "blue mahoe",
  "lignum vitae",
  "ackee",
  "breadfruit",
  "pimento",
  "coconut palm",
  "royal palm",
  "banana",
  "plantain",
  "mango",
  "guava",
  "soursop",
  "naseberry",
  "star apple",
  "June plum",
  "Otaheite apple",
  "tamarind",
  "cashew",
  "almond",
  "cedar",
  "Spanish elm",
  "guango",
  "cotton tree",
  "poui",
  "logwood",
  "fiddlewood",
  "bullet tree",
  "bamboo",
  "wild pine",
  "sea grape",
  "mahoe",
  "fig",
  "cocoa",
  "coffee",
  "sugarcane",
  "hibiscus"
] as const;

export function routeLocationForChunk(chunkX: number): StAnnRouteLocation {
  return ST_ANN_ROUTE_LOCATIONS.reduce((nearest, location) => (
    Math.abs(location.chunkX - chunkX) < Math.abs(nearest.chunkX - chunkX) ? location : nearest
  ), ST_ANN_ROUTE_LOCATIONS[0]);
}

export function routeLocationForWorld(worldX: number): StAnnRouteLocation {
  return routeLocationForChunk(Math.floor(worldX / CHUNK_SIZE));
}

export function routeWorldPoint(location: StAnnRouteLocation): { x: number; y: number } {
  return {
    x: location.chunkX * CHUNK_SIZE + CHUNK_SIZE / 2,
    y: parishRouteY(location.chunkX) * CHUNK_SIZE + CHUNK_SIZE / 2
  };
}

export function pickJamaicanFood(seed: string): string {
  return pickDeterministic(JAMAICAN_FOODS, seed);
}

export function pickJamaicanBird(seed: string): string {
  return pickDeterministic(JAMAICAN_BIRDS, seed);
}

export function pickJamaicanTree(seed: string): string {
  return pickDeterministic(JAMAICAN_TREES, seed);
}

export function sampleJamaicanFoods(seed: string, count: number): string[] {
  return sampleDeterministic(JAMAICAN_FOODS, seed, count);
}

export function sampleJamaicanTrees(seed: string, count: number): string[] {
  return sampleDeterministic(JAMAICAN_TREES, seed, count);
}

function sampleDeterministic<T extends string>(items: readonly T[], seed: string, count: number): T[] {
  const start = hash(seed) % items.length;
  const step = (hash(`${seed}:step`) % (items.length - 1)) + 1;
  const out: T[] = [];
  for (let i = 0; out.length < Math.min(count, items.length) && i < items.length * 2; i += 1) {
    const item = items[(start + i * step) % items.length];
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function pickDeterministic<T extends string>(items: readonly T[], seed: string): T {
  return items[hash(seed) % items.length];
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
