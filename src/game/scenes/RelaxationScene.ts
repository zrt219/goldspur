import Phaser from "phaser";
import { IMAGE_KEYS } from "../data/constants";
import { InteractionSystem, InteractionTarget } from "../systems/InteractionSystem";
import { BaseWorldScene } from "./BaseWorldScene";

type RelaxTarget = "relax";
type RelaxAction = "relax" | "end_day";

export class RelaxationScene extends BaseWorldScene {
  private interactions!: InteractionSystem<RelaxAction>;

  constructor() {
    super("RelaxationScene", "Relaxation");
  }

  create(): void {
    this.createBase(IMAGE_KEYS.relaxationClean, 700, 430);
    const target: InteractionTarget<RelaxAction> = {
      id: "relax",
      label: "Relax in Meadow",
      prompt: "E - Relax and restore",
      x: 690,
      y: 410,
      data: "relax"
    };
    const endDayTarget: InteractionTarget<RelaxAction> = {
      id: "end_day",
      label: "End Day",
      prompt: "E - End the day",
      x: 965,
      y: 470,
      data: "end_day"
    };
    this.interactions = new InteractionSystem([target, endDayTarget]);
    this.marker(690, 410, "Relax in Meadow", 0x93d98f, target.id);
    this.clickZone(690, 410, 78, () => this.relax());
    this.marker(965, 470, "End Day", 0xf1c86d, endDayTarget.id);
    this.clickZone(965, 470, 78, () => this.endDay());
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.ui.messageBox.isOpen() || this.ui.travelMenu.isOpen()) return;
    const target = this.interactions.nearest(new Phaser.Math.Vector2(this.player.x, this.player.y));
    this.setActiveInteraction(target?.id ?? null);
    const uses = `Uses: ${this.stats.relaxUsesToday}/3`;
    this.ui.setPrompt(target ? `${this.formatPrompt(target.prompt)}   ${uses}` : this.mountPrompt() ?? uses);
    if (target && this.actionJustDown("primaryInteract")) {
      target.data === "relax" ? this.relax() : this.endDay();
    } else this.handleMountInput();
  }

  private relax(): void {
    if (this.stats.relaxUsesToday <= 0) {
      this.ui.messageBox.show("Rested Enough", "Your horse has relaxed enough today. End the day to reset.");
      return;
    }
    this.mutateStats({ mood: 20, energy: 20, bond: 3, relaxUsesToday: -1 });
    this.completeStoryQuest("quiet-meadow");
    this.ui.messageBox.show("Relaxed in the Meadow", "Relaxed in the meadow. Mood +20, Energy +20, Bond +3.");
  }

  private endDay(): void {
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.mutateStats({ day: 1, relaxUsesToday: 3 - this.stats.relaxUsesToday, energy: 20, mood: 5 });
    this.time.delayedCall(240, () => {
      this.cameras.main.fadeIn(260, 0, 0, 0);
      this.ui.messageBox.show("New Day", `Day ${this.stats.day} begins. Energy restored slightly.`);
    });
  }
}
