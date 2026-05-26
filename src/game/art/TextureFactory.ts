import Phaser from "phaser";
import { Palette } from "./Palette";

type BuildingOptions = {
  key: string;
  roof: number;
  wall: number;
  width: number;
  height: number;
  sign?: string;
  logStyle?: boolean;
};

export function createGameTextures(scene: Phaser.Scene): void {
  grassTile(scene);
  dirtTile(scene);
  waterTile(scene);
  stoneTile(scene);
  worldFlowers(scene);
  worldRock(scene);
  worldLog(scene);
  worldBarrel(scene);
  worldPondEdge(scene);
  worldBush(scene);
  worldTallGrass(scene);
  worldStump(scene);
  worldReeds(scene);
  worldBerries(scene);
  worldMushrooms(scene);
  worldHerbs(scene);
  worldAppleTree(scene);
  worldBananaPatch(scene);
  worldHibiscusBush(scene);
  worldPalmCluster(scene);
  worldCoconutPile(scene);
  worldSugarcanePatch(scene);
  worldLimestoneOutcrop(scene);
  worldBreadfruitTree(scene);
  worldRainPuddle(scene);
  worldMarketStall(scene);
  worldFishingBoat(scene);
  playerBoat(scene);
  worldJerkDrum(scene);
  worldParishCaretaker(scene);
  inventoryIcons(scene);
  weatherTextures(scene);
  wildlifeTextures(scene);
  mountedHitbox(scene);
  pathSegment(scene);
  tree(scene, "tree_large", 156, 150);
  tree(scene, "tree_small", 116, 118);
  fence(scene, "fence_horizontal", false);
  fence(scene, "fence_vertical", true);
  sign(scene, "sign_small", 150, 96);
  sign(scene, "sign_wide", 220, 104);
  rider(scene);
  horse(scene);
  panelDark(scene);
  buttonDark(scene);
  building(scene, { key: "ranch_main_building", roof: Palette.greenRoof, wall: 0x845229, width: 320, height: 188, sign: "Goldspur Valley Ranch" });
  building(scene, { key: "cozy_stable_building", roof: Palette.redRoof, wall: 0x87512a, width: 210, height: 150, sign: "Cozy Stable" });
  building(scene, { key: "speed_barn_building", roof: Palette.blueRoof, wall: 0x8a3f24, width: 220, height: 158, sign: "Speed Barn" });
  building(scene, { key: "nature_cabin_building", roof: Palette.greenRoof, wall: 0x744a25, width: 210, height: 150, sign: "Nature Cabin", logStyle: true });

  alias(scene, "tex_grass", "grass_tile");
  alias(scene, "tex_dirt", "dirt_tile");
  alias(scene, "tex_tree", "tree_large");
  alias(scene, "tex_fence", "fence_horizontal");
  alias(scene, "tex_sign", "sign_wide");
  alias(scene, "placeholder_rider", "rider_placeholder");
  alias(scene, "placeholder_horse", "horse_placeholder");
  alias(scene, "building_stable", "ranch_main_building");
  alias(scene, "building_cozy", "cozy_stable_building");
  alias(scene, "building_barn", "speed_barn_building");
  alias(scene, "building_cabin", "nature_cabin_building");
}

function waterTile(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_water")) return;
  const g = scene.add.graphics();
  g.fillStyle(0x3f889b, 1).fillRect(0, 0, 96, 96);
  g.fillStyle(0x75bdd0, 0.28);
  for (let i = 0; i < 14; i += 1) {
    g.fillRoundedRect((i * 31) % 96, (i * 47) % 96, 20 + (i % 4) * 4, 2, 2);
  }
  g.fillStyle(0x224d57, 0.22).fillEllipse(48, 48, 82, 70);
  g.generateTexture("world_water", 96, 96);
  g.destroy();
}

function stoneTile(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_stone")) return;
  const g = scene.add.graphics();
  g.fillStyle(0x9b968c, 1).fillRect(0, 0, 96, 96);
  for (let i = 0; i < 18; i += 1) {
    g.fillStyle(i % 2 ? 0x756f67 : 0xc2b9a7, 0.35).fillEllipse((i * 37) % 96, (i * 19) % 96, 10 + (i % 4), 6 + (i % 3));
  }
  g.generateTexture("world_stone", 96, 96);
  g.destroy();
}

function worldFlowers(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_flowers")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.18).fillEllipse(48, 48, 70, 20);
  for (let i = 0; i < 24; i += 1) {
    const x = 18 + (i * 19) % 58;
    const y = 32 + (i * 29) % 28;
    g.fillStyle(i % 3 === 0 ? 0xe7a5bf : i % 3 === 1 ? 0xf0dd73 : 0xf5e6b8, 0.95).fillCircle(x, y, 2);
    g.fillStyle(Palette.grassLight, 0.75).fillRect(x, y + 2, 1, 5);
  }
  g.generateTexture("world_flowers", 96, 76);
  g.destroy();
}

function worldRock(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_rock")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.24).fillEllipse(48, 56, 62, 16);
  g.fillStyle(0x78736c, 1).fillEllipse(44, 40, 50, 30);
  g.fillStyle(0xa79f91, 1).fillEllipse(54, 35, 36, 24);
  g.lineStyle(2, 0x524d47, 0.7).strokeEllipse(44, 40, 50, 30);
  g.generateTexture("world_rock", 96, 76);
  g.destroy();
}

function worldLog(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_log")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.22).fillEllipse(50, 52, 72, 14);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(18, 31, 62, 18, 9);
  g.lineStyle(2, Palette.woodDark, 0.8).strokeRoundedRect(18, 31, 62, 18, 9);
  g.lineStyle(1, Palette.woodDark, 0.55).lineBetween(26, 37, 72, 36).lineBetween(28, 43, 70, 44);
  g.fillStyle(0xbe8548, 1).fillEllipse(21, 40, 14, 18);
  g.generateTexture("world_log", 96, 76);
  g.destroy();
}

function worldBarrel(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_barrel")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.22).fillEllipse(48, 62, 34, 12);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(34, 24, 28, 38, 8);
  g.lineStyle(2, Palette.woodDark, 1).strokeRoundedRect(34, 24, 28, 38, 8);
  g.lineStyle(2, Palette.goldDark, 0.9).lineBetween(36, 35, 60, 35).lineBetween(36, 51, 60, 51);
  g.generateTexture("world_barrel", 96, 76);
  g.destroy();
}

function worldPondEdge(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_pond_edge")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.16).fillEllipse(48, 50, 88, 34);
  g.fillStyle(0x2f6f81, 1).fillEllipse(48, 42, 76, 36);
  g.fillStyle(0x76bdd1, 0.55).fillEllipse(40, 36, 36, 10);
  g.fillStyle(0x56683a, 1).fillCircle(22, 47, 7).fillCircle(74, 42, 6);
  g.generateTexture("world_pond_edge", 96, 76);
  g.destroy();
}

function worldBush(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_bush")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.2).fillEllipse(50, 62, 78, 16);
  g.fillStyle(0x214f28, 1).fillCircle(30, 42, 18).fillCircle(48, 34, 22).fillCircle(66, 44, 18).fillCircle(48, 52, 24);
  g.fillStyle(Palette.grassLight, 0.5).fillCircle(41, 30, 9).fillCircle(61, 40, 8);
  g.generateTexture("world_bush", 96, 76);
  g.destroy();
}

function worldTallGrass(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_tall_grass")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.14).fillEllipse(48, 62, 82, 12);
  for (let i = 0; i < 22; i += 1) {
    const x = 16 + (i * 11) % 64;
    const y = 38 + (i * 7) % 20;
    g.lineStyle(2, i % 2 ? Palette.grassLight : Palette.grassDark, 0.9).lineBetween(x, y + 16, x + (i % 3) - 1, y);
  }
  g.generateTexture("world_tall_grass", 96, 76);
  g.destroy();
}

function worldStump(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_stump")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.2).fillEllipse(48, 58, 48, 13);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(33, 31, 30, 27, 7);
  g.fillStyle(0xbe8548, 1).fillEllipse(48, 31, 32, 18);
  g.lineStyle(2, Palette.woodDark, 0.85).strokeEllipse(48, 31, 32, 18);
  g.lineStyle(1, Palette.goldDark, 0.7).strokeEllipse(48, 31, 19, 10);
  g.generateTexture("world_stump", 96, 76);
  g.destroy();
}

function worldReeds(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_reeds")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.15).fillEllipse(48, 62, 74, 12);
  for (let i = 0; i < 13; i += 1) {
    const x = 20 + (i * 17) % 56;
    const h = 22 + (i % 4) * 5;
    g.lineStyle(2, 0x496a35, 0.9).lineBetween(x, 58, x + (i % 3) - 1, 58 - h);
    if (i % 3 === 0) g.fillStyle(0x8b5b35, 1).fillEllipse(x, 56 - h, 4, 12);
  }
  g.generateTexture("world_reeds", 96, 76);
  g.destroy();
}

function worldBerries(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_berries")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.18).fillEllipse(48, 62, 72, 14);
  g.fillStyle(0x28592c, 1).fillCircle(34, 44, 17).fillCircle(52, 38, 19).fillCircle(66, 47, 16);
  for (let i = 0; i < 13; i += 1) g.fillStyle(i % 2 ? 0x8c2240 : 0xbe2d5a, 1).fillCircle(29 + (i * 13) % 41, 33 + (i * 19) % 26, 2.3);
  g.generateTexture("world_berries", 96, 76);
  g.destroy();
}

function worldMushrooms(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_mushrooms")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.14).fillEllipse(48, 62, 58, 10);
  for (let i = 0; i < 6; i += 1) {
    const x = 27 + i * 8;
    const y = 45 + (i % 2) * 6;
    g.fillStyle(0xf5e6b8, 1).fillRoundedRect(x, y, 5, 14, 2);
    g.fillStyle(i % 2 ? 0xc95f4c : 0xd88b4a, 1).fillEllipse(x + 2, y, 14, 8);
  }
  g.generateTexture("world_mushrooms", 96, 76);
  g.destroy();
}

function worldHerbs(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_herbs")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.12).fillEllipse(48, 62, 60, 10);
  for (let i = 0; i < 15; i += 1) {
    const x = 25 + (i * 9) % 45;
    const y = 56 - (i % 5) * 4;
    g.lineStyle(2, 0x79a95b, 1).lineBetween(x, 60, x + (i % 3) - 1, y);
    g.fillStyle(0xbfd68a, 0.8).fillEllipse(x + 2, y + 2, 5, 3);
  }
  g.generateTexture("world_herbs", 96, 76);
  g.destroy();
}

function worldAppleTree(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_apple_tree")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.28).fillEllipse(58, 108, 100, 21);
  g.fillStyle(0x5a3519, 1).fillRoundedRect(49, 58, 18, 48, 7);
  g.fillStyle(0x244d28, 1).fillCircle(36, 49, 27).fillCircle(62, 36, 31).fillCircle(84, 55, 27).fillCircle(59, 64, 34);
  for (let i = 0; i < 9; i += 1) g.fillStyle(0xd34c36, 1).fillCircle(37 + (i * 17) % 43, 34 + (i * 23) % 37, 3);
  g.generateTexture("world_apple_tree", 128, 122);
  g.destroy();
}

function worldBananaPatch(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_banana_patch")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.22).fillEllipse(60, 90, 104, 18);
  for (let i = 0; i < 5; i += 1) {
    const x = 28 + i * 16;
    const h = 42 + (i % 3) * 8;
    g.fillStyle(0x5e3a1e, 1).fillRoundedRect(x - 3, 78 - h * 0.35, 7, h * 0.55, 3);
    g.fillStyle(0x4f8f36, 1).fillEllipse(x - 11, 66 - h * 0.32, 17, h);
    g.fillStyle(0x6fbf4d, 1).fillEllipse(x + 10, 64 - h * 0.34, 18, h + 8);
    g.fillStyle(0xf0d867, 1).fillEllipse(x + 6, 72 - h * 0.18, 5, 17);
  }
  g.generateTexture("world_banana_patch", 128, 104);
  g.destroy();
}

function worldHibiscusBush(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_hibiscus_bush")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.18).fillEllipse(49, 64, 80, 14);
  g.fillStyle(0x245a2d, 1).fillCircle(30, 45, 18).fillCircle(49, 35, 23).fillCircle(68, 47, 18).fillCircle(49, 55, 23);
  for (let i = 0; i < 11; i += 1) {
    const x = 24 + (i * 19) % 50;
    const y = 30 + (i * 23) % 28;
    g.fillStyle(i % 2 ? 0xef5576 : 0xf5d261, 1).fillCircle(x, y, 4);
    g.fillStyle(0xf7e7a4, 0.88).fillCircle(x + 1, y - 1, 1.5);
  }
  g.generateTexture("world_hibiscus_bush", 96, 76);
  g.destroy();
}

function worldPalmCluster(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_palm_cluster")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.26).fillEllipse(74, 134, 126, 22);
  for (let i = 0; i < 3; i += 1) {
    const x = 52 + i * 22;
    const topY = 38 + (i % 2) * 12;
    g.lineStyle(13 - i, 0x7a4f2a, 1).lineBetween(x, 130, x + (i - 1) * 11, topY);
    for (let leaf = 0; leaf < 7; leaf += 1) {
      const angle = -2.45 + leaf * 0.82;
      const dx = Math.cos(angle) * (34 + (leaf % 2) * 12);
      const dy = Math.sin(angle) * 18;
      g.lineStyle(9, leaf % 2 ? 0x3d7b39 : 0x5ca447, 1).lineBetween(x + (i - 1) * 11, topY, x + (i - 1) * 11 + dx, topY + dy);
    }
    g.fillStyle(0x5b351b, 1).fillCircle(x + (i - 1) * 11 + 8, topY + 6, 4).fillCircle(x + (i - 1) * 11 - 5, topY + 7, 4);
  }
  g.generateTexture("world_palm_cluster", 148, 150);
  g.destroy();
}

function worldCoconutPile(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_coconut_pile")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.18).fillEllipse(48, 60, 58, 12);
  for (let i = 0; i < 8; i += 1) {
    const x = 29 + (i * 13) % 39;
    const y = 40 + (i * 17) % 17;
    g.fillStyle(i % 2 ? 0x6b4a28 : 0x8b6339, 1).fillCircle(x, y, 8);
    g.fillStyle(0x2b1b10, 0.45).fillCircle(x - 2, y - 2, 1.5);
  }
  g.generateTexture("world_coconut_pile", 96, 76);
  g.destroy();
}

function worldSugarcanePatch(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_sugarcane_patch")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.16).fillEllipse(58, 78, 98, 13);
  for (let i = 0; i < 18; i += 1) {
    const x = 16 + (i * 11) % 84;
    const h = 36 + (i % 4) * 8;
    g.lineStyle(3, i % 2 ? 0x7aa64b : 0xa7c66b, 1).lineBetween(x, 76, x + (i % 3) - 1, 76 - h);
    g.lineStyle(2, 0x496a35, 0.65).lineBetween(x, 62 - h * 0.45, x + 11, 54 - h * 0.55);
  }
  g.generateTexture("world_sugarcane_patch", 116, 88);
  g.destroy();
}

function worldLimestoneOutcrop(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_limestone_outcrop")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.24).fillEllipse(56, 70, 92, 16);
  g.fillStyle(0x8f8b7e, 1).fillEllipse(42, 48, 44, 32).fillEllipse(65, 42, 54, 39).fillEllipse(82, 55, 32, 25);
  g.fillStyle(0xc8c0a9, 0.8).fillEllipse(59, 34, 35, 14).fillEllipse(31, 43, 21, 9);
  g.lineStyle(2, 0x5f5a50, 0.65).lineBetween(43, 35, 35, 59).lineBetween(66, 29, 72, 61).lineBetween(84, 47, 96, 61);
  g.generateTexture("world_limestone_outcrop", 116, 86);
  g.destroy();
}

function worldBreadfruitTree(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_breadfruit_tree")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.28).fillEllipse(62, 112, 108, 22);
  g.fillStyle(0x5d3a1f, 1).fillRoundedRect(53, 58, 18, 52, 7);
  g.fillStyle(0x23552c, 1).fillCircle(37, 52, 30).fillCircle(63, 38, 35).fillCircle(91, 55, 28).fillCircle(63, 69, 37);
  g.fillStyle(0x70a94f, 0.62).fillEllipse(49, 42, 18, 11).fillEllipse(77, 51, 19, 12).fillEllipse(60, 72, 21, 12);
  for (let i = 0; i < 5; i += 1) g.fillStyle(0xa7bc6f, 1).fillCircle(44 + (i * 17) % 39, 48 + (i * 21) % 34, 4);
  g.generateTexture("world_breadfruit_tree", 128, 126);
  g.destroy();
}

function worldRainPuddle(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_rain_puddle")) return;
  const g = scene.add.graphics();
  g.fillStyle(0x17495a, 0.28).fillEllipse(48, 49, 82, 26);
  g.fillStyle(0x77bfd1, 0.35).fillEllipse(38, 43, 35, 8);
  g.lineStyle(2, 0x2d7183, 0.4).strokeEllipse(48, 49, 82, 26);
  g.generateTexture("world_rain_puddle", 96, 76);
  g.destroy();
}

function worldMarketStall(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_market_stall")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.24).fillEllipse(70, 78, 120, 18);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(24, 40, 92, 40, 5);
  g.fillStyle(0xb65b3b, 1).fillTriangle(16, 42, 70, 12, 124, 42);
  g.fillStyle(0xf3cf74, 1).fillTriangle(29, 42, 70, 20, 111, 42);
  g.lineStyle(3, Palette.woodDark, 1).strokeTriangle(16, 42, 70, 12, 124, 42);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(30, 56, 80, 15, 4);
  for (let i = 0; i < 9; i += 1) {
    g.fillStyle(i % 2 ? 0xd64c34 : 0xf0d45b, 1).fillCircle(38 + i * 8, 52 + (i % 2) * 3, 4);
  }
  g.generateTexture("world_market_stall", 140, 92);
  g.destroy();
}

function worldFishingBoat(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_fishing_boat")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.2).fillEllipse(70, 65, 116, 16);
  g.fillStyle(0x396f83, 1).fillTriangle(12, 43, 126, 43, 104, 72).fillTriangle(12, 43, 38, 72, 104, 72);
  g.fillStyle(0xe9f1d5, 1).fillTriangle(62, 42, 62, 7, 91, 40);
  g.fillStyle(0xe0bf63, 1).fillRoundedRect(34, 35, 44, 10, 4);
  g.lineStyle(3, 0x234653, 1).lineBetween(12, 43, 126, 43).lineBetween(38, 72, 104, 72);
  g.lineStyle(2, 0x6c4a28, 1).lineBetween(62, 42, 62, 8);
  g.generateTexture("world_fishing_boat", 140, 84);
  g.destroy();
}

function playerBoat(scene: Phaser.Scene): void {
  if (scene.textures.exists("player_boat")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.22).fillEllipse(76, 78, 130, 18);
  g.fillStyle(0x315f75, 1).fillTriangle(12, 46, 140, 46, 112, 82).fillTriangle(12, 46, 43, 82, 112, 82);
  g.fillStyle(0x183a45, 0.72).fillTriangle(22, 50, 129, 50, 108, 74).fillTriangle(22, 50, 46, 74, 108, 74);
  g.fillStyle(0xf5e6b8, 1).fillTriangle(72, 43, 72, 7, 113, 42);
  g.fillStyle(0xd4af37, 1).fillRoundedRect(36, 42, 55, 12, 5);
  g.lineStyle(3, 0x102830, 1).lineBetween(12, 46, 140, 46).lineBetween(43, 82, 112, 82).lineBetween(12, 46, 43, 82).lineBetween(140, 46, 112, 82);
  g.lineStyle(2, Palette.woodDark, 1).lineBetween(72, 45, 72, 8).lineBetween(48, 33, 17, 20).lineBetween(103, 37, 133, 20);
  g.fillStyle(0x7a4f2a, 1).fillRoundedRect(18, 18, 38, 4, 2).fillRoundedRect(98, 18, 38, 4, 2);
  g.generateTexture("player_boat", 152, 98);
  g.destroy();
}

function worldJerkDrum(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_jerk_drum")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.22).fillEllipse(48, 66, 38, 12);
  g.fillStyle(0x242424, 1).fillRoundedRect(32, 28, 32, 38, 9);
  g.lineStyle(2, 0xb64b35, 1).strokeRoundedRect(32, 28, 32, 38, 9);
  g.fillStyle(0xb64b35, 1).fillEllipse(48, 28, 33, 10);
  g.fillStyle(0xf0d45b, 0.9).fillCircle(59, 39, 4);
  g.fillStyle(0xcbd3ce, 0.45).fillEllipse(57, 18, 26, 10).fillEllipse(67, 12, 18, 8);
  g.generateTexture("world_jerk_drum", 96, 78);
  g.destroy();
}

function worldParishCaretaker(scene: Phaser.Scene): void {
  if (scene.textures.exists("world_parish_caretaker")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.22).fillEllipse(44, 76, 52, 13);
  g.fillStyle(0x244d6f, 1).fillRoundedRect(27, 33, 34, 36, 8);
  g.fillStyle(0xf8dd91, 1).fillRoundedRect(24, 31, 40, 8, 4);
  g.fillStyle(0xb8783e, 1).fillCircle(44, 22, 13);
  g.fillStyle(0x4a2a14, 1).fillEllipse(44, 9, 42, 10).fillRoundedRect(34, 7, 20, 9, 3);
  g.fillStyle(0x15100a, 1).fillCircle(49, 20, 1.8);
  g.fillStyle(0x2a1a0e, 1).fillRect(31, 66, 8, 20).fillRect(50, 66, 8, 20);
  g.fillStyle(0x7a4a24, 1).fillRoundedRect(60, 45, 24, 9, 4);
  g.lineStyle(3, 0x15100a, 0.9).strokeRoundedRect(27, 33, 34, 36, 8);
  g.generateTexture("world_parish_caretaker", 96, 96);
  g.destroy();
}

function inventoryIcons(scene: Phaser.Scene): void {
  inventoryIcon(scene, "inventory_carrots", (g) => {
    for (let i = 0; i < 3; i += 1) {
      const x = 32 + i * 11;
      g.fillStyle(0xe77929, 1).fillTriangle(x, 64, x + 22, 22 + i * 3, x + 31, 72);
      g.lineStyle(2, 0x8f3e17, 0.55).lineBetween(x + 10, 54, x + 24, 42);
      g.fillStyle(0x3f8a37, 1).fillTriangle(x + 20, 24, x + 12, 8, x + 29, 20).fillTriangle(x + 23, 25, x + 31, 7, x + 35, 24);
    }
  });
  inventoryIcon(scene, "inventory_hay", (g) => {
    g.fillStyle(0xe8c75b, 1).fillRoundedRect(18, 32, 62, 38, 7);
    g.lineStyle(4, 0x8b5b35, 0.95).lineBetween(30, 32, 30, 70).lineBetween(66, 32, 66, 70);
    for (let i = 0; i < 8; i += 1) g.lineStyle(2, 0xf8dd91, 0.65).lineBetween(21, 38 + i * 4, 77, 35 + i * 5);
  });
  inventoryIcon(scene, "inventory_bucket", (g) => {
    g.fillStyle(0xaeb8bd, 1).fillRoundedRect(25, 34, 46, 39, 8);
    g.fillStyle(0x6fb5c8, 1).fillEllipse(48, 37, 43, 14);
    g.lineStyle(4, 0x667278, 1).strokeRoundedRect(25, 34, 46, 39, 8).lineBetween(31, 34, 40, 16).lineBetween(65, 34, 56, 16);
  });
  inventoryIcon(scene, "inventory_horseshoe", (g) => {
    g.lineStyle(12, 0xb8b2a8, 1).strokeCircle(48, 48, 28);
    g.fillStyle(0x000000, 0).fillRect(0, 0, 1, 1);
    g.fillStyle(0x15100a, 1).fillRect(14, 40, 68, 42);
    g.lineStyle(3, 0x5e5952, 1).lineBetween(22, 70, 35, 70).lineBetween(61, 70, 74, 70);
    for (let i = 0; i < 6; i += 1) g.fillStyle(0x5e5952, 1).fillCircle(31 + (i % 3) * 17, 35 + Math.floor(i / 3) * 17, 2.3);
  });
  inventoryIcon(scene, "inventory_brush", (g) => {
    g.fillStyle(0x7a4a24, 1).fillRoundedRect(18, 42, 58, 18, 8);
    g.fillStyle(0xf5e6b8, 1).fillRoundedRect(27, 56, 40, 16, 5);
    for (let i = 0; i < 7; i += 1) g.lineStyle(2, 0x9b7322, 0.8).lineBetween(30 + i * 6, 58, 27 + i * 6, 74);
  });
  inventoryIcon(scene, "inventory_saddle", (g) => {
    g.fillStyle(0x8a542a, 1).fillRoundedRect(21, 43, 58, 24, 12);
    g.fillStyle(0x4a2a14, 1).fillRoundedRect(35, 30, 30, 24, 10);
    g.lineStyle(4, 0xd4af37, 0.9).strokeRoundedRect(21, 43, 58, 24, 12);
    g.lineStyle(3, 0x2a1a0e, 1).lineBetween(38, 67, 34, 80).lineBetween(62, 66, 68, 80);
  });
  inventoryIcon(scene, "inventory_oats", (g) => {
    g.fillStyle(0xb9844a, 1).fillRoundedRect(26, 28, 44, 48, 8);
    g.fillStyle(0xf5e6b8, 1).fillEllipse(48, 29, 44, 14);
    for (let i = 0; i < 16; i += 1) g.fillStyle(0xf0d867, 1).fillCircle(31 + (i * 13) % 35, 38 + (i * 17) % 28, 2.4);
    g.lineStyle(3, 0x7a4a24, 1).strokeRoundedRect(26, 28, 44, 48, 8);
  });
  inventoryIcon(scene, "inventory_apple", (g) => {
    g.fillStyle(0xd84a34, 1).fillCircle(42, 50, 19).fillCircle(56, 50, 19);
    g.fillStyle(0xb93428, 1).fillCircle(49, 58, 22);
    g.fillStyle(0x5e3a1e, 1).fillRoundedRect(47, 20, 5, 18, 2);
    g.fillStyle(0x4f9b42, 1).fillEllipse(61, 27, 22, 10);
    g.fillStyle(0xf8dd91, 0.5).fillCircle(41, 45, 5);
  });
  inventoryIcon(scene, "inventory_rope", (g) => {
    g.lineStyle(8, 0xc79b5a, 1).strokeCircle(48, 49, 26).strokeCircle(48, 49, 14);
    g.lineStyle(3, 0x7a4a24, 0.8).strokeCircle(48, 49, 26).strokeCircle(48, 49, 14);
    g.lineStyle(7, 0xc79b5a, 1).lineBetween(62, 62, 78, 78);
  });
  inventoryIcon(scene, "inventory_lantern", (g) => {
    g.fillStyle(0xf0c75c, 0.26).fillCircle(48, 51, 38);
    g.fillStyle(0x2a1a0e, 1).fillRoundedRect(32, 33, 32, 42, 6);
    g.fillStyle(0xf8dd91, 1).fillRoundedRect(38, 41, 20, 25, 4);
    g.lineStyle(4, 0xd4af37, 1).strokeRoundedRect(32, 33, 32, 42, 6).strokeCircle(48, 29, 15);
  });
  inventoryIcon(scene, "inventory_nail_kit", (g) => {
    g.fillStyle(0x8a3f24, 1).fillRoundedRect(22, 35, 54, 34, 6);
    g.fillStyle(0xd4af37, 1).fillRoundedRect(40, 28, 16, 10, 4);
    g.lineStyle(3, 0x2a1a0e, 1).strokeRoundedRect(22, 35, 54, 34, 6);
    g.lineStyle(4, 0xf5e6b8, 1).lineBetween(36, 52, 60, 52).lineBetween(48, 40, 48, 64);
  });
  inventoryIcon(scene, "inventory_watering_can", (g) => {
    g.fillStyle(0x5aa0b7, 1).fillRoundedRect(24, 42, 40, 28, 8);
    g.lineStyle(5, 0x2f6f81, 1).strokeCircle(62, 50, 17);
    g.fillStyle(0x5aa0b7, 1).fillTriangle(22, 47, 8, 39, 22, 57).fillRoundedRect(55, 34, 17, 8, 4);
    g.fillStyle(0xbfe7f0, 1).fillCircle(11, 62, 2.2).fillCircle(18, 67, 2).fillCircle(25, 62, 1.8);
  });
  inventoryIcon(scene, "inventory_horse_tracker", (g) => {
    g.fillStyle(0xd4af37, 1).fillCircle(48, 48, 30);
    g.fillStyle(0x2a1a0e, 1).fillCircle(48, 48, 22);
    g.fillStyle(0xf5e6b8, 1).fillCircle(48, 48, 17);
    g.fillStyle(0xc64232, 1).fillTriangle(48, 21, 55, 50, 48, 45);
    g.fillStyle(0x244d6f, 1).fillTriangle(48, 75, 41, 46, 48, 51);
    g.lineStyle(3, 0x7a4a24, 1).strokeCircle(48, 48, 30);
  });
}

function inventoryIcon(scene: Phaser.Scene, key: string, draw: (graphics: Phaser.GameObjects.Graphics) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0).fillRect(0, 0, 96, 96);
  g.fillStyle(0x000000, 0.16).fillEllipse(50, 78, 58, 12);
  draw(g);
  g.generateTexture(key, 96, 96);
  g.destroy();
}

function weatherTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists("weather_raindrop")) {
    const g = scene.add.graphics();
    g.lineStyle(2, 0xbfe7f0, 0.82).lineBetween(3, 0, 0, 16);
    g.generateTexture("weather_raindrop", 6, 18);
    g.destroy();
  }

  if (!scene.textures.exists("weather_mist_band")) {
    const g = scene.add.graphics();
    for (let i = 0; i < 7; i += 1) {
      g.fillStyle(0xd8eadf, 0.07 + i * 0.012).fillEllipse(80 + i * 38, 16 + (i % 3) * 10, 150, 20);
    }
    g.generateTexture("weather_mist_band", 384, 64);
    g.destroy();
  }

  if (!scene.textures.exists("weather_haze_patch")) {
    const g = scene.add.graphics();
    g.fillStyle(0xe7f3df, 0.18).fillEllipse(96, 48, 190, 72);
    g.fillStyle(0xf4ead0, 0.1).fillEllipse(70, 36, 110, 38).fillEllipse(134, 56, 120, 34);
    g.generateTexture("weather_haze_patch", 192, 96);
    g.destroy();
  }

  if (!scene.textures.exists("weather_ripple")) {
    const g = scene.add.graphics();
    g.lineStyle(2, 0xbfe7f0, 0.42).strokeEllipse(16, 10, 28, 10);
    g.generateTexture("weather_ripple", 32, 20);
    g.destroy();
  }
}

function wildlifeTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists("world_coney")) {
    const g = scene.add.graphics();
    g.fillStyle(Palette.shadow, 0.18).fillEllipse(38, 52, 48, 10);
    g.fillStyle(0x7c5a3c, 1).fillEllipse(36, 38, 39, 22);
    g.fillStyle(0x9b7552, 1).fillCircle(55, 32, 12).fillEllipse(28, 34, 16, 14);
    g.fillStyle(0x5a3c27, 1).fillEllipse(26, 26, 5, 14).fillEllipse(49, 23, 5, 13);
    g.fillStyle(0xf2e0c6, 0.72).fillEllipse(55, 38, 15, 8);
    g.fillStyle(0x1c120b, 1).fillCircle(59, 30, 2.2);
    g.lineStyle(2, 0x4a321f, 0.9).lineBetween(20, 44, 13, 52).lineBetween(44, 47, 51, 54);
    g.generateTexture("world_coney", 76, 62);
    g.destroy();
  }
  alias(scene, "world_rabbit", "world_coney");

  if (!scene.textures.exists("world_jamaican_boa")) {
    const g = scene.add.graphics();
    g.fillStyle(Palette.shadow, 0.16).fillEllipse(50, 49, 70, 8);
    g.lineStyle(9, 0x7b5f39, 1);
    const points = [
      [14, 40],
      [28, 31],
      [42, 45],
      [58, 34],
      [74, 31],
      [88, 39]
    ];
    for (let i = 0; i < points.length - 1; i += 1) {
      g.lineBetween(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
    g.lineStyle(3, 0x3c2a1a, 0.68);
    for (let i = 0; i < 8; i += 1) g.lineBetween(20 + i * 8, 36 + (i % 2) * 4, 26 + i * 8, 42 - (i % 2) * 3);
    g.fillStyle(0x4c321d, 1).fillCircle(89, 39, 6);
    g.fillStyle(0xf0d69c, 1).fillCircle(93, 37, 1.4);
    g.generateTexture("world_jamaican_boa", 104, 66);
    g.destroy();
  }
  alias(scene, "world_snake", "world_jamaican_boa");

  if (!scene.textures.exists("world_feral_dog")) {
    const g = scene.add.graphics();
    g.fillStyle(Palette.shadow, 0.2).fillEllipse(62, 60, 78, 13);
    g.fillStyle(0x8a6b4c, 1).fillEllipse(58, 40, 63, 25).fillCircle(94, 34, 14);
    g.fillStyle(0x6d4d34, 1).fillTriangle(85, 24, 91, 9, 99, 24).fillTriangle(98, 25, 108, 15, 107, 31);
    g.fillStyle(0x6d4d34, 1).fillTriangle(30, 38, 9, 26, 27, 51);
    g.fillStyle(0xe4d4b4, 0.9).fillEllipse(93, 41, 20, 9).fillEllipse(52, 39, 28, 12);
    g.fillStyle(0x3a2a1d, 1).fillRect(41, 50, 7, 18).fillRect(70, 49, 7, 18).fillRect(88, 45, 6, 16);
    g.fillStyle(0x11100c, 1).fillCircle(99, 32, 2).fillCircle(108, 39, 2.4);
    g.generateTexture("world_feral_dog", 128, 82);
    g.destroy();
  }
  alias(scene, "world_coyote", "world_feral_dog");

  if (!scene.textures.exists("world_jamaican_bird")) {
    const g = scene.add.graphics();
    g.fillStyle(0x1d6d46, 1).fillEllipse(32, 29, 20, 11);
    g.fillStyle(0xf1cc44, 1).fillEllipse(32, 32, 15, 7);
    g.fillStyle(0x1d6d46, 1).fillTriangle(25, 28, 7, 20, 22, 38).fillTriangle(38, 28, 58, 19, 43, 38);
    g.fillStyle(0x15100a, 1).fillTriangle(43, 28, 60, 25, 44, 32).fillCircle(38, 26, 1.8);
    g.generateTexture("world_jamaican_bird", 64, 48);
    g.destroy();
  }
  alias(scene, "world_bird", "world_jamaican_bird");

  if (!scene.textures.exists("world_goat")) {
    const g = scene.add.graphics();
    g.fillStyle(Palette.shadow, 0.2).fillEllipse(47, 63, 70, 12);
    g.fillStyle(0xe6ddc5, 1).fillEllipse(45, 42, 54, 24).fillCircle(78, 34, 13);
    g.fillStyle(0x8a633d, 1).fillEllipse(35, 42, 17, 18).fillCircle(72, 39, 6);
    g.fillStyle(0xe6ddc5, 1).fillTriangle(70, 24, 65, 10, 78, 23).fillTriangle(83, 25, 91, 12, 90, 30);
    g.lineStyle(3, 0x5b3b22, 1).lineBetween(75, 24, 70, 10).lineBetween(82, 24, 88, 10);
    g.fillStyle(0x4b3423, 1).fillRect(30, 53, 6, 17).fillRect(52, 54, 6, 16).fillRect(72, 47, 5, 16);
    g.fillStyle(0x4b3423, 1).fillTriangle(83, 42, 78, 56, 88, 44);
    g.fillStyle(0x15100a, 1).fillCircle(82, 32, 2);
    g.generateTexture("world_goat", 104, 78);
    g.destroy();
  }

  if (!scene.textures.exists("world_mongoose")) {
    const g = scene.add.graphics();
    g.fillStyle(Palette.shadow, 0.18).fillEllipse(52, 55, 74, 9);
    g.fillStyle(0x98744f, 1).fillRoundedRect(24, 34, 48, 16, 8).fillEllipse(75, 34, 20, 13);
    g.fillStyle(0x6f5238, 1).fillTriangle(24, 39, 5, 33, 24, 48);
    g.fillStyle(0xb08b63, 0.72).fillEllipse(49, 35, 32, 8);
    g.lineStyle(2, 0x4b3828, 1).lineBetween(35, 46, 30, 56).lineBetween(62, 46, 68, 56);
    g.fillStyle(0x15100a, 1).fillCircle(81, 32, 1.8);
    g.generateTexture("world_mongoose", 104, 66);
    g.destroy();
  }

  if (!scene.textures.exists("world_frigatebird")) {
    const g = scene.add.graphics();
    g.fillStyle(0x141414, 1).fillTriangle(34, 28, 4, 12, 24, 36).fillTriangle(38, 28, 76, 11, 47, 38);
    g.fillEllipse(36, 29, 22, 10);
    g.fillTriangle(26, 31, 13, 43, 32, 35).fillTriangle(44, 31, 59, 44, 39, 35);
    g.fillStyle(0xb83429, 0.95).fillEllipse(44, 33, 8, 5);
    g.fillStyle(0xf0d57a, 1).fillTriangle(49, 28, 63, 25, 50, 31);
    g.generateTexture("world_frigatebird", 80, 52);
    g.destroy();
  }

  if (!scene.textures.exists("world_pelican")) {
    const g = scene.add.graphics();
    g.fillStyle(Palette.shadow, 0.14).fillEllipse(46, 48, 66, 8);
    g.fillStyle(0xddd4bf, 1).fillEllipse(40, 31, 34, 17);
    g.fillStyle(0x8d775e, 1).fillTriangle(28, 29, 5, 19, 23, 39).fillTriangle(48, 29, 73, 18, 54, 39);
    g.fillStyle(0xf2ead5, 1).fillCircle(60, 27, 10);
    g.fillStyle(0xe2ba6e, 1).fillRoundedRect(63, 28, 28, 6, 3);
    g.fillStyle(0xd49b58, 0.82).fillEllipse(71, 35, 23, 8);
    g.fillStyle(0x1b1510, 1).fillCircle(63, 24, 1.6);
    g.generateTexture("world_pelican", 96, 58);
    g.destroy();
  }
}

function mountedHitbox(scene: Phaser.Scene): void {
  if (scene.textures.exists("mounted_hitbox")) return;
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 0.01).fillRect(0, 0, 64, 48);
  g.generateTexture("mounted_hitbox", 64, 48);
  g.destroy();
}

function alias(scene: Phaser.Scene, aliasKey: string, sourceKey: string): void {
  if (!scene.textures.exists(aliasKey) && scene.textures.exists(sourceKey)) {
    scene.textures.addBase64(aliasKey, scene.textures.getBase64(sourceKey));
  }
}

function grassTile(scene: Phaser.Scene): void {
  if (scene.textures.exists("grass_tile")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.grass, 1).fillRect(0, 0, 96, 96);
  for (let i = 0; i < 130; i += 1) {
    const x = (i * 29) % 96;
    const y = (i * 53) % 96;
    g.fillStyle(i % 2 ? Palette.grassLight : Palette.grassDark, i % 2 ? 0.24 : 0.2).fillEllipse(x, y, 2 + (i % 4), 6 + (i % 5));
  }
  for (let i = 0; i < 12; i += 1) {
    g.fillStyle(i % 2 ? 0xe6d36b : 0xe8a0b1, 0.8).fillCircle((i * 41) % 96, (i * 67) % 96, 1.4);
  }
  g.generateTexture("grass_tile", 96, 96);
  g.destroy();
}

function dirtTile(scene: Phaser.Scene): void {
  if (scene.textures.exists("dirt_tile")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.dirt, 1).fillRect(0, 0, 96, 96);
  for (let i = 0; i < 120; i += 1) {
    g.fillStyle(i % 2 ? 0x8b5b35 : 0xd2a063, 0.34).fillCircle((i * 37) % 96, (i * 61) % 96, 1 + (i % 3));
  }
  g.generateTexture("dirt_tile", 96, 96);
  g.destroy();
}

function pathSegment(scene: Phaser.Scene): void {
  if (scene.textures.exists("path_segment")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.dirtDark, 0.85).fillRoundedRect(0, 0, 96, 54, 26);
  g.fillStyle(Palette.dirt, 1).fillRoundedRect(5, 5, 86, 44, 22);
  g.fillStyle(0xd0a064, 0.4);
  for (let i = 0; i < 26; i += 1) g.fillCircle((i * 19) % 90 + 3, (i * 31) % 44 + 5, 1 + (i % 3));
  g.generateTexture("path_segment", 96, 54);
  g.destroy();
}

function tree(scene: Phaser.Scene, key: string, width: number, height: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.28).fillEllipse(width / 2, height - 20, width * 0.72, 24);
  g.fillStyle(0x5a3519, 1).fillRoundedRect(width / 2 - 12, height * 0.46, 24, height * 0.42, 8);
  g.fillStyle(Palette.grassDark, 1).fillEllipse(width / 2, height * 0.34, width * 0.82, height * 0.48);
  g.fillStyle(0x315f34, 1).fillCircle(width * 0.32, height * 0.34, width * 0.2).fillCircle(width * 0.52, height * 0.23, width * 0.25).fillCircle(width * 0.68, height * 0.38, width * 0.22);
  g.fillStyle(Palette.grassLight, 0.52).fillCircle(width * 0.44, height * 0.24, width * 0.13).fillCircle(width * 0.66, height * 0.34, width * 0.12);
  g.generateTexture(key, width, height);
  g.destroy();
}

function fence(scene: Phaser.Scene, key: string, vertical: boolean): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const w = vertical ? 58 : 128;
  const h = vertical ? 128 : 58;
  g.fillStyle(Palette.shadow, 0.24).fillRoundedRect(8, h / 2 + 7, w - 16, 7, 3);
  g.fillStyle(Palette.woodDark, 1);
  if (vertical) {
    g.fillRoundedRect(18, 8, 10, 112, 3).fillRoundedRect(36, 8, 10, 112, 3);
    g.fillStyle(Palette.wood, 1).fillRoundedRect(10, 22, 42, 8, 3).fillRoundedRect(10, 76, 42, 8, 3);
  } else {
    g.fillRoundedRect(9, 10, 12, 42, 3).fillRoundedRect(106, 10, 12, 42, 3);
    g.fillStyle(Palette.wood, 1).fillRoundedRect(0, 18, 128, 8, 3).fillRoundedRect(0, 36, 128, 8, 3);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

function sign(scene: Phaser.Scene, key: string, width: number, height: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.28).fillRoundedRect(10, 12, width - 12, 46, 8);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(4, 6, width - 16, 44, 8);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(12, 12, width - 32, 30, 5);
  g.lineStyle(3, Palette.gold, 1).strokeRoundedRect(4, 6, width - 16, 44, 8);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(width / 2 - 6, 50, 12, height - 54, 3);
  g.generateTexture(key, width, height);
  g.destroy();
}

function rider(scene: Phaser.Scene): void {
  if (scene.textures.exists("rider_placeholder")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.32).fillEllipse(40, 74, 46, 12);
  g.lineStyle(3, 0x17100a, 1);
  g.fillStyle(0x5a3320, 1).fillEllipse(40, 13, 46, 13);
  g.fillStyle(0x7b4a24, 1).fillRoundedRect(28, 7, 24, 9, 3);
  g.fillStyle(0xd8a45c, 1).fillCircle(40, 25, 10);
  g.fillStyle(0x1e6075, 1).fillRoundedRect(26, 38, 28, 26, 6);
  g.lineStyle(3, 0x102830, 1).strokeRoundedRect(26, 38, 28, 26, 6);
  g.fillStyle(0x202b30, 1).fillRect(24, 58, 9, 18).fillRect(47, 58, 9, 18);
  g.fillStyle(0x2b180f, 1).fillRect(20, 74, 15, 5).fillRect(45, 74, 15, 5);
  g.generateTexture("rider_placeholder", 80, 84);
  g.destroy();
}

function horse(scene: Phaser.Scene): void {
  if (scene.textures.exists("horse_placeholder")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.32).fillEllipse(68, 76, 102, 19);
  g.lineStyle(3, 0x17100a, 1);
  g.fillStyle(0x8a542a, 1).fillEllipse(60, 42, 82, 35);
  g.fillStyle(0x8a542a, 1).fillEllipse(104, 30, 30, 26);
  g.fillStyle(0x1b120c, 1).fillTriangle(23, 31, 4, 24, 21, 50).fillRoundedRect(74, 22, 25, 8, 4);
  g.fillRect(34, 57, 8, 28).fillRect(56, 58, 8, 27).fillRect(80, 55, 8, 28).fillRect(96, 46, 7, 24);
  g.fillStyle(0xb88748, 1).fillRoundedRect(46, 28, 34, 13, 4);
  g.fillStyle(Palette.gold, 1).fillCircle(111, 27, 2.5);
  g.generateTexture("horse_placeholder", 132, 94);
  g.destroy();
}

function panelDark(scene: Phaser.Scene): void {
  if (scene.textures.exists("panel_dark")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.darkPanel, 0.96).fillRoundedRect(0, 0, 64, 64, 8);
  g.lineStyle(3, Palette.gold, 1).strokeRoundedRect(2, 2, 60, 60, 6);
  g.lineStyle(1, Palette.goldDark, 0.75).strokeRoundedRect(7, 7, 50, 50, 4);
  g.generateTexture("panel_dark", 64, 64);
  g.destroy();
}

function buttonDark(scene: Phaser.Scene): void {
  if (scene.textures.exists("button_dark")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.panelBrown, 0.98).fillRoundedRect(0, 0, 120, 48, 7);
  g.fillStyle(Palette.woodDark, 0.35).fillRoundedRect(7, 7, 106, 34, 5);
  g.lineStyle(2, Palette.gold, 1).strokeRoundedRect(1, 1, 118, 46, 6);
  g.generateTexture("button_dark", 120, 48);
  g.destroy();
}

function building(scene: Phaser.Scene, options: BuildingOptions): void {
  if (scene.textures.exists(options.key)) return;
  const { key, roof, wall, width, height, logStyle } = options;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.32).fillEllipse(width / 2, height - 12, width * 0.86, 26);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(28, 70, width - 56, height - 88, 6);
  g.fillStyle(wall, 1).fillRoundedRect(34, 76, width - 68, height - 100, 5);
  for (let y = 88; y < height - 26; y += logStyle ? 11 : 15) {
    g.lineStyle(logStyle ? 4 : 2, Palette.woodDark, logStyle ? 0.65 : 0.42).lineBetween(40, y, width - 40, y);
  }
  g.fillStyle(roof, 1).fillTriangle(12, 76, width / 2, 8, width - 12, 76);
  g.fillStyle(0x10291f, 0.35).fillTriangle(28, 76, width / 2, 20, width - 28, 76);
  g.lineStyle(5, Palette.woodDark, 1).strokeTriangle(12, 76, width / 2, 8, width - 12, 76);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(width / 2 - 19, height - 76, 38, 58, 4);
  g.fillStyle(0xf4ca73, 1).fillRoundedRect(54, 98, 31, 27, 4).fillRoundedRect(width - 85, 98, 31, 27, 4);
  g.lineStyle(2, Palette.goldDark, 1).strokeRoundedRect(54, 98, 31, 27, 4).strokeRoundedRect(width - 85, 98, 31, 27, 4);
  g.fillStyle(Palette.woodDark, 0.8).fillRoundedRect(width / 2 - 56, height - 40, 112, 18, 4);
  g.generateTexture(key, width, height);
  g.destroy();
}
