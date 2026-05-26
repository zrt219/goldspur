import Phaser from "phaser";
import { PaletteCss } from "./Palette";

export function buildingSprite(scene: Phaser.Scene, key: string, x: number, y: number, width: number, height: number): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setDisplaySize(width, height).setDepth(y + height / 2);
}

export function worldSign(scene: Phaser.Scene, x: number, y: number, label: string, wide = false): Phaser.GameObjects.Container {
  const image = scene.add.image(x, y, wide ? "sign_wide" : "sign_small").setDisplaySize(wide ? 160 : 128, wide ? 78 : 70);
  const text = scene.add.text(x, y - 18, label, {
    fontFamily: "Georgia",
    fontSize: "15px",
    color: PaletteCss.cream,
    align: "center"
  }).setOrigin(0.5);
  return scene.add.container(0, 0, [image, text]).setDepth(y + 10);
}
