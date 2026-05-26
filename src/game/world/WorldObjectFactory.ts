import Phaser from "phaser";
import { Palette } from "../art/Palette";
import { WorldObjectData } from "./ChunkTypes";

export type ObjectRenderSpec = {
  texture?: string;
  width: number;
  height: number;
  tint?: number;
  depthOffset: number;
};

export function objectRenderSpec(object: WorldObjectData): ObjectRenderSpec {
  if (isWildlifeSpawn(object.type)) return { width: 1, height: 1, depthOffset: 0 };
  if (object.type === "tree") {
    return {
      texture: object.variant % 2 === 0 ? "tree_large" : "tree_small",
      width: object.variant % 2 === 0 ? 112 : 82,
      height: object.variant % 2 === 0 ? 108 : 84,
      depthOffset: 38
    };
  }
  if (object.type === "rock") return { texture: "world_rock", width: 52, height: 36, depthOffset: 16 };
  if (object.type === "rock_cluster") return { texture: "world_rock", width: 74, height: 50, depthOffset: 18 };
  if (object.type === "flower_patch") return { texture: "world_flowers", width: 58, height: 34, depthOffset: 6 };
  if (object.type === "bush") return { texture: "world_bush", width: 66, height: 52, depthOffset: 12 };
  if (object.type === "tall_grass" || object.type === "tall_grass_graze_patch") return { texture: "world_tall_grass", width: 72, height: 50, depthOffset: 7 };
  if (object.type === "stump") return { texture: "world_stump", width: 54, height: 44, depthOffset: 13 };
  if (object.type === "reeds") return { texture: "world_reeds", width: 62, height: 52, depthOffset: 8 };
  if (object.type === "berry_bush") return { texture: "world_berries", width: 62, height: 48, depthOffset: 10 };
  if (object.type === "mushroom_patch") return { texture: "world_mushrooms", width: 54, height: 42, depthOffset: 6 };
  if (object.type === "herb_patch") return { texture: "world_herbs", width: 52, height: 42, depthOffset: 6 };
  if (object.type === "wild_apple_tree") return { texture: "world_apple_tree", width: 94, height: 90, depthOffset: 34 };
  if (object.type === "banana_patch") return { texture: "world_banana_patch", width: 88, height: 72, depthOffset: 14 };
  if (object.type === "hibiscus_bush") return { texture: "world_hibiscus_bush", width: 68, height: 52, depthOffset: 12 };
  if (object.type === "palm_cluster") return { texture: "world_palm_cluster", width: 112, height: 124, depthOffset: 46 };
  if (object.type === "coconut_pile") return { texture: "world_coconut_pile", width: 48, height: 36, depthOffset: 8 };
  if (object.type === "sugarcane_patch") return { texture: "world_sugarcane_patch", width: 78, height: 64, depthOffset: 9 };
  if (object.type === "limestone_outcrop") return { texture: "world_limestone_outcrop", width: 80, height: 58, depthOffset: 18 };
  if (object.type === "breadfruit_tree") return { texture: "world_breadfruit_tree", width: 96, height: 96, depthOffset: 36 };
  if (object.type === "rain_puddle") return { texture: "world_rain_puddle", width: 72, height: 28, depthOffset: 2 };
  if (object.type === "fence") {
    return {
      texture: object.variant % 2 === 0 ? "fence_horizontal" : "fence_vertical",
      width: object.variant % 2 === 0 ? 96 : 44,
      height: object.variant % 2 === 0 ? 44 : 96,
      depthOffset: 12
    };
  }
  if (object.type === "barrel") return { texture: "world_barrel", width: 34, height: 42, depthOffset: 18 };
  if (object.type === "sign") return { texture: "sign_small", width: 112, height: 72, depthOffset: 24 };
  if (object.type === "route_marker") return { texture: "sign_wide", width: 138, height: 66, depthOffset: 22 };
  if (object.type === "beach_palms") return { texture: "world_palm_cluster", width: 98, height: 118, tint: 0x9bc66c, depthOffset: 42 };
  if (object.type === "market_stall" || object.type === "fruit_stand") return { texture: "world_market_stall", width: 128, height: 76, tint: object.type === "fruit_stand" ? 0xffd177 : undefined, depthOffset: 24 };
  if (object.type === "parish_caretaker") return { texture: "world_parish_caretaker", width: 58, height: 58, depthOffset: 24 };
  if (object.type === "fishing_boat") return { texture: "world_fishing_boat", width: 126, height: 58, depthOffset: 10 };
  if (object.type === "jerk_drum") return { texture: "world_jerk_drum", width: 48, height: 52, depthOffset: 18 };
  if (object.type === "pond_edge" || object.type === "pond") return { texture: "world_pond_edge", width: 92, height: 54, depthOffset: 4 };
  if (object.type === "log" || object.type === "fallen_log") return { texture: "world_log", width: 74, height: 36, depthOffset: 10 };
  if (object.type === "goat_spawn") return { texture: "world_goat", width: 58, height: 42, depthOffset: 8 };
  if (object.type === "mongoose_spawn") return { texture: "world_mongoose", width: 52, height: 25, depthOffset: 7 };
  if (object.type === "frigatebird_spawn") return { texture: "world_frigatebird", width: 58, height: 34, depthOffset: 38 };
  if (object.type === "pelican_spawn") return { texture: "world_pelican", width: 66, height: 42, depthOffset: 32 };
  if (object.type === "wild_horse") return { texture: "ambient_horse_idle", width: 76, height: 76, depthOffset: 25 };
  return { texture: "sign_wide", width: 150, height: 78, depthOffset: 24 };
}

export function createFallbackObject(scene: Phaser.Scene, object: WorldObjectData): Phaser.GameObjects.GameObject {
  const radius = object.type === "rock" ? 18 : 24;
  const color = object.type === "pond_edge" ? 0x357986 : object.type === "flower_patch" ? 0xe7b4cb : Palette.wood;
  return scene.add.ellipse(object.x, object.y, radius * 2, radius, color, 0.9)
    .setStrokeStyle(2, Palette.woodDark, 0.7);
}

export function isWildlifeSpawn(type: WorldObjectData["type"]): boolean {
  return type === "rabbit_spawn"
    || type === "snake_spawn"
    || type === "coyote_spawn"
    || type === "bird_spawn"
    || type === "goat_spawn"
    || type === "mongoose_spawn"
    || type === "frigatebird_spawn"
    || type === "pelican_spawn";
}
