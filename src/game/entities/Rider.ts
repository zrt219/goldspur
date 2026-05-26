import Phaser from "phaser";
import { RIDER_ANIMATION_KEYS, RIDER_IDLE_KEY } from "../systems/AnimationLoader";

const MOVING_THRESHOLD = 8;

export class Rider {
  constructor(private readonly sprite: Phaser.Physics.Arcade.Sprite) {}

  updateFromVelocity(): void {
    const body = this.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body)) return;

    const moving = Math.abs(body.velocity.x) > MOVING_THRESHOLD || Math.abs(body.velocity.y) > MOVING_THRESHOLD;
    if (Math.abs(body.velocity.x) > MOVING_THRESHOLD) {
      this.sprite.setFlipX(body.velocity.x < 0);
    }

    if (moving) {
      if (this.playAnimation(RIDER_ANIMATION_KEYS.walkRight)) return;
      this.stopAnimation();
      return;
    }

    if (this.playAnimation(RIDER_ANIMATION_KEYS.idleBreathe)) return;
    this.stopAnimation();
    if (this.sprite.scene.textures.exists(RIDER_IDLE_KEY)) {
      this.sprite.setTexture(RIDER_IDLE_KEY);
    }
  }

  private playAnimation(key: string): boolean {
    if (!this.sprite.scene.anims.exists(key)) return false;
    this.sprite.play(key, true);
    return true;
  }

  private stopAnimation(): void {
    if (this.sprite.anims.isPlaying) {
      this.sprite.stop();
    }
  }
}
