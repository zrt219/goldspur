import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, IMAGE_KEYS } from "../data/constants";
import { BEGINNER_SPRINT, getRaceOutcome } from "../data/races";
import { InteractionSystem, InteractionTarget } from "../systems/InteractionSystem";
import { MOUNTED_ANIMATION_KEYS, MOUNTED_IDLE_KEY } from "../systems/AnimationLoader";
import { BaseWorldScene } from "./BaseWorldScene";

type RaceState = "idle" | "start" | "running" | "results";

export class RacingScene extends BaseWorldScene {
  private interactions!: InteractionSystem<typeof BEGINNER_SPRINT>;
  private raceState: RaceState = "idle";
  private raceOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super("RacingScene", "Racing");
  }

  create(): void {
    this.createBase(IMAGE_KEYS.racingClean, 638, 560);
    const target: InteractionTarget<typeof BEGINNER_SPRINT> = {
      id: BEGINNER_SPRINT.id,
      label: BEGINNER_SPRINT.label,
      prompt: "E - Enter Beginner Sprint Race",
      x: BEGINNER_SPRINT.x,
      y: BEGINNER_SPRINT.y,
      data: BEGINNER_SPRINT
    };
    this.interactions = new InteractionSystem([target]);
    this.marker(BEGINNER_SPRINT.x, BEGINNER_SPRINT.y, "Beginner Sprint", 0xf1c86d, target.id);
    this.clickZone(BEGINNER_SPRINT.x, BEGINNER_SPRINT.y, 92, () => this.enterRace());
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.ui.messageBox.isOpen() || this.ui.travelMenu.isOpen()) return;

    if (this.raceState === "start") {
      this.ui.setPrompt(`${this.actionLabel("jump")} or ${this.actionLabel("primaryInteract")} - Start race`);
      if (this.actionJustDown("jump") || this.actionJustDown("primaryInteract")) {
        this.runRace();
      }
      return;
    }

    if (this.raceState !== "idle") return;
    const target = this.interactions.nearest(new Phaser.Math.Vector2(this.player.x, this.player.y), 120);
    this.setActiveInteraction(target?.id ?? null);
    this.ui.setPrompt(target ? this.formatPrompt(target.prompt) : this.mountPrompt() ?? "");
    if (target && this.actionJustDown("primaryInteract")) this.enterRace();
    else this.handleMountInput();
  }

  protected override canStartMountedJump(): boolean {
    return this.raceState === "idle";
  }

  private enterRace(): void {
    if (
      this.stats.stamina < BEGINNER_SPRINT.staminaRequired ||
      this.stats.health < BEGINNER_SPRINT.healthRequired ||
      this.stats.energy < BEGINNER_SPRINT.energyRequired
    ) {
      this.ui.messageBox.show("Needs Recovery", "Your horse needs more recovery before racing.");
      return;
    }

    this.raceState = "start";
    this.showRaceStartCard();
  }

  private showRaceStartCard(): void {
    this.raceOverlay?.destroy(true);
    const panel = this.add.rectangle(GAME_WIDTH / 2, 122, 430, 112, 0x1d1710, 0.9)
      .setStrokeStyle(3, 0xd5a84d);
    const title = this.add.text(GAME_WIDTH / 2, 88, "Beginner Sprint Race", {
      fontFamily: "Georgia",
      fontSize: "26px",
      color: "#f8dd91"
    }).setOrigin(0.5);
    const detail = this.add.text(GAME_WIDTH / 2, 126, "Gate is set. Horses face down-track.", {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#fff3cf"
    }).setOrigin(0.5);
    const prompt = this.add.text(GAME_WIDTH / 2, 154, `Press ${this.actionLabel("jump")} or ${this.actionLabel("primaryInteract")} to start`, {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: "#9be07d"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    panel.setInteractive({ useHandCursor: true });
    panel.on("pointerdown", () => this.runRace());
    prompt.on("pointerdown", () => this.runRace());
    this.raceOverlay = this.add.container(0, 0, [panel, title, detail, prompt]).setDepth(760);
  }

  private runRace(): void {
    this.raceState = "running";
    this.raceOverlay?.destroy(true);
    this.player.setVisible(false);
    this.horse.setVisible(false);
    this.showCountdown(3);
  }

  private showCountdown(value: number): void {
    const label = value > 0 ? String(value) : "Go!";
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, label, {
      fontFamily: "Georgia",
      fontSize: value > 0 ? "72px" : "58px",
      color: "#f5e6b8",
      stroke: "#15100a",
      strokeThickness: 7
    }).setOrigin(0.5).setDepth(850);
    this.tweens.add({
      targets: text,
      scale: { from: 0.8, to: 1.15 },
      alpha: { from: 1, to: 0 },
      duration: 650,
      onComplete: () => {
        text.destroy();
        if (value > 0) this.showCountdown(value - 1);
        else this.showRaceAnimation();
      }
    });
  }

  private showRaceAnimation(): void {
    const progressBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 96, 540, 24, 0x21150d, 0.92)
      .setStrokeStyle(2, 0xd5a84d);
    const progress = this.add.rectangle(GAME_WIDTH / 2 - 258, GAME_HEIGHT - 96, 18, 14, 0xf1c86d, 1)
      .setOrigin(0, 0.5);
    const dust = Array.from({ length: 12 }, (_, index) => this.add.circle(330 + index * 12, 548 + (index % 3) * 14, 8, 0xd7b071, 0.35));
    const horseKey = this.textures.exists(this.horseVisuals.idleKey) ? this.horseVisuals.idleKey : this.textures.exists("horse_placeholder") ? "horse_placeholder" : IMAGE_KEYS.horse;
    const mountedKey = this.textures.exists(MOUNTED_IDLE_KEY) ? MOUNTED_IDLE_KEY : horseKey;
    const racers = [
      this.add.sprite(322, 470, mountedKey).setDisplaySize(112, 112),
      this.add.sprite(322, 515, mountedKey).setDisplaySize(104, 104).setTint(0xd7b690),
      this.add.sprite(322, 560, mountedKey).setDisplaySize(104, 104).setTint(0xb99b82)
    ];
    racers.forEach((racer, index) => {
      racer.setDepth(200 + index);
      racer.setFlipX(false);
      if (this.anims.exists(MOUNTED_ANIMATION_KEYS.rideRight)) racer.play(MOUNTED_ANIMATION_KEYS.rideRight, true);
    });
    this.raceOverlay = this.add.container(0, 0, [progressBg, progress, ...dust, ...racers]).setDepth(760);

    this.tweens.add({
      targets: progress,
      displayWidth: 516,
      duration: 3000,
      ease: "Sine.easeInOut"
    });
    racers.forEach((racer, index) => {
      this.tweens.add({
        targets: racer,
        x: 940 - index * 38,
        y: 325 + index * 38,
        duration: 2800 + index * 220,
        ease: "Sine.easeInOut"
      });
    });
    dust.forEach((puff, index) => {
      this.tweens.add({
        targets: puff,
        x: puff.x + 120 + index * 18,
        y: puff.y - 18,
        alpha: 0,
        scale: 2,
        duration: 1100,
        delay: index * 80
      });
    });
    this.time.delayedCall(3300, () => this.finishRace());
  }

  private finishRace(): void {
    const baseScore = this.stats.speed * 0.5 + this.stats.stamina * 0.3 + this.stats.mood * 0.1 + this.stats.bond * 0.1;
    const finalScore = Math.round(baseScore + Phaser.Math.Between(-10, 10));
    const outcome = getRaceOutcome(finalScore);
    this.mutateStats({
      stamina: -15,
      health: -10,
      energy: -20,
      bond: 1,
      coins: outcome.coins,
      mood: outcome.mood,
      racesEntered: 1,
      racesWon: outcome.won ? 1 : 0
    });
    this.completeStoryQuest("first-timed-run");
    this.completeStoryQuest("rival-at-the-rail");
    if (finalScore >= 45) this.completeStoryQuest("championship-trial");
    this.raceState = "results";
    this.raceOverlay?.destroy(true);
    this.ui.messageBox.show(
      "Race Results",
      `${outcome.place}\nCoins Earned: ${outcome.coins}\nRace Score: ${finalScore}\nStamina -15, Health -10, Energy -20, Bond +1`,
      () => {
        this.raceState = "idle";
        this.scene.restart();
      }
    );
  }
}
