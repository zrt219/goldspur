import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { button, panel } from "../art/UITheme";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";

const CREDITS_LINES = [
  "Goldspur Valley",
  "",
  "Story Mode",
  "A ranch tale about trust, training, and the road west.",
  "",
  "Design & Development",
  "Built with Phaser and TypeScript.",
  "",
  "World",
  "Goldspur Ranch, Steer Town, Mammee Bay, Drax Hall, St Ann's Bay, Ocho Rios, Runaway Bay, Brown's Town, and Discovery Bay.",
  "",
  "Thanks",
  "To every player who stops to brush the horse before chasing the next race.",
  "",
  "Ride steady."
];

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super("CreditsScene");
  }

  create(): void {
    this.paintBackdrop();
    panel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 760, 560, 5);
    this.add.text(GAME_WIDTH / 2, 105, "Credits", {
      fontFamily: "Georgia",
      fontSize: "43px",
      color: PaletteCss.gold
    }).setOrigin(0.5).setDepth(7);

    const credits = this.add.text(GAME_WIDTH / 2, 232, CREDITS_LINES.join("\n"), {
      fontFamily: "Georgia",
      fontSize: "21px",
      color: PaletteCss.cream,
      align: "center",
      lineSpacing: 10,
      wordWrap: { width: 660 }
    }).setOrigin(0.5, 0).setDepth(7);
    this.tweens.add({
      targets: credits,
      y: 175,
      duration: 9000,
      ease: "Sine.easeInOut"
    });

    button(this, GAME_WIDTH / 2, 620, 180, 44, "Back", () => this.scene.start("MainMenuScene"), 8);
    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("MainMenuScene"));
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start("MainMenuScene"));
  }

  private paintBackdrop(): void {
    this.cameras.main.setBackgroundColor("#15100a");
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, Palette.darkPanel, 1);
    this.add.circle(245, 165, 74, Palette.gold, 0.16).setStrokeStyle(2, Palette.goldDark, 0.45);
    this.add.rectangle(GAME_WIDTH / 2, 610, GAME_WIDTH, 160, Palette.woodDark, 0.72);
    this.add.ellipse(960, 260, 390, 130, Palette.grassDark, 0.36);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.18).setOrigin(0);
  }
}
