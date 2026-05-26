import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { button, panel } from "../art/UITheme";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";
import {
  bindingLabel,
  DEFAULT_GAME_SETTINGS,
  GameSettings,
  GraphicsQuality,
  INPUT_ACTION_LABELS,
  InputAction,
  isBindableCode,
  loadGameSettings,
  ResolutionSetting,
  saveGameSettings,
  TimeSpeedSetting,
  WeatherSetting,
  WorldScaleSetting
} from "../systems/GameSettings";

type SettingsSceneData = {
  returnScene?: string;
  notice?: string;
};

type AudioVolumeKey = "masterVolume" | "musicVolume" | "sfxVolume" | "ambientVolume";

const CONTROL_ACTIONS: InputAction[] = [
  "primaryInteract",
  "mount",
  "jump",
  "inventory",
  "map",
  "ranch",
  "settings",
  "reset"
];

const QUALITY_ORDER: GraphicsQuality[] = ["low", "medium", "high"];
const RESOLUTION_ORDER: ResolutionSetting[] = ["1280x720", "1600x900", "1920x1080"];
const TIME_ORDER: TimeSpeedSetting[] = ["slow", "normal", "fast"];
const WEATHER_ORDER: WeatherSetting[] = ["dynamic", "clear", "humid", "mist", "light_rain", "heavy_rain", "off"];
const WORLD_ORDER: WorldScaleSetting[] = ["large", "massive", "legendary"];

export class SettingsScene extends Phaser.Scene {
  private settings!: GameSettings;
  private returnScene = "RanchScene";
  private notice = "";
  private captureText?: Phaser.GameObjects.Text;

  constructor() {
    super("SettingsScene");
  }

  create(data: SettingsSceneData = {}): void {
    this.settings = loadGameSettings();
    this.returnScene = data.returnScene || "RanchScene";
    this.notice = data.notice ?? "";

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.68)
      .setDepth(1)
      .setInteractive();
    panel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 1080, 620, 2);
    this.add.text(GAME_WIDTH / 2, 74, "Settings", {
      fontFamily: "Georgia",
      fontSize: "34px",
      color: PaletteCss.gold
    }).setOrigin(0.5).setDepth(3);
    this.add.text(GAME_WIDTH / 2, 110, "Controls, graphics, sound, weather, time, and procedural world settings", {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: PaletteCss.cream
    }).setOrigin(0.5).setDepth(3);

    this.sectionTitle(290, 145, "Key Bindings");
    CONTROL_ACTIONS.forEach((action, index) => {
      const y = 186 + index * 42;
      this.settingButton(290, y, 270, `${INPUT_ACTION_LABELS[action]}: ${bindingLabel(this.settings.bindings[action])}`, () => this.beginRebind(action), "Click, then press a new key.");
    });
    this.add.text(290, 540, "E is reserved for primary interact and pickup. Mount is separate by default.", {
      fontFamily: "Georgia",
      fontSize: "14px",
      color: "#d9c795",
      align: "center",
      wordWrap: { width: 286 }
    }).setOrigin(0.5).setDepth(3);

    this.sectionTitle(640, 145, "World & Weather");
    this.settingButton(640, 186, 260, `Time: ${this.settings.time.speed}`, () => this.cycleTime(), "Change how quickly the in-game clock advances.");
    this.settingButton(640, 228, 260, `Weather: ${this.weatherLabel(this.settings.weather.mode)}`, () => this.cycleWeather(), "Use dynamic St Ann weather or force a condition.");
    this.settingButton(640, 270, 260, `Rain Amount: ${Math.round(this.settings.weather.rainScale * 100)}%`, () => this.cycleRainScale(), "Scale shower intensity.");
    this.settingButton(640, 312, 260, `World: ${this.settings.world.scale}`, () => this.cycleWorld(), "Changes the preferred procedural world size profile.");
    this.settingButton(640, 354, 260, `Horse Tracker: ${this.settings.world.horseTrackerAlwaysOn ? "Always On" : "Tool Only"}`, () => this.toggleHorseTrackerMode(), "Show horse marker when the tracker exists.");

    this.sectionTitle(990, 145, "Graphics & Audio");
    this.settingButton(990, 186, 260, `Quality: ${this.settings.graphics.quality}`, () => this.cycleQuality(), "Changes weather particle budget.");
    this.settingButton(990, 228, 260, `Resolution: ${this.settings.graphics.resolution}`, () => this.cycleResolution(), "Preferred viewport resolution profile.");
    this.settingButton(990, 270, 260, `Reduced Weather: ${this.settings.graphics.reducedWeather ? "On" : "Off"}`, () => this.toggleReducedWeather(), "Reduces animated haze and rain.");
    this.settingButton(990, 312, 260, `Master: ${this.volumeLabel(this.settings.audio.masterVolume)}`, () => this.cycleVolume("masterVolume"), "Master volume setting.");
    this.settingButton(990, 354, 260, `Ambient: ${this.volumeLabel(this.settings.audio.ambientVolume)}`, () => this.cycleVolume("ambientVolume"), "Ambient weather and scenery volume.");
    this.settingButton(990, 396, 260, `SFX: ${this.volumeLabel(this.settings.audio.sfxVolume)}`, () => this.cycleVolume("sfxVolume"), "Interface and gameplay sound effects.");
    this.settingButton(990, 438, 260, `Muted: ${this.settings.audio.muted ? "Yes" : "No"}`, () => this.toggleMuted(), "Mute or unmute all audio.");
    this.settingButton(990, 480, 260, "Easy Read Preset", () => this.applyEasyReadPreset(), "Slower clock, reduced rain, tracker on, and steadier weather.");

    button(this, 440, 622, 170, 42, "Reset Settings", () => this.resetSettings(), 4, "Restore default controls and settings.");
    button(this, 640, 622, 150, 42, "Close", () => this.close(), 4, "Return to the game.");
    button(this, 840, 622, 170, 42, "Save", () => this.close(), 4, "Save and return.");

    this.captureText = this.add.text(GAME_WIDTH / 2, 580, this.notice, {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: this.notice ? "#9be07d" : PaletteCss.cream,
      align: "center",
      fixedWidth: 760
    }).setOrigin(0.5).setDepth(4);

    this.input.keyboard?.once("keydown-ESC", () => this.close());
  }

  private sectionTitle(x: number, y: number, label: string): void {
    this.add.text(x, y, label, {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: PaletteCss.gold
    }).setOrigin(0.5).setDepth(3);
  }

  private settingButton(x: number, y: number, width: number, label: string, action: () => void, tooltip: string): void {
    button(this, x, y, width, 32, label, action, 4, tooltip);
  }

  private beginRebind(action: InputAction): void {
    this.captureText?.setColor("#f8dd91").setText(`Press a key for ${INPUT_ACTION_LABELS[action]}. Esc cancels.`);
    this.input.keyboard?.once("keydown", (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        this.scene.restart({ returnScene: this.returnScene, notice: "Rebind cancelled." });
        return;
      }
      if (!isBindableCode(event.code)) {
        this.scene.restart({ returnScene: this.returnScene, notice: "That key is not supported here yet." });
        return;
      }
      const result = this.applyBinding(action, event.code);
      saveGameSettings(this.settings);
      this.scene.restart({ returnScene: this.returnScene, notice: result });
    });
  }

  private applyBinding(action: InputAction, code: string): string {
    if (action === "mount" && code === this.settings.bindings.primaryInteract) {
      return "Mount stays separate from primary interaction. Choose another key.";
    }
    if (action === "primaryInteract" && code === this.settings.bindings.mount) {
      return "Primary interaction stays separate from mount. Choose another key.";
    }
    const duplicate = (Object.keys(this.settings.bindings) as InputAction[])
      .find((candidate) => candidate !== action && this.settings.bindings[candidate] === code);
    if (duplicate) {
      const previous = this.settings.bindings[action];
      this.settings.bindings[duplicate] = previous;
      this.settings.bindings[action] = code;
      return `${INPUT_ACTION_LABELS[action]} swapped with ${INPUT_ACTION_LABELS[duplicate]}.`;
    }
    this.settings.bindings[action] = code;
    return `${INPUT_ACTION_LABELS[action]} is now ${bindingLabel(code)}.`;
  }

  private cycleQuality(): void {
    this.settings.graphics.quality = nextIn(QUALITY_ORDER, this.settings.graphics.quality);
    this.saveAndRestart("Graphics quality updated.");
  }

  private cycleResolution(): void {
    this.settings.graphics.resolution = nextIn(RESOLUTION_ORDER, this.settings.graphics.resolution);
    this.saveAndRestart("Resolution preference updated.");
  }

  private toggleReducedWeather(): void {
    this.settings.graphics.reducedWeather = !this.settings.graphics.reducedWeather;
    this.saveAndRestart("Weather rendering preference updated.");
  }

  private cycleTime(): void {
    this.settings.time.speed = nextIn(TIME_ORDER, this.settings.time.speed);
    this.saveAndRestart("Clock speed updated.");
  }

  private cycleWeather(): void {
    this.settings.weather.mode = nextIn(WEATHER_ORDER, this.settings.weather.mode);
    this.saveAndRestart("Weather mode updated.");
  }

  private cycleRainScale(): void {
    const next = this.settings.weather.rainScale >= 1 ? 0.25 : this.settings.weather.rainScale + 0.25;
    this.settings.weather.rainScale = Math.min(1, Number(next.toFixed(2)));
    this.saveAndRestart("Rain amount updated.");
  }

  private cycleWorld(): void {
    this.settings.world.scale = nextIn(WORLD_ORDER, this.settings.world.scale);
    this.saveAndRestart("Procedural world profile updated.");
  }

  private toggleHorseTrackerMode(): void {
    this.settings.world.horseTrackerAlwaysOn = !this.settings.world.horseTrackerAlwaysOn;
    this.saveAndRestart("Horse tracker mode updated.");
  }

  private cycleVolume(key: AudioVolumeKey): void {
    const value = Number(this.settings.audio[key]);
    this.settings.audio[key] = value >= 1 ? 0 : Math.min(1, Number((value + 0.25).toFixed(2)));
    this.saveAndRestart("Audio setting updated.");
  }

  private toggleMuted(): void {
    this.settings.audio.muted = !this.settings.audio.muted;
    this.saveAndRestart("Mute setting updated.");
  }

  private applyEasyReadPreset(): void {
    this.settings.time.speed = "slow";
    this.settings.graphics.reducedWeather = true;
    this.settings.weather.rainScale = 0.5;
    this.settings.world.horseTrackerAlwaysOn = true;
    this.saveAndRestart("Easy Read preset applied.");
  }

  private resetSettings(): void {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_GAME_SETTINGS)) as GameSettings;
    this.saveAndRestart("Settings restored.");
  }

  private saveAndRestart(notice: string): void {
    saveGameSettings(this.settings);
    this.scene.restart({ returnScene: this.returnScene, notice });
  }

  private close(): void {
    saveGameSettings(this.settings);
    this.scene.stop();
    this.scene.resume(this.returnScene || "RanchScene");
  }

  private volumeLabel(value: number): string {
    return `${Math.round(value * 100)}%`;
  }

  private weatherLabel(mode: WeatherSetting): string {
    if (mode === "dynamic") return "Dynamic";
    if (mode === "off") return "Off";
    if (mode === "light_rain") return "Light Rain";
    if (mode === "heavy_rain") return "Heavy Rain";
    if (mode === "night_shower") return "Night Shower";
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  }
}

function nextIn<T>(items: readonly T[], current: T): T {
  const index = items.indexOf(current);
  return items[(index + 1 + items.length) % items.length];
}
