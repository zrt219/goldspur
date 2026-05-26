import Phaser from "phaser";
import { assetUrl, BOOT_IMAGE_FILES, QUEST_ITEM_FILES } from "../data/constants";
import { createGameTextures } from "../art/TextureFactory";
import { SaveSystem } from "../systems/SaveSystem";
import { createCoreGameAnimations, preloadCoreAnimationAssets } from "../systems/AnimationLoader";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    preloadCoreAnimationAssets(this);
    for (const [key, file] of Object.entries(BOOT_IMAGE_FILES)) {
      this.load.image(key, assetUrl(file));
    }
    for (const [key, file] of Object.entries(QUEST_ITEM_FILES)) {
      this.load.image(key, assetUrl(file));
    }
  }

  create(): void {
    createGameTextures(this);
    createCoreGameAnimations(this);
    SaveSystem.load();
    this.scene.start("MainMenuScene");
  }
}
