import Phaser from "phaser";
import type { HorseCustomizationSave } from "../data/horseCustomization";
import {
  HORSE_ANIMATION_KEYS,
  HORSE_GRAZE_KEY,
  HORSE_IDLE_KEY,
  MOUNTED_ANIMATION_KEYS,
  MOUNTED_IDLE_KEY
} from "../systems/AnimationLoader";

export type HorseVisualKeys = {
  idleKey: string;
  grazeKey: string;
  mountedIdleKey: string;
  previewKey: string;
  idleAnimationKey: string;
  walkAnimationKey: string;
  grazeAnimationKey: string;
  mountedIdleAnimationKey: string;
  mountedRideAnimationKey: string;
  mountedJumpAnimationKey: string;
  coatTint: number;
  mountedTint: number;
};

export function ensureHorseVisualTextures(_scene: Phaser.Scene, input: HorseCustomizationSave): HorseVisualKeys {
  void input;
  return {
    idleKey: HORSE_IDLE_KEY,
    grazeKey: HORSE_GRAZE_KEY,
    mountedIdleKey: MOUNTED_IDLE_KEY,
    previewKey: HORSE_IDLE_KEY,
    idleAnimationKey: HORSE_ANIMATION_KEYS.idleBreathe,
    walkAnimationKey: HORSE_ANIMATION_KEYS.walkRight,
    grazeAnimationKey: HORSE_ANIMATION_KEYS.grazeLoop,
    mountedIdleAnimationKey: MOUNTED_ANIMATION_KEYS.idleBreathe,
    mountedRideAnimationKey: MOUNTED_ANIMATION_KEYS.rideRight,
    mountedJumpAnimationKey: MOUNTED_ANIMATION_KEYS.jump,
    coatTint: 0xffffff,
    mountedTint: 0xffffff
  };
}
