import Phaser from "phaser";
import { IMAGE_KEYS } from "../data/constants";
import { BASIC_RECOVERY } from "../data/recovery";
import { InteractionSystem, InteractionTarget } from "../systems/InteractionSystem";
import { BaseWorldScene } from "./BaseWorldScene";

type CareTarget = {
  kind: "basic_recovery" | "vet_check" | "cool_down";
  label: string;
  prompt: string;
  x: number;
  y: number;
  cost: number;
  delta: {
    health?: number;
    stamina?: number;
    energy?: number;
    mood?: number;
    coins: number;
  };
};

const CARE_TARGETS: CareTarget[] = [
  {
    kind: "basic_recovery",
    label: BASIC_RECOVERY.label,
    prompt: "E - Recover Horse (+Stamina & Health)",
    x: BASIC_RECOVERY.x,
    y: BASIC_RECOVERY.y,
    cost: BASIC_RECOVERY.cost,
    delta: BASIC_RECOVERY.delta
  },
  {
    kind: "vet_check",
    label: "Vet Checkup",
    prompt: "E - Vet Checkup (+Health)",
    x: 520,
    y: 408,
    cost: 15,
    delta: { health: 18, mood: 2, coins: -15 }
  },
  {
    kind: "cool_down",
    label: "Cool Down Bay",
    prompt: "E - Cool Down (+Energy)",
    x: 780,
    y: 438,
    cost: 10,
    delta: { health: 6, energy: 12, coins: -10 }
  }
];

export class HealthScene extends BaseWorldScene {
  private interactions!: InteractionSystem<CareTarget>;

  constructor() {
    super("HealthScene", "Health");
  }

  create(): void {
    this.createBase(IMAGE_KEYS.healthClean, 620, 455);
    const targets: Array<InteractionTarget<CareTarget>> = CARE_TARGETS.map((target) => ({
      id: target.kind,
      label: target.label,
      prompt: target.prompt,
      x: target.x,
      y: target.y,
      radius: 86,
      data: target
    }));
    this.interactions = new InteractionSystem(targets);
    targets.forEach((target) => {
      this.marker(target.x, target.y, target.label, target.data.kind === "basic_recovery" ? 0x8ff099 : 0xf1c86d, target.id);
      this.clickZone(target.x, target.y, target.radius ?? 78, () => this.recover(target.data));
    });
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.ui.messageBox.isOpen() || this.ui.travelMenu.isOpen()) return;
    const target = this.interactions.nearest(new Phaser.Math.Vector2(this.player.x, this.player.y));
    this.setActiveInteraction(target?.id ?? null);
    this.ui.setPrompt(target ? this.formatPrompt(target.prompt) : this.mountPrompt() ?? "");
    if (target && this.actionJustDown("primaryInteract")) this.recover(target.data);
    else this.handleMountInput();
  }

  private recover(target: CareTarget): void {
    if (this.stats.coins < target.cost) {
      this.ui.messageBox.show("Not Enough Coins", `You need ${target.cost} coins for ${target.label}.`);
      return;
    }
    this.mutateStats(target.delta);
    this.completeStoryQuest("first-brush");
    this.completeStoryQuest("rainy-day-care");
    this.ui.messageBox.show(target.label, this.recoverySummary(target));
  }

  private recoverySummary(target: CareTarget): string {
    const changes = Object.entries(target.delta)
      .filter(([, value]) => Number(value) !== 0)
      .map(([key, value]) => `${this.statName(key)} ${Number(value) > 0 ? "+" : ""}${value}`);
    return [`Care complete.`, ...changes].join("\n");
  }

  private statName(key: string): string {
    if (key === "coins") return "Coins";
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
}
