import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import { CharacterSelectScene } from "./game/scenes/CharacterSelectScene";
import { CreditsScene } from "./game/scenes/CreditsScene";
import { HealthScene } from "./game/scenes/HealthScene";
import { HorseCustomizationScene } from "./game/scenes/HorseCustomizationScene";
import { InventoryScene } from "./game/scenes/InventoryScene";
import { MainMenuScene } from "./game/scenes/MainMenuScene";
import { RacingScene } from "./game/scenes/RacingScene";
import { RanchScene } from "./game/scenes/RanchScene";
import { RelaxationScene } from "./game/scenes/RelaxationScene";
import { TrainingScene } from "./game/scenes/TrainingScene";
import { OpenWorldScene } from "./game/scenes/OpenWorldScene";
import { SettingsScene } from "./game/scenes/SettingsScene";

import "./style.css";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#182514",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    MainMenuScene,
    CharacterSelectScene,
    CreditsScene,
    RanchScene,
    TrainingScene,
    RacingScene,
    HealthScene,
    HorseCustomizationScene,
    RelaxationScene,
    OpenWorldScene,
    InventoryScene,
    SettingsScene
  ],
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  }
};

const goldspurGame = new Phaser.Game(config);

if (import.meta.env.DEV) {
  (window as Window & { __goldspurGame?: Phaser.Game }).__goldspurGame = goldspurGame;
}
