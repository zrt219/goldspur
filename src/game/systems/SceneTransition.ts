import Phaser from "phaser";

export const SCENE_FADE_IN_MS = 130;
export const SCENE_FADE_OUT_MS = 110;

export function fadeInScene(scene: Phaser.Scene): void {
  scene.cameras.main.fadeIn(SCENE_FADE_IN_MS, 0, 0, 0);
}

export function startSceneWithFastFade(scene: Phaser.Scene, destination: string): void {
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    scene.scene.start(destination);
  };

  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, start);
  scene.cameras.main.fadeOut(SCENE_FADE_OUT_MS, 0, 0, 0);
  scene.time.delayedCall(SCENE_FADE_OUT_MS + 35, start);
}
