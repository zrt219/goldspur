import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { button, panel } from "../art/UITheme";
import { assetUrl, GAME_HEIGHT, GAME_WIDTH, IMAGE_KEYS, STREAMED_IMAGE_FILES } from "../data/constants";
import { CHARACTERS, characterById } from "../data/characters";
import { STORY_QUESTS, storyQuestById } from "../data/storyQuests";
import { SaveSystem } from "../systems/SaveSystem";

export class MainMenuScene extends Phaser.Scene {
  private fallbackBackdrop: Phaser.GameObjects.GameObject[] = [];
  private titleBackgroundLoading = false;

  constructor() {
    super("MainMenuScene");
  }

  create(): void {
    this.paintBackdrop();
    const save = SaveSystem.load();
    const character = characterById(save.selectedCharacterId);
    const activeQuest = storyQuestById(save.story.activeQuestId);

    this.add.text(88, 78, "Goldspur Valley", {
      fontFamily: "Georgia",
      fontSize: "58px",
      color: PaletteCss.gold
    }).setDepth(4);
    this.add.text(92, 142, "Story Mode", {
      fontFamily: "Georgia",
      fontSize: "25px",
      color: PaletteCss.cream
    }).setDepth(4);

    panel(this, 88 + 228, 385, 456, 390, 4);
    this.add.text(128, 232, "Saddle up", {
      fontFamily: "Georgia",
      fontSize: "30px",
      color: PaletteCss.gold
    }).setDepth(5);
    this.add.text(128, 278, [
      character ? `Rider: ${character.name}` : "Rider: not selected",
      `Quest: ${activeQuest?.title ?? "Ready to begin"}`,
      `${save.story.completedQuestIds.length}/${STORY_QUESTS.length} quests complete`
    ], {
      fontFamily: "Georgia",
      fontSize: "18px",
      color: PaletteCss.cream,
      lineSpacing: 9
    }).setDepth(5);

    button(this, 316, 374, 290, 46, character ? "Continue Story" : "Start Story", () => {
      this.scene.start(character ? "RanchScene" : "CharacterSelectScene");
    }, 6);
    button(this, 316, 434, 290, 46, "Character Select", () => {
      this.scene.start("CharacterSelectScene");
    }, 6);
    button(this, 316, 494, 290, 46, "Settings", () => {
      this.scene.launch("SettingsScene", { returnScene: this.scene.key });
      this.scene.pause();
      this.scene.bringToTop("SettingsScene");
    }, 6);
    button(this, 316, 554, 290, 46, "Credits", () => {
      this.scene.start("CreditsScene");
    }, 6);

    this.add.text(128, 616, "Enter: continue  |  C: character  |  S: settings  |  Esc: credits", {
      fontFamily: "Georgia",
      fontSize: "16px",
      color: "#d9c795"
    }).setDepth(5);

    this.drawRosterPreview();
    this.input.keyboard?.once("keydown-ENTER", () => this.scene.start(character ? "RanchScene" : "CharacterSelectScene"));
    this.input.keyboard?.once("keydown-C", () => this.scene.start("CharacterSelectScene"));
    this.input.keyboard?.once("keydown-S", () => {
      this.scene.launch("SettingsScene", { returnScene: this.scene.key });
      this.scene.pause();
      this.scene.bringToTop("SettingsScene");
    });
    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("CreditsScene"));
  }

  private paintBackdrop(): void {
    this.cameras.main.setBackgroundColor("#182514");
    if (this.textures.exists(IMAGE_KEYS.titleBackground)) {
      this.addTitleBackground();
    } else {
      this.drawFallbackBackdrop();
      this.streamTitleBackground();
    }
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.2)
      .setOrigin(0)
      .setDepth(3);
  }

  private addTitleBackground(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, IMAGE_KEYS.titleBackground)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(1);
  }

  private drawFallbackBackdrop(): void {
    this.fallbackBackdrop.forEach((object) => object.destroy());
    this.fallbackBackdrop = [
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x182514, 1),
      this.add.rectangle(920, 354, 560, 440, Palette.grassDark, 0.88)
        .setStrokeStyle(3, Palette.goldDark)
        .setDepth(1),
      this.add.rectangle(922, 570, 620, 90, Palette.dirtDark, 0.9)
        .setDepth(2),
      this.add.ellipse(908, 338, 360, 190, Palette.grassLight, 0.62)
        .setStrokeStyle(2, Palette.grass, 0.82)
        .setDepth(2),
      this.add.circle(1055, 215, 52, Palette.gold, 0.22)
        .setStrokeStyle(2, Palette.gold, 0.55)
        .setDepth(2)
    ];
  }

  private streamTitleBackground(): void {
    const file = STREAMED_IMAGE_FILES[IMAGE_KEYS.titleBackground];
    if (!file || this.titleBackgroundLoading || this.textures.exists(IMAGE_KEYS.titleBackground)) return;
    if (this.load.isLoading()) {
      this.time.delayedCall(50, () => this.streamTitleBackground());
      return;
    }
    this.titleBackgroundLoading = true;
    this.load.image(IMAGE_KEYS.titleBackground, assetUrl(file));
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.titleBackgroundLoading = false;
      if (!this.scene.isActive(this.scene.key) || !this.textures.exists(IMAGE_KEYS.titleBackground)) return;
      this.fallbackBackdrop.forEach((object) => object.destroy());
      this.fallbackBackdrop = [];
      this.addTitleBackground();
    });
    this.load.start();
  }

  private drawRosterPreview(): void {
    this.add.text(760, 155, "Choose your rider, then begin the ranch story.", {
      fontFamily: "Georgia",
      fontSize: "22px",
      color: PaletteCss.cream
    }).setOrigin(0.5).setDepth(5);
    CHARACTERS.forEach((character, index) => {
      const x = 710 + index * 138;
      const y = 350 + (index % 2 === 0 ? -26 : 28);
      this.add.ellipse(x, y + 86, 90, 24, 0x000000, 0.25).setDepth(4);
      this.add.circle(x, y, 38, character.color, 1)
        .setStrokeStyle(3, character.accentColor)
        .setDepth(5);
      this.add.rectangle(x, y + 70, 54, 86, character.color, 0.96)
        .setStrokeStyle(3, character.accentColor)
        .setDepth(5);
      this.add.text(x, y + 136, character.name.split(" ")[0], {
        fontFamily: "Georgia",
        fontSize: "17px",
        color: PaletteCss.cream
      }).setOrigin(0.5).setDepth(5);
    });
  }
}
