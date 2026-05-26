import Phaser from "phaser";
import { IMAGE_KEYS, WORLD_BOUNDS } from "../data/constants";
import { InventoryState } from "../data/items";
import { applyStatDelta, HorseStats, StatDelta } from "../systems/HorseStats";
import { SaveData, SaveSystem } from "../systems/SaveSystem";
import { UIManager } from "../systems/UIManager";
import { TravelDestination } from "../ui/TravelMenu";
import { paintScene } from "../art/ScenePainter";
import { Rider } from "../entities/Rider";
import { AmbientHorse } from "../entities/AmbientHorse";
import { ensureMountedAnimationAssets, HORSE_IDLE_KEY, isMountedAnimationAssetLoaded, MOUNTED_ANIMATION_KEYS, MOUNTED_IDLE_KEY, RIDER_IDLE_KEY } from "../systems/AnimationLoader";
import { ambienceForHour, StAnnAmbienceState, StAnnWeatherMode, WeatherSystem } from "../systems/WeatherSystem";
import { StoryQuestId } from "../data/storyQuests";
import { completeQuestInSave, rewardSummary } from "../systems/StoryQuestSystem";
import { ensureHorseVisualTextures, HorseVisualKeys } from "../art/HorseCustomizationTextures";
import { fadeInScene, startSceneWithFastFade } from "../systems/SceneTransition";
import { bindingLabel, GameSettings, InputAction, keyCodeForBinding, loadGameSettings, movementLabel } from "../systems/GameSettings";
import { healthStatus, travelSpeedFactor } from "../systems/HealthSystem";

const MOUNTED_WORLD_DISPLAY_SIZE = 112;
const MOUNTED_WORLD_BODY = { width: 42, height: 28 };
const MOUNTED_JUMP_LIFT = 22;

export abstract class BaseWorldScene extends Phaser.Scene {
  protected stats!: HorseStats;
  protected inventory!: InventoryState;
  protected ui!: UIManager;
  protected player!: Phaser.Physics.Arcade.Sprite;
  protected horse!: Phaser.Physics.Arcade.Sprite;
  protected riderEntity!: Rider;
  protected ambientHorse!: AmbientHorse;
  protected horseVisuals!: HorseVisualKeys;
  protected weather?: WeatherSystem;
  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  protected keys!: Record<"w" | "a" | "s" | "d" | "e" | "f" | "m" | "i" | "h" | "r" | "space" | "f3", Phaser.Input.Keyboard.Key>;
  protected settings: GameSettings = loadGameSettings();
  protected actionKeys!: Record<InputAction, Phaser.Input.Keyboard.Key>;
  protected areaName: string;
  protected isMounted = false;
  private markerGlows = new Map<string, Phaser.GameObjects.Shape | Phaser.GameObjects.Container>();
  private debugZones: Phaser.GameObjects.Shape[] = [];
  private debugVisible = false;
  private resetArmed = false;
  private isTraveling = false;
  private weatherHour = 12;
  private weatherMode: StAnnWeatherMode = "humid";
  private weatherCycleElapsed = 0;
  private isMountedJumping = false;
  private mountedJumpLift = 0;
  private mountedJumpCooldownUntil = 0;
  private mountedJumpTween?: Phaser.Tweens.Tween;
  private mountedAssetLoadAttempted = false;
  private mountedAssetLoadPending = false;
  private lowCareWarningAt = 0;

  protected constructor(sceneKey: string, areaName: string) {
    super(sceneKey);
    this.areaName = areaName;
  }

  protected createBase(_backgroundKey: string, startX = 640, startY = 380): void {
    const save = SaveSystem.load();
    this.stats = save.stats;
    this.inventory = save.inventory;

    this.addBackground();
    this.createActors(startX, startY);
    this.createControls();
    this.ui = new UIManager(
      this,
      this.areaName,
      (scene) => this.travel(scene),
      () => this.openInventory(),
      () => this.openSettings(),
      () => this.controlHints()
    );
    this.ui.updateStats(this.stats, this.areaName);
    this.createWeatherSystem();
    fadeInScene(this);
    this.showAreaTitle();
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      const updated = SaveSystem.load();
      this.stats = updated.stats;
      this.inventory = updated.inventory;
      this.refreshControlBindings();
      this.refreshHorseVisuals();
      this.ui.updateStats(this.stats, this.areaName);
      this.syncClockHud();
    });
  }

  override update(time: number, delta: number): void {
    this.updateMovement(delta);
    this.enforceSceneBounds();
    this.ambientHorse?.update(time);
    this.updateWeather(time, delta);
    this.updateMiniMap();
    this.handleGlobalKeys();
  }

  protected addBackground(): void {
    paintScene(this, this.areaName);
  }

  protected createActors(x: number, y: number): void {
    const save = SaveSystem.load();
    this.horseVisuals = ensureHorseVisualTextures(this, save.horseCustomization);
    const riderKey = this.textures.exists(RIDER_IDLE_KEY) ? RIDER_IDLE_KEY : this.textures.exists(IMAGE_KEYS.player) ? IMAGE_KEYS.player : "rider_placeholder";
    const horseKey = this.textures.exists(this.horseVisuals.idleKey) ? this.horseVisuals.idleKey : this.textures.exists(HORSE_IDLE_KEY) ? HORSE_IDLE_KEY : this.textures.exists(IMAGE_KEYS.horse) ? IMAGE_KEYS.horse : "horse_placeholder";
    this.player = this.physics.add.sprite(x, y, riderKey).setDepth(30).setCollideWorldBounds(true);
    this.player.setDisplaySize(this.textures.exists(RIDER_IDLE_KEY) ? 72 : 42, this.textures.exists(RIDER_IDLE_KEY) ? 72 : 60);
    this.horse = this.physics.add.sprite(x - 84, y + 56, horseKey).setDepth(30).setCollideWorldBounds(true);
    this.horse.setDisplaySize(this.textures.exists(this.horseVisuals.idleKey) ? 90 : this.textures.exists(HORSE_IDLE_KEY) ? 90 : 92, this.textures.exists(this.horseVisuals.idleKey) ? 90 : this.textures.exists(HORSE_IDLE_KEY) ? 90 : 66);
    this.horse.setTint(this.horseVisuals.coatTint);
    this.physics.world.setBounds(WORLD_BOUNDS.x, WORLD_BOUNDS.y, WORLD_BOUNDS.width, WORLD_BOUNDS.height);
    this.riderEntity = new Rider(this.player);
    this.ambientHorse = new AmbientHorse(this, this.horse, this.horseRoamBounds(x, y), this.horseVisuals);
    this.configurePlayerBody(false);
  }

  protected refreshHorseVisuals(): void {
    if (!this.horse || !this.player) return;
    const save = SaveSystem.load();
    this.horseVisuals = ensureHorseVisualTextures(this, save.horseCustomization);
    this.ambientHorse?.setVisuals(this.horseVisuals);
    if (this.isMounted) {
      this.stopMountedJump();
      if (this.player.anims.isPlaying) this.player.stop();
      this.player.setTexture(this.horseVisuals.mountedIdleKey).setDisplaySize(MOUNTED_WORLD_DISPLAY_SIZE, MOUNTED_WORLD_DISPLAY_SIZE).setTint(this.horseVisuals.mountedTint);
      this.applyMountedJumpLift(0);
    } else if (this.horse.visible) {
      if (this.horse.anims.isPlaying) this.horse.stop();
      this.player.clearTint();
      this.horse.setTexture(this.horseVisuals.idleKey).setDisplaySize(90, 90).setTint(this.horseVisuals.coatTint);
    }
  }

  protected horseRoamBounds(x: number, y: number): Phaser.Geom.Rectangle {
    const left = Phaser.Math.Clamp(x - 170, WORLD_BOUNDS.left, WORLD_BOUNDS.right - 320);
    const top = Phaser.Math.Clamp(y - 110, WORLD_BOUNDS.top, WORLD_BOUNDS.bottom - 220);
    return new Phaser.Geom.Rectangle(left, top, 320, 220);
  }

  protected createControls(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.refreshControlBindings();
    this.keys = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      i: Phaser.Input.Keyboard.KeyCodes.I,
      h: Phaser.Input.Keyboard.KeyCodes.H,
      r: Phaser.Input.Keyboard.KeyCodes.R,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      f3: Phaser.Input.Keyboard.KeyCodes.F3
    }) as typeof this.keys;
  }

  protected refreshControlBindings(): void {
    this.settings = loadGameSettings();
    this.actionKeys = (Object.keys(this.settings.bindings) as InputAction[]).reduce((keys, action) => {
      const keyCode = keyCodeForBinding(this.settings.bindings[action]) ?? keyCodeForBinding("KeyE")!;
      keys[action] = this.input.keyboard!.addKey(keyCode);
      return keys;
    }, {} as Record<InputAction, Phaser.Input.Keyboard.Key>);
  }

  protected actionJustDown(action: InputAction): boolean {
    const key = this.actionKeys?.[action];
    return Boolean(key && Phaser.Input.Keyboard.JustDown(key));
  }

  protected actionIsDown(action: InputAction): boolean {
    return Boolean(this.actionKeys?.[action]?.isDown);
  }

  protected actionLabel(action: InputAction): string {
    return bindingLabel(this.settings.bindings[action]);
  }

  protected primaryPrompt(label: string): string {
    return `${this.actionLabel("primaryInteract")} - ${label}`;
  }

  protected movementPrompt(): string {
    return movementLabel(this.settings);
  }

  protected formatPrompt(prompt: string): string {
    return prompt.replace(/^E\s*-\s*/i, `${this.actionLabel("primaryInteract")} - `);
  }

  protected controlHints(): { fallback: string; help: string } {
    const move = movementLabel(this.settings);
    const interact = this.actionLabel("primaryInteract");
    const mount = this.actionLabel("mount");
    const map = this.actionLabel("map");
    const inventory = this.actionLabel("inventory");
    const ranch = this.actionLabel("ranch");
    const settings = this.actionLabel("settings");
    return {
      fallback: `${move}   ${interact} interact   ${mount} mount   ${ranch} ranch`,
      help: `Help: ${move} move, ${interact} interact/pick up, ${mount} mount, ${map} map, ${inventory} inventory, ${settings} settings.`
    };
  }

  protected updateMovement(delta: number): void {
    if (this.ui?.isOverlayOpen()) {
      this.player.setVelocity(0);
      this.ambientHorse?.pause();
      return;
    }

    const speed = this.adjustedTravelSpeed(this.isMounted ? 315 : 235);
    const velocity = new Phaser.Math.Vector2(0, 0);
    if (this.cursors.left?.isDown || this.actionIsDown("moveLeft")) velocity.x -= 1;
    if (this.cursors.right?.isDown || this.actionIsDown("moveRight")) velocity.x += 1;
    if (this.cursors.up?.isDown || this.actionIsDown("moveUp")) velocity.y -= 1;
    if (this.cursors.down?.isDown || this.actionIsDown("moveDown")) velocity.y += 1;
    velocity.normalize().scale(speed);
    this.player.setVelocity(velocity.x, velocity.y);

    this.player.setDepth(this.player.y);
    if (this.isMounted) {
      this.handleMountedJumpInput();
      this.updateMountedAnimation(velocity);
    }
    else this.riderEntity?.updateFromVelocity();
    if (velocity.lengthSq() > 64) this.maybeWarnLowCare();
    void delta;
  }

  protected canStartMountedJump(): boolean {
    return true;
  }

  protected handleGlobalKeys(): void {
    if (this.ui.messageBox.isOpen() || this.ui.isJournalOpen()) {
      if (this.actionJustDown("debug")) this.toggleDebugZones();
      return;
    }
    if (this.ui.travelMenu.isOpen()) {
      if (this.actionJustDown("map")) this.ui.travelMenu.toggle();
      if (this.actionJustDown("debug")) this.toggleDebugZones();
      return;
    }
    if (this.actionJustDown("settings")) this.openSettings();
    if (this.actionJustDown("map")) this.ui.travelMenu.toggle();
    if (this.actionJustDown("inventory")) this.openInventory();
    if (this.actionJustDown("mount")) this.toggleMount();
    if (this.actionJustDown("ranch") && this.scene.key !== "RanchScene") this.travel("RanchScene");
    if (this.actionJustDown("reset")) this.handleReset();
    if (this.actionJustDown("debug")) this.toggleDebugZones();
  }

  protected mutateStats(delta: StatDelta): { before: HorseStats; after: HorseStats } {
    const before = { ...this.stats };
    this.stats = applyStatDelta(this.stats, delta);
    this.save();
    this.ui.updateStats(this.stats, this.areaName);
    this.syncClockHud();
    this.showStatFloat(delta);
    return { before, after: { ...this.stats } };
  }

  protected setStats(stats: HorseStats): void {
    this.stats = stats;
    this.save();
    this.ui.updateStats(this.stats, this.areaName);
    this.syncClockHud();
  }

  protected save(): void {
    SaveSystem.save({ stats: this.stats, inventory: this.inventory });
  }

  protected saveData(data: SaveData): void {
    this.stats = data.stats;
    this.inventory = data.inventory;
    SaveSystem.save(data);
    this.ui.updateStats(this.stats, this.areaName);
    this.syncClockHud();
  }

  protected completeStoryQuest(questId: StoryQuestId): boolean {
    const save = SaveSystem.load();
    const result = completeQuestInSave({ ...save, stats: this.stats, inventory: this.inventory }, questId);
    if (!result.completed || !result.quest) return false;
    this.stats = result.save.stats;
    this.inventory = result.save.inventory;
    SaveSystem.save(result.save);
    this.ui.updateStats(this.stats, this.areaName);
    this.ui.toast(`Story complete: ${result.quest.title}. ${rewardSummary(result.quest.reward)}`, "#d4af37");
    return true;
  }

  protected currentAmbience(): StAnnAmbienceState | undefined {
    return this.weather?.getAmbience();
  }

  protected onAmbienceChanged(_ambience: StAnnAmbienceState): void {
    // Scenes with chunk or lighting systems can mirror the global ambience.
  }

  protected updateMiniMap(): void {
    this.ui?.updateMiniMap({
      mode: "local",
      areaName: this.areaName,
      worldX: this.player.x,
      worldY: this.player.y,
      horse: this.horse?.visible ? { x: this.horse.x, y: this.horse.y, visible: true, tracked: true } : undefined
    });
  }

  protected openInventory(): void {
    this.scene.launch("InventoryScene", {
      returnScene: this.scene.key,
      stats: this.stats,
      inventory: this.inventory
    });
    this.scene.pause();
    this.scene.bringToTop("InventoryScene");
  }

  protected openSettings(): void {
    this.scene.launch("SettingsScene", {
      returnScene: this.scene.key
    });
    this.scene.pause();
    this.scene.bringToTop("SettingsScene");
  }

  protected travel(scene: TravelDestination): void {
    if (scene === this.scene.key || this.isTraveling) return;
    if (this.isMounted) this.dismountHorse(false);
    this.isTraveling = true;
    startSceneWithFastFade(this, scene);
  }

  protected marker(x: number, y: number, label: string, color = 0xf1c86d, id = label, showHoverLabel = true): Phaser.GameObjects.Container {
    const glow = this.add.ellipse(x, y, 76, 42, color, 0.08).setStrokeStyle(2, color, 0.85).setVisible(false);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.28, to: 0.62 },
      duration: 950,
      yoyo: true,
      repeat: -1
    });
    const labelWidth = Math.max(150, label.length * 13);
    const shadow = this.add.rectangle(x + 4, y - 43, labelWidth, 34, 0x000000, 0.32);
    const sign = this.add.rectangle(x, y - 48, labelWidth, 34, 0x2a1a0e, 0.96)
      .setStrokeStyle(3, 0xd4af37);
    const inner = this.add.rectangle(x, y - 48, labelWidth - 10, 24, 0x7a4a24, 0.65)
      .setStrokeStyle(1, 0x9b7322, 0.75);
    const text = this.add.text(x, y - 48, label, {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#fff3cf"
    }).setOrigin(0.5);
    const debug = this.add.circle(x, y, 68, 0xffd36e, 0.04)
      .setStrokeStyle(2, 0xffd36e, 0.5)
      .setVisible(false)
      .setDepth(20);
    this.debugZones.push(debug);
    this.markerGlows.set(id, glow);
    const container = this.add.container(0, 0, [glow, shadow, sign, inner, text]).setDepth(90);
    container.setVisible(false);
    if (showHoverLabel) this.markerGlows.set(`${id}:label`, container);
    return container;
  }

  protected clickZone(x: number, y: number, radius: number, action: () => void): Phaser.GameObjects.Arc {
    return this.add.circle(x, y, radius, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(95)
      .on("pointerdown", () => {
        if (!this.ui.messageBox.isOpen() && !this.ui.travelMenu.isOpen()) action();
      });
  }

  protected setActiveInteraction(id: string | null): void {
    this.markerGlows.forEach((glow, markerId) => {
      if (markerId.endsWith(":label")) {
        glow.setVisible(markerId === `${id}:label`);
        return;
      }
      glow.setVisible(this.debugVisible || markerId === id);
      glow.setAlpha(markerId === id ? 0.55 : 0.16);
    });
  }

  protected mountPrompt(): string | undefined {
    if (this.isMounted) return `${this.actionLabel("mount")} - Dismount`;
    if (!this.horse?.visible) return undefined;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.horse.x, this.horse.y);
    return distance <= 96 ? `${this.actionLabel("mount")} - Mount Horse` : undefined;
  }

  protected handleMountInput(): boolean {
    const prompt = this.mountPrompt();
    if (!prompt || !this.actionJustDown("mount")) return false;
    this.toggleMount();
    return true;
  }

  protected adjustedTravelSpeed(baseSpeed: number): number {
    return Math.round(baseSpeed * travelSpeedFactor(this.stats));
  }

  protected maybeWarnLowCare(): void {
    if (!this.ui || this.time.now - this.lowCareWarningAt < 12000) return;
    if (this.stats.health > 50 && this.stats.energy > 25) return;
    this.lowCareWarningAt = this.time.now;
    const status = healthStatus(this.stats);
    this.ui.toast(`${status.label}: ${status.advice}`, status.color);
  }

  protected toggleMount(): void {
    if (this.isMounted) this.dismountHorse();
    else this.mountHorse();
  }

  protected mountHorse(): void {
    if (this.isMounted || !this.horse?.visible) return;
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.horse.x, this.horse.y);
    if (distance > 112) {
      this.ui?.toast("Move closer to your horse to mount.", "#ffcf8a");
      return;
    }
    if (!this.mountedAssetLoadAttempted && !isMountedAnimationAssetLoaded(this)) {
      this.mountedAssetLoadAttempted = true;
      this.mountedAssetLoadPending = true;
      this.ui?.toast("Preparing riding animation...", "#f8dd91");
      ensureMountedAnimationAssets(this, () => {
        this.mountedAssetLoadPending = false;
        if (!this.scene.isActive(this.scene.key) || this.isMounted || !this.horse?.visible) return;
        if (!isMountedAnimationAssetLoaded(this)) this.ui?.toast("Using fallback riding sprite.", "#ffcf8a");
        this.mountHorse();
      });
      return;
    }
    if (this.mountedAssetLoadPending) return;
    this.isMounted = true;
    this.stopMountedJump();
    this.player.setVelocity(0);
    this.ambientHorse?.setEnabled(false);
    this.horse.disableBody(true, true);
    if (this.textures.exists(this.horseVisuals.mountedIdleKey)) {
      this.player.setTexture(this.horseVisuals.mountedIdleKey).setDisplaySize(MOUNTED_WORLD_DISPLAY_SIZE, MOUNTED_WORLD_DISPLAY_SIZE);
    } else if (this.textures.exists(MOUNTED_IDLE_KEY)) {
      this.player.setTexture(MOUNTED_IDLE_KEY).setDisplaySize(MOUNTED_WORLD_DISPLAY_SIZE, MOUNTED_WORLD_DISPLAY_SIZE);
    } else if (this.textures.exists("horse_placeholder")) {
      this.player.setTexture("horse_placeholder").setDisplaySize(110, 78);
    }
    this.applyMountedJumpLift(0);
    this.player.setTint(this.horseVisuals.mountedTint);
    this.configurePlayerBody(true);
    this.ui?.toast("Mounted up. Ride anywhere.", "#d4af37");
  }

  protected dismountHorse(showToast = true): void {
    if (!this.isMounted) return;
    this.isMounted = false;
    this.stopMountedJump();
    this.player.setVelocity(0);
    if (this.player.anims.isPlaying) this.player.stop();
    const riderKey = this.textures.exists(RIDER_IDLE_KEY) ? RIDER_IDLE_KEY : this.textures.exists(IMAGE_KEYS.player) ? IMAGE_KEYS.player : "rider_placeholder";
    this.player.clearTint().setTexture(riderKey).setDisplaySize(this.textures.exists(RIDER_IDLE_KEY) ? 72 : 42, this.textures.exists(RIDER_IDLE_KEY) ? 72 : 60);
    this.player.setOrigin(0.5, 0.5);
    this.configurePlayerBody(false);
    const bounds = this.physics.world.bounds;
    const horseX = Phaser.Math.Clamp(this.player.x - 78, bounds.x + 32, bounds.right - 32);
    const horseY = Phaser.Math.Clamp(this.player.y + 38, bounds.y + 32, bounds.bottom - 32);
    this.horse.enableBody(true, horseX, horseY, true, true);
    this.horse.setTexture(this.horseVisuals.idleKey).setTint(this.horseVisuals.coatTint);
    this.horse.setDisplaySize(90, 90);
    this.horse.setVelocity(0);
    this.ambientHorse?.setEnabled(true);
    if (showToast) this.ui?.toast("Dismounted.", "#f8dd91");
  }

  protected updateMountedAnimation(velocity: Phaser.Math.Vector2): void {
    if (this.isMountedJumping) {
      if (this.anims.exists(this.horseVisuals.mountedJumpAnimationKey)) {
        this.player.play(this.horseVisuals.mountedJumpAnimationKey, true);
        return;
      }
      if (this.anims.exists(this.horseVisuals.mountedRideAnimationKey)) {
        this.player.play(this.horseVisuals.mountedRideAnimationKey, true);
        return;
      }
    }
    const moving = velocity.lengthSq() > 64;
    if (Math.abs(velocity.x) > 8) this.player.setFlipX(velocity.x < 0);
    if (moving && this.anims.exists(this.horseVisuals.mountedRideAnimationKey)) {
      this.player.play(this.horseVisuals.mountedRideAnimationKey, true);
      return;
    }
    if (moving && this.anims.exists("mounted_ride_right")) {
      this.player.play("mounted_ride_right", true);
      return;
    }
    if (!moving && this.anims.exists(this.horseVisuals.mountedIdleAnimationKey)) {
      this.player.play(this.horseVisuals.mountedIdleAnimationKey, true);
      return;
    }
    if (!moving && this.anims.exists(MOUNTED_ANIMATION_KEYS.idleBreathe)) {
      this.player.play(MOUNTED_ANIMATION_KEYS.idleBreathe, true);
      return;
    }
    if (this.player.anims.isPlaying) this.player.stop();
    if (this.textures.exists(this.horseVisuals.mountedIdleKey)) this.player.setTexture(this.horseVisuals.mountedIdleKey);
    else if (this.textures.exists(MOUNTED_IDLE_KEY)) this.player.setTexture(MOUNTED_IDLE_KEY);
  }

  protected handleMountedJumpInput(): void {
    if (!this.actionJustDown("jump")) return;
    if (!this.canStartMountedJump() || this.isMountedJumping || this.time.now < this.mountedJumpCooldownUntil) return;
    this.startMountedJump();
  }

  private startMountedJump(): void {
    this.isMountedJumping = true;
    this.mountedJumpCooldownUntil = this.time.now + 860;
    if (this.anims.exists(this.horseVisuals.mountedJumpAnimationKey)) {
      this.player.play(this.horseVisuals.mountedJumpAnimationKey, true);
    }
    this.spawnMountedJumpDust();
    this.mountedJumpTween?.stop();
    const state = { lift: 0 };
    this.mountedJumpTween = this.tweens.add({
      targets: state,
      lift: { from: 0, to: MOUNTED_JUMP_LIFT },
      duration: 330,
      yoyo: true,
      ease: "Sine.easeOut",
      onUpdate: () => this.applyMountedJumpLift(state.lift),
      onComplete: () => {
        this.isMountedJumping = false;
        this.applyMountedJumpLift(0);
        this.mountedJumpTween = undefined;
      }
    });
  }

  private stopMountedJump(): void {
    this.mountedJumpTween?.stop();
    this.mountedJumpTween = undefined;
    this.isMountedJumping = false;
    this.applyMountedJumpLift(0);
  }

  private applyMountedJumpLift(lift: number): void {
    this.mountedJumpLift = lift;
    const scaleY = Math.max(0.001, Math.abs(this.player.scaleY));
    this.player.setDisplayOrigin(
      this.player.width * 0.5,
      this.player.height * 0.5 + this.mountedJumpLift / scaleY
    );
  }

  private spawnMountedJumpDust(): void {
    for (let index = 0; index < 5; index += 1) {
      const puff = this.add.circle(
        this.player.x - 24 + index * 12,
        this.player.y + 46 + (index % 2) * 4,
        6,
        0xd7b071,
        0.32
      ).setDepth(this.player.y - 1);
      this.tweens.add({
        targets: puff,
        x: puff.x - 20 + index * 6,
        y: puff.y + 4,
        scale: 1.9,
        alpha: 0,
        duration: 520,
        ease: "Sine.easeOut",
        onComplete: () => puff.destroy()
      });
    }
  }

  private createWeatherSystem(): void {
    this.weatherHour = this.baseWeatherHour();
    this.weatherMode = this.weatherModeForHour(this.weatherHour);
    const ambience = this.ambienceForSettings(this.weatherHour, this.weatherMode);
    this.weather = new WeatherSystem(this, ambience, { depth: 650, rainDropCount: this.weatherRainDropCount() });
    this.syncClockHud(ambience);
    this.onAmbienceChanged(ambience);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.weather?.destroy();
      this.weather = undefined;
    });
  }

  private updateWeather(time: number, delta: number): void {
    this.weather?.update(time, delta);
    this.weatherCycleElapsed += delta;
    if (this.weatherCycleElapsed < this.weatherHourInterval()) return;
    this.weatherCycleElapsed = 0;
    this.weatherHour = (this.weatherHour + 1) % 24;
    this.weatherMode = this.weatherModeForHour(this.weatherHour);
    const ambience = this.ambienceForSettings(this.weatherHour, this.weatherMode);
    this.weather?.setAmbience(ambience);
    this.syncClockHud(ambience);
    this.onAmbienceChanged(this.weather?.getAmbience() ?? ambience);
  }

  private baseWeatherHour(): number {
    const sceneOffset: Record<string, number> = {
      Ranch: 8,
      Training: 11,
      Racing: 15,
      Health: 10,
      Relaxation: 17,
      "St Ann Route": 13
    };
    return ((sceneOffset[this.areaName] ?? 12) + (this.stats.day - 1) * 2) % 24;
  }

  private weatherModeForHour(hour: number): StAnnWeatherMode {
    const forced = this.settings.weather.mode;
    if (forced === "off") return "clear";
    if (forced !== "dynamic") return forced;
    const safeHour = ((hour % 24) + 24) % 24;
    const roll = this.weatherRoll(this.stats.day, safeHour);
    if (safeHour < 5 || safeHour >= 20) return roll < 0.2 ? "night_shower" : roll < 0.58 ? "mist" : "humid";
    if (safeHour < 8) return roll < 0.58 ? "mist" : "humid";
    if (safeHour >= 12 && safeHour <= 16) {
      if (roll < 0.08) return "heavy_rain";
      if (roll < 0.34) return "light_rain";
      return roll < 0.78 ? "humid" : "clear";
    }
    if (safeHour >= 17 && safeHour < 20) return roll < 0.18 ? "light_rain" : roll < 0.64 ? "humid" : "clear";
    return roll < 0.14 ? "light_rain" : roll < 0.48 ? "humid" : "clear";
  }

  private weatherRoll(day: number, hour: number): number {
    let hash = (day * 1103515245 + hour * 2654435761 + this.areaName.length * 374761393) >>> 0;
    for (let index = 0; index < this.areaName.length; index += 1) {
      hash = Math.imul(hash ^ this.areaName.charCodeAt(index), 2246822519) >>> 0;
    }
    return (hash % 1000) / 1000;
  }

  private ambienceForSettings(hour: number, mode: StAnnWeatherMode): StAnnAmbienceState {
    const ambience = ambienceForHour(hour, mode);
    if (this.settings.weather.mode === "off") {
      return {
        ...ambience,
        weather: "clear",
        rainIntensity: 0,
        humidity: Math.min(ambience.humidity, 0.5),
        haze: 0,
        wind: Math.min(ambience.wind, 0.12)
      };
    }
    const rainScale = this.settings.graphics.reducedWeather ? Math.min(this.settings.weather.rainScale, 0.35) : this.settings.weather.rainScale;
    const hazeScale = this.settings.graphics.reducedWeather ? 0.35 : 1;
    return {
      ...ambience,
      rainIntensity: Phaser.Math.Clamp(ambience.rainIntensity * rainScale, 0, 1),
      haze: Phaser.Math.Clamp(ambience.haze * hazeScale, 0, 1)
    };
  }

  private weatherHourInterval(): number {
    if (this.settings.time.speed === "slow") return 12000;
    if (this.settings.time.speed === "fast") return 3500;
    return 7000;
  }

  private weatherRainDropCount(): number {
    if (this.settings.weather.mode === "off") return 0;
    const base = this.settings.graphics.quality === "low" ? 48 : this.settings.graphics.quality === "medium" ? 86 : 132;
    return this.settings.graphics.reducedWeather ? Math.floor(base * 0.42) : base;
  }

  protected enforceSceneBounds(): void {
    if (!this.player) return;
    const halfWidth = Math.max(22, this.player.displayWidth * (this.isMounted ? 0.44 : 0.34));
    const halfHeight = Math.max(24, this.player.displayHeight * (this.isMounted ? 0.48 : 0.42));
    const x = Phaser.Math.Clamp(this.player.x, WORLD_BOUNDS.left + halfWidth, WORLD_BOUNDS.right - halfWidth);
    const y = Phaser.Math.Clamp(this.player.y, WORLD_BOUNDS.top + halfHeight, WORLD_BOUNDS.bottom - halfHeight);
    if (x !== this.player.x || y !== this.player.y) {
      this.player.setPosition(x, y);
      this.player.setVelocity(0);
    }
    if (!this.horse?.active || !this.horse.visible) return;
    const horseHalfWidth = Math.max(34, this.horse.displayWidth * 0.45);
    const horseHalfHeight = Math.max(28, this.horse.displayHeight * 0.45);
    const horseX = Phaser.Math.Clamp(this.horse.x, WORLD_BOUNDS.left + horseHalfWidth, WORLD_BOUNDS.right - horseHalfWidth);
    const horseY = Phaser.Math.Clamp(this.horse.y, WORLD_BOUNDS.top + horseHalfHeight, WORLD_BOUNDS.bottom - horseHalfHeight);
    if (horseX !== this.horse.x || horseY !== this.horse.y) {
      this.horse.setPosition(horseX, horseY);
      this.horse.setVelocity(0);
    }
  }

  private syncClockHud(ambience = this.weather?.getAmbience()): void {
    if (!ambience || !this.ui) return;
    this.ui.updateClock({
      day: this.stats.day,
      hour: this.weatherHour,
      weather: ambience.weather,
      timeOfDay: ambience.timeOfDay,
      rainIntensity: ambience.rainIntensity,
      humidity: ambience.humidity
    });
  }

  protected configurePlayerBody(mounted: boolean): void {
    const body = this.player.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) return;
    if (mounted) {
      body.setSize(MOUNTED_WORLD_BODY.width, MOUNTED_WORLD_BODY.height, true);
      return;
    }
    body.setSize(28, 34, true);
  }

  protected toggleDebugZones(): void {
    this.debugVisible = !this.debugVisible;
    this.debugZones.forEach((zone) => zone.setVisible(this.debugVisible));
    if (!this.debugVisible) {
      this.markerGlows.forEach((glow) => glow.setVisible(false));
    }
    this.ui.toast(this.debugVisible ? "Interaction debug visible" : "Interaction debug hidden");
  }

  private showAreaTitle(): void {
    const titles: Record<string, string> = {
      Ranch: "Ranch",
      Training: "Training Grounds",
      Racing: "Racing Track",
      Health: "Health & Care",
      Relaxation: "Relaxation Meadow"
    };
    const panel = this.add.rectangle(640, 86, 340, 52, 0x15100a, 0.88)
      .setStrokeStyle(2, 0xd4af37)
      .setDepth(820)
      .setScrollFactor(0);
    const text = this.add.text(640, 86, titles[this.areaName] ?? this.areaName, {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: "#f5e6b8"
    }).setOrigin(0.5).setDepth(821).setScrollFactor(0);
    this.tweens.add({
      targets: [panel, text],
      alpha: 0,
      delay: 1200,
      duration: 350,
      onComplete: () => {
        panel.destroy();
        text.destroy();
      }
    });
  }

  private showStatFloat(delta: StatDelta): void {
    const entries = Object.entries(delta)
      .filter(([key]) => key !== "relaxUsesToday" && key !== "racesEntered" && key !== "racesWon")
      .slice(0, 3);
    entries.forEach(([key, value], index) => {
      if (typeof value !== "number" || value === 0) return;
      const color = key === "coins" && value > 0 ? "#d4af37" : value > 0 ? "#8ee06d" : "#e36b55";
      const sign = value > 0 ? "+" : "";
      const text = this.add.text(this.player.x + 16, this.player.y - 54 - index * 22, `${sign}${value} ${this.statLabel(key)}`, {
        fontFamily: "Georgia",
        fontSize: "18px",
        color,
        stroke: "#15100a",
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(850);
      this.tweens.add({
        targets: text,
        y: text.y - 36,
        alpha: 0,
        duration: 1000,
        ease: "Sine.easeOut",
        onComplete: () => text.destroy()
      });
    });
  }

  private statLabel(key: string): string {
    return key.charAt(0).toUpperCase() + key.slice(1);
  }

  protected handleReset(): void {
    if (!this.resetArmed) {
      this.resetArmed = true;
      this.ui.toast("Press R again to reset save", "#ffb46b");
      this.time.delayedCall(3000, () => {
        this.resetArmed = false;
      });
      return;
    }
    const data = SaveSystem.reset();
    this.saveData(data);
    this.resetArmed = false;
    this.ui.messageBox.show("Save Reset", "Your Goldspur Valley save has been reset.", () => {
      this.scene.start("RanchScene");
    });
  }
}
