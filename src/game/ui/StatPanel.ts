import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { statBar } from "../art/UITheme";
import { HorseStats } from "../systems/HorseStats";

type Row = {
  key: keyof HorseStats | "area";
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  bar?: Phaser.GameObjects.Container;
};

const BAR_COLORS: Partial<Record<keyof HorseStats, number>> = {
  speed: 0xd4af37,
  stamina: 0x75b65a,
  health: 0xd35b43,
  mood: 0xce8fc7,
  bond: 0x7ca6d8,
  energy: 0xf1c86d
};

export class StatPanel {
  private container: Phaser.GameObjects.Container;
  private rows: Row[] = [];
  private horseNameText: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene, areaName: string, compact = false) {
    const panelHeight = compact ? 250 : 370;
    const panel = scene.add.rectangle(125, compact ? 145 : 205, 230, panelHeight, Palette.darkPanel, 0.94)
      .setStrokeStyle(3, Palette.gold);
    const inner = scene.add.rectangle(125, compact ? 145 : 205, 216, panelHeight - 14, Palette.panelBrown, 0.22)
      .setStrokeStyle(1, Palette.goldDark, 0.65);
    const portrait = scene.add.circle(58, 54, 28, 0x8a542a)
      .setStrokeStyle(3, Palette.gold);
    const portraitText = scene.add.text(58, 54, "H", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: PaletteCss.cream
    }).setOrigin(0.5);
    const title = scene.add.text(100, 36, "Goldspur", {
      fontFamily: "Georgia",
      fontSize: "25px",
      color: PaletteCss.gold
    });
    this.horseNameText = scene.add.text(100, 66, "Horse: Starter", {
      fontFamily: "Georgia",
      fontSize: "14px",
      color: PaletteCss.cream
    });

    const children: Phaser.GameObjects.GameObject[] = [panel, inner, portrait, portraitText, title, this.horseNameText];
    const rowKeys: Array<keyof HorseStats | "area"> = compact ? [
      "health",
      "energy",
      "coins",
      "day",
      "area"
    ] : [
      "speed",
      "stamina",
      "health",
      "mood",
      "bond",
      "energy",
      "coins",
      "day",
      "racesWon",
      "area"
    ];
    rowKeys.forEach((key, index) => {
      const y = 106 + index * 27;
      const label = scene.add.text(28, y, this.labelFor(key), {
        fontFamily: "Georgia",
        fontSize: "14px",
        color: PaletteCss.cream
      }).setOrigin(0, 0.5);
      const value = scene.add.text(205, y, "", {
        fontFamily: "Georgia",
        fontSize: "14px",
        color: PaletteCss.cream,
        align: "right"
      }).setOrigin(1, 0.5);
      const divider = scene.add.line(125, y + 14, -95, 0, 95, 0, Palette.goldDark, 0.18);
      children.push(label, value, divider);
      let bar: Phaser.GameObjects.Container | undefined;
      if (key in BAR_COLORS) {
        bar = statBar(scene, 122, y + 10, 0, BAR_COLORS[key as keyof HorseStats] ?? Palette.gold);
        children.push(bar);
      }
      this.rows.push({ key, label, value, bar });
    });
    children.forEach((child) => {
      const fixed = child as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor;
      fixed.setScrollFactor?.(0);
    });
    this.container = scene.add.container(0, 0, children).setDepth(700).setScrollFactor(0);
    this.update({} as HorseStats, areaName);
  }

  update(stats: HorseStats, areaName: string): void {
    this.horseNameText.setText(`Horse: ${stats.horseName || "Starter"}`);
    this.rows.forEach((row) => {
      if (row.key === "area") {
        row.value.setText(areaName);
      } else if (row.key === "racesWon") {
        row.label.setText("Wins");
        row.value.setText(`${stats.racesWon ?? 0}/${stats.racesEntered ?? 0}`);
      } else {
        row.value.setText(String(stats[row.key] ?? ""));
      }
      if (row.key === "health" || row.key === "energy") {
        const value = Number(stats[row.key]) || 0;
        row.value.setColor(value <= 30 ? "#ff8a65" : value <= 55 ? "#ffcf8a" : PaletteCss.cream);
      } else {
        row.value.setColor(PaletteCss.cream);
      }
      if (row.bar && row.key !== "area" && row.key !== "racesWon") {
        row.bar.destroy(true);
        row.bar = statBar(this.scene, 122, row.label.y + 10, Number(stats[row.key]) || 0, BAR_COLORS[row.key] ?? Palette.gold);
        row.bar.setScrollFactor(0);
        this.container.add(row.bar);
      }
    });
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private labelFor(key: keyof HorseStats | "area"): string {
    const labels: Record<string, string> = {
      speed: "Speed",
      stamina: "Stamina",
      health: "Health",
      mood: "Mood",
      bond: "Bond",
      energy: "Energy",
      coins: "Coins",
      day: "Day",
      racesWon: "Wins",
      area: "Area"
    };
    return labels[key] ?? String(key);
  }
}
