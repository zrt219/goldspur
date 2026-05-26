import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";

export class MessageBox {
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private visible = false;
  private onClose?: () => void;
  private shownAt = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const panel = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 320, 0x20160f, 0.94)
      .setStrokeStyle(3, 0xd5a84d);
    const title = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 122, "", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f7e6ba",
      align: "center"
    }).setOrigin(0.5);
    this.text = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 68, "", {
      fontFamily: "Georgia",
      fontSize: "19px",
      color: "#fff3cf",
      align: "center",
      lineSpacing: 8,
      wordWrap: { width: 482 }
    }).setOrigin(0.5, 0);
    const button = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, 150, 44, 0x5d3a1d, 1)
      .setStrokeStyle(2, 0xf1c86d)
      .setInteractive({ useHandCursor: true });
    const buttonText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110, "Continue", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#fff3cf"
    }).setOrigin(0.5);
    const keyboardHint = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 144, "Enter / Space: continue", {
      fontFamily: "Georgia",
      fontSize: "14px",
      color: "#d9c795"
    }).setOrigin(0.5);
    button.on("pointerdown", () => this.close());
    [panel, title, this.text, button, buttonText, keyboardHint].forEach((child) => child.setScrollFactor(0));
    this.container = scene.add.container(0, 0, [panel, title, this.text, button, buttonText, keyboardHint])
      .setDepth(900)
      .setVisible(false)
      .setScrollFactor(0);
    this.container.setData("title", title);
    scene.input.keyboard?.on("keydown-ENTER", this.handleKeyboardContinue);
    scene.input.keyboard?.on("keydown-SPACE", this.handleKeyboardContinue);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off("keydown-ENTER", this.handleKeyboardContinue);
      scene.input.keyboard?.off("keydown-SPACE", this.handleKeyboardContinue);
    });
  }

  show(title: string, body: string, onClose?: () => void): void {
    const titleText = this.container.getData("title") as Phaser.GameObjects.Text;
    titleText.setText(title);
    this.text.setText(body);
    this.onClose = onClose;
    this.visible = true;
    this.shownAt = this.scene.time.now;
    this.container.setVisible(true);
  }

  close(): void {
    if (!this.visible) return;
    this.visible = false;
    this.container.setVisible(false);
    this.onClose?.();
    this.onClose = undefined;
  }

  isOpen(): boolean {
    return this.visible;
  }

  private readonly handleKeyboardContinue = (): void => {
    if (!this.visible || this.scene.time.now - this.shownAt < 120) return;
    this.close();
  };
}
