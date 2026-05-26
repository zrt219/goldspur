import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";

export type TravelDestination = "RanchScene" | "TrainingScene" | "RacingScene" | "HealthScene" | "RelaxationScene" | "OpenWorldScene";

const DESTINATIONS: Array<{ scene: TravelDestination | null; label: string }> = [
  { scene: "RanchScene", label: "Ranch" },
  { scene: "TrainingScene", label: "Training Grounds" },
  { scene: "RacingScene", label: "Racing Track" },
  { scene: "HealthScene", label: "Health & Care" },
  { scene: "RelaxationScene", label: "Relaxation Meadow" },
  { scene: "OpenWorldScene", label: "St Ann Route" }
];

export class TravelMenu {
  private container: Phaser.GameObjects.Container;
  private open = false;

  constructor(private readonly scene: Phaser.Scene, private readonly onTravel: (scene: TravelDestination) => void) {
    const panel = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 430, 500, 0x1d1710, 0.95)
      .setStrokeStyle(3, 0xd5a84d);
    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 216, "Travel Board", {
      fontFamily: "Georgia",
      fontSize: "30px",
      color: "#f8dd91"
    }).setOrigin(0.5);
    const subtitle = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, "Choose where to ride.", {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: "#fff3cf"
    }).setOrigin(0.5);
    const children: Phaser.GameObjects.GameObject[] = [panel, title, subtitle];
    DESTINATIONS.forEach((destination, index) => {
      const y = GAME_HEIGHT / 2 - 126 + index * 46;
      const row = scene.add.rectangle(GAME_WIDTH / 2, y, 280, 40, 0x3b2716, 0.98)
        .setStrokeStyle(1, 0xf0c66a)
        .setInteractive({ useHandCursor: true });
      const label = scene.add.text(GAME_WIDTH / 2, y, destination.label, {
        fontFamily: "Georgia",
        fontSize: "20px",
        color: "#fff3cf"
      }).setOrigin(0.5);
      row.on("pointerdown", () => {
        this.hide();
        if (destination.scene) this.onTravel(destination.scene);
      });
      children.push(row, label);
    });
    const close = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 196, 150, 40, 0x3b2716, 0.98)
      .setStrokeStyle(1, 0xf0c66a)
      .setInteractive({ useHandCursor: true });
    const closeLabel = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 196, "Close", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#fff3cf"
    }).setOrigin(0.5);
    close.on("pointerdown", () => this.hide());
    children.push(close, closeLabel);
    children.forEach((child) => {
      const fixed = child as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor;
      fixed.setScrollFactor?.(0);
    });
    this.container = scene.add.container(0, 0, children).setDepth(850).setVisible(false).setScrollFactor(0);
    scene.input.keyboard?.on("keydown-ESC", this.handleKeyboardClose);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off("keydown-ESC", this.handleKeyboardClose);
    });
  }

  toggle(): void {
    this.open ? this.hide() : this.show();
  }

  show(): void {
    this.open = true;
    this.container.setVisible(true);
  }

  hide(): void {
    this.open = false;
    this.container.setVisible(false);
  }

  isOpen(): boolean {
    return this.open;
  }

  private readonly handleKeyboardClose = (): void => {
    if (this.open) this.hide();
  };
}
