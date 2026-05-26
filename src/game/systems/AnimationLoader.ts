import Phaser from "phaser";
import { assetUrl } from "../data/constants";

const LOOP_FRAME_COUNT = 8;
const MOUNTED_FRAME_COUNT = 10;

type AnimationSpec = {
  key: string;
  frames?: string[];
  sheetKey?: string;
  startFrame?: number;
  endFrame?: number;
  frameRate: number;
  repeat: number;
};

function frameKeys(prefix: string, count = LOOP_FRAME_COUNT): string[] {
  return Array.from({ length: count }, (_value, index) => `${prefix}_${String(index + 1).padStart(2, "0")}`);
}

export const RIDER_ANIMATION_KEYS = {
  idleBreathe: "rider_idle_breathe",
  walkRight: "rider_walk_right"
} as const;

export const HORSE_ANIMATION_KEYS = {
  idleBreathe: "horse_idle_breathe",
  walkRight: "horse_walk_right",
  grazeLoop: "horse_graze_loop"
} as const;

export const MOUNTED_ANIMATION_KEYS = {
  idleBreathe: "mounted_idle_breathe",
  rideRight: "mounted_ride_right",
  jump: "mounted_jump"
} as const;

export const RIDER_IDLE_BREATHE_KEYS = frameKeys("rider_idle_breathe");
export const RIDER_WALK_RIGHT_KEYS = frameKeys("rider_walk_right");
export const RIDER_IDLE_KEY = RIDER_IDLE_BREATHE_KEYS[0];

export const HORSE_IDLE_KEY = "ambient_horse_idle";
export const HORSE_GRAZE_KEY = "ambient_horse_graze";
export const HORSE_IDLE_BREATHE_KEYS = frameKeys("ambient_horse_idle_breathe");
export const HORSE_WALK_RIGHT_KEYS = frameKeys("ambient_horse_walk_right");
export const HORSE_GRAZE_KEYS = frameKeys("ambient_horse_graze");

export const MOUNTED_IDLE_KEY = "mounted_idle";
export const MOUNTED_IDLE_BREATHE_SHEET_KEY = "mounted_idle_breathe_sheet";
export const MOUNTED_RIDE_RIGHT_SHEET_KEY = "mounted_ride_right_sheet";
export const MOUNTED_JUMP_SHEET_KEY = "mounted_jump_sheet";
export const MOUNTED_IDLE_BREATHE_KEYS = frameKeys("mounted_idle_breathe", MOUNTED_FRAME_COUNT);
export const MOUNTED_RIDE_RIGHT_KEYS = frameKeys("mounted_ride_right", MOUNTED_FRAME_COUNT);
export const MOUNTED_JUMP_KEYS = frameKeys("mounted_jump", MOUNTED_FRAME_COUNT);

const ANIMATION_SPECS: AnimationSpec[] = [
  {
    key: RIDER_ANIMATION_KEYS.idleBreathe,
    frames: RIDER_IDLE_BREATHE_KEYS,
    frameRate: 6,
    repeat: -1
  },
  {
    key: RIDER_ANIMATION_KEYS.walkRight,
    frames: RIDER_WALK_RIGHT_KEYS,
    frameRate: 12,
    repeat: -1
  },
  {
    key: HORSE_ANIMATION_KEYS.idleBreathe,
    frames: HORSE_IDLE_BREATHE_KEYS,
    frameRate: 5,
    repeat: -1
  },
  {
    key: HORSE_ANIMATION_KEYS.walkRight,
    frames: HORSE_WALK_RIGHT_KEYS,
    frameRate: 8,
    repeat: -1
  },
  {
    key: HORSE_ANIMATION_KEYS.grazeLoop,
    frames: HORSE_GRAZE_KEYS,
    frameRate: 5,
    repeat: -1
  }
];

const MOUNTED_ANIMATION_SPECS: AnimationSpec[] = [
  {
    key: MOUNTED_ANIMATION_KEYS.idleBreathe,
    sheetKey: MOUNTED_IDLE_BREATHE_SHEET_KEY,
    startFrame: 0,
    endFrame: MOUNTED_FRAME_COUNT - 1,
    frameRate: 5,
    repeat: -1
  },
  {
    key: MOUNTED_ANIMATION_KEYS.rideRight,
    sheetKey: MOUNTED_RIDE_RIGHT_SHEET_KEY,
    startFrame: 0,
    endFrame: MOUNTED_FRAME_COUNT - 1,
    frameRate: 10,
    repeat: -1
  },
  {
    key: MOUNTED_ANIMATION_KEYS.jump,
    sheetKey: MOUNTED_JUMP_SHEET_KEY,
    startFrame: 0,
    endFrame: MOUNTED_FRAME_COUNT - 1,
    frameRate: 14,
    repeat: 0
  }
];

let mountedLoadInProgress = false;
let mountedLoadCallbacks: Array<() => void> = [];

export function preloadAnimationAssets(scene: Phaser.Scene): void {
  preloadCoreAnimationAssets(scene);
  preloadMountedAnimationAssets(scene);
}

export function preloadCoreAnimationAssets(scene: Phaser.Scene): void {
  loadFrames(scene, RIDER_IDLE_BREATHE_KEYS, "sprites/rider/idle_breathe", "idle_breathe");
  loadFrames(scene, RIDER_WALK_RIGHT_KEYS, "sprites/rider/walk_right", "walk_right");

  scene.load.image(HORSE_IDLE_KEY, assetUrl("sprites/horse/horse_idle.png"));
  scene.load.image(HORSE_GRAZE_KEY, assetUrl("sprites/horse/horse_graze.png"));
  loadFrames(scene, HORSE_IDLE_BREATHE_KEYS, "sprites/horse/idle_breathe", "idle_breathe");
  loadFrames(scene, HORSE_WALK_RIGHT_KEYS, "sprites/horse/walk_right", "walk_right");
  loadFrames(scene, HORSE_GRAZE_KEYS, "sprites/horse/graze", "graze");
}

export function preloadMountedAnimationAssets(scene: Phaser.Scene): void {
  if (isMountedAnimationAssetLoaded(scene)) return;
  scene.load.image(MOUNTED_IDLE_KEY, assetUrl("sprites/mounted/mounted_idle.png"));
  loadSheet(scene, MOUNTED_IDLE_BREATHE_SHEET_KEY, "sprites/mounted_atlas/idle_breathe.png");
  loadSheet(scene, MOUNTED_RIDE_RIGHT_SHEET_KEY, "sprites/mounted_atlas/ride_right.png");
  loadSheet(scene, MOUNTED_JUMP_SHEET_KEY, "sprites/mounted_atlas/jump.png");
}

export function createGameAnimations(scene: Phaser.Scene): void {
  createCoreGameAnimations(scene);
  createMountedGameAnimations(scene);
}

export function createCoreGameAnimations(scene: Phaser.Scene): void {
  ANIMATION_SPECS.forEach((spec) => createAnimation(scene, spec));
}

export function createMountedGameAnimations(scene: Phaser.Scene): void {
  MOUNTED_ANIMATION_SPECS.forEach((spec) => createAnimation(scene, spec));
}

export function isMountedAnimationAssetLoaded(scene: Phaser.Scene): boolean {
  return scene.textures.exists(MOUNTED_IDLE_KEY)
    && scene.textures.exists(MOUNTED_IDLE_BREATHE_SHEET_KEY)
    && scene.textures.exists(MOUNTED_RIDE_RIGHT_SHEET_KEY)
    && scene.textures.exists(MOUNTED_JUMP_SHEET_KEY);
}

export function ensureMountedAnimationAssets(scene: Phaser.Scene, onComplete: () => void): boolean {
  if (isMountedAnimationAssetLoaded(scene)) {
    createMountedGameAnimations(scene);
    onComplete();
    return true;
  }

  mountedLoadCallbacks.push(() => {
    createMountedGameAnimations(scene);
    onComplete();
  });

  if (mountedLoadInProgress) return false;
  mountedLoadInProgress = true;

  const startLoad = (): void => {
    if (scene.load.isLoading()) {
      scene.time.delayedCall(40, startLoad);
      return;
    }
    preloadMountedAnimationAssets(scene);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
      mountedLoadInProgress = false;
      const callbacks = mountedLoadCallbacks;
      mountedLoadCallbacks = [];
      callbacks.forEach((callback) => callback());
    });
    scene.load.start();
  };

  startLoad();
  return false;
}

function loadFrames(scene: Phaser.Scene, keys: string[], directory: string, basename: string): void {
  keys.forEach((key, index) => {
    scene.load.image(key, assetUrl(`${directory}/${basename}_${String(index + 1).padStart(2, "0")}.png`));
  });
}

function loadSheet(scene: Phaser.Scene, key: string, file: string): void {
  scene.load.spritesheet(key, assetUrl(file), {
    frameWidth: 384,
    frameHeight: 384
  });
}

function createAnimation(scene: Phaser.Scene, spec: AnimationSpec): void {
  if (scene.anims.exists(spec.key)) return;

  if (spec.sheetKey) {
    if (!scene.textures.exists(spec.sheetKey)) {
      console.warn(`Skipping animation "${spec.key}" because spritesheet "${spec.sheetKey}" is missing.`);
      return;
    }
    scene.anims.create({
      key: spec.key,
      frames: scene.anims.generateFrameNumbers(spec.sheetKey, {
        start: spec.startFrame ?? 0,
        end: spec.endFrame ?? 0
      }),
      frameRate: spec.frameRate,
      repeat: spec.repeat
    });
    return;
  }

  const frames = spec.frames ?? [];
  const missingFrames = frames.filter((key) => !scene.textures.exists(key));
  if (missingFrames.length > 0) {
    console.warn(`Skipping animation "${spec.key}" because ${missingFrames.length} frame texture(s) are missing.`);
    return;
  }

  scene.anims.create({
    key: spec.key,
    frames: frames.map((key) => ({ key })),
    frameRate: spec.frameRate,
    repeat: spec.repeat
  });
}
