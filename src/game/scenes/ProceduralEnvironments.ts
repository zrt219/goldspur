import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";
import { Palette } from "../art/Palette";
import { labelStyle } from "../art/UITheme";

const DEPTH_ENV = 0;
const DEPTH_PROPS = 10;
const DEPTH_LABELS = 90;

export function drawProceduralEnvironment(scene: Phaser.Scene, area: string): void {
  tiledGrass(scene);
  vignette(scene);
  switch (area) {
    case "Ranch":
      ranch(scene);
      break;
    case "Training":
      training(scene);
      break;
    case "Racing":
      racing(scene);
      break;
    case "Health":
      health(scene);
      break;
    case "Relaxation":
      relaxation(scene);
      break;
  }
}

function tiledGrass(scene: Phaser.Scene): void {
  for (let x = 0; x < GAME_WIDTH; x += 128) {
    for (let y = 0; y < GAME_HEIGHT; y += 128) {
      scene.add.image(x, y, "tex_grass").setOrigin(0).setDepth(DEPTH_ENV);
    }
  }
}

function vignette(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(DEPTH_ENV + 0.2);
  g.fillStyle(0x000000, 0.18).fillRect(0, 0, GAME_WIDTH, 62);
  g.fillRect(0, GAME_HEIGHT - 70, GAME_WIDTH, 70);
  g.fillStyle(0x000000, 0.1).fillRect(0, 0, 58, GAME_HEIGHT);
  g.fillRect(GAME_WIDTH - 58, 0, 58, GAME_HEIGHT);
}

function path(scene: Phaser.Scene, points: Array<[number, number]>, width: number): void {
  const g = scene.add.graphics().setDepth(DEPTH_ENV + 1);
  g.lineStyle(width + 18, Palette.dirtDark, 0.75);
  strokePath(g, points);
  g.lineStyle(width, Palette.dirt, 1);
  strokePath(g, points);
  g.lineStyle(Math.max(8, width - 18), 0xc99458, 0.65);
  strokePath(g, points);
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    for (let j = 0; j < 22; j += 1) {
      const t = j / 22;
      const x = Phaser.Math.Linear(x1, x2, t) + Phaser.Math.Between(-width / 2, width / 2);
      const y = Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-width / 2, width / 2);
      g.fillStyle(j % 2 ? 0x84532e : 0xd6a364, 0.34).fillCircle(x, y, Phaser.Math.Between(1, 3));
    }
  }
}

function strokePath(g: Phaser.GameObjects.Graphics, points: Array<[number, number]>): void {
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => g.lineTo(x, y));
  g.strokePath();
}

function trees(scene: Phaser.Scene, spots: Array<[number, number, number]>): void {
  spots.forEach(([x, y, scale]) => scene.add.image(x, y, "tex_tree").setScale(scale).setDepth(y - 8));
}

function fences(scene: Phaser.Scene, spots: Array<[number, number, number]>, vertical = false): void {
  spots.forEach(([x, y, scale]) => {
    scene.add.image(x, y, "tex_fence")
      .setScale(scale)
      .setAngle(vertical ? 90 : 0)
      .setDepth(DEPTH_PROPS);
  });
}

function ranch(scene: Phaser.Scene): void {
  path(scene, [[640, 165], [640, 320], [520, 438], [330, 555]], 72);
  path(scene, [[640, 320], [680, 460], [640, 585]], 68);
  path(scene, [[640, 320], [800, 430], [980, 555]], 62);
  path(scene, [[500, 335], [410, 345]], 45);
  path(scene, [[640, 320], [860, 345]], 45);
  path(scene, [[740, 350], [940, 430]], 44);

  fences(scene, [[150, 610, 1.1], [280, 610, 1], [1040, 610, 1.1], [1160, 610, 1], [235, 112, 0.9], [1035, 112, 0.9]]);
  trees(scene, [[130, 130, 1.15], [270, 155, 0.92], [1080, 135, 1.05], [1170, 260, 0.96], [128, 610, 1.12], [1135, 575, 1.12]]);

  scene.add.image(640, 155, "building_stable").setDisplaySize(330, 235).setDepth(210);
  scene.add.text(640, 258, "Goldspur Valley Ranch", labelStyle(22)).setOrigin(0.5).setDepth(DEPTH_LABELS);
  scene.add.image(310, 548, "building_cozy").setDisplaySize(220, 174).setDepth(548);
  scene.add.image(640, 562, "building_barn").setDisplaySize(235, 178).setDepth(562);
  scene.add.image(980, 548, "building_cabin").setDisplaySize(220, 174).setDepth(548);

  flowerPatch(scene, 438, 530);
  flowerPatch(scene, 760, 535);
  flowerPatch(scene, 970, 440);
}

function training(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(DEPTH_ENV + 1);
  g.fillStyle(Palette.dirtDark, 1).fillRoundedRect(165, 92, 950, 530, 22);
  g.fillStyle(Palette.dirt, 1).fillRoundedRect(188, 114, 904, 486, 18);
  for (let x = 205; x < 1080; x += 128) {
    for (let y = 130; y < 590; y += 128) scene.add.image(x, y, "tex_dirt").setOrigin(0).setAlpha(0.45).setDepth(DEPTH_ENV + 1.1);
  }
  fences(scene, [[260, 108, 1], [390, 108, 1], [520, 108, 1], [650, 108, 1], [780, 108, 1], [910, 108, 1], [1040, 108, 1], [260, 600, 1], [390, 600, 1], [520, 600, 1], [650, 600, 1], [780, 600, 1], [910, 600, 1]]);
  for (let i = 0; i < 7; i += 1) cone(scene, 330 + i * 88, 510);
  jump(scene, 600, 430);
  barrel(scene, 875, 415);
  barrel(scene, 915, 455);
  barrel(scene, 850, 475);
  scene.add.text(640, 132, "Goldspur Training Arena", labelStyle(22)).setOrigin(0.5).setDepth(DEPTH_LABELS);
}

function racing(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(DEPTH_ENV + 1);
  g.fillStyle(Palette.dirtDark, 1).fillEllipse(640, 370, 860, 450);
  g.fillStyle(Palette.dirt, 1).fillEllipse(640, 370, 815, 405);
  g.fillStyle(Palette.grass, 1).fillEllipse(640, 370, 555, 230);
  g.lineStyle(5, 0xd8b066, 0.82).strokeEllipse(640, 370, 820, 410);
  g.lineStyle(4, Palette.cream, 1).lineBetween(322, 244, 322, 502);
  for (let i = 0; i < 55; i += 1) {
    g.fillStyle(i % 2 ? 0x885431 : 0xd3a060, 0.42).fillCircle(245 + ((i * 67) % 790), 210 + ((i * 43) % 335), Phaser.Math.Between(1, 3));
  }
  startGate(scene, 315, 555);
  scene.add.text(322, 456, "Start Gate", labelStyle(17)).setOrigin(0.5).setDepth(DEPTH_LABELS);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(860, 140, 285, 74, 4);
  g.fillStyle(Palette.wood, 1).fillRect(876, 154, 252, 14).fillRect(876, 184, 252, 14);
}

function health(scene: Phaser.Scene): void {
  path(scene, [[180, 545], [610, 430], [1040, 528]], 55);
  trees(scene, [[170, 170, 1], [1110, 190, 1.1], [225, 615, 0.9]]);
  const g = scene.add.graphics().setDepth(DEPTH_PROPS);
  g.fillStyle(Palette.shadow, 0.28).fillEllipse(585, 475, 310, 45);
  g.fillStyle(0xf2dfbd, 1).fillTriangle(425, 330, 585, 170, 745, 330);
  g.fillStyle(0xe6cfa3, 1).fillRoundedRect(462, 330, 246, 150, 6);
  g.lineStyle(5, Palette.woodDark, 1).strokeRoundedRect(462, 330, 246, 150, 6);
  g.fillStyle(0x4f8f53, 1).fillRect(575, 218, 22, 70).fillRect(551, 242, 70, 22);
  trough(scene, 805, 448);
  hay(scene, 360, 472);
  g.fillStyle(Palette.wood, 1).fillRoundedRect(930, 368, 120, 42, 5);
  scene.add.text(585, 306, "Valley Vet", labelStyle(22)).setOrigin(0.5).setDepth(DEPTH_LABELS);
}

function relaxation(scene: Phaser.Scene): void {
  path(scene, [[260, 545], [520, 460], [704, 430]], 42);
  trees(scene, [[405, 270, 1.55], [1130, 170, 1.1], [180, 610, 1]]);
  const g = scene.add.graphics().setDepth(DEPTH_ENV + 2);
  g.fillStyle(0x245d67, 1).fillEllipse(800, 420, 370, 180);
  g.fillStyle(Palette.water, 1).fillEllipse(790, 410, 345, 160);
  g.fillStyle(Palette.waterLight, 0.62).fillEllipse(735, 382, 130, 38).fillEllipse(865, 440, 110, 26);
  g.lineStyle(9, 0x5d6d3b, 1).strokeEllipse(800, 420, 380, 190);
  g.fillStyle(0xa7493f, 1).fillRoundedRect(535, 445, 86, 52, 5);
  flowerPatch(scene, 600, 520);
  flowerPatch(scene, 280, 390);
  scene.add.text(710, 525, "Meadow Rest", labelStyle(22)).setOrigin(0.5).setDepth(DEPTH_LABELS);
}

function cone(scene: Phaser.Scene, x: number, y: number): void {
  scene.add.graphics().setDepth(DEPTH_PROPS).fillStyle(0xc85b2b, 1).fillTriangle(x - 13, y + 14, x, y - 24, x + 13, y + 14).fillStyle(Palette.cream, 1).fillRect(x - 9, y - 2, 18, 4);
}

function jump(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(DEPTH_PROPS);
  g.fillStyle(Palette.woodDark, 1).fillRect(x - 62, y - 38, 12, 76).fillRect(x + 50, y - 38, 12, 76);
  g.fillStyle(Palette.cream, 1).fillRect(x - 65, y - 8, 130, 8);
  g.fillStyle(0xa33c2b, 1).fillRect(x - 40, y - 8, 18, 8).fillRect(x + 20, y - 8, 18, 8);
}

function barrel(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(DEPTH_PROPS);
  g.fillStyle(Palette.wood, 1).fillEllipse(x, y, 42, 50);
  g.lineStyle(3, Palette.woodDark, 1).strokeEllipse(x, y, 42, 50);
  g.lineStyle(2, Palette.goldDark, 1).lineBetween(x - 18, y - 10, x + 18, y - 10).lineBetween(x - 18, y + 10, x + 18, y + 10);
}

function startGate(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(DEPTH_PROPS);
  g.fillStyle(Palette.shadow, 0.3).fillRoundedRect(x - 120, y + 22, 260, 36, 6);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(x - 125, y, 250, 62, 5);
  for (let i = 0; i < 4; i += 1) g.fillStyle(Palette.gold, 1).fillRect(x - 70 + i * 34, y - 30, 14, 92);
}

function trough(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(DEPTH_PROPS);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(x - 70, y - 10, 140, 35, 8);
  g.fillStyle(Palette.waterLight, 0.75).fillRoundedRect(x - 58, y - 6, 116, 16, 6);
}

function hay(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(DEPTH_PROPS);
  g.fillStyle(0xc9953f, 1).fillRoundedRect(x - 55, y, 110, 30, 4).fillRoundedRect(x - 35, y - 30, 70, 30, 4);
  g.lineStyle(2, 0x8a6422, 0.6).lineBetween(x - 45, y + 9, x + 45, y + 9).lineBetween(x - 25, y - 18, x + 25, y - 18);
}

function flowerPatch(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(DEPTH_ENV + 3);
  for (let i = 0; i < 24; i += 1) {
    g.fillStyle(i % 2 ? 0xf1d06b : 0xe88ba2, 0.95).fillCircle(x + Phaser.Math.Between(-70, 70), y + Phaser.Math.Between(-38, 38), 2);
  }
}
