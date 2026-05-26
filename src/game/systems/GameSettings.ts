import Phaser from "phaser";
import type { StAnnWeatherMode } from "./WeatherSystem";

export type InputAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "primaryInteract"
  | "mount"
  | "jump"
  | "inventory"
  | "map"
  | "ranch"
  | "settings"
  | "reset"
  | "debug"
  | "zoomOut"
  | "zoomIn"
  | "zoomReset";

export type GraphicsQuality = "low" | "medium" | "high";
export type ResolutionSetting = "1280x720" | "1600x900" | "1920x1080";
export type TimeSpeedSetting = "slow" | "normal" | "fast";
export type WeatherSetting = "dynamic" | "off" | StAnnWeatherMode;
export type WorldScaleSetting = "large" | "massive" | "legendary";

export type GameSettings = {
  version: 1;
  bindings: Record<InputAction, string>;
  graphics: {
    quality: GraphicsQuality;
    resolution: ResolutionSetting;
    reducedWeather: boolean;
  };
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    ambientVolume: number;
    muted: boolean;
  };
  time: {
    speed: TimeSpeedSetting;
  };
  weather: {
    mode: WeatherSetting;
    rainScale: number;
  };
  world: {
    scale: WorldScaleSetting;
    horseTrackerAlwaysOn: boolean;
  };
};

const SETTINGS_KEY = "goldspur_valley_settings_v1";

export const INPUT_ACTION_LABELS: Record<InputAction, string> = {
  moveUp: "Move Up",
  moveDown: "Move Down",
  moveLeft: "Move Left",
  moveRight: "Move Right",
  primaryInteract: "Interact / Pick Up",
  mount: "Mount / Dismount",
  jump: "Horse Jump",
  inventory: "Inventory",
  map: "Map",
  ranch: "Return Ranch",
  settings: "Settings",
  reset: "Reset Save",
  debug: "Debug Zones",
  zoomOut: "Zoom Out",
  zoomIn: "Zoom In",
  zoomReset: "Reset Zoom"
};

export const DEFAULT_BINDINGS: Record<InputAction, string> = {
  moveUp: "KeyW",
  moveDown: "KeyS",
  moveLeft: "KeyA",
  moveRight: "KeyD",
  primaryInteract: "KeyE",
  mount: "KeyF",
  jump: "Space",
  inventory: "KeyI",
  map: "KeyM",
  ranch: "KeyH",
  settings: "Escape",
  reset: "KeyR",
  debug: "F3",
  zoomOut: "KeyZ",
  zoomIn: "KeyX",
  zoomReset: "Digit0"
};

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  version: 1,
  bindings: { ...DEFAULT_BINDINGS },
  graphics: {
    quality: "high",
    resolution: "1280x720",
    reducedWeather: false
  },
  audio: {
    masterVolume: 0.85,
    musicVolume: 0.65,
    sfxVolume: 0.8,
    ambientVolume: 0.75,
    muted: false
  },
  time: {
    speed: "normal"
  },
  weather: {
    mode: "dynamic",
    rainScale: 1
  },
  world: {
    scale: "legendary",
    horseTrackerAlwaysOn: true
  }
};

export function loadGameSettings(): GameSettings {
  if (typeof localStorage === "undefined") return cloneSettings(DEFAULT_GAME_SETTINGS);
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return cloneSettings(DEFAULT_GAME_SETTINGS);
    return normalizeGameSettings(JSON.parse(raw));
  } catch {
    return cloneSettings(DEFAULT_GAME_SETTINGS);
  }
}

export function saveGameSettings(settings: GameSettings): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeGameSettings(settings)));
  } catch {
    // Settings are convenience state; storage failures should not stop play.
  }
}

export function normalizeGameSettings(input: unknown): GameSettings {
  const raw = typeof input === "object" && input !== null ? input as Partial<GameSettings> : {};
  return {
    version: 1,
    bindings: normalizeBindings(raw.bindings),
    graphics: {
      quality: oneOf(raw.graphics?.quality, ["low", "medium", "high"], DEFAULT_GAME_SETTINGS.graphics.quality),
      resolution: oneOf(raw.graphics?.resolution, ["1280x720", "1600x900", "1920x1080"], DEFAULT_GAME_SETTINGS.graphics.resolution),
      reducedWeather: raw.graphics?.reducedWeather === true
    },
    audio: {
      masterVolume: normalizedVolume(raw.audio?.masterVolume, DEFAULT_GAME_SETTINGS.audio.masterVolume),
      musicVolume: normalizedVolume(raw.audio?.musicVolume, DEFAULT_GAME_SETTINGS.audio.musicVolume),
      sfxVolume: normalizedVolume(raw.audio?.sfxVolume, DEFAULT_GAME_SETTINGS.audio.sfxVolume),
      ambientVolume: normalizedVolume(raw.audio?.ambientVolume, DEFAULT_GAME_SETTINGS.audio.ambientVolume),
      muted: raw.audio?.muted === true
    },
    time: {
      speed: oneOf(raw.time?.speed, ["slow", "normal", "fast"], DEFAULT_GAME_SETTINGS.time.speed)
    },
    weather: {
      mode: oneOf(raw.weather?.mode, ["dynamic", "off", "clear", "humid", "mist", "light_rain", "heavy_rain", "night_shower"], DEFAULT_GAME_SETTINGS.weather.mode),
      rainScale: normalizedVolume(raw.weather?.rainScale, DEFAULT_GAME_SETTINGS.weather.rainScale)
    },
    world: {
      scale: oneOf(raw.world?.scale, ["large", "massive", "legendary"], DEFAULT_GAME_SETTINGS.world.scale),
      horseTrackerAlwaysOn: raw.world?.horseTrackerAlwaysOn !== false
    }
  };
}

export function keyCodeForBinding(code: string): number | undefined {
  if (code.startsWith("Key") && code.length === 4) {
    const letter = code.charAt(3).toUpperCase();
    return Phaser.Input.Keyboard.KeyCodes[letter as keyof typeof Phaser.Input.Keyboard.KeyCodes] as number | undefined;
  }
  if (code.startsWith("Digit") && code.length === 6) {
    const digit = code.charAt(5);
    const digitNames: Record<string, keyof typeof Phaser.Input.Keyboard.KeyCodes> = {
      "0": "ZERO",
      "1": "ONE",
      "2": "TWO",
      "3": "THREE",
      "4": "FOUR",
      "5": "FIVE",
      "6": "SIX",
      "7": "SEVEN",
      "8": "EIGHT",
      "9": "NINE"
    };
    const key = digitNames[digit];
    return key ? Phaser.Input.Keyboard.KeyCodes[key] as number : undefined;
  }
  const named: Record<string, number> = {
    ArrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
    ArrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
    ArrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
    ArrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    Space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    Enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    Escape: Phaser.Input.Keyboard.KeyCodes.ESC,
    F1: Phaser.Input.Keyboard.KeyCodes.F1,
    F2: Phaser.Input.Keyboard.KeyCodes.F2,
    F3: Phaser.Input.Keyboard.KeyCodes.F3,
    F4: Phaser.Input.Keyboard.KeyCodes.F4,
    F5: Phaser.Input.Keyboard.KeyCodes.F5,
    F6: Phaser.Input.Keyboard.KeyCodes.F6,
    F7: Phaser.Input.Keyboard.KeyCodes.F7,
    F8: Phaser.Input.Keyboard.KeyCodes.F8,
    F9: Phaser.Input.Keyboard.KeyCodes.F9,
    F10: Phaser.Input.Keyboard.KeyCodes.F10,
    F11: Phaser.Input.Keyboard.KeyCodes.F11,
    F12: Phaser.Input.Keyboard.KeyCodes.F12
  };
  return named[code];
}

export function isBindableCode(code: string): boolean {
  return keyCodeForBinding(code) !== undefined;
}

export function bindingLabel(code: string): string {
  if (code.startsWith("Key") && code.length === 4) return code.charAt(3).toUpperCase();
  if (code.startsWith("Digit") && code.length === 6) return code.charAt(5);
  if (code.startsWith("Arrow")) return code.replace("Arrow", "");
  if (code === "Space") return "Space";
  if (code === "Escape") return "Esc";
  return code;
}

export function movementLabel(settings: GameSettings): string {
  const binding = settings.bindings;
  const wasd = binding.moveUp === "KeyW" && binding.moveLeft === "KeyA" && binding.moveDown === "KeyS" && binding.moveRight === "KeyD";
  if (wasd) return "WASD / Arrows";
  return `${bindingLabel(binding.moveUp)}/${bindingLabel(binding.moveLeft)}/${bindingLabel(binding.moveDown)}/${bindingLabel(binding.moveRight)} / Arrows`;
}

function normalizeBindings(input: unknown): Record<InputAction, string> {
  const raw = typeof input === "object" && input !== null ? input as Partial<Record<InputAction, unknown>> : {};
  const next = { ...DEFAULT_BINDINGS };
  (Object.keys(DEFAULT_BINDINGS) as InputAction[]).forEach((action) => {
    const code = raw[action];
    if (typeof code === "string" && isBindableCode(code)) next[action] = code;
  });
  if (next.mount === next.primaryInteract) next.mount = DEFAULT_BINDINGS.mount;
  return next;
}

function normalizedVolume(input: unknown, fallback: number): number {
  const value = Number(input);
  return Number.isFinite(value) ? Phaser.Math.Clamp(value, 0, 1) : fallback;
}

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === "string" && options.includes(value as T) ? value as T : fallback;
}

function cloneSettings(settings: GameSettings): GameSettings {
  return JSON.parse(JSON.stringify(settings)) as GameSettings;
}
