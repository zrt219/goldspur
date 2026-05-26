import { BiomeId, TileType } from "./ChunkTypes";
import { layeredNoise2D, valueNoise2D } from "./Noise";
import { parishForChunk } from "../data/jamaicaTravel";

export type BiomeDefinition = {
  id: BiomeId;
  label: string;
  baseTile: TileType;
  accentTiles: TileType[];
  treeDensity: number;
  rockDensity: number;
  flowerDensity: number;
  fenceDensity: number;
  waterDensity: number;
};

export const BIOMES: Record<BiomeId, BiomeDefinition> = {
  ranch_valley: {
    id: "ranch_valley",
    label: "Ranch Valley",
    baseTile: "grass_light",
    accentTiles: ["grass", "flowers", "grass_light"],
    treeDensity: 0.06,
    rockDensity: 0.025,
    flowerDensity: 0.2,
    fenceDensity: 0.08,
    waterDensity: 0.015
  },
  meadow: {
    id: "meadow",
    label: "Meadow",
    baseTile: "grass",
    accentTiles: ["grass_light", "flowers"],
    treeDensity: 0.04,
    rockDensity: 0.02,
    flowerDensity: 0.28,
    fenceDensity: 0.015,
    waterDensity: 0.035
  },
  forest: {
    id: "forest",
    label: "Forest",
    baseTile: "forest_floor",
    accentTiles: ["grass_dark", "grass", "stone"],
    treeDensity: 0.18,
    rockDensity: 0.07,
    flowerDensity: 0.035,
    fenceDensity: 0.005,
    waterDensity: 0.02
  },
  creek: {
    id: "creek",
    label: "Creek",
    baseTile: "grass_dark",
    accentTiles: ["mud", "shallow_water", "water"],
    treeDensity: 0.09,
    rockDensity: 0.045,
    flowerDensity: 0.07,
    fenceDensity: 0.005,
    waterDensity: 0.18
  },
  hills: {
    id: "hills",
    label: "Hills",
    baseTile: "grass_dark",
    accentTiles: ["stone", "grass", "dirt"],
    treeDensity: 0.08,
    rockDensity: 0.16,
    flowerDensity: 0.035,
    fenceDensity: 0.015,
    waterDensity: 0.01
  },
  race_plains: {
    id: "race_plains",
    label: "Race Plains",
    baseTile: "grass_light",
    accentTiles: ["grass", "flowers", "sand"],
    treeDensity: 0.025,
    rockDensity: 0.015,
    flowerDensity: 0.08,
    fenceDensity: 0.055,
    waterDensity: 0.008
  },
  steer_town_groves: {
    id: "steer_town_groves",
    label: "Steer Town Groves",
    baseTile: "grass_light",
    accentTiles: ["grass", "flowers", "dirt"],
    treeDensity: 0.11,
    rockDensity: 0.018,
    flowerDensity: 0.18,
    fenceDensity: 0.06,
    waterDensity: 0.018
  },
  ocho_rios_cove: {
    id: "ocho_rios_cove",
    label: "Ocho Rios Cove",
    baseTile: "grass",
    accentTiles: ["sand", "shallow_water", "flowers"],
    treeDensity: 0.075,
    rockDensity: 0.035,
    flowerDensity: 0.12,
    fenceDensity: 0.02,
    waterDensity: 0.095
  },
  runaway_bay_scrub: {
    id: "runaway_bay_scrub",
    label: "Runaway Bay Scrub",
    baseTile: "grass_light",
    accentTiles: ["sand", "grass", "dirt"],
    treeDensity: 0.045,
    rockDensity: 0.045,
    flowerDensity: 0.09,
    fenceDensity: 0.025,
    waterDensity: 0.035
  },
  discovery_bay_limestone: {
    id: "discovery_bay_limestone",
    label: "Discovery Bay Limestone",
    baseTile: "grass_dark",
    accentTiles: ["stone", "sand", "dirt"],
    treeDensity: 0.055,
    rockDensity: 0.17,
    flowerDensity: 0.045,
    fenceDensity: 0.012,
    waterDensity: 0.025
  },
  discovery_bay_coast: {
    id: "discovery_bay_coast",
    label: "Discovery Bay Coast",
    baseTile: "sand",
    accentTiles: ["shallow_water", "grass_light", "flowers"],
    treeDensity: 0.035,
    rockDensity: 0.025,
    flowerDensity: 0.075,
    fenceDensity: 0.01,
    waterDensity: 0.13
  },
  north_coast_parish: {
    id: "north_coast_parish",
    label: "North Coast Parish Shore",
    baseTile: "grass_light",
    accentTiles: ["sand", "grass", "flowers"],
    treeDensity: 0.06,
    rockDensity: 0.035,
    flowerDensity: 0.1,
    fenceDensity: 0.025,
    waterDensity: 0.075
  },
  western_parish_beach: {
    id: "western_parish_beach",
    label: "Western Parish Beach",
    baseTile: "sand",
    accentTiles: ["grass_light", "shallow_water", "flowers"],
    treeDensity: 0.04,
    rockDensity: 0.03,
    flowerDensity: 0.08,
    fenceDensity: 0.018,
    waterDensity: 0.12
  },
  south_coast_parish: {
    id: "south_coast_parish",
    label: "South Coast Parish Fields",
    baseTile: "grass_light",
    accentTiles: ["dirt", "sand", "grass"],
    treeDensity: 0.05,
    rockDensity: 0.055,
    flowerDensity: 0.07,
    fenceDensity: 0.045,
    waterDensity: 0.045
  },
  kingston_harbour: {
    id: "kingston_harbour",
    label: "Kingston Harbour Shore",
    baseTile: "sand",
    accentTiles: ["stone", "dirt", "shallow_water"],
    treeDensity: 0.03,
    rockDensity: 0.08,
    flowerDensity: 0.035,
    fenceDensity: 0.05,
    waterDensity: 0.11
  },
  blue_mountain_parish: {
    id: "blue_mountain_parish",
    label: "Blue Mountain Parish Edge",
    baseTile: "grass_dark",
    accentTiles: ["forest_floor", "mud", "flowers"],
    treeDensity: 0.13,
    rockDensity: 0.07,
    flowerDensity: 0.08,
    fenceDensity: 0.018,
    waterDensity: 0.09
  }
};

export function biomeLabel(biome: BiomeId): string {
  return BIOMES[biome].label;
}

export function selectBiome(seed: string, chunkX: number, chunkY: number): BiomeId {
  const distanceFromSpawn = Math.hypot(chunkX, chunkY);
  if (distanceFromSpawn <= 1.25) return "ranch_valley";

  const routeRegion = selectParishRouteRegion(seed, chunkX, chunkY);
  if (routeRegion) return routeRegion;
  const travelParish = parishForChunk(chunkX, chunkY);
  if (travelParish) return travelParish.biome;

  const warpX = chunkX + (valueNoise2D(seed, chunkX, chunkY, 23, "biome-warp-x") - 0.5) * 18;
  const warpY = chunkY + (valueNoise2D(seed, chunkX - 17, chunkY + 9, 23, "biome-warp-y") - 0.5) * 18;
  const moisture = valueNoise2D(seed, warpX, warpY, 5.8, "moisture");
  const terrain = layeredNoise2D(seed, warpX, warpY, "terrain");
  const openness = valueNoise2D(seed, warpX + 18.5, warpY - 7.25, 7.2, "openness");
  const canopy = layeredNoise2D(seed, warpX - 31.25, warpY + 14.5, "canopy");

  if (moisture > 0.8 && terrain < 0.72) return "creek";
  if (terrain > 0.78) return "hills";
  if (openness > 0.76 && canopy < 0.62) return "race_plains";
  if (canopy > 0.62 || (terrain < 0.34 && moisture > 0.32)) return "forest";
  return "meadow";
}

export function parishRouteY(chunkX: number): number {
  return Math.round(Math.sin(chunkX / 2.3) * 1.35 + Math.sin((chunkX + 3) / 5.1) * 0.85);
}

export function routeDistance(chunkX: number, chunkY: number): number {
  return Math.abs(chunkY - parishRouteY(chunkX));
}

export function selectParishRouteRegion(seed: string, chunkX: number, chunkY: number): BiomeId | undefined {
  if (chunkX < -2 || chunkX > 28 || routeDistance(chunkX, chunkY) > 2) return undefined;

  const coastalPocket = valueNoise2D(seed, chunkX + 7, chunkY - 11, 3.8, "parish-coast") > 0.72;
  if (chunkX <= 3) return "steer_town_groves";
  if (chunkX <= 8) return coastalPocket ? "ocho_rios_cove" : "steer_town_groves";
  if (chunkX <= 14) return coastalPocket ? "ocho_rios_cove" : "runaway_bay_scrub";
  if (chunkX <= 21) return "discovery_bay_limestone";
  return "discovery_bay_coast";
}
