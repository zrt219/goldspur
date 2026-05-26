import Phaser from "phaser";
import { HORSE_ANIMATION_KEYS, HORSE_GRAZE_KEY, HORSE_IDLE_KEY } from "../systems/AnimationLoader";
import { HorseVisualKeys } from "../art/HorseCustomizationTextures";

type HorseState = "idle" | "wander" | "graze" | "look";

const WANDER_SPEED = 52;

export class AmbientHorse {
  private state: HorseState = "idle";
  private stateUntil = 0;
  private target = new Phaser.Math.Vector2();
  private fallbackTween?: Phaser.Tweens.Tween;
  private baseScaleX = 1;
  private baseScaleY = 1;
  private enabled = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly sprite: Phaser.Physics.Arcade.Sprite,
    private readonly roamBounds: Phaser.Geom.Rectangle,
    private visuals?: HorseVisualKeys
  ) {
    this.sprite.setTexture(this.idleTexture());
    this.sprite.setDisplaySize(86, 86);
    this.baseScaleX = this.sprite.scaleX;
    this.baseScaleY = this.sprite.scaleY;
    this.enterIdle();
  }

  setVisuals(visuals: HorseVisualKeys): void {
    this.visuals = visuals;
    this.sprite.setTexture(this.idleTexture()).setDisplaySize(86, 86);
    this.enterIdle();
  }

  update(time: number): void {
    if (!this.enabled) return;
    if (this.scene.scene.isPaused()) return;

    if (this.state === "wander") {
      if (time >= this.stateUntil) {
        this.enterIdle();
      } else {
        this.updateWander();
      }
    } else if (time >= this.stateUntil) {
      this.nextState();
    }

    this.sprite.setDepth(this.sprite.y - 8);
  }

  pause(): void {
    this.sprite.setVelocity(0);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.sprite.setVelocity(0);
    this.stopFallbackTween();

    if (!enabled) {
      this.stopAnimation();
      return;
    }

    this.sprite.setTexture(this.idleTexture());
    this.enterIdle();
  }

  destroy(): void {
    this.fallbackTween?.stop();
  }

  private nextState(): void {
    const roll = Math.random();
    if (roll < 0.5) this.enterGraze();
    else if (roll < 0.78) this.enterWander();
    else this.enterLook();
  }

  private enterIdle(): void {
    this.stopFallbackTween();
    this.state = "idle";
    this.stateUntil = this.scene.time.now + Phaser.Math.Between(1800, 3600);
    this.sprite.setVelocity(0);

    if (this.playAnimation(this.visuals?.idleAnimationKey ?? HORSE_ANIMATION_KEYS.idleBreathe)) return;
    this.sprite.setTexture(this.idleTexture());
    this.startFallbackBreatheTween(0.985, 1200);
  }

  private enterLook(): void {
    this.stopFallbackTween();
    this.state = "look";
    this.stateUntil = this.scene.time.now + Phaser.Math.Between(900, 1700);
    this.sprite.setVelocity(0);
    this.sprite.setFlipX(Math.random() > 0.5);

    if (this.playAnimation(this.visuals?.idleAnimationKey ?? HORSE_ANIMATION_KEYS.idleBreathe)) return;
    this.sprite.setTexture(this.idleTexture());
  }

  private enterGraze(): void {
    this.stopFallbackTween();
    this.state = "graze";
    this.stateUntil = this.scene.time.now + Phaser.Math.Between(3200, 6200);
    this.sprite.setVelocity(0);

    if (this.playAnimation(this.visuals?.grazeAnimationKey ?? HORSE_ANIMATION_KEYS.grazeLoop)) return;
    this.sprite.setTexture(this.grazeTexture());
    this.startFallbackBreatheTween(0.97, 850);
  }

  private enterWander(): void {
    this.stopFallbackTween();
    this.state = "wander";
    this.stateUntil = this.scene.time.now + Phaser.Math.Between(2400, 4300);
    this.playAnimation(this.visuals?.walkAnimationKey ?? HORSE_ANIMATION_KEYS.walkRight);

    const distance = Phaser.Math.Between(48, 130);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = Phaser.Math.Clamp(this.sprite.x + Math.cos(angle) * distance, this.roamBounds.left, this.roamBounds.right);
    const y = Phaser.Math.Clamp(this.sprite.y + Math.sin(angle) * distance, this.roamBounds.top, this.roamBounds.bottom);
    this.target.set(x, y);
  }

  private updateWander(): void {
    const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.target.x, this.target.y);
    if (distance < 8) {
      this.enterGraze();
      return;
    }

    const direction = new Phaser.Math.Vector2(this.target.x - this.sprite.x, this.target.y - this.sprite.y).normalize();
    this.sprite.setVelocity(direction.x * WANDER_SPEED, direction.y * WANDER_SPEED);
    if (Math.abs(direction.x) > 0.15) this.sprite.setFlipX(direction.x < 0);

    if (!this.sprite.anims.isPlaying && !this.playAnimation(this.visuals?.walkAnimationKey ?? HORSE_ANIMATION_KEYS.walkRight)) {
      this.sprite.setTexture(this.idleTexture());
    }
  }

  private playAnimation(key: string): boolean {
    if (!this.scene.anims.exists(key)) return false;
    this.sprite.play(key, true);
    return true;
  }

  private stopAnimation(): void {
    if (this.sprite.anims.isPlaying) {
      this.sprite.stop();
    }
  }

  private startFallbackBreatheTween(scaleY: number, duration: number): void {
    this.fallbackTween = this.scene.tweens.add({
      targets: this.sprite,
      scaleY: this.baseScaleY * scaleY,
      duration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  private stopFallbackTween(): void {
    this.fallbackTween?.stop();
    this.fallbackTween = undefined;
    this.sprite.setScale(this.baseScaleX, this.baseScaleY);
  }

  private idleTexture(): string {
    return this.visuals?.idleKey ?? (this.scene.textures.exists(HORSE_IDLE_KEY) ? HORSE_IDLE_KEY : this.sprite.texture.key);
  }

  private grazeTexture(): string {
    return this.visuals?.grazeKey ?? (this.scene.textures.exists(HORSE_GRAZE_KEY) ? HORSE_GRAZE_KEY : this.idleTexture());
  }
}
