import Phaser from "phaser";

export type StAnnTimeOfDay = "dawn" | "day" | "dusk" | "night";
export type StAnnWeatherMode = "clear" | "humid" | "mist" | "light_rain" | "heavy_rain" | "night_shower";

export type StAnnAmbienceInput = {
  timeOfDay?: StAnnTimeOfDay;
  weather?: StAnnWeatherMode;
  humidity?: number;
  rainIntensity?: number;
  haze?: number;
  wind?: number;
};

export type StAnnAmbienceState = Required<StAnnAmbienceInput> & {
  skyTint: number;
  overlayTint: number;
  overlayAlpha: number;
  hazeTint: number;
};

export type WeatherSystemOptions = {
  depth?: number;
  width?: number;
  height?: number;
  rainDropCount?: number;
};

const TIME_TINTS: Record<StAnnTimeOfDay, Pick<StAnnAmbienceState, "skyTint" | "overlayTint" | "overlayAlpha" | "hazeTint">> = {
  dawn: { skyTint: 0xf4c78e, overlayTint: 0xf0a766, overlayAlpha: 0.12, hazeTint: 0xffeed2 },
  day: { skyTint: 0x9ed8ef, overlayTint: 0xffffff, overlayAlpha: 0.02, hazeTint: 0xe7f3df },
  dusk: { skyTint: 0xe99b72, overlayTint: 0xd46f5a, overlayAlpha: 0.16, hazeTint: 0xf4d7b0 },
  night: { skyTint: 0x15254b, overlayTint: 0x0f1d3a, overlayAlpha: 0.38, hazeTint: 0x8aa6bf }
};

const WEATHER_DEFAULTS: Record<StAnnWeatherMode, Pick<StAnnAmbienceState, "humidity" | "rainIntensity" | "haze" | "wind">> = {
  clear: { humidity: 0.48, rainIntensity: 0, haze: 0.08, wind: 0.18 },
  humid: { humidity: 0.82, rainIntensity: 0, haze: 0.42, wind: 0.12 },
  mist: { humidity: 0.88, rainIntensity: 0.08, haze: 0.62, wind: 0.16 },
  light_rain: { humidity: 0.9, rainIntensity: 0.38, haze: 0.5, wind: 0.28 },
  heavy_rain: { humidity: 0.96, rainIntensity: 0.82, haze: 0.68, wind: 0.45 },
  night_shower: { humidity: 0.94, rainIntensity: 0.52, haze: 0.58, wind: 0.34 }
};

type RainDrop = Phaser.GameObjects.Sprite & {
  getData(key: "speed" | "drift"): number;
};

export function createStAnnAmbience(input: StAnnAmbienceInput = {}): StAnnAmbienceState {
  const weather = input.weather ?? "humid";
  const timeOfDay = input.timeOfDay ?? (weather === "night_shower" ? "night" : "day");
  const weatherDefaults = WEATHER_DEFAULTS[weather];
  const timeDefaults = TIME_TINTS[timeOfDay];
  const rainIntensity = clamp01(input.rainIntensity ?? weatherDefaults.rainIntensity);
  const humidity = clamp01(input.humidity ?? Math.max(weatherDefaults.humidity, rainIntensity * 0.85));
  const haze = clamp01(input.haze ?? Math.max(weatherDefaults.haze, humidity * 0.45));
  const wind = clamp01(input.wind ?? weatherDefaults.wind);

  return {
    timeOfDay,
    weather,
    humidity,
    rainIntensity,
    haze,
    wind,
    skyTint: timeDefaults.skyTint,
    overlayTint: timeDefaults.overlayTint,
    overlayAlpha: clamp01(timeDefaults.overlayAlpha + rainIntensity * 0.1 + haze * 0.04),
    hazeTint: timeDefaults.hazeTint
  };
}

export function ambienceForHour(hour: number, weather: StAnnWeatherMode = "humid"): StAnnAmbienceState {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const timeOfDay: StAnnTimeOfDay = normalizedHour < 5 || normalizedHour >= 20
    ? "night"
    : normalizedHour < 8
    ? "dawn"
    : normalizedHour >= 17
    ? "dusk"
    : "day";
  const resolvedWeather = timeOfDay === "night" && (weather === "light_rain" || weather === "heavy_rain")
    ? "night_shower"
    : timeOfDay !== "night" && weather === "night_shower"
    ? "humid"
    : weather;
  return createStAnnAmbience({ timeOfDay, weather: resolvedWeather });
}

export function tileHumidityTint(baseTint: number, humidity: number): number {
  if (humidity <= 0.05) return baseTint;
  const from = Phaser.Display.Color.ValueToColor(baseTint);
  const to = Phaser.Display.Color.ValueToColor(0x8fb59c);
  const mix = clamp01(humidity) * 0.24;
  return Phaser.Display.Color.GetColor(
    Math.round(from.red + (to.red - from.red) * mix),
    Math.round(from.green + (to.green - from.green) * mix),
    Math.round(from.blue + (to.blue - from.blue) * mix)
  );
}

export class WeatherSystem {
  private readonly container: Phaser.GameObjects.Container;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly hazeLayers: Phaser.GameObjects.TileSprite[] = [];
  private readonly rainDrops: RainDrop[] = [];
  private state: StAnnAmbienceState;
  private width: number;
  private height: number;

  constructor(
    private readonly scene: Phaser.Scene,
    initial: StAnnAmbienceInput = {},
    options: WeatherSystemOptions = {}
  ) {
    this.state = createStAnnAmbience(initial);
    this.width = options.width ?? scene.scale.width;
    this.height = options.height ?? scene.scale.height;
    this.container = scene.add.container(0, 0).setDepth(options.depth ?? 9000).setScrollFactor(0);
    this.overlay = scene.add.rectangle(0, 0, this.width, this.height, this.state.overlayTint, 0).setOrigin(0);
    this.container.add(this.overlay);

    this.createHazeLayers();
    this.createRainDrops(options.rainDropCount ?? 120);
    this.applyState();
  }

  setAmbience(input: StAnnAmbienceInput): void {
    this.state = createStAnnAmbience({ ...this.state, ...input });
    this.applyState();
  }

  setWeather(weather: StAnnWeatherMode): void {
    this.setAmbience({ weather });
  }

  setTimeOfDay(timeOfDay: StAnnTimeOfDay): void {
    this.setAmbience({ timeOfDay });
  }

  getAmbience(): StAnnAmbienceState {
    return { ...this.state };
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.overlay.setSize(width, height);
    this.hazeLayers.forEach((layer, index) => {
      layer.setPosition(width / 2, height * (0.28 + index * 0.22));
      layer.setDisplaySize(width * 1.2, 90 + index * 24);
    });
  }

  update(time: number, delta: number): void {
    const dt = Math.min(delta, 40) / 16.6667;
    const effectiveRain = this.effectiveRainIntensity(time);
    const rainVisibleCount = Math.floor(this.rainDrops.length * effectiveRain);
    this.hazeLayers.forEach((layer, index) => {
      layer.tilePositionX += (0.18 + this.state.wind * 0.9 + index * 0.08) * dt;
      layer.tilePositionY += Math.sin(layer.tilePositionX * 0.01) * 0.08;
    });

    this.rainDrops.forEach((drop, index) => {
      const visible = index < rainVisibleCount;
      drop.setVisible(visible);
      if (!visible) return;
      drop.x += (drop.getData("drift") + this.state.wind * 4) * dt;
      drop.y += drop.getData("speed") * (1 + effectiveRain * 0.8) * dt;
      if (drop.y > this.height + 24 || drop.x > this.width + 24) {
        drop.setPosition(Math.random() * this.width - 30, -Math.random() * 80);
      }
    });
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private createHazeLayers(): void {
    if (!this.scene.textures.exists("weather_mist_band")) return;
    for (let i = 0; i < 3; i += 1) {
      const layer = this.scene.add.tileSprite(this.width / 2, this.height * (0.28 + i * 0.22), this.width * 1.2, 90 + i * 24, "weather_mist_band")
        .setAlpha(0)
        .setBlendMode(Phaser.BlendModes.SCREEN);
      this.hazeLayers.push(layer);
      this.container.add(layer);
    }
  }

  private createRainDrops(count: number): void {
    if (!this.scene.textures.exists("weather_raindrop")) return;
    for (let i = 0; i < count; i += 1) {
      const drop = this.scene.add.sprite(Math.random() * this.width, Math.random() * this.height, "weather_raindrop") as RainDrop;
      drop.setAlpha(0.68)
        .setScale(0.8 + Math.random() * 0.65)
        .setAngle(12)
        .setVisible(false)
        .setData("speed", 13 + Math.random() * 11)
        .setData("drift", 1 + Math.random() * 2.5);
      this.rainDrops.push(drop);
      this.container.add(drop);
    }
  }

  private applyState(): void {
    this.overlay.setFillStyle(this.state.overlayTint, this.state.overlayAlpha);
    const hazeAlpha = clamp01(this.state.haze * 0.34 + this.state.humidity * 0.08);
    this.hazeLayers.forEach((layer, index) => {
      layer.setTint(this.state.hazeTint);
      layer.setAlpha(hazeAlpha * (1 - index * 0.18));
    });
    const rainAlpha = 0.38 + this.state.rainIntensity * 0.4;
    this.rainDrops.forEach((drop) => drop.setAlpha(rainAlpha));
  }

  private effectiveRainIntensity(time: number): number {
    if (this.state.rainIntensity <= 0) return 0;
    const showerPulse = (Math.sin(time / 3600) + 1) / 2;
    const gustPulse = (Math.sin(time / 1150 + this.state.wind * 3) + 1) / 2;
    if (this.state.rainIntensity < 0.56 && showerPulse < 0.27) return 0;
    return clamp01(this.state.rainIntensity * (0.48 + showerPulse * 0.38 + gustPulse * 0.18));
  }
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
