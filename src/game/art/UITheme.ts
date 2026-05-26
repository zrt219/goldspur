import Phaser from "phaser";
import { Palette, PaletteCss } from "./Palette";

export function panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, depth: number): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, width, height, Palette.darkPanel, 0.94)
    .setStrokeStyle(3, Palette.gold)
    .setDepth(depth)
    .setScrollFactor(0);
}

export function button(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  action: () => void,
  depth: number,
  tooltip?: string
): Phaser.GameObjects.Container {
  const shadow = scene.add.rectangle(x + 3, y + 4, width, height, 0x000000, 0.26)
    .setScrollFactor(0);
  const bg = scene.add.rectangle(x, y, width, height, Palette.panelBrown, 0.97)
    .setStrokeStyle(2, Palette.gold)
    .setScrollFactor(0);
  const text = scene.add.text(x, y, label, {
    fontFamily: "Georgia",
    fontSize: "16px",
    color: PaletteCss.cream,
    align: "center",
    fixedWidth: width - 18
  }).setOrigin(0.5).setScrollFactor(0);
  const hit = scene.add.zone(x, y, width, height)
    .setInteractive({ useHandCursor: true })
    .setScrollFactor(0);

  hit.on("pointerover", () => {
    bg.setFillStyle(Palette.woodDark, 1);
    bg.setStrokeStyle(2, Palette.cream);
    shadow.setAlpha(0.36);
    text.setColor(PaletteCss.gold);
    if (tooltip) scene.events.emit("ui-tooltip-show", { text: tooltip, x, y: y - height / 2 - 12 });
  });
  hit.on("pointerout", () => {
    bg.setFillStyle(Palette.panelBrown, 0.97);
    bg.setStrokeStyle(2, Palette.gold);
    shadow.setAlpha(1);
    text.setColor(PaletteCss.cream);
    if (tooltip) scene.events.emit("ui-tooltip-hide");
  });
  hit.on("pointerdown", action);
  return scene.add.container(0, 0, [shadow, bg, text, hit]).setDepth(depth).setScrollFactor(0);
}

export function labelStyle(size = 16): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: "Georgia",
    fontSize: `${size}px`,
    color: PaletteCss.cream,
    backgroundColor: "rgba(21,16,10,0.9)",
    padding: { x: 12, y: 6 }
  };
}

export function statBar(scene: Phaser.Scene, x: number, y: number, value: number, color: number): Phaser.GameObjects.Container {
  const bg = scene.add.rectangle(x, y, 74, 6, Palette.woodDark, 1).setOrigin(0, 0.5);
  const fill = scene.add.rectangle(x, y, Math.max(4, 74 * Phaser.Math.Clamp(value, 0, 100) / 100), 6, color, 1).setOrigin(0, 0.5);
  return scene.add.container(0, 0, [bg, fill]).setScrollFactor(0);
}
