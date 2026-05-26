import Phaser from "phaser";
import { Palette } from "./Palette";

export function createProceduralTextures(scene: Phaser.Scene): void {
  grassTile(scene);
  dirtTile(scene);
  tree(scene);
  fence(scene);
  sign(scene);
  rider(scene);
  horse(scene);
  building(scene, "building_stable", Palette.greenRoof, 260, 185);
  building(scene, "building_cozy", Palette.redRoof, 190, 150);
  building(scene, "building_barn", Palette.blueRoof, 205, 155);
  building(scene, "building_cabin", Palette.greenRoof, 190, 150);
}

function grassTile(scene: Phaser.Scene): void {
  if (scene.textures.exists("tex_grass")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.grass, 1).fillRect(0, 0, 128, 128);
  for (let i = 0; i < 130; i += 1) {
    const x = (i * 37) % 128;
    const y = (i * 71) % 128;
    const color = i % 3 === 0 ? Palette.grassLight : Palette.grassDark;
    g.fillStyle(color, i % 3 === 0 ? 0.28 : 0.22).fillCircle(x, y, 1 + (i % 3));
  }
  for (let i = 0; i < 10; i += 1) {
    g.fillStyle(i % 2 ? 0xf1d06b : 0xd98aa0, 0.85).fillCircle((i * 43) % 128, (i * 59) % 128, 1.7);
  }
  g.generateTexture("tex_grass", 128, 128);
  g.destroy();
}

function dirtTile(scene: Phaser.Scene): void {
  if (scene.textures.exists("tex_dirt")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.dirt, 1).fillRect(0, 0, 128, 128);
  for (let i = 0; i < 110; i += 1) {
    const color = i % 2 ? 0x8f5c33 : 0xd2a064;
    g.fillStyle(color, 0.35).fillCircle((i * 41) % 128, (i * 67) % 128, 1 + (i % 4));
  }
  g.generateTexture("tex_dirt", 128, 128);
  g.destroy();
}

function tree(scene: Phaser.Scene): void {
  if (scene.textures.exists("tex_tree")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.28).fillEllipse(70, 116, 88, 28);
  g.fillStyle(0x5b3517, 1).fillRoundedRect(58, 58, 22, 60, 8);
  g.fillStyle(Palette.grassDark, 1).fillEllipse(70, 46, 104, 72);
  g.fillStyle(0x315f34, 1).fillCircle(38, 46, 36).fillCircle(76, 28, 42).fillCircle(104, 56, 38);
  g.fillStyle(Palette.grassLight, 0.58).fillCircle(59, 34, 24).fillCircle(92, 48, 20);
  g.generateTexture("tex_tree", 140, 132);
  g.destroy();
}

function fence(scene: Phaser.Scene): void {
  if (scene.textures.exists("tex_fence")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.25).fillRect(8, 25, 112, 8);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(8, 11, 12, 42, 3).fillRoundedRect(104, 11, 12, 42, 3);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(2, 18, 124, 8, 3).fillRoundedRect(2, 36, 124, 8, 3);
  g.generateTexture("tex_fence", 128, 64);
  g.destroy();
}

function sign(scene: Phaser.Scene): void {
  if (scene.textures.exists("tex_sign")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.32).fillRoundedRect(12, 14, 136, 48, 7);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(8, 8, 136, 48, 7);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(14, 14, 124, 36, 5);
  g.lineStyle(3, Palette.gold, 1).strokeRoundedRect(8, 8, 136, 48, 7);
  g.fillStyle(Palette.woodDark, 1).fillRect(70, 55, 12, 48);
  g.generateTexture("tex_sign", 156, 112);
  g.destroy();
}

function rider(scene: Phaser.Scene): void {
  if (scene.textures.exists("placeholder_rider")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.32).fillEllipse(36, 68, 42, 12);
  g.lineStyle(3, 0x17100a, 1);
  g.fillStyle(0x5a3320, 1).fillEllipse(36, 13, 40, 13);
  g.fillStyle(0x7b4a24, 1).fillRoundedRect(25, 8, 22, 8, 3);
  g.fillStyle(0xd8a45c, 1).fillCircle(36, 25, 10);
  g.fillStyle(0x25506a, 1).fillRoundedRect(23, 37, 26, 25, 5);
  g.fillStyle(0x1d2930, 1).fillRect(21, 56, 9, 17).fillRect(42, 56, 9, 17);
  g.fillStyle(0x2b180f, 1).fillRect(18, 70, 14, 5).fillRect(40, 70, 14, 5);
  g.generateTexture("placeholder_rider", 72, 80);
  g.destroy();
}

function horse(scene: Phaser.Scene): void {
  if (scene.textures.exists("placeholder_horse")) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.32).fillEllipse(62, 72, 96, 18);
  g.lineStyle(3, 0x17100a, 1);
  g.fillStyle(0x8a542a, 1).fillEllipse(58, 42, 78, 34);
  g.fillStyle(0x8a542a, 1).fillEllipse(97, 30, 28, 25);
  g.fillStyle(0x1b120c, 1).fillTriangle(22, 31, 2, 24, 20, 48);
  g.fillRoundedRect(70, 22, 25, 8, 4);
  g.fillRect(35, 56, 8, 27).fillRect(56, 57, 8, 27).fillRect(78, 54, 8, 27);
  g.fillStyle(0xb88748, 1).fillRoundedRect(45, 28, 31, 13, 4);
  g.fillStyle(Palette.gold, 1).fillCircle(103, 27, 2.5);
  g.generateTexture("placeholder_horse", 124, 92);
  g.destroy();
}

function building(scene: Phaser.Scene, key: string, roof: number, width: number, height: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(Palette.shadow, 0.33).fillEllipse(width / 2, height - 12, width * 0.88, 28);
  g.fillStyle(roof, 1).fillTriangle(12, 65, width / 2, 8, width - 12, 65);
  g.fillStyle(roof, 0.85).fillRoundedRect(34, 54, width - 68, 24, 3);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(30, 70, width - 60, height - 84, 5);
  for (let y = 82; y < height - 18; y += 15) {
    g.lineStyle(2, Palette.woodDark, 0.45).lineBetween(38, y, width - 38, y);
  }
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(width / 2 - 18, height - 72, 36, 58, 4);
  g.fillStyle(0xf4ca73, 1).fillRoundedRect(52, 92, 30, 26, 3).fillRoundedRect(width - 82, 92, 30, 26, 3);
  g.lineStyle(3, Palette.goldDark, 1).strokeRoundedRect(30, 70, width - 60, height - 84, 5);
  g.generateTexture(key, width, height);
  g.destroy();
}
