import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { button, panel } from "../art/UITheme";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";
import { CHARACTERS, CharacterDefinition } from "../data/characters";
import { applyStatDelta, HorseStats } from "../systems/HorseStats";
import { SaveSystem } from "../systems/SaveSystem";

export class CharacterSelectScene extends Phaser.Scene {
  private selected?: CharacterDefinition;
  private detailText?: Phaser.GameObjects.Text;

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    this.paintBackdrop();
    const save = SaveSystem.load();
    this.selected = CHARACTERS.find((character) => character.id === save.selectedCharacterId) ?? CHARACTERS[0];

    this.add.text(GAME_WIDTH / 2, 64, "Choose Your Rider", {
      fontFamily: "Georgia",
      fontSize: "43px",
      color: PaletteCss.gold
    }).setOrigin(0.5).setDepth(5);
    this.add.text(GAME_WIDTH / 2, 112, "Each rider begins with a different horse and starter strength.", {
      fontFamily: "Georgia",
      fontSize: "19px",
      color: PaletteCss.cream
    }).setOrigin(0.5).setDepth(5);

    CHARACTERS.forEach((character, index) => this.createCharacterCard(character, index));
    panel(this, GAME_WIDTH / 2, 612, 850, 112, 5);
    this.detailText = this.add.text(255, 575, "", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: PaletteCss.cream,
      lineSpacing: 6,
      wordWrap: { width: 540 }
    }).setDepth(6);
    button(this, 845, 610, 180, 44, "Begin", () => this.beginStory(), 7);
    button(this, 1040, 610, 160, 44, "Back", () => this.scene.start("MainMenuScene"), 7);
    this.updateDetails();

    this.input.keyboard?.once("keydown-ENTER", () => this.beginStory());
    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("MainMenuScene"));
  }

  private createCharacterCard(character: CharacterDefinition, index: number): void {
    const x = 220 + index * 280;
    const y = 334;
    const card = panel(this, x, y, 235, 330, 5)
      .setInteractive({ useHandCursor: true });
    const selectedRing = this.add.rectangle(x, y, 249, 344, character.accentColor, 0)
      .setStrokeStyle(4, character.accentColor, this.selected?.id === character.id ? 0.95 : 0)
      .setDepth(6);
    this.add.ellipse(x, y + 108, 104, 26, 0x000000, 0.28).setDepth(6);
    this.add.circle(x, y - 82, 42, character.color, 1)
      .setStrokeStyle(3, character.accentColor)
      .setDepth(7);
    this.add.rectangle(x, y + 6, 68, 118, character.color, 0.98)
      .setStrokeStyle(3, character.accentColor)
      .setDepth(7);
    this.add.text(x, y + 87, character.name, {
      fontFamily: "Georgia",
      fontSize: "21px",
      color: PaletteCss.gold,
      align: "center",
      fixedWidth: 200
    }).setOrigin(0.5).setDepth(7);
    this.add.text(x, y + 124, character.title, {
      fontFamily: "Georgia",
      fontSize: "15px",
      color: PaletteCss.cream,
      align: "center",
      fixedWidth: 190
    }).setOrigin(0.5).setDepth(7);
    this.add.text(x, y + 168, `Horse: ${character.horseName}`, {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#d9c795",
      align: "center",
      fixedWidth: 190
    }).setOrigin(0.5).setDepth(7);

    const choose = () => {
      this.selected = character;
      this.updateDetails();
      selectedRing.setStrokeStyle(4, character.accentColor, 0.95);
      this.children.list.forEach((child) => {
        if (child !== selectedRing && child.getData?.("characterRing")) {
          (child as Phaser.GameObjects.Rectangle).setStrokeStyle(4, Palette.gold, 0);
        }
      });
    };
    selectedRing.setData("characterRing", true);
    card.on("pointerdown", choose);
    selectedRing.setInteractive({ useHandCursor: true }).on("pointerdown", choose);
  }

  private updateDetails(): void {
    if (!this.detailText || !this.selected) return;
    this.detailText.setText([
      `${this.selected.name} of ${this.selected.hometown}`,
      this.selected.summary,
      `Starter bonus: ${this.bonusText(this.selected.starterBonus)}`
    ].join("\n"));
  }

  private beginStory(): void {
    if (!this.selected) return;
    const save = SaveSystem.load();
    const firstSelection = !save.selectedCharacterId;
    const stats: HorseStats = firstSelection
      ? applyStatDelta({ ...save.stats, horseName: this.selected.horseName }, this.selected.starterBonus)
      : { ...save.stats, horseName: this.selected.horseName };
    SaveSystem.save({
      stats,
      inventory: save.inventory,
      world: save.world,
      story: save.story,
      selectedCharacterId: this.selected.id
    });
    this.scene.start("RanchScene");
  }

  private bonusText(bonus: Partial<Record<keyof HorseStats, number>>): string {
    return Object.entries(bonus)
      .map(([key, value]) => `+${value} ${key}`)
      .join(", ");
  }

  private paintBackdrop(): void {
    this.cameras.main.setBackgroundColor("#141b13");
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x141b13, 1);
    this.add.rectangle(GAME_WIDTH / 2, 450, GAME_WIDTH, 220, Palette.dirtDark, 0.72);
    this.add.ellipse(260, 210, 380, 160, Palette.grassDark, 0.75);
    this.add.ellipse(1015, 220, 440, 170, Palette.grass, 0.48);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.18).setOrigin(0);
  }
}
