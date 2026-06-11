import Phaser from "phaser";
import { button, panel } from "../art/UITheme";
import { ensureHorseVisualTextures } from "../art/HorseCustomizationTextures";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";
import {
  equippedHorseItem,
  HorseCustomizationCategory,
  HORSE_CUSTOMIZATION_CATEGORIES,
  horseCustomizationItem,
  horseCustomizationItemsFor
} from "../data/horseCustomization";
import { Palette, PaletteCss } from "../art/Palette";
import { buyOrEquipHorseCustomization } from "../systems/CoinStore";
import { SaveData, SaveSystem } from "../systems/SaveSystem";
import { normalizeStats } from "../systems/HorseStats";

type HorseCustomizationSceneData = {
  returnScene: string;
};

export class HorseCustomizationScene extends Phaser.Scene {
  private save!: SaveData;
  private returnScene = "RanchScene";
  private category: HorseCustomizationCategory = "coat";
  private root?: Phaser.GameObjects.Container;
  private feedback = "Select a category, then buy or equip a style.";

  constructor() {
    super("HorseCustomizationScene");
  }

  create(data: HorseCustomizationSceneData): void {
    this.returnScene = data.returnScene || "RanchScene";
    this.save = SaveSystem.load();
    this.render();
    this.input.keyboard?.on("keydown-ESC", () => this.close());
    this.input.keyboard?.on("keydown-C", () => this.close());
  }

  private render(): void {
    this.root?.destroy(true);
    const visuals = ensureHorseVisualTextures(this, this.save.horseCustomization);
    const children: Phaser.GameObjects.GameObject[] = [];

    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.52)
      .setDepth(930)
      .setInteractive();
    const surface = panel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 1100, 640, 931);
    children.push(shade, surface);

    children.push(this.add.text(116, 68, "Goldspur Tack Store", {
      fontFamily: "Georgia",
      fontSize: "34px",
      color: PaletteCss.gold
    }).setDepth(932));
    children.push(this.add.text(116, 108, "Buy with coins. Owned styles equip for free.", {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: PaletteCss.cream
    }).setDepth(932));
    children.push(this.add.text(990, 80, `Coins: ${this.save.stats.coins}`, {
      fontFamily: "Georgia",
      fontSize: "26px",
      color: PaletteCss.gold
    }).setOrigin(1, 0.5).setDepth(932));

    this.renderPreview(children, visuals.previewKey, visuals.coatTint, visuals.idleAnimationKey);
    this.renderCategories(children);
    this.renderItems(children);
    this.renderDetails(children);

    children.push(button(this, 1052, 642, 140, 40, "Close", () => this.close(), 934));
    this.root = this.add.container(0, 0, children).setDepth(930).setScrollFactor(0);
  }

  private renderPreview(children: Phaser.GameObjects.GameObject[], previewKey: string, tint: number, animationKey: string): void {
    children.push(this.add.rectangle(270, 310, 360, 360, 0x21170f, 0.86)
      .setStrokeStyle(2, Palette.goldDark)
      .setDepth(932));
    const horse = this.add.sprite(270, 258, previewKey).setDepth(933).setDisplaySize(300, 208).setTint(tint);
    if (this.anims.exists(animationKey)) horse.play(animationKey, true);
    children.push(horse);
    children.push(this.add.text(270, 402, this.save.stats.horseName, {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: PaletteCss.gold
    }).setOrigin(0.5).setDepth(933));
    children.push(this.add.text(270, 440, [
      equippedHorseItem(this.save.horseCustomization, "coat").label,
      equippedHorseItem(this.save.horseCustomization, "mane").label,
      equippedHorseItem(this.save.horseCustomization, "saddle").label,
      equippedHorseItem(this.save.horseCustomization, "blanket").label
    ].join("\n"), {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: PaletteCss.cream,
      align: "center",
      lineSpacing: 6
    }).setOrigin(0.5, 0).setDepth(933));
    children.push(button(this, 270, 560, 210, 38, "Rename Horse", () => this.renameHorse(), 934));
  }

  private renderCategories(children: Phaser.GameObjects.GameObject[]): void {
    HORSE_CUSTOMIZATION_CATEGORIES.forEach((entry, index) => {
      const y = 164 + index * 42;
      const active = entry.id === this.category;
      const categoryButton = button(this, 498, y, 132, 34, active ? `> ${entry.label}` : entry.label, () => {
        this.category = entry.id;
        this.feedback = `${entry.label} selected.`;
        this.render();
      }, 934);
      children.push(categoryButton);
    });
  }

  private renderItems(children: Phaser.GameObjects.GameObject[]): void {
    const items = horseCustomizationItemsFor(this.category);
    children.push(this.add.text(632, 142, HORSE_CUSTOMIZATION_CATEGORIES.find((entry) => entry.id === this.category)?.label ?? "Styles", {
      fontFamily: "Georgia",
      fontSize: "24px",
      color: PaletteCss.gold
    }).setDepth(933));

    items.forEach((item, index) => {
      const owned = this.save.horseCustomization.owned.includes(item.id);
      const equipped = this.save.horseCustomization.equipped[item.category] === item.id;
      const canAfford = this.save.stats.coins >= item.price;
      const y = 186 + index * 39;
      const status = equipped ? "Equipped" : owned ? "Equip" : canAfford ? `${item.price} coins` : `Need ${item.price}`;
      const row = button(this, 790, y, 382, 32, `${item.label}  |  ${status}`, () => this.buyOrEquip(item.id), 934);
      const swatch = this.add.rectangle(595, y, 20, 20, item.tint, 1)
        .setStrokeStyle(1, item.accent ?? 0xf5e6b8)
        .setDepth(935);
      children.push(row, swatch);
    });
  }

  private renderDetails(children: Phaser.GameObjects.GameObject[]): void {
    const equipped = equippedHorseItem(this.save.horseCustomization, this.category);
    const item = horseCustomizationItem(this.save.horseCustomization.equipped[this.category]) ?? equipped;
    children.push(this.add.rectangle(866, 524, 420, 118, 0x24180f, 0.86)
      .setStrokeStyle(2, Palette.goldDark)
      .setDepth(932));
    children.push(this.add.text(670, 476, `Equipped: ${item.label}`, {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: PaletteCss.gold
    }).setDepth(933));
    children.push(this.add.text(670, 508, item.description, {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: PaletteCss.cream,
      wordWrap: { width: 382 },
      lineSpacing: 6
    }).setDepth(933));
    if (item.effectLabel) {
      children.push(this.add.text(670, 552, item.effectLabel, {
        fontFamily: "Georgia",
        fontSize: "15px",
        color: "#9be07d",
        wordWrap: { width: 382 },
        lineSpacing: 4
      }).setDepth(933));
    }
    children.push(this.add.text(670, 588, this.feedback, {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: PaletteCss.cream,
      wordWrap: { width: 382 }
    }).setDepth(933));
  }

  private buyOrEquip(itemId: string): void {
    const result = buyOrEquipHorseCustomization(this.save, itemId);
    this.feedback = result.message;
    if (result.ok) {
      this.save = result.save;
      SaveSystem.save(this.save);
    }
    this.render();
  }

  private renameHorse(): void {
    const next = window.prompt("Name your horse", this.save.stats.horseName);
    if (!next) return;
    const horseName = next.trim().slice(0, 18);
    if (!horseName) return;
    this.save = {
      ...this.save,
      stats: normalizeStats({ ...this.save.stats, horseName })
    };
    SaveSystem.save(this.save);
    this.feedback = `Renamed horse to ${horseName}.`;
    this.render();
  }

  private close(): void {
    SaveSystem.save(this.save);
    this.scene.stop();
    this.scene.resume(this.returnScene);
  }
}
