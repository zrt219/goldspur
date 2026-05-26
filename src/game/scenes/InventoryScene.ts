import Phaser from "phaser";
import { button, panel } from "../art/UITheme";
import { GAME_HEIGHT, GAME_WIDTH, IMAGE_KEYS } from "../data/constants";
import { InventoryItemId, InventoryState, ITEM_DESCRIPTIONS, ITEM_LABELS } from "../data/items";
import { horseCustomizationSummary } from "../data/horseCustomization";
import { applyStatDelta, HorseStats } from "../systems/HorseStats";
import { careDeltaForItem, careItemActionLabel, healthStatus, isCareItem, isConsumableCareItem } from "../systems/HealthSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { completeQuestInSave } from "../systems/StoryQuestSystem";
import { destinationByParishId } from "../data/jamaicaTravel";
import { bindingLabel, loadGameSettings } from "../systems/GameSettings";

type InventorySceneData = {
  returnScene: string;
  stats: HorseStats;
  inventory: InventoryState;
};

const ITEM_ORDER: InventoryItemId[] = [
  "carrots",
  "hay",
  "bucket",
  "horseshoe",
  "brush",
  "saddle",
  "oats",
  "apple",
  "rope",
  "lantern",
  "nail_kit",
  "watering_can",
  "horse_tracker"
];

export class InventoryScene extends Phaser.Scene {
  private stats!: HorseStats;
  private inventory!: InventoryState;
  private description!: Phaser.GameObjects.Text;
  private tooltip!: Phaser.GameObjects.Text;
  private feedback!: Phaser.GameObjects.Text;
  private useButton!: Phaser.GameObjects.Container;
  private selectedItem?: InventoryItemId;
  private returnScene = "RanchScene";
  private quantityTexts = new Map<InventoryItemId, Phaser.GameObjects.Text>();
  private itemCells = new Map<InventoryItemId, Phaser.GameObjects.Rectangle>();
  private trackerPanel?: Phaser.GameObjects.Container;

  constructor() {
    super("InventoryScene");
  }

  create(data: InventorySceneData): void {
    const save = SaveSystem.load();
    this.stats = data.stats ?? save.stats;
    this.inventory = data.inventory ?? save.inventory;
    this.returnScene = data.returnScene || "RanchScene";

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.68).setDepth(1);
    if (this.textures.exists(IMAGE_KEYS.inventoryReference)) {
      this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, IMAGE_KEYS.inventoryReference)
        .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
        .setDepth(2)
        .setAlpha(0.36);
    }
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1000, 610, 0x1b1510, 0.94)
      .setStrokeStyle(3, 0xd5a84d)
      .setDepth(3);
    this.add.text(170, 90, "Horse Info", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f8dd91"
    }).setDepth(4);
    this.add.text(170, 136, this.horseInfo(), {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#fff3cf",
      lineSpacing: 7,
      wordWrap: { width: 238 }
    }).setDepth(4);
    this.add.text(470, 90, "Inventory", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f8dd91"
    }).setDepth(4);

    ITEM_ORDER.forEach((item, index) => this.createItemCell(item, index));
    this.description = this.add.text(170, 575, `Pick a treat or tool for ${this.stats.horseName}. Food helps right away. Select an item for details.`, {
      fontFamily: "Georgia",
      fontSize: "19px",
      color: "#fff3cf",
      wordWrap: { width: 660 }
    }).setDepth(4);
    this.feedback = this.add.text(170, 646, "Care status: " + healthStatus(this.stats).label, {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: healthStatus(this.stats).color,
      wordWrap: { width: 620 }
    }).setDepth(4);
    this.tooltip = this.add.text(0, 0, "", {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#fff3cf",
      backgroundColor: "rgba(21,16,10,0.94)",
      padding: { x: 12, y: 8 },
      wordWrap: { width: 300 }
    }).setDepth(8).setVisible(false);
    this.useButton = button(this, 840, 634, 150, 44, "Use / Open", () => this.useSelected(), 5, "Use care items or open the selected tool.");
    button(this, 1018, 634, 140, 44, "Close", () => this.close(this.returnScene), 5, "Return to the game.");

    this.input.keyboard?.once("keydown-I", () => this.close(this.returnScene));
    this.input.keyboard?.once("keydown-ESC", () => this.close(this.returnScene));
  }

  private createItemCell(item: InventoryItemId, index: number): void {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 520 + col * 205;
    const y = 158 + row * 88;
    const bg = this.add.rectangle(x, y, 184, 78, 0x2a1d12, 0.95)
      .setStrokeStyle(2, isCareItem(item) ? 0x9be07d : 0x9f7937)
      .setInteractive({ useHandCursor: true })
      .setDepth(4);
    this.itemCells.set(item, bg);
    this.add.image(x - 58, y - 2, this.iconKey(item))
      .setDisplaySize(58, 58)
      .setDepth(5);
    const label = this.add.text(x - 8, y - 18, ITEM_LABELS[item], {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: "#f8dd91",
      fixedWidth: 92,
      wordWrap: { width: 92 }
    }).setOrigin(0, 0.5).setDepth(5);
    const badge = this.add.rectangle(x + 63, y + 25, 48, 26, 0xf5e6b8, 0.96)
      .setStrokeStyle(2, 0xd4af37)
      .setDepth(5);
    const quantity = this.add.text(x + 63, y + 25, `x${this.inventory[item]}`, {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: "#15100a"
    }).setOrigin(0.5).setDepth(5);
    const ribbonLabel = item === "horse_tracker" ? "Tool" : isCareItem(item) ? "Care" : "Item";
    this.add.rectangle(x - 52, y - 32, 58, 20, item === "horse_tracker" ? 0xd4af37 : isCareItem(item) ? 0x3f7f35 : 0x6b4b2b, 0.98)
      .setDepth(5);
    this.add.text(x - 52, y - 32, ribbonLabel, {
      fontFamily: "Georgia",
      fontSize: "12px",
      color: item === "horse_tracker" ? "#15100a" : "#fff3cf"
    }).setOrigin(0.5).setDepth(6);
    void label;
    void badge;
    this.quantityTexts.set(item, quantity);
    bg.on("pointerover", () => this.showTooltip(item, x, y));
    bg.on("pointerout", () => this.tooltip.setVisible(false));
    bg.on("pointerdown", () => this.selectItem(item));
  }

  private selectItem(item: InventoryItemId): void {
    this.selectedItem = item;
    this.trackerPanel?.destroy(true);
    this.trackerPanel = undefined;
    this.description.setText(`${ITEM_LABELS[item]}\n${ITEM_DESCRIPTIONS[item]}\nQuantity: ${this.inventory[item]}`);
    this.feedback.setText(this.actionHint(item)).setColor(item === "horse_tracker" || this.isUsable(item) ? "#9be07d" : "#d9c795");
    this.itemCells.forEach((cell, key) => {
      cell.setStrokeStyle(key === item ? 3 : 2, key === item ? 0xf8dd91 : 0x9f7937);
      cell.setFillStyle(key === item ? 0x4a3018 : 0x2a1d12, 0.95);
    });
  }

  private useSelected(): void {
    const item = this.selectedItem;
    if (!item) {
      this.feedback.setText("Select an item first. Food and care tools are the fastest way to help your horse.").setColor("#ffcf8a");
      return;
    }
    if (this.inventory[item] <= 0) {
      this.feedback.setText(`${ITEM_LABELS[item]} is empty.`).setColor("#ffcf8a");
      return;
    }
    if (item === "horse_tracker") {
      this.openHorseTracker();
      return;
    }
    const delta = careDeltaForItem(item);
    if (!delta) {
      this.feedback.setText(`${ITEM_LABELS[item]} is for inspecting or future upgrades.`).setColor("#d9c795");
      return;
    }
    if (isConsumableCareItem(item)) this.inventory[item] -= 1;
    this.stats = applyStatDelta(this.stats, delta);
    const save = SaveSystem.load();
    const quest = completeQuestInSave({ ...save, stats: this.stats, inventory: this.inventory }, "morning-feed");
    this.stats = quest.save.stats;
    this.inventory = quest.save.inventory;
    SaveSystem.save(quest.save);
    this.quantityTexts.get(item)?.setText(`x${this.inventory[item]}`);
    this.selectItem(item);
    this.feedback.setText(`${careItemActionLabel(item)}: ${this.deltaSummary(delta)}.`).setColor("#9be07d");
  }

  private showTooltip(item: InventoryItemId, x: number, y: number): void {
    const action = item === "horse_tracker"
      ? "Click to select, then open the tracker."
      : this.isUsable(item)
        ? "Click to select, then press Use / Open."
        : "Click to inspect.";
    this.tooltip
      .setText(`${ITEM_LABELS[item]}\n${ITEM_DESCRIPTIONS[item]}\n${action}`)
      .setPosition(Phaser.Math.Clamp(x - 120, 210, GAME_WIDTH - 310), y - 92)
      .setVisible(true);
  }

  private isUsable(item: InventoryItemId): boolean {
    return isCareItem(item);
  }

  private actionHint(item: InventoryItemId): string {
    if (item === "horse_tracker") return "Ready: open the horse tracker panel.";
    if (this.isUsable(item)) return "Ready: press Use / Open to care for your horse.";
    return "Inspect item: no direct action yet.";
  }

  private deltaSummary(delta: Record<string, unknown>): string {
    return Object.entries(delta)
      .filter(([, value]) => typeof value === "number" && value !== 0)
      .map(([key, value]) => `${this.statName(key)} ${Number(value) > 0 ? "+" : ""}${value}`)
      .join(", ");
  }

  private statName(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  private iconKey(item: InventoryItemId): string {
    return `inventory_${item}`;
  }

  private openHorseTracker(): void {
    this.trackerPanel?.destroy(true);
    const save = SaveSystem.load();
    const settings = loadGameSettings();
    const parish = destinationByParishId(save.world.currentParishId);
    const position = save.world.horsePosition ?? save.world.openWorldPosition;
    const chunkLine = position
      ? `Last fix: chunk ${position.chunkX}, ${position.chunkY}`
      : "Last fix: ranch yard";
    const distanceLine = position && save.world.openWorldPosition
      ? `Distance from last rider fix: ${Math.round(Phaser.Math.Distance.Between(position.x, position.y, save.world.openWorldPosition.x, save.world.openWorldPosition.y) / 32)} paces`
      : "Distance from rider: nearby";
    const trackerMode = settings.world.horseTrackerAlwaysOn ? "Mini map marker: active" : "Mini map marker: tool gated";
    const body = [
      `Horse: ${this.stats.horseName}`,
      `Parish: ${parish.shoreName}, ${parish.name}`,
      chunkLine,
      distanceLine,
      trackerMode,
      `Mount key: ${bindingLabel(settings.bindings.mount)}`,
      "",
      "Mini map: ringed amber dot."
    ].join("\n");
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.54)
      .setDepth(12)
      .setInteractive();
    const surface = panel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 600, 390, 13);
    const title = this.add.text(GAME_WIDTH / 2, 206, "Horse Tracker", {
      fontFamily: "Georgia",
      fontSize: "27px",
      color: "#f8dd91"
    }).setOrigin(0.5).setDepth(14);
    const text = this.add.text(384, 252, body, {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: "#fff3cf",
      lineSpacing: 6,
      wordWrap: { width: 512 }
    }).setDepth(14);
    const close = button(this, GAME_WIDTH / 2, 534, 150, 40, "Close", () => {
      this.trackerPanel?.destroy(true);
      this.trackerPanel = undefined;
    }, 15, "Close the tracker panel.");
    this.trackerPanel = this.add.container(0, 0, [shade, surface, title, text, close]).setDepth(12);
  }

  private horseInfo(): string {
    const status = healthStatus(this.stats);
    const style = horseCustomizationSummary(SaveSystem.load().horseCustomization).split(",").slice(0, 2).join(",");
    return [
      `Horse: ${this.stats.horseName}`,
      `Style: ${style}`,
      `Care: ${status.label}`,
      `Speed: ${this.stats.speed}`,
      `Stamina: ${this.stats.stamina}`,
      `Health: ${this.stats.health}`,
      `Mood: ${this.stats.mood}`,
      `Bond: ${this.stats.bond}`,
      `Energy: ${this.stats.energy}`,
      `Coins: ${this.stats.coins}`,
      `Day: ${this.stats.day}`
    ].join("\n");
  }

  private close(returnScene: string): void {
    SaveSystem.save({ stats: this.stats, inventory: this.inventory });
    this.scene.stop();
    this.scene.resume(returnScene || "RanchScene");
  }
}
