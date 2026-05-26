import Phaser from "phaser";
import { HOUSES, HouseDefinition } from "../data/houses";
import { IMAGE_KEYS } from "../data/constants";
import { Palette, PaletteCss } from "../art/Palette";
import { button, panel } from "../art/UITheme";
import { InteractionSystem, InteractionTarget } from "../systems/InteractionSystem";
import { applyStatDelta } from "../systems/HorseStats";
import { BaseWorldScene } from "./BaseWorldScene";
import { TravelDestination } from "../ui/TravelMenu";
import { SaveSystem } from "../systems/SaveSystem";
import { RANCH_NPCS, RanchNpcDefinition, RanchNpcId, ranchNpcById } from "../data/npcs";
import {
  BOAT_HULLS,
  BOAT_SAILS,
  BOAT_TRIMS,
  boatDockPoint,
  boatSummary,
  destinationByParishId,
  JAMAICA_PARISH_DESTINATIONS,
  JamaicaParishDestination,
  nextBoatHull,
  nextBoatSail,
  nextBoatTrim,
  shoreWorldPoint
} from "../data/jamaicaTravel";
import { chunkKey } from "../world/ChunkTypes";

type RanchTarget =
  | { type: "horse" }
  | { type: "starter_stable" }
  | { type: "travel_board" }
  | { type: "boathouse" }
  | { type: "tack_shop" }
  | { type: "npc"; npcId: RanchNpcId };

const CORE_RANCH_TARGETS: Array<InteractionTarget<RanchTarget>> = [
  { id: "horse", label: "Horse", prompt: "E - Check Horse", x: 585, y: 430, radius: 80, data: { type: "horse" } },
  { id: "starter_stable", label: "Starter Stable", prompt: "E - Choose Starter Home", x: 420, y: 560, radius: 95, data: { type: "starter_stable" } },
  { id: "travel_board", label: "Travel Board", prompt: "E - Open Travel Board", x: 850, y: 330, radius: 95, data: { type: "travel_board" } },
  { id: "boathouse", label: "Boat Shed", prompt: "E - Build / Customize Boat", x: 1048, y: 555, radius: 92, data: { type: "boathouse" } },
  { id: "tack_shop", label: "Tack Store", prompt: "E - Customize Horse", x: 250, y: 430, radius: 88, data: { type: "tack_shop" } }
];

const RANCH_TARGETS: Array<InteractionTarget<RanchTarget>> = [
  ...CORE_RANCH_TARGETS,
  ...RANCH_NPCS.map((npc) => ({
    id: npc.id,
    label: npc.label,
    prompt: npc.prompt,
    x: npc.x,
    y: npc.y,
    radius: 84,
    data: { type: "npc", npcId: npc.id } as RanchTarget
  }))
];

export class RanchScene extends BaseWorldScene {
  private interactions!: InteractionSystem<RanchTarget>;
  private modal?: Phaser.GameObjects.Container;
  private actorsMasked = false;
  private playerWasVisible = true;
  private horseWasVisible = true;

  constructor() {
    super("RanchScene", "Ranch");
  }

  protected override horseRoamBounds(_x: number, _y: number): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(485, 420, 260, 185);
  }

  create(): void {
    this.createBase(IMAGE_KEYS.ranchClean, 640, 395);
    this.interactions = new InteractionSystem(RANCH_TARGETS);
    RANCH_NPCS.forEach((npc) => this.createNpcSprite(npc));
    CORE_RANCH_TARGETS.forEach((target) => this.createPermanentLabel(target.x, target.y - 78, target.label));
    RANCH_TARGETS.forEach((target) => {
      this.marker(target.x, target.y, target.label, target.data.type === "npc" ? 0x8ff099 : 0xf1c86d, target.id, target.data.type === "npc");
      this.clickZone(target.x, target.y, target.radius ?? 80, () => this.handleInteraction(target.data));
    });
    if (!this.stats.houseChoice) {
      this.ui.toast("Talk to Auntie Marva or visit the Starter Stable.");
    }
  }

  override update(time: number, delta: number): void {
    const overlayOpen = Boolean(this.modal) || this.ui.isOverlayOpen();
    this.setRanchActorsMasked(overlayOpen);
    if (overlayOpen) {
      this.player?.setVelocity(0);
      this.horse?.setVelocity(0);
      this.ambientHorse?.pause();
      return;
    }
    super.update(time, delta);
    if (this.ui.messageBox.isOpen() || this.ui.travelMenu.isOpen()) return;
    const target = this.prioritizedRanchTarget();
    this.setActiveInteraction(target?.id ?? null);
    const prompt = target?.data.type === "horse"
      ? `${this.primaryPrompt("Check Horse")}   ${this.mountPrompt() ?? ""}`.trim()
      : target?.data.type === "starter_stable" && this.stats.houseChoice
        ? this.primaryPrompt("Enter Stable")
        : target?.prompt ? this.formatPrompt(target.prompt) : undefined;
    this.ui.setPrompt(prompt ?? this.mountPrompt() ?? "");
    if (target && this.actionJustDown("primaryInteract")) this.handleInteraction(target.data);
    else this.handleMountInput();
  }

  private prioritizedRanchTarget(): InteractionTarget<RanchTarget> | null {
    const position = new Phaser.Math.Vector2(this.player.x, this.player.y);
    const target = this.interactions.nearest(position);
    if (this.stats.houseChoice) return target;
    const guide = RANCH_TARGETS.find((entry) => entry.id === "auntie_marva");
    if (!guide) return target;
    const distanceToGuide = Phaser.Math.Distance.Between(position.x, position.y, guide.x, guide.y);
    return distanceToGuide <= (guide.radius ?? 84) ? guide : target;
  }

  private handleInteraction(target: RanchTarget): void {
    if (target.type === "horse") {
      this.ui.messageBox.show("Horse", `${this.stats.horseName} is ready. Press ${this.actionLabel("mount")} to mount or dismount.`);
      return;
    }
    if (target.type === "travel_board") {
      this.openTravelBoard();
      return;
    }
    if (target.type === "boathouse") {
      this.openBoatModal();
      return;
    }
    if (target.type === "tack_shop") {
      this.openHorseCustomization();
      return;
    }
    if (target.type === "npc") {
      this.talkToNpc(target.npcId);
      return;
    }
    if (this.stats.houseChoice) {
      const chosen = HOUSES.find((house) => house.id === this.stats.houseChoice);
      this.completeStoryQuest("old-bridle");
      this.completeStoryQuest("valley-homecoming");
      if (this.stats.bond >= 60 && this.stats.health >= 70 && this.stats.mood >= 70) {
        this.completeStoryQuest("goldspur-legacy");
      }
      this.ui.messageBox.show("Starter Stable", `Starter home: ${chosen?.label ?? "Unknown"}`);
      return;
    }
    this.openStarterHomeModal();
  }

  private talkToNpc(npcId: RanchNpcId): void {
    const npc = ranchNpcById(npcId);
    if (npcId === "auntie_marva") {
      const next = this.stats.houseChoice
        ? `Ranch Guide\nNext: Travel Board for Health, Training, Racing, or St Ann Route.\n${this.actionLabel("inventory")} = food and tools.`
        : `Ranch Guide\nStart: choose a home at Starter Stable.\n${this.actionLabel("inventory")} = food/tools. ${this.actionLabel("mount")} = mount.`;
      this.ui.messageBox.show(npc.label, next);
      return;
    }
    if (npcId === "coach_devon") {
      const healthy = this.stats.health >= 60 && this.stats.energy >= 45;
      this.ui.messageBox.show(
        npc.label,
        healthy
          ? "Your horse is fit enough for light training. Build speed and stamina before racing, then recover after hard runs."
          : "Ease up before training. Low health or energy slows your horse, so use feed, water, or Health & Care first."
      );
      return;
    }
    if (npcId === "nurse_lorna") {
      const save = SaveSystem.load();
      const checkupId = `ranch:npc:${npcId}:checkup`;
      if (this.stats.health < 75 && !save.world.interactedWorldObjects.includes(checkupId)) {
        save.world.interactedWorldObjects.push(checkupId);
        this.stats = applyStatDelta(this.stats, { health: 12, energy: 4 });
        SaveSystem.save({ stats: this.stats, inventory: this.inventory, world: save.world });
        this.ui.updateStats(this.stats, this.areaName);
        this.ui.messageBox.show(npc.label, "A quick checkup catches sore legs early. Health +12, Energy +4.\n\nVisit Health & Care for bigger recovery.");
        return;
      }
      const status = this.stats.health >= 80 ? "Healthy" : this.stats.health >= 50 ? "Needs care soon" : "Rest now";
      this.ui.messageBox.show(npc.label, `Health status: ${status} (${this.stats.health}/100).\n\nWater buckets, hay, oats, and Health & Care all help keep your horse ready.`);
      return;
    }
    if (npcId === "boatwright_kofi") {
      this.ui.messageBox.show(npc.label, "Build the Goldspur Skiff at the Boat Shed. It moves your home papers to parish shores, then you row from the shore in the open world.");
    }
  }

  private openTravelBoard(): void {
    if (this.modal) this.closeModal();
    const destinations: Array<{ label: string; scene?: TravelDestination; action?: () => void }> = [
      { label: "Training Grounds", scene: "TrainingScene" },
      { label: "Racing Track", scene: "RacingScene" },
      { label: "Health & Care", scene: "HealthScene" },
      { label: "Relaxation Meadow", scene: "RelaxationScene" },
      { label: "St Ann Route", action: () => this.travelToParish(destinationByParishId("st-ann")) },
      { label: "Boat & Parishes", action: () => this.openBoatModal() }
    ];
    const children = this.modalBase("Travel Board", "Choose where to ride.", 430, 540);
    destinations.forEach((destination, index) => {
      const y = 260 + index * 52;
      children.push(button(this, 640, y, 270, 40, destination.label, () => {
        this.closeModal();
        if (destination.action) destination.action();
        else if (destination.scene) this.travel(destination.scene);
      }, 902));
    });
    children.push(button(this, 640, 592, 160, 40, "Close", () => this.closeModal(), 902));
    this.modal = this.add.container(0, 0, children).setDepth(900);
  }

  private openHorseCustomization(): void {
    this.closeModal();
    this.scene.launch("HorseCustomizationScene", { returnScene: this.scene.key });
    this.scene.pause();
  }

  private openBoatModal(): void {
    if (this.modal) this.closeModal();
    const save = SaveSystem.load();
    const boat = save.world.boat;
    const homeParish = destinationByParishId(save.world.homeParishId);
    const subtitle = boat.built
      ? `${boatSummary(boat)}. Home moves with you from ${homeParish.name}.`
      : "Build a skiff, customize it, then move your home papers to any parish shore.";
    const children = this.modalBase("Boat Shed", subtitle, 1000, 560);
    if (!boat.built) {
      children.push(button(this, 640, 268, 250, 38, "Build Goldspur Skiff", () => this.buildBoat(), 904));
    } else {
      children.push(button(this, 350, 268, 250, 38, `Hull: ${this.boatHullLabel(boat.hull)}`, () => this.cycleBoat("hull"), 904));
      children.push(button(this, 640, 268, 250, 38, `Sail: ${this.boatSailLabel(boat.sail)}`, () => this.cycleBoat("sail"), 904));
      children.push(button(this, 930, 268, 250, 38, `Trim: ${this.boatTrimLabel(boat.trim)}`, () => this.cycleBoat("trim"), 904));
    }

    JAMAICA_PARISH_DESTINATIONS.forEach((destination, index) => {
      const column = index < 7 ? 0 : 1;
      const row = index % 7;
      const x = column === 0 ? 475 : 805;
      const y = 322 + row * 34;
      const visited = save.world.visitedParishIds.includes(destination.id) ? " *" : "";
      const locked = !boat.built && destination.id !== "st-ann";
      const label = locked ? `Build skiff: ${destination.name}` : `${destination.name}: ${destination.shoreName}${visited}`;
      children.push(button(this, x, y, 290, 30, label, () => {
        this.travelToParish(destination);
      }, 904));
    });

    children.push(button(this, 640, 630, 160, 38, "Close", () => this.closeModal(), 904));
    this.modal = this.add.container(0, 0, children).setDepth(900);
  }

  private buildBoat(): void {
    const save = SaveSystem.load();
    const dock = boatDockPoint(destinationByParishId(save.world.currentParishId));
    save.world.boat = { ...save.world.boat, ...dock, built: true, onboard: false };
    if (!save.world.visitedParishIds.includes("st-ann")) save.world.visitedParishIds.push("st-ann");
    SaveSystem.save({ stats: this.stats, inventory: this.inventory, world: save.world });
    this.closeModal();
    this.ui.messageBox.show("Goldspur Skiff Built", "The skiff is ready. It can carry you, tack, and your starter home papers to parish shores across Jamaica.");
  }

  private cycleBoat(part: "hull" | "sail" | "trim"): void {
    const save = SaveSystem.load();
    if (part === "hull") save.world.boat.hull = nextBoatHull(save.world.boat.hull);
    if (part === "sail") save.world.boat.sail = nextBoatSail(save.world.boat.sail);
    if (part === "trim") save.world.boat.trim = nextBoatTrim(save.world.boat.trim);
    SaveSystem.save({ stats: this.stats, inventory: this.inventory, world: save.world });
    this.closeModal();
    this.openBoatModal();
  }

  private travelToParish(destination: JamaicaParishDestination): void {
    const save = SaveSystem.load();
    if (!save.world.boat.built && destination.id !== "st-ann") {
      this.closeModal();
      this.ui.messageBox.show("Boat Needed", "Build the Goldspur Skiff first, then you can move your home papers to any parish shore.");
      return;
    }
    const shore = shoreWorldPoint(destination);
    const dock = boatDockPoint(destination);
    save.world.currentParishId = destination.id;
    save.world.homeParishId = destination.id;
    save.world.openWorldPosition = {
      x: shore.x,
      y: shore.y,
      chunkX: shore.chunkX,
      chunkY: shore.chunkY
    };
    save.world.boat = {
      ...save.world.boat,
      ...dock,
      onboard: false
    };
    save.world.discoveredChunks = Array.from(new Set([...save.world.discoveredChunks, chunkKey(shore.chunkX, shore.chunkY)]));
    save.world.visitedParishIds = Array.from(new Set([...save.world.visitedParishIds, destination.id]));
    SaveSystem.save({ stats: this.stats, inventory: this.inventory, world: save.world });
    this.closeModal();
    this.travel("OpenWorldScene");
  }

  private openStarterHomeModal(): void {
    if (this.modal) this.closeModal();
    const children = this.modalBase("Choose Starter Home", "Pick one permanent starting bonus.", 760, 390);
    HOUSES.forEach((house, index) => {
      const x = 390 + index * 250;
      const card = this.add.rectangle(x, 340, 210, 185, Palette.panelBrown, 0.96)
        .setStrokeStyle(2, Palette.gold)
        .setDepth(902);
      const title = this.add.text(x, 280, house.label, {
        fontFamily: "Georgia",
        fontSize: "21px",
        color: PaletteCss.gold
      }).setOrigin(0.5).setDepth(903);
      const detail = this.add.text(x, 324, this.houseDetails(house), {
        fontFamily: "Georgia",
        fontSize: "16px",
        color: PaletteCss.cream,
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: 170 }
      }).setOrigin(0.5, 0).setDepth(903);
      const choose = button(this, x, 420, 132, 38, "Choose", () => this.chooseHouse(house), 904);
      children.push(card, title, detail, choose);
    });
    children.push(button(this, 640, 525, 160, 40, "Close", () => this.closeModal(), 902));
    this.modal = this.add.container(0, 0, children).setDepth(900);
  }

  private modalBase(title: string, subtitle: string, width: number, height: number): Phaser.GameObjects.GameObject[] {
    const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.38)
      .setDepth(899)
      .setInteractive();
    overlay.on("pointerdown", (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
    });
    const modalPanel = panel(this, 640, 360, width, height, 900);
    const titleText = this.add.text(640, 185, title, {
      fontFamily: "Georgia",
      fontSize: "31px",
      color: PaletteCss.gold
    }).setOrigin(0.5).setDepth(901);
    const subtitleText = this.add.text(640, 224, subtitle, {
      fontFamily: "Georgia",
      fontSize: "17px",
      color: PaletteCss.cream,
      align: "center",
      fixedWidth: width - 96,
      wordWrap: { width: width - 120 }
    }).setOrigin(0.5).setDepth(901);
    return [overlay, modalPanel, titleText, subtitleText];
  }

  private chooseHouse(house: HouseDefinition): void {
    if (this.stats.houseChoice) return;
    this.stats = applyStatDelta({ ...this.stats, houseChoice: house.id }, house.bonus);
    this.save();
    this.ui.updateStats(this.stats, this.areaName);
    this.completeStoryQuest("welcome-to-goldspur");
    this.closeModal();
    this.ui.messageBox.show("Starter Home Selected", house.message);
  }

  private closeModal(): void {
    this.modal?.destroy(true);
    this.modal = undefined;
    this.setRanchActorsMasked(this.ui.isOverlayOpen());
  }

  private houseDetails(house: HouseDefinition): string {
    if (house.id === "cozy_stable") return "+10 Mood\nBest for recovery.";
    if (house.id === "speed_barn") return "+5 Speed\nBest for racing.";
    return "+5 Bond\nBest for connection.";
  }

  private boatHullLabel(id: string): string {
    return BOAT_HULLS.find((entry) => entry.id === id)?.label ?? id;
  }

  private boatSailLabel(id: string): string {
    return BOAT_SAILS.find((entry) => entry.id === id)?.label ?? id;
  }

  private boatTrimLabel(id: string): string {
    return BOAT_TRIMS.find((entry) => entry.id === id)?.label ?? id;
  }

  private setRanchActorsMasked(masked: boolean): void {
    if (this.actorsMasked === masked) return;
    this.actorsMasked = masked;
    if (masked) {
      this.playerWasVisible = this.player?.visible ?? true;
      this.horseWasVisible = this.horse?.visible ?? true;
      this.player?.setVisible(false);
      this.horse?.setVisible(false);
      return;
    }
    this.player?.setVisible(this.playerWasVisible);
    this.horse?.setVisible(this.horseWasVisible && !this.isMounted);
  }

  private createNpcSprite(npc: RanchNpcDefinition): void {
    const shadow = this.add.ellipse(npc.x, npc.y + 26, 34, 12, 0x000000, 0.24);
    const legs = this.add.rectangle(npc.x, npc.y + 17, 20, 32, 0x24374a, 1);
    const body = this.add.rectangle(npc.x, npc.y - 10, 34, 42, npc.color, 1)
      .setStrokeStyle(2, 0x15100a, 0.95);
    const scarf = this.add.rectangle(npc.x, npc.y - 24, 38, 8, npc.accent, 1);
    const head = this.add.circle(npc.x, npc.y - 42, 15, 0xb8783e, 1)
      .setStrokeStyle(2, 0x15100a, 0.9);
    const hat = this.add.rectangle(npc.x, npc.y - 59, 42, 8, 0x5a3320, 1)
      .setStrokeStyle(1, 0x15100a, 0.9);
    const label = this.add.text(npc.x, npc.y - 84, npc.label, {
      fontFamily: "Georgia",
      fontSize: "15px",
      color: "#fff3cf",
      backgroundColor: "rgba(21,16,10,0.86)",
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
    this.add.container(0, 0, [shadow, legs, body, scarf, head, hat, label]).setDepth(npc.y + 20);
  }

  private createPermanentLabel(x: number, y: number, label: string): void {
    this.add.text(x, y, label, {
      fontFamily: "Georgia",
      fontSize: "15px",
      color: "#fff3cf",
      backgroundColor: "rgba(21,16,10,0.78)",
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(92);
  }
}
