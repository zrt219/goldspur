import Phaser from "phaser";
import {
  equippedHorseItem,
  horseCustomizationSummary,
  type HorseCustomizationSave
} from "../data/horseCustomization";
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
  styleSummary: string;
};

export function ensureHorseVisualTextures(_scene: Phaser.Scene, input: HorseCustomizationSave): HorseVisualKeys {
  const coat = equippedHorseItem(input, "coat");
  const mane = equippedHorseItem(input, "mane");
  const marking = equippedHorseItem(input, "marking");
  const saddle = equippedHorseItem(input, "saddle");
  const blanket = equippedHorseItem(input, "blanket");
  const bridle = equippedHorseItem(input, "bridle");
  const wraps = equippedHorseItem(input, "wraps");
  const charm = equippedHorseItem(input, "charm");

  const coatTint = mixOptional(
    mixOptional(coat.tint, marking.tint, marking.id === "marking_none" ? 0 : 0.16),
    mane.tint,
    0.08
  );
  const mountedTint = [
    [blanket.tint, 0.18],
    [saddle.tint, 0.16],
    [bridle.tint, 0.08],
    [wraps.tint, wraps.id === "wraps_none" ? 0 : 0.06],
    [charm.tint, charm.id === "charm_none" ? 0 : 0.06],
    [saddle.accent ?? blanket.accent ?? charm.accent ?? 0, 0.07]
  ].reduce((tint, [nextTint, amount]) => mixOptional(tint, nextTint, amount), coatTint);

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
    coatTint,
    mountedTint,
    styleSummary: horseCustomizationSummary(input)
  };
}

function mixOptional(fromTint: number, toTint: number, amount: number): number {
  if (!toTint || amount <= 0) return fromTint;
  return mixTint(fromTint, toTint, amount);
}

function mixTint(fromTint: number, toTint: number, amount: number): number {
  const safeAmount = Phaser.Math.Clamp(amount, 0, 1);
  const from = Phaser.Display.Color.ValueToColor(fromTint);
  const to = Phaser.Display.Color.ValueToColor(toTint);
  return Phaser.Display.Color.GetColor(
    Math.round(from.red + (to.red - from.red) * safeAmount),
    Math.round(from.green + (to.green - from.green) * safeAmount),
    Math.round(from.blue + (to.blue - from.blue) * safeAmount)
  );
}
