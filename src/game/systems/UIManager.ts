import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { button, panel } from "../art/UITheme";
import { GAME_HEIGHT, GAME_WIDTH } from "../data/constants";
import { HorseStats } from "./HorseStats";
import { MessageBox } from "../ui/MessageBox";
import { MiniMap, MiniMapState } from "../ui/MiniMap";
import { StatPanel } from "../ui/StatPanel";
import { TravelDestination, TravelMenu } from "../ui/TravelMenu";
import { hiddenQuestProgress, HIDDEN_QUEST_NAME } from "../data/hiddenQuest";
import { SaveSystem } from "./SaveSystem";
import { STORY_QUESTS, storyQuestById } from "../data/storyQuests";
import { activeCelebrationForDay, boatSummary, destinationByParishId } from "../data/jamaicaTravel";
import { horseCustomizationExplorationBonusSummary, horseCustomizationSummary } from "../data/horseCustomization";
import { explorationProgress } from "../data/explorationScenarios";
import type { StAnnTimeOfDay, StAnnWeatherMode } from "./WeatherSystem";

export type ClockHudState = {
  day: number;
  hour: number;
  weather: StAnnWeatherMode;
  timeOfDay: StAnnTimeOfDay;
  rainIntensity: number;
  humidity: number;
};

export type ControlHints = {
  fallback: string;
  help: string;
};

export class UIManager {
  readonly messageBox: MessageBox;
  readonly travelMenu: TravelMenu;
  private readonly statPanel: StatPanel;
  private promptText: Phaser.GameObjects.Text;
  private toastText: Phaser.GameObjects.Text;
  private journalContainer: Phaser.GameObjects.Container;
  private journalTitle!: Phaser.GameObjects.Text;
  private journalBody!: Phaser.GameObjects.Text;
  private clockText: Phaser.GameObjects.Text;
  private tooltipText: Phaser.GameObjects.Text;
  private miniMap?: MiniMap;
  private journalOpen = false;
  private currentStats?: HorseStats;

  constructor(
    private readonly scene: Phaser.Scene,
    private areaName: string,
    onTravel: (scene: TravelDestination) => void,
    onInventory: () => void,
    onSettings: () => void,
    private readonly controls: () => ControlHints
  ) {
    this.statPanel = new StatPanel(scene, areaName, areaName === "Ranch");
    this.messageBox = new MessageBox(scene);
    this.travelMenu = new TravelMenu(scene, onTravel);
    panel(scene, GAME_WIDTH / 2, GAME_HEIGHT - 48, 560, 48, 709);
    this.promptText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 48, "", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: PaletteCss.cream,
      align: "center",
      padding: { x: 18, y: 8 },
      wordWrap: { width: 520 }
    }).setOrigin(0.5).setDepth(710).setScrollFactor(0);
    this.toastText = scene.add.text(GAME_WIDTH / 2, 78, "", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: PaletteCss.gold,
      align: "center",
      backgroundColor: "rgba(25,18,12,0.86)",
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setDepth(720).setVisible(false).setScrollFactor(0);

    this.clockText = this.createClockHud();
    this.tooltipText = this.createTooltipSurface();
    this.scene.events.on("ui-tooltip-show", this.showTooltip);
    this.scene.events.on("ui-tooltip-hide", this.hideTooltip);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.events.off("ui-tooltip-show", this.showTooltip);
      this.scene.events.off("ui-tooltip-hide", this.hideTooltip);
    });
    this.createCornerControls(onInventory, onSettings);
    this.journalContainer = this.createJournalSurface();
  }

  updateStats(stats: HorseStats, areaName = this.areaName): void {
    this.areaName = areaName;
    this.currentStats = stats;
    this.statPanel.update(stats, areaName);
    if (this.journalOpen) this.updateJournalContent();
  }

  updateMiniMap(state: MiniMapState): void {
    this.miniMap?.update(state);
  }

  updateClock(state: ClockHudState): void {
    const time = this.formatHour(state.hour);
    const weather = this.weatherLabel(state.weather);
    const detail = state.rainIntensity > 0.05
      ? `${Math.round(state.rainIntensity * 100)}% rain`
      : `${Math.round(state.humidity * 100)}% humidity`;
    this.clockText.setText(`Day ${state.day}  |  ${time}  |  ${weather}  |  ${detail}`);
  }

  setPrompt(text: string): void {
    this.promptText.setText(text || this.fallbackPrompt());
  }

  toast(message: string, color = "#f8dd91"): void {
    this.toastText.setColor(color).setText(message).setVisible(true);
    this.scene.tweens.killTweensOf(this.toastText);
    this.scene.tweens.add({
      targets: this.toastText,
      alpha: { from: 1, to: 0 },
      delay: 1700,
      duration: 600,
      onComplete: () => {
        this.toastText.setAlpha(1).setVisible(false);
      }
    });
  }

  isOverlayOpen(): boolean {
    return this.messageBox.isOpen() || this.travelMenu.isOpen() || this.journalOpen;
  }

  isJournalOpen(): boolean {
    return this.journalOpen;
  }

  private createCornerControls(onInventory: () => void, onSettings: () => void): void {
    if (this.areaName === "Ranch") {
      this.textButton(86, GAME_HEIGHT - 34, "Inventory", onInventory, 112, "Open feed, tools, and horse-care items.");
      this.textButton(210, GAME_HEIGHT - 34, "Journal", () => this.toggleJournal("Journal"), 112, "Open quests, horse status, and travel notes.");
      this.textButton(334, GAME_HEIGHT - 34, "Settings", onSettings, 112, "Open controls, graphics, sound, weather, and world settings.");
      this.textButton(GAME_WIDTH - 92, GAME_HEIGHT - 34, "Map", () => this.travelMenu.toggle(), 120, "Open the ranch travel board.");
      return;
    }
    this.miniMap = new MiniMap(this.scene);
    this.textButton(GAME_WIDTH - 154, 184, "Help", () => this.toast(this.controls().help), 70, "Show movement and interaction controls.");
    this.textButton(GAME_WIDTH - 76, 184, "Status", () => this.toggleJournal("Status"), 78, "Open horse, quest, and travel status.");

    this.textButton(92, GAME_HEIGHT - 34, "Inventory", onInventory, 120, "Open feed, tools, and horse-care items.");
    this.textButton(224, GAME_HEIGHT - 34, "Quests", () => this.toggleJournal("Quests"), 120, "Review active story and hidden quest clues.");
    this.textButton(356, GAME_HEIGHT - 34, "Settings", onSettings, 120, "Open controls, graphics, sound, weather, and world settings.");
    this.textButton(GAME_WIDTH - 224, GAME_HEIGHT - 34, "Map", () => this.travelMenu.toggle(), 120, "Open fast travel destinations.");
    this.textButton(GAME_WIDTH - 92, GAME_HEIGHT - 34, "Journal", () => this.toggleJournal("Journal"), 120, "Open the full ranch journal.");
  }

  private createClockHud(): Phaser.GameObjects.Text {
    this.scene.add.rectangle(GAME_WIDTH / 2, 30, 438, 34, Palette.darkPanel, 0.9)
      .setStrokeStyle(2, Palette.goldDark, 0.75)
      .setDepth(704)
      .setScrollFactor(0);
    return this.scene.add.text(GAME_WIDTH / 2, 30, "Day 1  |  12:00 PM  |  Humid", {
      fontFamily: "Georgia",
      fontSize: "15px",
      color: PaletteCss.cream,
      align: "center",
      fixedWidth: 414
    }).setOrigin(0.5).setDepth(705).setScrollFactor(0);
  }

  private createTooltipSurface(): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, "", {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: PaletteCss.cream,
      backgroundColor: "rgba(21,16,10,0.94)",
      padding: { x: 12, y: 8 },
      wordWrap: { width: 280 }
    }).setDepth(940).setScrollFactor(0).setVisible(false);
  }

  private readonly showTooltip = (data: { text: string; x: number; y: number }): void => {
    this.tooltipText
      .setText(data.text)
      .setPosition(Phaser.Math.Clamp(data.x - 140, 18, GAME_WIDTH - 318), Phaser.Math.Clamp(data.y - 28, 18, GAME_HEIGHT - 98))
      .setVisible(true);
  };

  private readonly hideTooltip = (): void => {
    this.tooltipText.setVisible(false);
  };

  private createJournalSurface(): Phaser.GameObjects.Container {
    const shade = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.42);
    const surface = panel(this.scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, 620, 440, 881);
    const inner = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 2, 560, 300, Palette.panelBrown, 0.28)
      .setStrokeStyle(1, Palette.goldDark, 0.75);
    this.journalTitle = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 202, "Journal", {
      fontFamily: "Georgia",
      fontSize: "28px",
      color: PaletteCss.gold
    }).setOrigin(0.5);
    this.journalBody = this.scene.add.text(GAME_WIDTH / 2 - 252, GAME_HEIGHT / 2 - 148, "", {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: PaletteCss.cream,
      lineSpacing: 5,
      wordWrap: { width: 504 }
    });
    const close = button(this.scene, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 178, 150, 40, "Close", () => this.hideJournal(), 883);
    const children: Phaser.GameObjects.GameObject[] = [shade, surface, inner, this.journalTitle, this.journalBody, close];
    children.forEach((child) => {
      const fixed = child as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.ScrollFactor;
      fixed.setScrollFactor?.(0);
    });
    return this.scene.add.container(0, 0, children).setDepth(880).setVisible(false).setScrollFactor(0);
  }

  private toggleJournal(title: "Journal" | "Quests" | "Status"): void {
    if (this.journalOpen && this.journalTitle.text === title) {
      this.hideJournal();
      return;
    }
    this.journalOpen = true;
    this.travelMenu.hide();
    this.journalTitle.setText(title);
    this.updateJournalContent();
    this.journalContainer.setVisible(true);
  }

  private hideJournal(): void {
    this.journalOpen = false;
    this.journalContainer.setVisible(false);
  }

  private updateJournalContent(): void {
    const stats = this.currentStats;
    const save = SaveSystem.load();
    const hiddenQuest = hiddenQuestProgress(save.world.interactedWorldObjects);
    const activeQuest = storyQuestById(save.story.activeQuestId);
    const home = this.homeLabel(stats?.houseChoice ?? null);
    const homeParish = destinationByParishId(save.world.homeParishId);
    const currentParish = destinationByParishId(save.world.currentParishId);
    const celebration = activeCelebrationForDay(stats?.day ?? 1, save.world.currentParishId);
    const exploration = explorationProgress(save.world.interactedWorldObjects);
    const coreQuest = activeQuest
      ? `Story quest: ${activeQuest.title} (${save.story.completedQuestIds.length}/${STORY_QUESTS.length})\nObjective: ${activeQuest.objective}`
      : "Story quest: Complete. Goldspur's legacy is secure.";
    const hiddenLine = hiddenQuest.complete
      ? `${HIDDEN_QUEST_NAME}: complete. The Puerto Seco coin cache has been claimed.`
      : hiddenQuest.found > 0
        ? `${HIDDEN_QUEST_NAME}: ${hiddenQuest.found}/${hiddenQuest.total}. Next clue: ${hiddenQuest.current?.title ?? "unknown"}.`
        : `${HIDDEN_QUEST_NAME}: hidden somewhere between Steer Town, St Ann's Bay, Ocho Rios, Runaway Bay, and Puerto Seco.`;
    const raceRecord = `${stats?.racesWon ?? 0}/${stats?.racesEntered ?? 0}`;
    this.journalBody.setText([
      coreQuest,
      hiddenLine,
      "",
      `Location: ${this.areaName}`,
      `Home: ${home} at ${homeParish.name}`,
      `World seed: ${this.seedLabel(save.world.worldSeed)}`,
      `Horse style: ${horseCustomizationSummary(save.horseCustomization)}`,
      `Tack field perk: ${this.firstLine(horseCustomizationExplorationBonusSummary(save.horseCustomization))}`,
      `Trail discoveries: ${exploration.uniqueScenarioCount}/${exploration.totalScenarioTypes} tool routes, ${exploration.completedSites} sites`,
      `Next trail lead: ${exploration.nextHint}`,
      boatSummary(save.world.boat),
      `Parish shore: ${currentParish.shoreName}, ${currentParish.name}`,
      `Today: ${celebration.title} (${celebration.timing}) - ${celebration.summary}`,
      `Day: ${stats?.day ?? 1}`,
      `Energy: ${stats?.energy ?? "--"}   Health: ${stats?.health ?? "--"}   Mood: ${stats?.mood ?? "--"}`,
      `Bond: ${stats?.bond ?? "--"}   Race record: ${raceRecord}`,
      "",
      activeQuest ? `Next: ${activeQuest.location} - ${activeQuest.summary}` : this.nextStep(stats)
    ].join("\n"));
  }

  private nextStep(stats?: HorseStats): string {
    if (!stats?.houseChoice) return "Next: Choose a home to unlock the ranch routine.";
    if ((stats.energy ?? 0) < 35) return "Next: Rest or visit Health & Care before harder training.";
    if ((stats.speed ?? 0) < 25 || (stats.stamina ?? 0) < 25) return "Next: Train speed and stamina before racing.";
    return "Next: Use the Map or ranch Travel Board to pick your next activity.";
  }

  private homeLabel(choice: HorseStats["houseChoice"]): string {
    if (choice === "cozy_stable") return "Cozy Stable";
    if (choice === "speed_barn") return "Speed Barn";
    if (choice === "nature_cabin") return "Nature Cabin";
    return "Unchosen";
  }

  private seedLabel(seed: string): string {
    return seed.length > 28 ? `${seed.slice(0, 24)}...` : seed;
  }

  private firstLine(text: string): string {
    return text.split("\n")[0] ?? text;
  }

  private formatHour(hour: number): string {
    const normalized = ((hour % 24) + 24) % 24;
    const suffix = normalized >= 12 ? "PM" : "AM";
    const displayHour = normalized % 12 || 12;
    return `${displayHour}:00 ${suffix}`;
  }

  private weatherLabel(weather: StAnnWeatherMode): string {
    if (weather === "clear") return "Clear";
    if (weather === "humid") return "Humid";
    if (weather === "mist") return "Mist";
    if (weather === "light_rain") return "Passing shower";
    if (weather === "heavy_rain") return "Heavy shower";
    return "Night shower";
  }

  private fallbackPrompt(): string {
    const controls = this.controls().fallback;
    if (this.areaName === "Ranch" && !this.currentStats?.houseChoice) {
      return `Next: choose a home at Starter Stable. ${controls}`;
    }
    if (this.areaName === "Ranch") {
      return `${controls}   Talk to NPCs for help`;
    }
    return controls;
  }

  private textButton(x: number, y: number, label: string, action: () => void, width: number, tooltip?: string): void {
    button(this.scene, x, y, width, 42, label, action, 705, tooltip);
  }
}
