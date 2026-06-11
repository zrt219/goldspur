import Phaser from "phaser";
import { GAME_HEIGHT, IMAGE_KEYS } from "../data/constants";
import { BaseWorldScene } from "./BaseWorldScene";
import { ChunkManager, TravelMode, WorldInteraction } from "../world/ChunkManager";
import { CHUNK_SIZE, chunkKey, TILE_SIZE, worldToChunk } from "../world/ChunkTypes";
import type { WorldSaveData } from "../world/WorldSeed";
import { ITEM_LABELS } from "../data/items";
import {
  EXPLORATION_MILESTONES,
  explorationMilestoneKey,
  explorationProgress,
  explorationScenarioForObjectType,
  explorationScenarioKey,
  ResolvedExplorationScenario
} from "../data/explorationScenarios";
import {
  addOwnedHorseCustomizationItems,
  horseCustomizationExplorationBonus,
  horseCustomizationLabels,
  type HorseCustomizationSave
} from "../data/horseCustomization";
import { SaveSystem } from "../systems/SaveSystem";
import { applyStatDelta, StatDelta } from "../systems/HorseStats";
import { Palette, PaletteCss } from "../art/Palette";
import { isWildlifeSpawnObject, Wildlife } from "../entities/Wildlife";
import { HiddenQuestItem, HIDDEN_QUEST_ITEMS, HIDDEN_QUEST_NAME, hiddenQuestProgress } from "../data/hiddenQuest";
import { StAnnAmbienceState } from "../systems/WeatherSystem";
import { RIDER_IDLE_KEY } from "../systems/AnimationLoader";
import {
  pickJamaicanBird,
  pickJamaicanFood,
  routeLocationForChunk,
  sampleJamaicanFoods,
  sampleJamaicanTrees
} from "../data/jamaicaContent";
import { type MiniMapLandmark } from "../ui/MiniMap";
import {
  activeCelebrationForDay,
  boatDockPoint,
  boatHullTint,
  destinationByParishId,
  JamaicaParishDestination,
  OPEN_WORLD_PLAYABLE_BOUNDS,
  parishForChunk,
  shoreWorldPoint
} from "../data/jamaicaTravel";

type HiddenQuestRenderable = HiddenQuestItem & {
  sprite: Phaser.GameObjects.Sprite;
  glow: Phaser.GameObjects.Ellipse;
};

type WorldPlace = {
  name: string;
  summary: string;
  stAnn: boolean;
};

const HIDDEN_QUEST_INTERACTION_DISTANCE = 78;
const OPEN_WORLD_ENTITY_DEPTH_BASE = 118;
const OPEN_WORLD_ENTITY_DEPTH_RANGE = 490;
const OPEN_WORLD_SAFE_SPAWN = { x: 256, y: 260 } as const;
const TERRAIN_STEP_PIXELS = 5;
const MAX_TERRAIN_SWEEP_DELTA_MS = 450;
const DISEMBARK_SEARCH_RADIUS_TILES = 24;
const DISEMBARK_DIRECT_OFFSETS: Array<[number, number]> = [
  [62, 38],
  [62, -38],
  [-62, 38],
  [-62, -38],
  [0, 78],
  [0, -78],
  [104, 0],
  [-104, 0],
  [94, 58],
  [94, -58],
  [-94, 58],
  [-94, -58]
];

export class OpenWorldScene extends BaseWorldScene {
  private chunkManager!: ChunkManager;
  private worldSeed = "";
  private interactionRing!: Phaser.GameObjects.Ellipse;
  private debugText!: Phaser.GameObjects.Text;
  private debugWorldVisible = false;
  private activeInteraction?: WorldInteraction;
  private lastSavedChunk = "";
  private lastSaveAt = 0;
  private wildlife = new Map<string, Wildlife>();
  private lastWildlifeNoticeAt = 0;
  private hiddenQuestItems: HiddenQuestRenderable[] = [];
  private activeQuestItem?: HiddenQuestRenderable;
  private boatSprite?: Phaser.Physics.Arcade.Sprite;
  private isBoating = false;
  private currentParish!: JamaicaParishDestination;
  private lastSafeLandPoint?: { x: number; y: number };
  private lastSafeBoatPoint?: { x: number; y: number };

  constructor() {
    super("OpenWorldScene", "St Ann Route");
  }

  create(): void {
    const save = SaveSystem.load();
    this.currentParish = destinationByParishId(save.world.currentParishId);
    this.areaName = this.currentParish.id === "st-ann" ? "St Ann Route" : `${this.currentParish.name} Shore`;
    this.worldSeed = save.world.worldSeed;
    const rawStart = save.world.openWorldPosition ?? { x: 256, y: 260, chunkX: 0, chunkY: 0 };
    const start = this.clampOpenWorldPoint(rawStart.x, rawStart.y);
    this.createBase(IMAGE_KEYS.ranchClean, start.x, start.y);

    const startsOnBoat = save.world.boat.built && save.world.boat.onboard;
    this.player.setCollideWorldBounds(true);
    this.horse.setCollideWorldBounds(true);
    this.physics.world.setBounds(OPEN_WORLD_PLAYABLE_BOUNDS.left, OPEN_WORLD_PLAYABLE_BOUNDS.top, OPEN_WORLD_PLAYABLE_BOUNDS.width, OPEN_WORLD_PLAYABLE_BOUNDS.height);
    this.cameras.main.setBounds(OPEN_WORLD_PLAYABLE_BOUNDS.left, OPEN_WORLD_PLAYABLE_BOUNDS.top, OPEN_WORLD_PLAYABLE_BOUNDS.width, OPEN_WORLD_PLAYABLE_BOUNDS.height);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);

    this.chunkManager = new ChunkManager(this, this.worldSeed);
    const safeStart = this.safeResolvedTravelPoint(this.player.x, this.player.y, startsOnBoat ? "boat" : "land", 18);
    this.player.setPosition(safeStart.x, safeStart.y);
    this.horse.setPosition(safeStart.x - 84, safeStart.y + 56);
    if (startsOnBoat) this.lastSafeBoatPoint = { x: safeStart.x, y: safeStart.y };
    else this.lastSafeLandPoint = { x: safeStart.x, y: safeStart.y };
    if (!startsOnBoat) this.mountHorse();
    const ambience = this.currentAmbience();
    if (ambience) this.chunkManager.setAmbience(ambience);
    this.chunkManager.update(this.player.x, this.player.y);
    this.syncWildlife();
    this.createHiddenQuestItems();
    this.createPlayerBoat();
    if (startsOnBoat) this.restoreBoardedBoat();
    this.physics.add.collider(this.player, this.chunkManager.collisionGroup);

    this.interactionRing = this.add.ellipse(0, 0, 88, 46, Palette.gold, 0.06)
      .setStrokeStyle(2, Palette.gold, 0.85)
      .setDepth(90)
      .setVisible(false);
    this.tweens.add({
      targets: this.interactionRing,
      alpha: { from: 0.28, to: 0.62 },
      duration: 950,
      yoyo: true,
      repeat: -1
    });

    this.debugText = this.add.text(18, 280, "", {
      fontFamily: "Consolas",
      fontSize: "14px",
      color: PaletteCss.cream,
      backgroundColor: "rgba(21,16,10,0.82)",
      padding: { x: 10, y: 8 }
    }).setDepth(760).setScrollFactor(0).setVisible(false);

    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _objects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      this.adjustZoom(dy > 0 ? -0.08 : 0.08);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.saveOpenWorldPosition();
      this.wildlife.forEach((wildlife) => wildlife.destroy());
      this.wildlife.clear();
      this.boatSprite?.destroy();
      this.boatSprite = undefined;
      this.hiddenQuestItems.forEach((item) => {
        item.sprite.destroy();
        item.glow.destroy();
      });
      this.hiddenQuestItems = [];
      this.chunkManager?.destroy();
    });
    this.saveOpenWorldPosition();
    this.announceCelebration();
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    this.handleZoomKeys();
    const chunkChanged = this.chunkManager.update(this.player.x, this.player.y);
    if (chunkChanged) this.syncWildlife();
    this.updateHiddenQuestItems();
    this.updateWildlife(time, delta);
    this.updateOpenWorldInteraction();
    this.updateDebugText();
    this.syncOpenWorldDepths();
    if (chunkChanged || time - this.lastSaveAt > 4000) this.saveOpenWorldPosition(time);
  }

  protected override updateMovement(delta: number): void {
    if (this.ui?.isOverlayOpen()) {
      this.player.setVelocity(0);
      this.ambientHorse?.pause();
      return;
    }
    if (!this.isBoating) {
      const speed = this.adjustedTravelSpeed(this.isMounted ? 315 : 235);
      const velocity = this.inputVelocity(speed);
      this.filterVelocityForTerrain(velocity, delta, "land");
      this.player.setVelocity(velocity.x, velocity.y);
      this.player.setDepth(this.worldDisplayDepth(this.player.y));
      if (this.isMounted) {
        this.handleMountedJumpInput();
        this.updateMountedAnimation(velocity);
      } else {
        this.riderEntity?.updateFromVelocity();
      }
      if (velocity.lengthSq() > 64) this.maybeWarnLowCare();
      return;
    }

    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left?.isDown || this.actionIsDown("moveLeft")) velocity.x -= 1;
    if (this.cursors.right?.isDown || this.actionIsDown("moveRight")) velocity.x += 1;
    if (this.cursors.up?.isDown || this.actionIsDown("moveUp")) velocity.y -= 1;
    if (this.cursors.down?.isDown || this.actionIsDown("moveDown")) velocity.y += 1;
    velocity.normalize().scale(185);
    this.filterVelocityForTerrain(velocity, delta, "boat");
    this.player.setVelocity(velocity.x, velocity.y);
    if (Math.abs(velocity.x) > 8) this.player.setFlipX(velocity.x < 0);
    this.player.setDepth(this.worldDisplayDepth(this.player.y, 8));
    const bob = Math.sin(this.time.now / 260) * 2;
    this.player.setAngle(velocity.lengthSq() > 64 ? Phaser.Math.Clamp(velocity.x / 70, -4, 4) : bob);
    void delta;
  }

  protected override enforceSceneBounds(): void {
    if (!this.player || !this.chunkManager) return;
    const mode: TravelMode = this.isBoating ? "boat" : "land";
    const fallback = mode === "boat" ? this.lastSafeBoatPoint : this.lastSafeLandPoint;
    let safe = this.safeResolvedTravelPoint(this.player.x, this.player.y, mode, 14, fallback);
    if (safe.x !== this.player.x || safe.y !== this.player.y) {
      this.player.setPosition(safe.x, safe.y);
      this.player.setVelocity(0);
    }
    if (this.isTravelPointPassable(this.player.x, this.player.y, mode)) {
      if (mode === "boat") this.lastSafeBoatPoint = { x: this.player.x, y: this.player.y };
      else this.lastSafeLandPoint = { x: this.player.x, y: this.player.y };
    }
    if (!this.horse?.active || !this.horse.visible) return;
    let horseSafe = this.safeResolvedTravelPoint(this.horse.x, this.horse.y, "land", 10);
    if (!this.isTravelPointPassable(horseSafe.x, horseSafe.y, "land")) {
      horseSafe = this.safeResolvedTravelPoint(this.player.x - 88, this.player.y + 54, "land", 18);
    }
    if (horseSafe.x !== this.horse.x || horseSafe.y !== this.horse.y) {
      this.horse.setPosition(horseSafe.x, horseSafe.y);
      this.horse.setVelocity(0);
    }
  }

  private inputVelocity(speed: number): Phaser.Math.Vector2 {
    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left?.isDown || this.actionIsDown("moveLeft")) velocity.x -= 1;
    if (this.cursors.right?.isDown || this.actionIsDown("moveRight")) velocity.x += 1;
    if (this.cursors.up?.isDown || this.actionIsDown("moveUp")) velocity.y -= 1;
    if (this.cursors.down?.isDown || this.actionIsDown("moveDown")) velocity.y += 1;
    return velocity.normalize().scale(speed);
  }

  private filterVelocityForTerrain(velocity: Phaser.Math.Vector2, delta: number, mode: TravelMode): void {
    if (!this.chunkManager || velocity.lengthSq() === 0) return;
    const dt = this.travelDeltaSeconds(delta);
    if (dt <= 0) {
      velocity.set(0, 0);
      return;
    }
    const nextX = this.player.x + velocity.x * dt;
    const nextY = this.player.y + velocity.y * dt;
    if (!this.isTravelPathPassable(this.player.x, this.player.y, nextX, this.player.y, mode)) velocity.x = 0;
    if (!this.isTravelPathPassable(this.player.x, this.player.y, this.player.x, nextY, mode)) velocity.y = 0;
    if (!this.isTravelPathPassable(this.player.x, this.player.y, this.player.x + velocity.x * dt, this.player.y + velocity.y * dt, mode)) {
      velocity.set(0, 0);
    }
  }

  private travelDeltaSeconds(delta: number): number {
    const frameMs = Number.isFinite(delta) ? Math.max(delta, 16) : 16;
    return frameMs > MAX_TERRAIN_SWEEP_DELTA_MS ? 0 : frameMs / 1000;
  }

  private isTravelPathPassable(fromX: number, fromY: number, toX: number, toY: number, mode: TravelMode): boolean {
    const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const steps = Math.max(1, Math.ceil(distance / TERRAIN_STEP_PIXELS));
    for (let index = 1; index <= steps; index += 1) {
      const t = index / steps;
      if (!this.isTravelPointPassable(
        Phaser.Math.Linear(fromX, toX, t),
        Phaser.Math.Linear(fromY, toY, t),
        mode
      )) {
        return false;
      }
    }
    return true;
  }

  private isTravelPointPassable(x: number, y: number, mode: TravelMode): boolean {
    if (!this.isWithinOpenWorldBounds(x, y)) return false;
    return this.travelProbeOffsets(mode).every(([dx, dy]) => this.chunkManager.isPassable(x + dx, y + dy, mode));
  }

  private travelProbeOffsets(mode: TravelMode): Array<[number, number]> {
    if (mode === "boat") {
      return [
        [0, 0],
        [-50, 0], [50, 0], [0, -26], [0, 26],
        [-42, -20], [42, -20], [-42, 20], [42, 20],
        [-24, -30], [24, -30], [-24, 30], [24, 30]
      ];
    }
    if (this.isMounted) {
      return [
        [0, 0],
        [-34, 0], [34, 0], [0, -28], [0, 28],
        [-30, -22], [30, -22], [-30, 22], [30, 22],
        [-18, -34], [18, -34], [-18, 34], [18, 34]
      ];
    }
    return [
      [0, 0],
      [-26, 0], [26, 0], [0, -24], [0, 24],
      [-22, -18], [22, -18], [-22, 18], [22, 18]
    ];
  }

  private resolveTravelPoint(x: number, y: number, mode: TravelMode, radiusTiles = 12): { x: number; y: number } {
    const clamped = this.clampOpenWorldPoint(x, y);
    if (!this.chunkManager) return clamped;
    if (this.isTravelPointPassable(clamped.x, clamped.y, mode)) return clamped;
    return this.nearestBodyPassablePoint(clamped.x, clamped.y, mode, radiusTiles);
  }

  private safeResolvedTravelPoint(x: number, y: number, mode: TravelMode, radiusTiles = 12, fallback?: { x: number; y: number }): { x: number; y: number } {
    const point = this.resolveTravelPoint(x, y, mode, radiusTiles);
    return this.isTravelPointPassable(point.x, point.y, mode) ? point : this.recoveryTravelPoint(mode, fallback);
  }

  private nearestBodyPassablePoint(x: number, y: number, mode: TravelMode, radiusTiles = 12): { x: number; y: number } {
    const originTileX = Math.floor(x / TILE_SIZE);
    const originTileY = Math.floor(y / TILE_SIZE);
    const searchRadius = Math.max(radiusTiles, 36);
    for (let radius = 1; radius <= searchRadius; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const candidate = this.clampOpenWorldPoint(
            (originTileX + dx) * TILE_SIZE + TILE_SIZE / 2,
            (originTileY + dy) * TILE_SIZE + TILE_SIZE / 2
          );
          if (this.isTravelPointPassable(candidate.x, candidate.y, mode)) return candidate;
        }
      }
    }
    const point = this.chunkManager.nearestPassablePoint(x, y, mode, searchRadius);
    const clamped = this.clampOpenWorldPoint(point.x, point.y);
    return this.isTravelPointPassable(clamped.x, clamped.y, mode) ? clamped : this.clampOpenWorldPoint(x, y);
  }

  private nearestTravelPointInRadius(x: number, y: number, mode: TravelMode, radiusTiles: number): { x: number; y: number } | undefined {
    const originTileX = Math.floor(x / TILE_SIZE);
    const originTileY = Math.floor(y / TILE_SIZE);
    for (let radius = 1; radius <= radiusTiles; radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        for (let dx = -radius; dx <= radius; dx += 1) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
          const candidate = this.clampOpenWorldPoint(
            (originTileX + dx) * TILE_SIZE + TILE_SIZE / 2,
            (originTileY + dy) * TILE_SIZE + TILE_SIZE / 2
          );
          if (this.isTravelPointPassable(candidate.x, candidate.y, mode)) return candidate;
        }
      }
    }
    return undefined;
  }

  private findDisembarkPoint(boatX: number, boatY: number): { x: number; y: number } | undefined {
    for (const [dx, dy] of DISEMBARK_DIRECT_OFFSETS) {
      const candidate = this.clampOpenWorldPoint(boatX + dx, boatY + dy);
      if (this.isTravelPointPassable(candidate.x, candidate.y, "land")) return candidate;
    }
    return this.nearestTravelPointInRadius(boatX, boatY, "land", DISEMBARK_SEARCH_RADIUS_TILES);
  }

  private recoveryTravelPoint(mode: TravelMode, fallback?: { x: number; y: number }): { x: number; y: number } {
    if (fallback && this.isTravelPointPassable(fallback.x, fallback.y, mode)) return fallback;
    if (mode === "boat") {
      const dock = boatDockPoint(this.currentParish ?? destinationByParishId("st-ann"));
      const safeDock = this.resolveTravelPoint(dock.x, dock.y, "boat", 96);
      if (this.isTravelPointPassable(safeDock.x, safeDock.y, "boat")) return safeDock;
    }
    const safeOrigin = this.resolveTravelPoint(OPEN_WORLD_SAFE_SPAWN.x, OPEN_WORLD_SAFE_SPAWN.y, "land", 64);
    if (mode === "land" && this.isTravelPointPassable(safeOrigin.x, safeOrigin.y, "land")) return safeOrigin;
    const clamped = this.clampOpenWorldPoint(OPEN_WORLD_SAFE_SPAWN.x, OPEN_WORLD_SAFE_SPAWN.y);
    return clamped;
  }

  private clampOpenWorldPoint(x: number, y: number): { x: number; y: number } {
    return {
      x: Phaser.Math.Clamp(Number.isFinite(x) ? x : 256, OPEN_WORLD_PLAYABLE_BOUNDS.left + 48, OPEN_WORLD_PLAYABLE_BOUNDS.right - 48),
      y: Phaser.Math.Clamp(Number.isFinite(y) ? y : 260, OPEN_WORLD_PLAYABLE_BOUNDS.top + 48, OPEN_WORLD_PLAYABLE_BOUNDS.bottom - 48)
    };
  }

  private isWithinOpenWorldBounds(x: number, y: number): boolean {
    return x >= OPEN_WORLD_PLAYABLE_BOUNDS.left + 44
      && x <= OPEN_WORLD_PLAYABLE_BOUNDS.right - 44
      && y >= OPEN_WORLD_PLAYABLE_BOUNDS.top + 44
      && y <= OPEN_WORLD_PLAYABLE_BOUNDS.bottom - 44;
  }

  protected override handleGlobalKeys(): void {
    if (this.ui.messageBox.isOpen() || this.ui.isJournalOpen()) {
      if (this.actionJustDown("debug")) this.toggleOpenWorldDebug();
      return;
    }
    if (this.ui.travelMenu.isOpen()) {
      if (this.actionJustDown("map")) this.ui.travelMenu.toggle();
      if (this.actionJustDown("debug")) this.toggleOpenWorldDebug();
      return;
    }
    if (this.actionJustDown("settings")) this.openSettings();
    if (this.actionJustDown("map")) this.ui.travelMenu.toggle();
    if (this.actionJustDown("inventory")) this.openInventory();
    if (!this.isBoating && this.actionJustDown("mount")) this.toggleMount();
    if (this.actionJustDown("ranch")) {
      if (this.isBoating) this.disembarkBoat(false);
      this.travel("RanchScene");
    }
    if (this.actionJustDown("reset")) this.handleReset();
    if (this.actionJustDown("debug")) this.toggleOpenWorldDebug();
  }

  protected override addBackground(): void {
    // The St Ann route is chunk-rendered. No static gameplay screenshot background belongs here.
  }

  protected override onAmbienceChanged(ambience: StAnnAmbienceState): void {
    this.chunkManager?.setAmbience(ambience);
  }

  protected override updateMiniMap(): void {
    if (!this.chunkManager) return;
    const info = this.chunkManager.currentInfo(this.player.x, this.player.y);
    const save = SaveSystem.load();
    const travelParish = parishForChunk(info.chunkX, info.chunkY);
    const inSeededWilderness = !travelParish;
    const currentParish = travelParish ?? destinationByParishId(save.world.currentParishId);
    const trackerActive = save.inventory.horse_tracker > 0 && this.settings.world.horseTrackerAlwaysOn;
    const trackedHorse = this.horse?.active && this.horse.visible
      ? { x: this.horse.x, y: this.horse.y, visible: true, tracked: trackerActive }
      : save.world.horsePosition
        ? { x: save.world.horsePosition.x, y: save.world.horsePosition.y, visible: false, tracked: trackerActive }
        : undefined;
    const boat = save.world.boat.built
      ? {
          x: this.isBoating ? this.player.x : this.boatSprite?.x ?? save.world.boat.x ?? this.player.x,
          y: this.isBoating ? this.player.y : this.boatSprite?.y ?? save.world.boat.y ?? this.player.y,
          built: true,
          onboard: this.isBoating
        }
      : undefined;
    this.ui.updateMiniMap({
      mode: inSeededWilderness ? "local" : currentParish.id === "st-ann" ? "parish" : "island",
      areaName: this.areaName,
      worldX: this.player.x,
      worldY: this.player.y,
      chunkX: info.chunkX,
      chunkY: info.chunkY,
      biomeLabel: info.biome,
      locationName: inSeededWilderness ? this.seededWildernessName(info.chunkX, info.chunkY) : currentParish.id === "st-ann" ? info.location : `${currentParish.shoreName}, ${currentParish.name}`,
      locationDetail: this.isBoating ? "Rowing the coast" : inSeededWilderness ? `${info.biome} | seed world` : info.biome,
      currentParishId: currentParish.id,
      visitedParishIds: save.world.visitedParishIds,
      discoveredChunks: this.chunkManager.markDiscovered(save.world.discoveredChunks, this.player.x, this.player.y),
      landmarks: this.miniMapLandmarks(),
      horse: trackedHorse,
      boat,
      bounds: inSeededWilderness ? this.localMapBounds() : OPEN_WORLD_PLAYABLE_BOUNDS
    });
  }

  private updateOpenWorldInteraction(): void {
    if (this.ui.isOverlayOpen()) {
      this.ui.setPrompt("");
      this.interactionRing.setVisible(false);
      return;
    }
    if (this.isBoating) {
      this.activeInteraction = undefined;
      this.activeQuestItem = undefined;
      this.interactionRing.setVisible(false);
      this.ui.setPrompt(`${this.primaryPrompt("Tie Up Boat")}   ${this.movementPrompt()} row`);
      if (this.actionJustDown("primaryInteract")) this.disembarkBoat();
      return;
    }
    if (this.boatSprite?.visible) {
      const distanceToBoat = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boatSprite.x, this.boatSprite.y);
      if (distanceToBoat <= 96) {
        this.activeInteraction = undefined;
        this.activeQuestItem = undefined;
        this.interactionRing
          .setPosition(this.boatSprite.x, this.boatSprite.y + 8)
          .setDepth(this.worldDisplayDepth(this.boatSprite.y, 10))
          .setVisible(true);
        this.ui.setPrompt(this.primaryPrompt("Board Boat"));
        if (this.actionJustDown("primaryInteract")) this.boardBoat();
        return;
      }
    }
    this.activeQuestItem = this.nearestHiddenQuestItem();
    if (this.activeQuestItem) {
      this.activeInteraction = undefined;
      this.interactionRing
        .setPosition(this.activeQuestItem.x, this.activeQuestItem.y)
        .setDepth(this.worldDisplayDepth(this.activeQuestItem.y, 4))
        .setVisible(true);
      this.ui.setPrompt(this.formatPrompt(this.activeQuestItem.prompt));
      if (this.actionJustDown("primaryInteract")) this.handleHiddenQuestInteraction(this.activeQuestItem);
      return;
    }

    this.activeInteraction = this.chunkManager.nearestInteraction(this.player.x, this.player.y);
    if (!this.activeInteraction) {
      this.ui.setPrompt(this.mountPrompt() ?? "");
      this.interactionRing.setVisible(false);
      this.handleMountInput();
      return;
    }

    this.interactionRing
      .setPosition(this.activeInteraction.worldX, this.activeInteraction.worldY)
      .setDepth(this.worldDisplayDepth(this.activeInteraction.worldY, 4))
      .setVisible(true);
    this.ui.setPrompt(this.promptFor(this.activeInteraction));
    if (this.actionJustDown("primaryInteract")) this.handleWorldInteraction(this.activeInteraction);
  }

  private handleWorldInteraction(interaction: WorldInteraction): void {
    const object = interaction.object;
    if (object.type === "sign") {
      const location = this.placeForWorld(interaction.worldX, interaction.worldY);
      this.ui.messageBox.show("Trail Sign", object.variant === 0 && location.stAnn ? "Ranch is back west. Trails continue ahead." : `You are near ${location.name}: ${location.summary}.`);
      return;
    }
    if (object.type === "wild_horse") {
      if (this.handleExplorationScenario(interaction)) return;
      this.ui.messageBox.show("Wild Horse", "A wild horse watches from a distance. Capture and taming will come later.");
      return;
    }
    if (object.type === "landmark") {
      if (object.variant === 3) this.completeStoryQuest("discovery-bay-map");
      const location = this.placeForWorld(interaction.worldX, interaction.worldY);
      this.ui.messageBox.show(location.stAnn ? "St Ann Landmark" : "Parish Landmark", object.variant === 3 && location.stAnn ? `Limestone and old road stones mark ${location.name} country.` : `${location.name}: ${location.summary}.`);
      return;
    }

    const save = SaveSystem.load();
    const alreadyUsed = save.world.interactedWorldObjects.includes(object.id);
    if (object.type === "route_marker") {
      if (!alreadyUsed) {
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
      }
      this.completeStoryQuest("ranch-errand");
      const routeMarkerReads = save.world.interactedWorldObjects.filter((id) => id.includes(":route_marker:")).length;
      if (routeMarkerReads >= 2) this.completeStoryQuest("north-coast-signs");
      if (object.variant >= 2) this.completeStoryQuest("runaway-bay-ride");
      this.ui.messageBox.show("Route Marker", this.routeMarkerMessage(object.variant, interaction.worldX, interaction.worldY));
      return;
    }
    if (object.type === "market_stall" || object.type === "fruit_stand") {
      if (this.handleExplorationScenario(interaction)) return;
      const foods = sampleJamaicanFoods(object.id, 5).join(", ");
      if (!alreadyUsed && object.type === "fruit_stand") {
        this.stats = applyStatDelta(this.stats, { mood: 1, energy: 2 });
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
        this.ui.updateStats(this.stats, this.areaName);
        this.ui.messageBox.show("Fruit Stand", `A roadside seller shares ${pickJamaicanFood(object.id)} for the trail. Other baskets show ${foods}. ${this.celebrationLine()} Mood +1, Energy +2.`);
      } else {
        if (!alreadyUsed) {
          save.world.interactedWorldObjects.push(object.id);
          this.saveWorld(save.world.interactedWorldObjects);
        }
        this.ui.messageBox.show(object.type === "fruit_stand" ? "Fruit Stand" : "Market Stall", object.type === "fruit_stand" ? `Baskets of ${foods} sit under a hand-painted awning. ${this.celebrationLine()}` : `A parish stall offers ${foods}. ${this.celebrationLine()}`);
      }
      this.completeStoryQuest("market-day");
      return;
    }
    if (object.type === "parish_caretaker") {
      const location = this.placeForWorld(interaction.worldX, interaction.worldY);
      if (!alreadyUsed) {
        this.stats = applyStatDelta(this.stats, { health: 5, energy: 3 });
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
        this.ui.updateStats(this.stats, this.areaName);
        this.ui.messageBox.show("Parish Caretaker", `A caretaker near ${location.name} checks the bridle, offers water, and points out the safest road. Health +5, Energy +3.`);
      } else {
        this.ui.messageBox.show("Parish Caretaker", `The caretaker waves you through ${location.name}. Your horse is already checked for this stop.`);
      }
      return;
    }
    if (object.type === "fishing_boat") {
      if (this.handleExplorationScenario(interaction)) return;
      this.ui.messageBox.show("Fishing Boat", "A pulled-up fishing boat rests by the cove. Your own skiff can be built and customized back at the ranch Boat Shed.");
      return;
    }
    if (object.type === "jerk_drum") {
      this.ui.messageBox.show("Jerk Drum", `Smoke curls from a roadside drum with ${sampleJamaicanFoods(`${object.id}:jerk`, 3).join(", ")} nearby. The smell lifts the whole ride.`);
      return;
    }
    if (object.type === "beach_palms") {
      if (this.handleExplorationScenario(interaction)) return;
      this.completeStoryQuest("beach-sprint");
      this.ui.messageBox.show("Beach Palms", "Palms lean over warm sand and shallow water. The coast is opening up.");
      return;
    }
    if (object.type === "flower_patch") {
      if (this.handleExplorationScenario(interaction)) return;
      if (!alreadyUsed) {
        this.stats = applyStatDelta(this.stats, { mood: 1 });
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
        this.ui.updateStats(this.stats, this.areaName);
        this.ui.messageBox.show("Wildflowers", "Wildflowers sway beside the trail. Your horse seems calmer. Mood +1.");
      } else {
        this.ui.messageBox.show("Wildflowers", "The wildflowers here have already been enjoyed today.");
      }
      return;
    }
    if (object.type === "banana_patch" || object.type === "breadfruit_tree" || object.type === "coconut_pile" || object.type === "sugarcane_patch") {
      if (this.handleExplorationScenario(interaction)) return;
      if (!alreadyUsed) {
        this.stats = applyStatDelta(this.stats, { mood: 1, energy: object.type === "sugarcane_patch" ? 1 : 2 });
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
        this.ui.updateStats(this.stats, this.areaName);
      }
      this.ui.messageBox.show("Roadside Food", `${this.foodObjectMessage(object.type, object.id)} ${alreadyUsed ? "You already checked this spot." : "Mood +1."}`);
      return;
    }
    if (object.type === "hibiscus_bush" || object.type === "palm_cluster" || object.type === "limestone_outcrop" || object.type === "rain_puddle") {
      if (this.handleExplorationScenario(interaction)) return;
      this.ui.messageBox.show("St Ann Scenery", this.sceneryMessage(object.type, object.id));
      return;
    }
    if (object.type === "pond_edge" || object.type === "pond") {
      if (this.handleExplorationScenario(interaction)) return;
      if (!alreadyUsed) {
        this.stats = applyStatDelta(this.stats, { energy: 5 });
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
        this.ui.updateStats(this.stats, this.areaName);
        this.ui.messageBox.show("Pond", "Your horse drinks from the pond. Energy +5.");
      } else {
        this.ui.messageBox.show("Pond", "The pond is quiet. Your horse has already rested here.");
      }
      return;
    }
    if (object.type === "berry_bush" || object.type === "mushroom_patch" || object.type === "herb_patch" || object.type === "wild_apple_tree") {
      if (this.handleExplorationScenario(interaction)) return;
      if (!alreadyUsed) {
        const delta = object.type === "wild_apple_tree" ? { mood: 2, energy: 3 } : { mood: 1 };
        this.stats = applyStatDelta(this.stats, delta);
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
        this.ui.updateStats(this.stats, this.areaName);
        this.ui.messageBox.show("Forage", `${this.forageMessage(object.type)} ${object.type === "wild_apple_tree" ? "Mood +2, Energy +3." : "Mood +1."}`);
      } else {
        this.ui.messageBox.show("Forage", "This patch has already been picked.");
      }
      return;
    }
    if (object.type === "tall_grass_graze_patch") {
      if (!alreadyUsed) {
        this.stats = applyStatDelta(this.stats, { energy: 5, mood: 2 });
        save.world.interactedWorldObjects.push(object.id);
        this.saveWorld(save.world.interactedWorldObjects);
        this.ui.updateStats(this.stats, this.areaName);
        this.ui.messageBox.show("Trail Graze", "Your horse grazes for a moment. Energy +5, Mood +2.");
      } else {
        this.ui.messageBox.show("Trail Graze", "Your horse already grazed here.");
      }
      return;
    }
    if (object.type === "rock_cluster") {
      if (this.handleExplorationScenario(interaction)) return;
      this.ui.messageBox.show("Trail Marker", "A rocky trail marker breaks up the grass.");
      return;
    }
    if (object.type === "fallen_log") {
      if (this.handleExplorationScenario(interaction)) return;
      this.ui.messageBox.show("Fallen Log", "A weathered log shelters tiny mushrooms and trail insects.");
    }
  }

  private promptFor(interaction: WorldInteraction): string {
    const scenario = this.availableExplorationScenario(interaction);
    if (scenario) return this.primaryPrompt(scenario.prompt);
    if (interaction.object.type === "sign") return this.primaryPrompt("Read Sign");
    if (interaction.object.type === "route_marker") return this.primaryPrompt("Read Route Marker");
    if (interaction.object.type === "market_stall") return this.primaryPrompt("Inspect Market Stall");
    if (interaction.object.type === "fruit_stand") return this.primaryPrompt("Visit Fruit Stand");
    if (interaction.object.type === "parish_caretaker") return this.primaryPrompt("Talk to Caretaker");
    if (interaction.object.type === "banana_patch") return this.primaryPrompt("Check Banana Patch");
    if (interaction.object.type === "breadfruit_tree") return this.primaryPrompt("Inspect Breadfruit Tree");
    if (interaction.object.type === "coconut_pile") return this.primaryPrompt("Check Coconut Pile");
    if (interaction.object.type === "sugarcane_patch") return this.primaryPrompt("Inspect Sugarcane");
    if (interaction.object.type === "hibiscus_bush") return this.primaryPrompt("Inspect Hibiscus");
    if (interaction.object.type === "palm_cluster") return this.primaryPrompt("Inspect Palms");
    if (interaction.object.type === "limestone_outcrop") return this.primaryPrompt("Inspect Limestone");
    if (interaction.object.type === "rain_puddle") return this.primaryPrompt("Check Rain Puddle");
    if (interaction.object.type === "fishing_boat") return this.primaryPrompt("Inspect Fishing Boat");
    if (interaction.object.type === "jerk_drum") return this.primaryPrompt("Inspect Jerk Drum");
    if (interaction.object.type === "beach_palms") return this.primaryPrompt("Rest By Palms");
    if (interaction.object.type === "flower_patch") return this.primaryPrompt("Inspect Wildflowers");
    if (interaction.object.type === "pond_edge" || interaction.object.type === "pond") return this.primaryPrompt("Let Horse Drink");
    if (interaction.object.type === "berry_bush") return this.primaryPrompt("Forage Wild Berries");
    if (interaction.object.type === "mushroom_patch") return this.primaryPrompt("Gather Mushrooms");
    if (interaction.object.type === "herb_patch") return this.primaryPrompt("Gather Herbs");
    if (interaction.object.type === "wild_apple_tree") return this.primaryPrompt("Pick Wild Apple");
    if (interaction.object.type === "tall_grass_graze_patch") return this.primaryPrompt("Let Horse Graze");
    if (interaction.object.type === "wild_horse") return this.primaryPrompt("Watch Wild Horse");
    if (interaction.object.type === "rock_cluster") return this.primaryPrompt("Inspect Rocks");
    if (interaction.object.type === "fallen_log") return this.primaryPrompt("Inspect Fallen Log");
    return this.primaryPrompt("Inspect Landmark");
  }

  private handleExplorationScenario(interaction: WorldInteraction): boolean {
    const scenario = this.availableExplorationScenario(interaction);
    if (!scenario) return false;
    const save = SaveSystem.load();
    const key = explorationScenarioKey(interaction.object.id, scenario.id);
    if (save.world.interactedWorldObjects.includes(key)) return false;
    if (this.inventory[scenario.item] <= 0) {
      this.ui.messageBox.show("Tool Needed", `${ITEM_LABELS[scenario.item]} is needed here. Check the ranch inventory before riding back out.`);
      return true;
    }
    const beforeProgress = explorationProgress(save.world.interactedWorldObjects);
    this.stats = applyStatDelta(this.stats, scenario.reward);
    save.world.interactedWorldObjects.push(key);
    let message = `${scenario.message} ${this.deltaSummary(scenario.reward)}.`;
    const tackBonus = horseCustomizationExplorationBonus(save.horseCustomization, scenario.id);
    if (this.hasDelta(tackBonus)) {
      this.stats = applyStatDelta(this.stats, tackBonus);
      message += ` Tack perk: ${this.deltaSummary(tackBonus)}.`;
    }
    const afterProgress = explorationProgress(save.world.interactedWorldObjects);
    const milestone = EXPLORATION_MILESTONES.find((entry) => (
      beforeProgress.uniqueScenarioCount < entry.count
      && afterProgress.uniqueScenarioCount >= entry.count
      && !save.world.interactedWorldObjects.includes(explorationMilestoneKey(entry.id))
    ));
    if (milestone) {
      this.stats = applyStatDelta(this.stats, milestone.reward);
      save.world.interactedWorldObjects.push(explorationMilestoneKey(milestone.id));
      message += ` ${milestone.title}: ${milestone.message}. ${this.deltaSummary(milestone.reward)}.`;
      if (milestone.unlockCustomizationIds?.length) {
        save.horseCustomization = addOwnedHorseCustomizationItems(save.horseCustomization, milestone.unlockCustomizationIds);
        const unlocked = horseCustomizationLabels(milestone.unlockCustomizationIds).join(", ");
        if (unlocked) message += ` Tack unlocked: ${unlocked}.`;
      }
    }
    this.saveWorld(save.world.interactedWorldObjects, save.horseCustomization);
    this.ui.updateStats(this.stats, this.areaName);
    this.ui.messageBox.show(scenario.title, message);
    return true;
  }

  private availableExplorationScenario(interaction: WorldInteraction): ResolvedExplorationScenario | undefined {
    const scenario = this.explorationScenarioFor(interaction);
    if (!scenario) return undefined;
    const save = SaveSystem.load();
    const key = explorationScenarioKey(interaction.object.id, scenario.id);
    return save.world.interactedWorldObjects.includes(key) ? undefined : scenario;
  }

  private explorationScenarioFor(interaction: WorldInteraction): ResolvedExplorationScenario | undefined {
    const definition = explorationScenarioForObjectType(interaction.object.type);
    if (!definition) return undefined;
    const location = this.placeForWorld(interaction.worldX, interaction.worldY);
    return {
      ...definition,
      message: definition.message(location.name)
    };
  }

  private deltaSummary(delta: StatDelta): string {
    return Object.entries(delta)
      .filter(([, value]) => typeof value === "number" && value !== 0)
      .map(([key, value]) => `${this.statName(key)} ${Number(value) > 0 ? "+" : ""}${value}`)
      .join(", ");
  }

  private hasDelta(delta: StatDelta): boolean {
    return Object.values(delta).some((value) => typeof value === "number" && value !== 0);
  }

  private statName(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  private forageMessage(type: string): string {
    if (type === "berry_bush") return "Collected wild berries.";
    if (type === "mushroom_patch") return "Gathered trail mushrooms.";
    if (type === "herb_patch") return "Gathered trail herbs.";
    return "Picked a wild apple.";
  }

  private routeMarkerMessage(variant: number, worldX = this.player.x, worldY = this.player.y): string {
    const place = this.placeForWorld(worldX, worldY);
    if (!place.stAnn) return `${place.name}: ${place.summary}. Boat landings can move your home papers between parish shores.`;
    if (variant <= 1) return "Steer Town, Mammee Bay, Drax Hall, and St Ann's Bay are marked along the home road.";
    if (variant === 2) return "Ocho Rios, Dunn's River, Shaw Park, and Fern Gully are marked east and inland.";
    if (variant === 3) return "Runaway Bay, Salem, Discovery Bay, and Puerto Seco are marked along limestone coast country.";
    return "Brown's Town, Alexandria, Claremont, Moneague, and Nine Mile are marked inland across St Ann.";
  }

  private placeForWorld(worldX: number, worldY: number): WorldPlace {
    const chunk = worldToChunk(worldX, worldY);
    const parish = parishForChunk(chunk.chunkX, chunk.chunkY);
    if (parish && parish.id !== "st-ann") {
      return {
        name: `${parish.shoreName}, ${parish.name}`,
        summary: `${parish.summary}; today's local note is ${parish.localEvent}`,
        stAnn: false
      };
    }
    const route = routeLocationForChunk(Math.floor(worldX / CHUNK_SIZE));
    return {
      name: route.name,
      summary: `${route.summary}. The St Ann route stays between Steer Town, Ocho Rios, Runaway Bay, Brown's Town, and Discovery Bay`,
      stAnn: true
    };
  }

  private celebrationLine(): string {
    const save = SaveSystem.load();
    const celebration = activeCelebrationForDay(this.stats.day, save.world.currentParishId);
    return `Today carries ${celebration.title}: ${celebration.summary}.`;
  }

  private foodObjectMessage(type: string, seed: string): string {
    if (type === "banana_patch") return `Banana leaves shade a roadside patch. A rider has tucked away ${pickJamaicanFood(seed)} beside it.`;
    if (type === "breadfruit_tree") return `A breadfruit tree leans over the lane with notes about ${sampleJamaicanFoods(seed, 3).join(", ")}.`;
    if (type === "coconut_pile") return `Fresh coconuts sit by the road with talk of ${pickJamaicanFood(seed)} and ginger beer.`;
    return `Sugarcane rustles beside a food basket: ${sampleJamaicanFoods(seed, 4).join(", ")}.`;
  }

  private sceneryMessage(type: string, seed: string): string {
    if (type === "hibiscus_bush") return `Hibiscus flowers brighten the lane. Nearby trees include ${sampleJamaicanTrees(seed, 3).join(", ")}.`;
    if (type === "palm_cluster") return `Palms shade the route with ${sampleJamaicanTrees(seed, 3).join(", ")} marked on a farm note.`;
    if (type === "limestone_outcrop") return "A white limestone outcrop catches the rain light, the kind of stone you see around Discovery Bay country.";
    return `Rain gathers in a shallow puddle. A ${pickJamaicanBird(seed)} flicks past the wet grass.`;
  }

  private createHiddenQuestItems(): void {
    this.hiddenQuestItems = HIDDEN_QUEST_ITEMS.map((item) => {
      const sprite = this.add.sprite(item.x, item.y, item.texture)
        .setDisplaySize(50, 50)
        .setOrigin(0.5, 0.72)
        .setDepth(this.worldDisplayDepth(item.y, 18));
      const glow = this.add.ellipse(item.x, item.y + 8, 68, 28, Palette.gold, 0.12)
        .setStrokeStyle(2, Palette.gold, 0.55)
        .setDepth(this.worldDisplayDepth(item.y, 8));
      this.tweens.add({
        targets: [sprite, glow],
        alpha: { from: 0.74, to: 1 },
        duration: 900,
        yoyo: true,
        repeat: -1
      });
      return { ...item, sprite, glow };
    });
    this.updateHiddenQuestItems();
  }

  private updateHiddenQuestItems(): void {
    const completed = SaveSystem.load().world.interactedWorldObjects;
    const completedSet = new Set(completed);
    this.hiddenQuestItems.forEach((item) => {
      const available = this.isHiddenQuestItemAvailable(item, completedSet);
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      const nearby = distance < 340;
      item.sprite.setVisible(available && nearby);
      item.glow.setVisible(available && nearby && distance < 185);
      item.sprite.setDepth(this.worldDisplayDepth(item.y, 18));
      item.glow.setDepth(this.worldDisplayDepth(item.y, 8));
    });
  }

  private nearestHiddenQuestItem(): HiddenQuestRenderable | undefined {
    const completed = new Set(SaveSystem.load().world.interactedWorldObjects);
    let nearest: HiddenQuestRenderable | undefined;
    this.hiddenQuestItems.forEach((item) => {
      if (!this.isHiddenQuestItemAvailable(item, completed)) return;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
      if (distance > HIDDEN_QUEST_INTERACTION_DISTANCE) return;
      if (!nearest || distance < Phaser.Math.Distance.Between(this.player.x, this.player.y, nearest.x, nearest.y)) nearest = item;
    });
    return nearest;
  }

  private isHiddenQuestItemAvailable(item: HiddenQuestItem, completed: Set<string>): boolean {
    if (completed.has(item.id)) return false;
    return !item.requires || completed.has(item.requires);
  }

  private handleHiddenQuestInteraction(item: HiddenQuestRenderable): void {
    const save = SaveSystem.load();
    if (save.world.interactedWorldObjects.includes(item.id)) {
      this.ui.messageBox.show(item.title, item.repeatMessage);
      return;
    }
    this.stats = applyStatDelta(this.stats, { coins: item.rewardCoins });
    save.world.interactedWorldObjects.push(item.id);
    this.saveWorld(save.world.interactedWorldObjects);
    this.ui.updateStats(this.stats, this.areaName);
    this.updateHiddenQuestItems();
    const progress = hiddenQuestProgress(save.world.interactedWorldObjects);
    const suffix = progress.complete ? `\n\n${HIDDEN_QUEST_NAME} complete.` : `\n\n${HIDDEN_QUEST_NAME}: ${progress.found}/${progress.total}.`;
    this.completeStoryQuest("hidden-cache");
    this.ui.messageBox.show(item.title, `${item.foundMessage} Coins +${item.rewardCoins}.${suffix}`);
  }

  private createPlayerBoat(): void {
    const save = SaveSystem.load();
    if (!save.world.boat.built) return;
    const parish = destinationByParishId(save.world.currentParishId);
    const dock = boatDockPoint(parish);
    const x = typeof save.world.boat.x === "number" && Number.isFinite(save.world.boat.x) ? save.world.boat.x : dock.x;
    const y = typeof save.world.boat.y === "number" && Number.isFinite(save.world.boat.y) ? save.world.boat.y : dock.y;
    this.boatSprite = this.physics.add.sprite(x, y, "player_boat")
      .setDisplaySize(122, 78)
      .setDepth(this.worldDisplayDepth(y, 4))
      .setTint(boatHullTint(save.world.boat.hull));
  }

  private restoreBoardedBoat(): void {
    const save = SaveSystem.load();
    if (!save.world.boat.built) return;
    this.isBoating = true;
    const x = typeof save.world.boat.x === "number" && Number.isFinite(save.world.boat.x) ? save.world.boat.x : this.player.x;
    const y = typeof save.world.boat.y === "number" && Number.isFinite(save.world.boat.y) ? save.world.boat.y : this.player.y;
    const safeBoat = this.safeResolvedTravelPoint(x, y, "boat", 18, this.lastSafeBoatPoint);
    this.player.setTexture("player_boat")
      .setDisplaySize(122, 78)
      .setTint(boatHullTint(save.world.boat.hull))
      .setPosition(safeBoat.x, safeBoat.y);
    this.configurePlayerBody(true);
    this.boatSprite?.disableBody(true, true);
    this.horse.disableBody(true, true);
    this.ambientHorse?.setEnabled(false);
  }

  private boardBoat(): void {
    const save = SaveSystem.load();
    if (!save.world.boat.built || !this.boatSprite) {
      this.ui.toast("Build a boat at the ranch Boat Shed first.", "#ffcf8a");
      return;
    }
    if (this.isMounted) this.dismountHorse(false);
    this.isBoating = true;
    this.player.setVelocity(0);
    this.player.setTexture("player_boat").setDisplaySize(122, 78).setTint(boatHullTint(save.world.boat.hull));
    const safeBoat = this.safeResolvedTravelPoint(this.boatSprite.x, this.boatSprite.y, "boat", 18, this.lastSafeBoatPoint);
    this.player.setPosition(safeBoat.x, safeBoat.y);
    this.configurePlayerBody(true);
    this.boatSprite.disableBody(true, true);
    this.horse.disableBody(true, true);
    this.ambientHorse?.setEnabled(false);
    this.saveBoatState(true);
    this.ui.toast(`Boarded ${save.world.boat.name}. Row with ${this.movementPrompt()}.`, "#d4af37");
  }

  private disembarkBoat(showToast = true): void {
    if (!this.isBoating) return;
    const save = SaveSystem.load();
    const boatX = this.player.x;
    const boatY = this.player.y;
    const landing = this.findDisembarkPoint(boatX, boatY);
    if (!landing) {
      this.player.setVelocity(0);
      this.lastSafeBoatPoint = { x: boatX, y: boatY };
      this.saveBoatState(true);
      this.ui.toast("Row closer to shore before tying up.", "#ffcf8a");
      return;
    }
    this.isBoating = false;
    this.player.setVelocity(0);
    this.player.clearTint().setAngle(0);
    const riderKey = this.textures.exists(RIDER_IDLE_KEY) ? RIDER_IDLE_KEY : IMAGE_KEYS.player;
    this.player.setTexture(this.textures.exists(riderKey) ? riderKey : "rider_placeholder")
      .setDisplaySize(this.textures.exists(riderKey) ? 72 : 42, this.textures.exists(riderKey) ? 72 : 60);
    this.player.setPosition(landing.x, landing.y);
    this.lastSafeLandPoint = { x: landing.x, y: landing.y };
    this.lastSafeBoatPoint = { x: boatX, y: boatY };
    this.configurePlayerBody(false);
    this.boatSprite?.enableBody(true, boatX, boatY, true, true);
    this.boatSprite?.setDisplaySize(122, 78).setTint(boatHullTint(save.world.boat.hull)).setDepth(this.worldDisplayDepth(boatY, 40));
    const bounds = this.physics.world.bounds;
    const horsePoint = this.safeResolvedTravelPoint(
      Phaser.Math.Clamp(this.player.x - 88, bounds.x + 32, bounds.right - 32),
      Phaser.Math.Clamp(this.player.y + 54, bounds.y + 32, bounds.bottom - 32),
      "land",
      10,
      this.lastSafeLandPoint
    );
    this.horse.enableBody(true, horsePoint.x, horsePoint.y, true, true);
    this.horse.setTexture(this.horseVisuals.idleKey).setDisplaySize(90, 90).setTint(this.horseVisuals.coatTint);
    this.ambientHorse?.setVisuals(this.horseVisuals);
    this.ambientHorse?.setEnabled(true);
    this.saveBoatState(false);
    if (showToast) this.ui.toast("Boat tied up. Back on foot.", "#f8dd91");
  }

  private saveBoatState(onboard: boolean): void {
    const save = SaveSystem.load();
    if (!save.world.boat.built) return;
    const rawX = onboard ? this.player.x : this.boatSprite?.x ?? this.player.x + 76;
    const rawY = onboard ? this.player.y : this.boatSprite?.y ?? this.player.y + 36;
    const boatPoint = this.safeResolvedTravelPoint(rawX, rawY, "boat", 18, this.lastSafeBoatPoint);
    const x = boatPoint.x;
    const y = boatPoint.y;
    const boatChunk = worldToChunk(x, y);
    const playerPoint = this.safeResolvedTravelPoint(this.player.x, this.player.y, onboard ? "boat" : "land", 14, onboard ? this.lastSafeBoatPoint : this.lastSafeLandPoint);
    save.world.boat = {
      ...save.world.boat,
      x,
      y,
      chunkX: boatChunk.chunkX,
      chunkY: boatChunk.chunkY,
      onboard
    };
    const playerChunk = worldToChunk(playerPoint.x, playerPoint.y);
    save.world.openWorldPosition = {
      x: playerPoint.x,
      y: playerPoint.y,
      chunkX: playerChunk.chunkX,
      chunkY: playerChunk.chunkY
    };
    if (!onboard && this.horse?.active && this.horse.visible) {
      const safeHorse = this.safeResolvedTravelPoint(this.horse.x, this.horse.y, "land", 10, this.lastSafeLandPoint);
      const horseChunk = worldToChunk(safeHorse.x, safeHorse.y);
      save.world.horsePosition = {
        x: safeHorse.x,
        y: safeHorse.y,
        chunkX: horseChunk.chunkX,
        chunkY: horseChunk.chunkY
      };
    }
    this.syncWorldLocation(save.world, playerPoint);
    SaveSystem.save({ stats: this.stats, inventory: this.inventory, world: save.world });
  }

  private announceCelebration(): void {
    const save = SaveSystem.load();
    const celebration = activeCelebrationForDay(this.stats.day, save.world.currentParishId);
    this.time.delayedCall(1650, () => {
      this.ui.toast(`${celebration.title}: ${celebration.summary}`, celebration.kind === "holiday" ? "#d4af37" : "#f8dd91");
    });
  }

  private syncWildlife(): void {
    const loaded = this.chunkManager.loadedObjects().filter((entry) => isWildlifeSpawnObject(entry.object));
    const liveIds = new Set(loaded.map((entry) => entry.object.id));
    this.wildlife.forEach((wildlife, id) => {
      if (!liveIds.has(id)) {
        wildlife.destroy();
        this.wildlife.delete(id);
      }
    });
    loaded.forEach((entry) => {
      if (!this.wildlife.has(entry.object.id)) {
        this.wildlife.set(entry.object.id, new Wildlife(this, entry));
      }
    });
  }

  private updateWildlife(time: number, delta: number): void {
    const threat = { x: this.player.x, y: this.player.y };
    this.wildlife.forEach((wildlife) => wildlife.update(time, delta, threat));
    if (time - this.lastWildlifeNoticeAt < 7000) return;
    const nearby = Array.from(this.wildlife.values())
      .find((wildlife) => wildlife.kind === "snake" || wildlife.kind === "coyote" || wildlife.kind === "rabbit" || wildlife.kind === "bird" || wildlife.kind === "goat" || wildlife.kind === "mongoose" || wildlife.kind === "pelican" || wildlife.kind === "frigatebird");
    if (!nearby) return;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, nearby.sprite.x, nearby.sprite.y);
    if (distance > (nearby.kind === "coyote" ? 145 : 95)) return;
    this.lastWildlifeNoticeAt = time;
    const wildlifeName = String(nearby.sprite.getData("wildlifeName") ?? pickJamaicanBird(nearby.id));
    if (nearby.kind === "snake") this.ui.toast("A Jamaican boa is sunning near the rocks. Better steer around it.", "#ffcf8a");
    else if (nearby.kind === "coyote") this.ui.toast("A stray hill dog watches from the treeline, then slips away.", "#ffcf8a");
    else if (nearby.kind === "goat") this.ui.toast("A roadside goat trots out of the path.", "#f8dd91");
    else if (nearby.kind === "mongoose") this.ui.toast("A mongoose flashes through the scrub.", "#f8dd91");
    else if (nearby.kind === "pelican") this.ui.toast(`${wildlifeName} lifts off toward the water.`, "#f8dd91");
    else if (nearby.kind === "frigatebird") this.ui.toast(`${wildlifeName} wheels high above the coast.`, "#f8dd91");
    else if (nearby.kind === "bird") this.ui.toast(`${wildlifeName} flits across the St Ann road.`, "#f8dd91");
    else this.ui.toast("A Jamaican coney darts through the grass.", "#f8dd91");
  }

  private miniMapLandmarks(): MiniMapLandmark[] {
    if (!this.chunkManager) return [];
    const save = SaveSystem.load();
    const completed = new Set(save.world.interactedWorldObjects);
    const discoveredChunks = this.chunkManager.markDiscovered(save.world.discoveredChunks, this.player.x, this.player.y);
    const landmarks: MiniMapLandmark[] = this.chunkManager.loadedObjects()
      .filter((entry) => {
        const type = entry.object.type;
        return type === "route_marker"
          || type === "sign"
          || type === "market_stall"
          || type === "fruit_stand"
          || type === "parish_caretaker"
          || type === "landmark"
          || type === "beach_palms"
          || type === "banana_patch"
          || type === "breadfruit_tree";
      })
      .map((entry) => {
        const type = entry.object.type;
        const kind: MiniMapLandmark["kind"] = type === "market_stall" || type === "fruit_stand"
          ? "market"
          : type === "parish_caretaker"
          ? "quest"
          : type === "route_marker" || type === "sign"
          ? "route"
          : "nature";
        return {
          x: entry.worldX,
          y: entry.worldY,
          label: type.replace(/_/g, " "),
          kind
        };
      });
    const currentQuest = hiddenQuestProgress(save.world.interactedWorldObjects).current;
    if (currentQuest && this.isHiddenQuestItemAvailable(currentQuest, completed)) {
      const questChunk = worldToChunk(currentQuest.x, currentQuest.y);
      const questDiscovered = discoveredChunks.includes(chunkKey(questChunk.chunkX, questChunk.chunkY))
        || Phaser.Math.Distance.Between(this.player.x, this.player.y, currentQuest.x, currentQuest.y) < 700;
      if (questDiscovered) {
        landmarks.push({
          x: currentQuest.x,
          y: currentQuest.y,
          label: currentQuest.title,
          kind: "quest"
        });
      }
    }
    return landmarks;
  }

  private handleZoomKeys(): void {
    if (this.actionJustDown("zoomOut")) this.adjustZoom(-0.12);
    if (this.actionJustDown("zoomIn")) this.adjustZoom(0.12);
    if (this.actionJustDown("zoomReset")) this.cameras.main.setZoom(1);
  }

  private adjustZoom(amount: number): void {
    this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + amount, 0.65, 1.35));
  }

  private syncOpenWorldDepths(): void {
    this.player?.setDepth(this.worldDisplayDepth(this.player.y, this.isBoating ? 8 : 0));
    if (this.horse?.active && this.horse.visible) this.horse.setDepth(this.worldDisplayDepth(this.horse.y, -8));
    if (this.boatSprite?.active && this.boatSprite.visible) this.boatSprite.setDepth(this.worldDisplayDepth(this.boatSprite.y, 4));
    this.wildlife.forEach((wildlife) => {
      if (wildlife.sprite.active) wildlife.sprite.setDepth(this.worldDisplayDepth(wildlife.sprite.y, 18));
    });
  }

  private worldDisplayDepth(worldY: number, offset = 0): number {
    const camera = this.cameras.main;
    const viewportHeight = camera.height || GAME_HEIGHT;
    const screenY = (worldY - camera.scrollY) * camera.zoom;
    const normalized = Phaser.Math.Clamp(screenY / Math.max(1, viewportHeight), 0, 1);
    return OPEN_WORLD_ENTITY_DEPTH_BASE + normalized * OPEN_WORLD_ENTITY_DEPTH_RANGE + offset;
  }

  private localMapBounds(): { left: number; top: number; right: number; bottom: number; width: number; height: number } {
    const radius = CHUNK_SIZE * 7;
    return {
      left: this.player.x - radius,
      top: this.player.y - radius,
      right: this.player.x + radius,
      bottom: this.player.y + radius,
      width: radius * 2,
      height: radius * 2
    };
  }

  private seededWildernessName(chunkX: number, chunkY: number): string {
    return `Seeded Wilds ${chunkX}, ${chunkY}`;
  }

  private updateDebugText(): void {
    if (!this.debugWorldVisible) return;
    const info = this.chunkManager.currentInfo(this.player.x, this.player.y);
    this.debugText.setText([
      `DEBUG ${this.areaName}`,
      `Seed: ${this.worldSeed}`,
      `Chunk: ${info.chunkX}, ${info.chunkY}`,
      `Nearest: ${info.location}`,
      `Biome: ${info.biome}`,
      `Loaded chunks: ${info.loaded}`,
      `FPS: ${Math.round(this.game.loop.actualFps)}`
    ]);
  }

  private toggleOpenWorldDebug(): void {
    this.toggleDebugZones();
    this.debugWorldVisible = !this.debugWorldVisible;
    this.debugText.setVisible(this.debugWorldVisible);
  }

  private saveWorld(interactedWorldObjects?: string[], horseCustomization?: HorseCustomizationSave): void {
    const save = SaveSystem.load();
    const safePlayer = this.safeResolvedTravelPoint(this.player.x, this.player.y, this.isBoating ? "boat" : "land", 14, this.isBoating ? this.lastSafeBoatPoint : this.lastSafeLandPoint);
    if (safePlayer.x !== this.player.x || safePlayer.y !== this.player.y) this.player.setPosition(safePlayer.x, safePlayer.y);
    const current = worldToChunk(safePlayer.x, safePlayer.y);
    save.world.openWorldPosition = {
      x: safePlayer.x,
      y: safePlayer.y,
      chunkX: current.chunkX,
      chunkY: current.chunkY
    };
    if (this.horse?.active && this.horse.visible) {
      const safeHorse = this.safeResolvedTravelPoint(this.horse.x, this.horse.y, "land", 10, this.lastSafeLandPoint);
      const horseChunk = worldToChunk(safeHorse.x, safeHorse.y);
      save.world.horsePosition = {
        x: safeHorse.x,
        y: safeHorse.y,
        chunkX: horseChunk.chunkX,
        chunkY: horseChunk.chunkY
      };
    }
    this.syncWorldLocation(save.world, safePlayer);
    if (interactedWorldObjects) save.world.interactedWorldObjects = Array.from(new Set(interactedWorldObjects));
    if (save.world.boat.built) {
      const boatX = this.isBoating ? this.player.x : this.boatSprite?.x;
      const boatY = this.isBoating ? this.player.y : this.boatSprite?.y;
      if (typeof boatX === "number" && typeof boatY === "number") {
        const boatPoint = this.safeResolvedTravelPoint(boatX, boatY, "boat", 18, this.lastSafeBoatPoint);
        const boatChunk = worldToChunk(boatPoint.x, boatPoint.y);
        save.world.boat = {
          ...save.world.boat,
          x: boatPoint.x,
          y: boatPoint.y,
          chunkX: boatChunk.chunkX,
          chunkY: boatChunk.chunkY,
          onboard: this.isBoating
        };
      }
    }
    SaveSystem.save({ stats: this.stats, inventory: this.inventory, world: save.world, horseCustomization: horseCustomization ?? save.horseCustomization });
  }

  private syncWorldLocation(world: WorldSaveData, point: { x: number; y: number }): void {
    const current = worldToChunk(point.x, point.y);
    world.discoveredChunks = this.chunkManager.markDiscovered(world.discoveredChunks, point.x, point.y);
    const parish = parishForChunk(current.chunkX, current.chunkY);
    if (parish) {
      world.currentParishId = parish.id;
      world.visitedParishIds = Array.from(new Set([...world.visitedParishIds, parish.id]));
      this.currentParish = parish;
      const nextAreaName = parish.id === "st-ann" ? "St Ann Route" : `${parish.name} Shore`;
      if (this.areaName !== nextAreaName) {
        this.areaName = nextAreaName;
        this.ui.updateStats(this.stats, this.areaName);
      }
    } else {
      const nextAreaName = this.seededWildernessName(current.chunkX, current.chunkY);
      if (this.areaName !== nextAreaName) {
        this.areaName = nextAreaName;
        this.ui.updateStats(this.stats, this.areaName);
      }
    }
  }

  private saveOpenWorldPosition(time = this.time.now): void {
    this.saveWorld();
    const current = worldToChunk(this.player.x, this.player.y);
    this.lastSavedChunk = chunkKey(current.chunkX, current.chunkY);
    this.lastSaveAt = time;
  }
}
