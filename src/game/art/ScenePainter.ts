import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";
import { Palette, PaletteCss } from "./Palette";
import { buildingSprite, worldSign } from "./RanchObjects";

export function paintScene(scene: Phaser.Scene, area: string): void {
  grass(scene);
  shade(scene);
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

function grass(scene: Phaser.Scene): void {
  for (let x = 0; x < GAME_WIDTH; x += 96) {
    for (let y = 0; y < GAME_HEIGHT; y += 96) scene.add.image(x, y, "grass_tile").setOrigin(0).setDepth(0);
  }
}

function shade(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(0.2);
  g.fillStyle(0x000000, 0.13).fillRect(0, 0, GAME_WIDTH, 44);
  g.fillRect(0, GAME_HEIGHT - 54, GAME_WIDTH, 54);
}

export function drawPath(scene: Phaser.Scene, points: Array<[number, number]>, width = 54): void {
  const g = scene.add.graphics().setDepth(1);
  g.lineStyle(width + 12, Palette.dirtDark, 0.74);
  stroke(g, points);
  g.lineStyle(width, Palette.dirt, 1);
  stroke(g, points);
  g.lineStyle(Math.max(10, width - 20), 0xc7985c, 0.55);
  stroke(g, points);
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    for (let j = 0; j < 14; j += 1) {
      const t = (j + 0.4) / 14;
      g.fillStyle(j % 2 ? 0x875431 : 0xe2b16f, 0.38).fillCircle(
        Phaser.Math.Linear(x1, x2, t) + Phaser.Math.Between(-width / 2, width / 2),
        Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-width / 2, width / 2),
        Phaser.Math.Between(1, 3)
      );
    }
  }
}

function stroke(g: Phaser.GameObjects.Graphics, points: Array<[number, number]>): void {
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => g.lineTo(x, y));
  g.strokePath();
}

function ranch(scene: Phaser.Scene): void {
  drawPath(scene, [[640, 205], [640, 345], [640, 505]], 54);
  drawPath(scene, [[640, 405], [420, 550]], 38);
  drawPath(scene, [[640, 335], [850, 330]], 36);

  placeFences(scene);
  placeTrees(scene, [[105, 605, 1.1], [235, 120, 0.85], [1120, 125, 1], [1160, 610, 1.05], [1060, 570, 0.86], [250, 600, 0.75]]);
  buildingSprite(scene, "ranch_main_building", 640, 120, 300, 150);
  mainTitle(scene, 640, 210, "Goldspur Valley Ranch");
  buildingSprite(scene, "cozy_stable_building", 420, 560, 210, 150);
  worldSign(scene, 850, 330, "Travel Board", true);
  hubCircle(scene, 640, 370);
  trough(scene, 780, 235);
  hay(scene, 520, 530);
  flowers(scene, 330, 505);
  flowers(scene, 920, 378);
}

function hubCircle(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(2);
  g.fillStyle(0x8f6a3d, 0.38).fillEllipse(x, y, 155, 82);
  g.lineStyle(3, 0xd1a35c, 0.45).strokeEllipse(x, y, 155, 82);
  for (let i = 0; i < 18; i += 1) {
    g.fillStyle(0x5d4730, 0.35).fillCircle(x + Phaser.Math.Between(-68, 68), y + Phaser.Math.Between(-32, 32), Phaser.Math.Between(2, 4));
  }
}

function training(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(Palette.dirtDark, 1).fillRoundedRect(190, 110, 900, 500, 18);
  g.fillStyle(Palette.dirt, 1).fillRoundedRect(205, 125, 870, 470, 14);
  for (let x = 210; x < 1070; x += 96) {
    for (let y = 125; y < 590; y += 96) scene.add.image(x, y, "dirt_tile").setOrigin(0).setAlpha(0.45).setDepth(1.1);
  }
  fenceLine(scene, 245, 115, 7);
  fenceLine(scene, 245, 595, 7);
  cones(scene);
  jump(scene, 600, 430);
  barrels(scene, [[875, 415], [915, 455], [850, 475]]);
  mainTitle(scene, 640, 145, "Goldspur Training Arena");
}

function racing(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(1);
  g.fillStyle(Palette.dirtDark, 1).fillEllipse(640, 365, 810, 420);
  g.fillStyle(Palette.dirt, 1).fillEllipse(640, 365, 760, 370);
  g.fillStyle(Palette.grass, 1).fillEllipse(640, 365, 500, 205);
  g.lineStyle(5, 0xe0b46b, 0.85).strokeEllipse(640, 365, 760, 370);
  g.lineStyle(4, Palette.cream, 1).lineBetween(324, 245, 324, 495);
  startGate(scene, 315, 555);
  worldSign(scene, 330, 465, "Start Gate");
  spectatorStand(scene, 915, 160);
}

function health(scene: Phaser.Scene): void {
  drawPath(scene, [[185, 545], [610, 420], [1040, 528]], 48);
  placeTrees(scene, [[150, 160, 1], [1120, 180, 1], [260, 620, 0.8]]);
  const g = scene.add.graphics().setDepth(10);
  g.fillStyle(Palette.shadow, 0.28).fillEllipse(585, 475, 300, 42);
  g.fillStyle(0xf1ddb6, 1).fillTriangle(430, 330, 585, 175, 740, 330);
  g.fillStyle(0xe2c89c, 1).fillRoundedRect(468, 330, 236, 145, 6);
  g.lineStyle(5, Palette.woodDark, 1).strokeRoundedRect(468, 330, 236, 145, 6);
  g.fillStyle(0x4f8f53, 1).fillRect(574, 222, 22, 66).fillRect(552, 244, 66, 22);
  trough(scene, 805, 448);
  hay(scene, 360, 472);
  mainTitle(scene, 585, 307, "Valley Vet");
}

function relaxation(scene: Phaser.Scene): void {
  drawPath(scene, [[260, 545], [520, 460], [704, 430]], 40);
  placeTrees(scene, [[405, 265, 1.35], [1120, 170, 1], [175, 612, 1]]);
  const g = scene.add.graphics().setDepth(2);
  g.fillStyle(0x255f68, 1).fillEllipse(805, 420, 360, 178);
  g.fillStyle(Palette.water, 1).fillEllipse(795, 410, 330, 156);
  g.fillStyle(Palette.waterLight, 0.62).fillEllipse(738, 382, 126, 35).fillEllipse(870, 440, 112, 25);
  g.lineStyle(8, 0x5d6d3b, 1).strokeEllipse(805, 420, 370, 188);
  g.fillStyle(0xa7493f, 1).fillRoundedRect(535, 445, 86, 52, 5);
  flowers(scene, 600, 520);
  flowers(scene, 280, 390);
  mainTitle(scene, 710, 525, "Meadow Rest");
}

function mainTitle(scene: Phaser.Scene, x: number, y: number, label: string): void {
  scene.add.rectangle(x + 4, y + 4, Math.max(220, label.length * 12), 36, 0x000000, 0.28).setDepth(90);
  scene.add.rectangle(x, y, Math.max(220, label.length * 12), 36, Palette.panelBrown, 0.96).setStrokeStyle(2, Palette.gold).setDepth(91);
  scene.add.text(x, y, label, { fontFamily: "Georgia", fontSize: "20px", color: PaletteCss.cream }).setOrigin(0.5).setDepth(92);
}

function placeTrees(scene: Phaser.Scene, spots: Array<[number, number, number]>): void {
  spots.forEach(([x, y, scale]) => scene.add.image(x, y, scale > 1 ? "tree_large" : "tree_small").setScale(scale).setDepth(y));
}

function placeFences(scene: Phaser.Scene): void {
  fenceLine(scene, 80, 646, 3);
  fenceLine(scene, 925, 646, 3);
  fenceLine(scene, 160, 104, 2);
  fenceLine(scene, 985, 104, 2);
}

function fenceLine(scene: Phaser.Scene, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i += 1) scene.add.image(x + i * 126, y, "fence_horizontal").setDepth(y);
}

function flowers(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(3);
  for (let i = 0; i < 24; i += 1) {
    g.fillStyle(i % 2 ? 0xf1d06b : 0xe88ba2, 0.9).fillCircle(x + Phaser.Math.Between(-70, 70), y + Phaser.Math.Between(-38, 38), 2);
  }
}

function cones(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(10);
  for (let i = 0; i < 7; i += 1) {
    const x = 330 + i * 88;
    const y = 510;
    g.fillStyle(0xc85b2b, 1).fillTriangle(x - 13, y + 14, x, y - 24, x + 13, y + 14);
    g.fillStyle(Palette.cream, 1).fillRect(x - 9, y - 2, 18, 4);
  }
}

function jump(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(10);
  g.fillStyle(Palette.woodDark, 1).fillRect(x - 62, y - 38, 12, 76).fillRect(x + 50, y - 38, 12, 76);
  g.fillStyle(Palette.cream, 1).fillRect(x - 65, y - 8, 130, 8);
  g.fillStyle(0xa33c2b, 1).fillRect(x - 40, y - 8, 18, 8).fillRect(x + 20, y - 8, 18, 8);
}

function barrels(scene: Phaser.Scene, spots: Array<[number, number]>): void {
  const g = scene.add.graphics().setDepth(10);
  spots.forEach(([x, y]) => {
    g.fillStyle(Palette.wood, 1).fillEllipse(x, y, 42, 50);
    g.lineStyle(3, Palette.woodDark, 1).strokeEllipse(x, y, 42, 50);
    g.lineStyle(2, Palette.goldDark, 1).lineBetween(x - 18, y - 10, x + 18, y - 10).lineBetween(x - 18, y + 10, x + 18, y + 10);
  });
}

function startGate(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(10);
  g.fillStyle(Palette.shadow, 0.3).fillRoundedRect(x - 120, y + 22, 260, 36, 6);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(x - 125, y, 250, 62, 5);
  for (let i = 0; i < 4; i += 1) g.fillStyle(Palette.gold, 1).fillRect(x - 70 + i * 34, y - 30, 14, 92);
}

function spectatorStand(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(10);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(x - 150, y - 30, 300, 80, 5);
  g.fillStyle(Palette.wood, 1).fillRect(x - 132, y - 14, 264, 14).fillRect(x - 132, y + 18, 264, 14);
}

function trough(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(10);
  g.fillStyle(Palette.woodDark, 1).fillRoundedRect(x - 70, y - 10, 140, 35, 8);
  g.fillStyle(Palette.waterLight, 0.75).fillRoundedRect(x - 58, y - 6, 116, 16, 6);
}

function hay(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics().setDepth(10);
  g.fillStyle(0xc9953f, 1).fillRoundedRect(x - 55, y, 110, 30, 4).fillRoundedRect(x - 35, y - 30, 70, 30, 4);
  g.lineStyle(2, 0x8a6422, 0.6).lineBetween(x - 45, y + 9, x + 45, y + 9).lineBetween(x - 25, y - 18, x + 25, y - 18);
}
