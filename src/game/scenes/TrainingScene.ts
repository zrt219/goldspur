import Phaser from "phaser";
import { IMAGE_KEYS } from "../data/constants";
import { TRAINING_DRILLS, TrainingDrill } from "../data/training";
import { InteractionSystem, InteractionTarget } from "../systems/InteractionSystem";
import { BaseWorldScene } from "./BaseWorldScene";

export class TrainingScene extends BaseWorldScene {
  private interactions!: InteractionSystem<TrainingDrill>;

  constructor() {
    super("TrainingScene", "Training");
  }

  create(): void {
    this.createBase(IMAGE_KEYS.trainingClean, 640, 420);
    const targets: Array<InteractionTarget<TrainingDrill>> = TRAINING_DRILLS.map((drill) => ({
      id: drill.id,
      label: drill.label,
      prompt: `${drill.prompt} (${this.preview(drill)})`,
      x: drill.x,
      y: drill.y,
      data: drill
    }));
    this.interactions = new InteractionSystem(targets);
    TRAINING_DRILLS.forEach((drill) => {
      this.marker(drill.x, drill.y, drill.label, 0xffd36e, drill.id);
      this.clickZone(drill.x, drill.y, 72, () => this.runDrill(drill));
    });
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.ui.messageBox.isOpen() || this.ui.travelMenu.isOpen()) return;
    const target = this.interactions.nearest(new Phaser.Math.Vector2(this.player.x, this.player.y));
    this.setActiveInteraction(target?.id ?? null);
    this.ui.setPrompt(target ? this.formatPrompt(target.prompt) : this.mountPrompt() ?? "");
    if (target && this.actionJustDown("primaryInteract")) this.runDrill(target.data);
    else this.handleMountInput();
  }

  private runDrill(drill: TrainingDrill): void {
    if (this.stats.energy < drill.requirement) {
      this.ui.messageBox.show("Not Enough Energy", `Not enough energy for ${drill.label}. Visit Relaxation or end the day.`);
      return;
    }
    const { before, after } = this.mutateStats(drill.delta);
    const lines = Object.entries(drill.delta).map(([key, value]) => {
      const oldValue = before[key as keyof typeof before];
      const newValue = after[key as keyof typeof after];
      const sign = value > 0 ? "+" : "";
      return `${this.label(key)} ${oldValue} -> ${newValue}  ${sign}${value}`;
    });
    this.completeStoryQuest("training-ring");
    this.completeStoryQuest("stable-challenge");
    this.ui.messageBox.show(`${drill.label} Complete!`, lines.join("\n"));
  }

  private preview(drill: TrainingDrill): string {
    return Object.entries(drill.delta)
      .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${this.label(key)}`)
      .join(", ");
  }

  private label(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}
