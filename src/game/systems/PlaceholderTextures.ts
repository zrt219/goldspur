import Phaser from "phaser";

export function createPlaceholderRiderTexture(scene: Phaser.Scene, key = "placeholder_rider"): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x5a3320, 1).fillEllipse(32, 17, 32, 12);
  g.fillStyle(0xd8a45c, 1).fillCircle(32, 23, 10);
  g.fillStyle(0x31546c, 1).fillRoundedRect(20, 34, 24, 25, 5);
  g.fillStyle(0x1c2830, 1).fillRect(17, 42, 8, 20).fillRect(39, 42, 8, 20);
  g.lineStyle(3, 0x2a170d, 1).lineBetween(20, 46, 10, 56).lineBetween(44, 46, 54, 56);
  g.generateTexture(key, 64, 72);
  g.destroy();
}

export function createPlaceholderHorseTexture(scene: Phaser.Scene, key = "placeholder_horse"): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x8a542a, 1).fillEllipse(44, 38, 66, 31);
  g.fillStyle(0x8a542a, 1).fillEllipse(81, 25, 28, 25);
  g.fillStyle(0x17110d, 1).fillTriangle(26, 25, 10, 18, 22, 39);
  g.fillStyle(0x1b120c, 1).fillRect(35, 51, 8, 28).fillRect(59, 51, 8, 28);
  g.fillRect(74, 44, 7, 26);
  g.fillStyle(0x1a120c, 1).fillRoundedRect(54, 20, 25, 8, 4);
  g.fillStyle(0xe0b867, 1).fillCircle(88, 22, 3);
  g.generateTexture(key, 112, 88);
  g.destroy();
}

export function createPlaceholderBuildingTexture(scene: Phaser.Scene, key: string, variant: "stable" | "barn" | "cabin"): void {
  if (scene.textures.exists(key)) return;
  const colors = {
    stable: { wall: 0x7b4d2a, roof: 0x254531 },
    barn: { wall: 0x8a3e23, roof: 0x1e4669 },
    cabin: { wall: 0x6b4a2b, roof: 0x59733c }
  }[variant];
  const g = scene.add.graphics();
  g.fillStyle(colors.roof, 1).fillTriangle(12, 54, 110, 8, 208, 54);
  g.fillStyle(colors.wall, 1).fillRoundedRect(28, 54, 164, 104, 4);
  g.lineStyle(4, 0x2a1a0d, 1).strokeRoundedRect(28, 54, 164, 104, 4);
  g.fillStyle(0x2b1b10, 1).fillRect(94, 96, 36, 62);
  g.fillStyle(0xf2cf77, 1).fillRect(48, 78, 28, 25).fillRect(144, 78, 28, 25);
  g.generateTexture(key, 220, 170);
  g.destroy();
}

export function createPlaceholderSignTexture(scene: Phaser.Scene, key = "placeholder_sign"): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(0x4c2c14, 1).fillRoundedRect(8, 8, 100, 42, 5);
  g.fillStyle(0x2e1a0d, 1).fillRect(53, 48, 10, 50);
  g.lineStyle(3, 0xd5a84d, 1).strokeRoundedRect(8, 8, 100, 42, 5);
  g.generateTexture(key, 116, 104);
  g.destroy();
}
