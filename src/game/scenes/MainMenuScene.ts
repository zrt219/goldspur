import Phaser from "phaser";
import { Palette, PaletteCss } from "../art/Palette";
import { button, DISPLAY_FONT_FAMILY, prefersReducedMotion, revealObjects, surfaceFrame, UI_FONT_FAMILY } from "../art/UITheme";
import { assetUrl, GAME_HEIGHT, GAME_WIDTH, IMAGE_KEYS, IMAGE_FILES, STREAMED_IMAGE_FILES } from "../data/constants";
import { CHARACTERS, characterById } from "../data/characters";
import { STORY_QUESTS } from "../data/storyQuests";
import { RANCH_NPCS, npcAttentionTone, ranchNpcMemoryFor } from "../data/npcs";
import { mainMenuPreviewCards } from "../systems/OnboardingPreviewSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { activeStoryQuest } from "../systems/StoryGuide";
import { playSceneAmbientMusic } from "../systems/AmbientMusicSystem";

type MenuHubAction = "continue" | "choose_rider" | "customize_rider" | "settings" | "credits";

type MenuHubCard = {
  id: string;
  strap: string;
  title: string;
  body: string;
  action: MenuHubAction;
  priority: number;
  tone: "urgent" | "recommended" | "npc";
};

type MenuFeedItem = {
  strap: string;
  message: string;
  tone: "urgent" | "recommended" | "npc";
};

export class MainMenuScene extends Phaser.Scene {
  private fallbackBackdrop: Phaser.GameObjects.GameObject[] = [];
  private titleBackgroundLoading = false;

  constructor() {
    super("MainMenuScene");
  }

  preload(): void {
    if (!this.textures.exists(IMAGE_KEYS.menuCrest)) this.load.image(IMAGE_KEYS.menuCrest, assetUrl(IMAGE_FILES[IMAGE_KEYS.menuCrest]));
  }

  create(): void {
    playSceneAmbientMusic(this);
    this.paintBackdrop();
    const save = SaveSystem.load();
    const character = characterById(save.selectedCharacterId);
    const activeQuest = activeStoryQuest(save);
    const storyComplete = save.story.completedQuestIds.length >= STORY_QUESTS.length;
    const hubCards = this.mainMenuHubCards(save, Boolean(character), activeQuest?.title ?? null, storyComplete);
    const primaryAction = hubCards[0]?.action ?? "continue";

    const title = this.add.text(88, 78, "Goldspur Valley", {
      fontFamily: DISPLAY_FONT_FAMILY,
      fontSize: "58px",
      color: PaletteCss.gold
    }).setDepth(4);
    const subtitle = this.add.text(92, 142, "Story Mode", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "21px",
      color: "#f1ddae"
    }).setDepth(4);

    const menuObjects: Phaser.GameObjects.GameObject[] = [title, subtitle];
    menuObjects.push(...surfaceFrame(this, 316, 472, 472, 620, 4, "warm"));
    if (this.textures.exists(IMAGE_KEYS.menuCrest)) {
      const crestGlow = this.add.circle(492, 252, 48, Palette.gold, 0.08)
        .setStrokeStyle(1, Palette.goldDark, 0.65)
        .setDepth(5);
      const crest = this.add.image(492, 252, IMAGE_KEYS.menuCrest)
        .setDisplaySize(84, 84)
        .setAlpha(0.92)
        .setDepth(6);
      menuObjects.push(crestGlow, crest);
      if (!prefersReducedMotion()) {
        const scaleX = crest.scaleX;
        const scaleY = crest.scaleY;
        crest.setScale(scaleX * 0.94, scaleY * 0.94);
        this.tweens.add({
          targets: crest,
          scaleX,
          scaleY,
          alpha: { from: 0.78, to: 0.92 },
          duration: 280,
          ease: "Quart.easeOut"
        });
        this.tweens.add({
          targets: crestGlow,
          alpha: { from: 0.08, to: 0.18 },
          duration: 1700,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
    }
    menuObjects.push(this.add.text(128, 208, "LIVE RANCH LOOP", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "11px",
      color: "#65f2ff"
    }).setDepth(5));
    menuObjects.push(...this.drawStatusChip(174, 244, "Loop", activeQuest?.title ? "Quest live" : storyComplete ? "Free ride" : "Start ready", "recommended"));
    menuObjects.push(...this.drawStatusChip(290, 244, "Horse", this.statsHorseTag(save), save.stats.health < 70 || save.stats.energy < 35 ? "urgent" : "npc"));
    menuObjects.push(...this.drawStatusChip(406, 244, "Home", save.stats.houseChoice ? "Chosen" : "Unset", save.stats.houseChoice ? "npc" : "recommended"));
    menuObjects.push(this.add.text(128, 286, "Ranch Command Hub", {
      fontFamily: DISPLAY_FONT_FAMILY,
      fontSize: "30px",
      color: PaletteCss.gold
    }).setDepth(5));
    menuObjects.push(this.add.text(128, 322, [
      character
        ? `${character.name} is set for the loop. ${save.stats.houseChoice ? "Home chosen." : "Home still open."}`
        : "Choose a rider, set a home, and open the ranch loop.",
      activeQuest?.title
        ? `Story lead: ${activeQuest.title}`
        : storyComplete
          ? "Story lead: Legacy complete."
          : "Story lead: First chapter ready."
    ], {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "12px",
      color: PaletteCss.cream,
      lineSpacing: 3,
      wordWrap: { width: 350 }
    }).setDepth(5));

    let hubCardTop = 341;
    hubCards.slice(0, 3).forEach((card, index) => {
      const cardHeight = this.measureHubCardHeight(card);
      menuObjects.push(...this.drawHubCard(316, hubCardTop, card, index === 0, cardHeight));
      hubCardTop += cardHeight + 14;
    });

    const continueLabelY = hubCardTop + 8;
    const continueButtonY = hubCardTop + 52;
    const utilityButtonsY = continueButtonY + 60;
    const footerHintY = utilityButtonsY + 42;

    menuObjects.push(this.add.text(316, continueLabelY, `Continue loop jumps to: ${hubCards[0]?.title ?? "Ranch loop"}`, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "12px",
      color: "#d9c795",
      align: "center",
      fixedWidth: 340
    }).setOrigin(0.5).setDepth(6));
    menuObjects.push(button(this, 316, continueButtonY, 332, 56, "Continue Loop", () => this.runMenuHubAction(primaryAction, Boolean(character)), 6, hubCards[0]?.body));
    menuObjects.push(button(this, 196, utilityButtonsY, 108, 38, "Rider", () => this.runMenuHubAction("choose_rider", Boolean(character)), 6));
    menuObjects.push(button(this, 316, utilityButtonsY, 108, 38, "Style", () => this.runMenuHubAction("customize_rider", Boolean(character)), 6));
    menuObjects.push(button(this, 436, utilityButtonsY, 108, 38, "Systems", () => this.runMenuHubAction("settings", Boolean(character)), 6));

    menuObjects.push(this.add.text(128, footerHintY, "Enter: continue loop  |  C: rider  |  P: style  |  S: systems  |  Esc: credits", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "11px",
      color: "#d9c795"
    }).setDepth(5));

    revealObjects(this, menuObjects, 34, 12);
    revealObjects(this, this.drawStoryPreview(save), 40, 8);
    revealObjects(this, this.drawRosterPreview(save), 42, 8);

    this.input.keyboard?.once("keydown-ENTER", () => this.runMenuHubAction(primaryAction, Boolean(character)));
    this.input.keyboard?.once("keydown-C", () => this.scene.start("CharacterSelectScene"));
    this.input.keyboard?.once("keydown-P", () => {
      this.scene.launch("PlayerCustomizationScene", { returnScene: this.scene.key });
      this.scene.pause();
      this.scene.bringToTop("PlayerCustomizationScene");
    });
    this.input.keyboard?.once("keydown-S", () => {
      this.scene.launch("SettingsScene", { returnScene: this.scene.key });
      this.scene.pause();
      this.scene.bringToTop("SettingsScene");
    });
    this.input.keyboard?.once("keydown-ESC", () => this.scene.start("CreditsScene"));
  }

  private mainMenuHubCards(
    save: ReturnType<typeof SaveSystem.load>,
    hasCharacter: boolean,
    activeQuestTitle: string | null,
    storyComplete: boolean
  ): MenuHubCard[] {
    const stats = save.stats;
    const cards: MenuHubCard[] = [];
    if (!hasCharacter) {
      cards.push({
        id: "urgent-rider",
        strap: "Urgent action",
        title: "Choose your rider",
        body: "Start with the new sprite set before the ranch loop begins.",
        action: "choose_rider",
        priority: 100,
        tone: "urgent"
      });
    } else if (!stats.houseChoice) {
      cards.push({
        id: "urgent-auntie",
        strap: "Urgent action",
        title: "Talk to Auntie Marva",
        body: "She unlocks home choice and keeps the first run clean.",
        action: "continue",
        priority: 96,
        tone: "urgent"
      });
    } else if (stats.health < 70) {
      cards.push({
        id: "urgent-health",
        strap: "Urgent action",
        title: "Health check needed",
        body: "Nurse Lorna has a care branch ready before hard riding.",
        action: "continue",
        priority: 92,
        tone: "urgent"
      });
    } else if (stats.energy < 35) {
      cards.push({
        id: "urgent-energy",
        strap: "Urgent action",
        title: "Recover before training",
        body: "Low energy can desync the loop feel. Rest or care first.",
        action: "continue",
        priority: 90,
        tone: "urgent"
      });
    }

    cards.push({
      id: "recommended-loop",
      strap: "Recommended next",
      title: activeQuestTitle ?? (storyComplete ? "Run the ranch rhythm" : "Progress story loop"),
      body: stats.speed < 25 || stats.stamina < 25
        ? "Train speed and stamina, then talk to Coach Devon for branches."
        : "Ride, care, talk, and let NPC memory reshape the next options.",
      action: hasCharacter ? "continue" : "choose_rider",
      priority: 72,
      tone: "recommended"
    });

    const nowMs = Date.now();
    const npcLines = RANCH_NPCS
      .map((npc) => {
        const memory = ranchNpcMemoryFor(save.world.npcMemories, npc.id);
        const pressure = memory.pendingObjectives.length + memory.pendingQuests.length + (memory.flags.neglectedNpc ? 2 : 0);
        return {
          npc,
          memory,
          pressure,
          tone: npcAttentionTone(memory, nowMs)
        };
      })
      .sort((left, right) => right.pressure - left.pressure || right.memory.affinity - left.memory.affinity)
      .slice(0, 3);
    const npcBody = npcLines.length
      ? (() => {
        const [lead, ...rest] = npcLines;
        const leadName = lead.npc.label.split(" ").at(-1) ?? lead.npc.label;
        const leadTone = this.shortFeedLine(
          lead.tone
            .replace(/^This NPC\s+/i, "")
            .replace(/^NPC\s+/i, "")
            .replace(/^still\s+/i, ""),
          42
        );
        return `${leadName}: ${leadTone}${rest.length ? ` / +${rest.length} more waiting.` : ""}`;
      })()
      : "No active NPC pressure yet. Start a loop to wake the ranch.";
    cards.push({
      id: "npc-rail",
      strap: "NPC pulse",
      title: "Who's waiting?",
      body: npcBody,
      action: hasCharacter ? "continue" : "choose_rider",
      priority: 60,
      tone: "npc"
    });

    return cards.sort((left, right) => right.priority - left.priority);
  }

  private measureHubCardHeight(card: MenuHubCard): number {
    const probe = this.add.text(-1000, -1000, card.body, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "10px",
      color: PaletteCss.cream,
      fixedWidth: 254,
      wordWrap: { width: 254 },
      lineSpacing: 2
    }).setVisible(false);
    const height = Math.ceil(probe.height);
    probe.destroy();
    return Math.max(78, height + 58);
  }

  private drawHubCard(x: number, top: number, card: MenuHubCard, primary: boolean, cardHeight = this.measureHubCardHeight(card)): Phaser.GameObjects.GameObject[] {
    const color = card.tone === "urgent" ? 0x65f2ff : card.tone === "recommended" ? Palette.gold : 0x8ff0d4;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const centerY = top + cardHeight / 2;
    const innerHeight = Math.max(60, cardHeight - 18);
    const glow = this.add.rectangle(x, centerY, 336, cardHeight, color, primary ? 0.12 : 0.06)
      .setDepth(5)
      .setData("menuHubCard", card.id);
    const bg = this.add.rectangle(x, centerY, 332, cardHeight - 4, Palette.darkPanel, 0.94)
      .setStrokeStyle(1, color, primary ? 0.82 : 0.44)
      .setDepth(6)
      .setData("menuHubCard", card.id);
    const inner = this.add.rectangle(x, centerY + 1, 320, innerHeight, Palette.panelBrown, 0.18)
      .setStrokeStyle(1, Palette.goldDark, 0.32)
      .setDepth(6)
      .setData("menuHubCard", card.id);
    const rail = this.add.rectangle(x - 154, centerY, 4, Math.max(52, innerHeight - 8), color, primary ? 0.56 : 0.34)
      .setDepth(7)
      .setData("menuHubCard", card.id);
    const pulse = this.add.rectangle(x - 126, top + 16, 44, 2, color, 0.72)
      .setDepth(7)
      .setData("menuHubPulse", card.id);
    const strap = this.add.text(x - 138, top + 10, card.strap.toUpperCase(), {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "10px",
      color: card.tone === "urgent" ? "#65f2ff" : "#d9c795"
    }).setDepth(7).setData("menuHubCard", card.id);
    const title = this.add.text(x - 138, top + 28, card.title, {
      fontFamily: DISPLAY_FONT_FAMILY,
      fontSize: primary ? "17px" : "15px",
      color: PaletteCss.gold
    }).setDepth(7).setData("menuHubCard", card.id);
    const body = this.add.text(x - 138, top + 48, card.body, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "10px",
      color: PaletteCss.cream,
      fixedWidth: 254,
      wordWrap: { width: 254 },
      lineSpacing: 2
    }).setDepth(7).setData("menuHubCard", card.id);
    const badge = this.add.rectangle(x + 118, top + 22, 72, 20, Palette.panelBrown, 0.98)
      .setStrokeStyle(1, color, 0.88)
      .setDepth(7)
      .setData("menuHubCard", card.id);
    const badgeText = this.add.text(x + 118, top + 22, primary ? "NOW" : card.tone === "npc" ? "NPC" : "NEXT", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "10px",
      color: card.tone === "urgent" ? "#e9fcff" : PaletteCss.gold,
      align: "center",
      fixedWidth: 60
    }).setOrigin(0.5).setDepth(8).setData("menuHubCard", card.id);
    objects.push(glow, bg, inner, rail, pulse, strap, title, body, badge, badgeText);
    if (!prefersReducedMotion()) {
      this.tweens.add({
        targets: [glow, pulse, rail],
        alpha: { from: primary ? 0.1 : 0.06, to: primary ? 0.22 : 0.12 },
        duration: primary ? 980 : 1400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
    return objects;
  }

  private runMenuHubAction(action: MenuHubAction, hasCharacter: boolean): void {
    if (action === "choose_rider") {
      this.scene.start("CharacterSelectScene");
      return;
    }
    if (action === "customize_rider") {
      this.scene.launch("PlayerCustomizationScene", { returnScene: this.scene.key });
      this.scene.pause();
      this.scene.bringToTop("PlayerCustomizationScene");
      return;
    }
    if (action === "settings") {
      this.scene.launch("SettingsScene", { returnScene: this.scene.key });
      this.scene.pause();
      this.scene.bringToTop("SettingsScene");
      return;
    }
    if (action === "credits") {
      this.scene.start("CreditsScene");
      return;
    }
    this.scene.start(hasCharacter ? "RanchScene" : "CharacterSelectScene");
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

  private drawStoryPreview(save: ReturnType<typeof SaveSystem.load>): Phaser.GameObjects.GameObject[] {
    const objects: Phaser.GameObjects.GameObject[] = [];
    const cards = mainMenuPreviewCards(save);
    const worldFeed = this.mainMenuWorldFeedItems(save);
    objects.push(...surfaceFrame(this, 868, 168, 560, 78, 4, "warm"));
    const heading = this.add.text(868, 152, "Your first ride is simple.", {
      fontFamily: DISPLAY_FONT_FAMILY,
      fontSize: "22px",
      color: PaletteCss.cream
    }).setOrigin(0.5).setDepth(5);
    heading.setShadow(0, 2, "#000000", 6, true, true);
    const subline = this.add.text(868, 184, "Pick a rider, talk to Auntie Marva, choose a home, then ride.", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "14px",
      color: "#d9c795"
    }).setOrigin(0.5).setDepth(5);
    subline.setShadow(0, 2, "#000000", 6, true, true);
    objects.push(heading, subline);
    objects.push(...surfaceFrame(this, 868, 292, 560, 108, 4, "warm"));
    objects.push(this.add.text(614, 250, "TODAY'S TRACK", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "11px",
      color: "#65f2ff"
    }).setDepth(6));
    objects.push(this.add.rectangle(868, 292, 514, 70, Palette.darkPanel, 0.9)
      .setStrokeStyle(1, Palette.goldDark, 0.32)
      .setDepth(5));
    objects.push(this.add.rectangle(776, 292, 1, 72, Palette.goldDark, 0.28).setDepth(6));
    objects.push(this.add.rectangle(960, 292, 1, 72, Palette.goldDark, 0.28).setDepth(6));
    cards.forEach((card, index) => {
      const x = 684 + index * 184;
      const footer = this.compactPreviewFooter(card.footer);
      const body = this.compactPreviewBody(card.body);
      const accent = index === 0 ? "#8ff0d4" : index === 1 ? "#d9c795" : "#65f2ff";
      objects.push(this.add.rectangle(x + 52, 270, 104, 2, index === 2 ? 0x65f2ff : index === 0 ? 0x8ff0d4 : Palette.gold, 0.48).setDepth(6));
      objects.push(this.add.text(x, 268, card.strap, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "10px",
        color: accent
      }).setDepth(6)
        .setData("menuPreviewCardIndex", index)
        .setData("menuPreviewRole", "strap"));
      objects.push(this.add.text(x, 284, card.title, {
        fontFamily: DISPLAY_FONT_FAMILY,
        fontSize: "16px",
        color: PaletteCss.gold,
        wordWrap: { width: 146 }
      }).setDepth(6)
        .setData("menuPreviewCardIndex", index)
        .setData("menuPreviewRole", "title"));
      objects.push(this.add.text(x, 322, body, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "10px",
        color: PaletteCss.cream,
        wordWrap: { width: 152 }
      }).setDepth(6)
        .setData("menuPreviewCardIndex", index)
        .setData("menuPreviewRole", "body"));
      objects.push(this.add.text(x, 348, footer, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "10px",
        color: "#d9c795",
        wordWrap: { width: 152 }
      }).setDepth(6)
        .setData("menuPreviewCardIndex", index)
        .setData("menuPreviewRole", "footer"));
    });
    objects.push(...surfaceFrame(this, 868, 380, 560, 36, 4, "info"));
    objects.push(this.add.text(614, 372, "WORLD FEED", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "11px",
      color: "#65f2ff"
    }).setDepth(6));
    worldFeed.forEach((item, index) => {
      const chipX = 666 + index * 182;
      const accent = this.feedToneColor(item.tone);
      objects.push(this.add.text(chipX - 78, 382, `${item.strap}  ${item.message}`, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "10px",
        color: item.tone === "urgent" ? "#dffcff" : "#e6d9b0",
        fixedWidth: 158
      }).setDepth(7));
      objects.push(this.add.rectangle(chipX + 84, 380, 1, 16, index === worldFeed.length - 1 ? 0x000000 : item.tone === "urgent" ? 0x65f2ff : item.tone === "npc" ? 0x8ff0d4 : Palette.goldDark, index === worldFeed.length - 1 ? 0 : 0.24).setDepth(7));
    });
    return objects;
  }

  private mainMenuWorldFeedItems(save: ReturnType<typeof SaveSystem.load>): MenuFeedItem[] {
    const nowMs = Date.now();
    const mostPressedNpc = RANCH_NPCS
      .map((npc) => {
        const memory = ranchNpcMemoryFor(save.world.npcMemories, npc.id);
        return {
          npc,
          memory,
          pressure: memory.pendingObjectives.length + memory.pendingQuests.length + (memory.flags.neglectedNpc ? 2 : 0)
        };
      })
      .sort((left, right) => right.pressure - left.pressure || right.memory.affinity - left.memory.affinity)[0];
    const npcLine = mostPressedNpc
      ? this.shortFeedLine(`${mostPressedNpc.npc.label}: ${npcAttentionTone(mostPressedNpc.memory, nowMs)}`, 42)
      : "Ranch calm.";
    const systemLine = save.stats.health < 70
      ? "Health pulse rising."
      : save.stats.energy < 35
        ? "Recovery window open."
        : "Loop stable.";
    const routeLine = save.stats.houseChoice
      ? "Home papers signed."
      : "Auntie Marva still waiting.";
    return [
      { strap: "NPC", message: npcLine, tone: "npc" },
      { strap: "CARE", message: systemLine, tone: save.stats.health < 70 || save.stats.energy < 35 ? "urgent" : "recommended" },
      { strap: "ROUTE", message: routeLine, tone: save.stats.houseChoice ? "recommended" : "urgent" }
    ];
  }

  private compactPreviewFooter(footer: string): string {
    return footer
      .replace("Goldspur Favorite", "Favorite")
      .replace("Trail Regular", "Trail regular")
      .replace("Premium currency", "Premium")
      .replace("Premium preview", "Preview");
  }

  private compactPreviewBody(body: string): string {
    return this.shortFeedLine(body.replace(/\s+/g, " ").trim(), 54);
  }

  private drawStatusChip(x: number, y: number, label: string, value: string, tone: MenuHubCard["tone"]): Phaser.GameObjects.GameObject[] {
    const accent = tone === "urgent" ? 0x65f2ff : tone === "npc" ? 0x8ff0d4 : Palette.gold;
    const color = this.feedToneColor(tone);
    const shell = this.add.rectangle(x, y, 102, 34, Palette.darkPanel, 0.92)
      .setStrokeStyle(1, accent, 0.5)
      .setDepth(5);
    const rail = this.add.rectangle(x - 40, y, 3, 22, accent, 0.56)
      .setDepth(6);
    const labelText = this.add.text(x - 32, y - 8, label.toUpperCase(), {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "9px",
      color
    }).setDepth(6);
    const valueText = this.add.text(x - 32, y + 4, value, {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "11px",
      color: "#f1e5bf",
      fixedWidth: 66
    }).setDepth(6);
    return [shell, rail, labelText, valueText];
  }

  private statsHorseTag(save: ReturnType<typeof SaveSystem.load>): string {
    if (save.stats.health < 70) return "Care first";
    if (save.stats.energy < 35) return "Rest low";
    return "Stable";
  }

  private feedToneColor(tone: MenuFeedItem["tone"]): string {
    if (tone === "urgent") return "#65f2ff";
    if (tone === "npc") return "#8ff0d4";
    return "#d9c795";
  }

  private shortFeedLine(text: string, maxLength: number): string {
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  private drawRosterPreview(save: ReturnType<typeof SaveSystem.load>): Phaser.GameObjects.GameObject[] {
    const character = characterById(save.selectedCharacterId);
    const accent = character?.accentColor ?? Palette.gold;
    const accentCss = character ? `#${character.accentColor.toString(16).padStart(6, "0")}` : "#65f2ff";
    const riderValue = character?.name ?? "Choose rider";
    const horseValue = this.statsHorseTag(save);
    const homeValue = save.stats.houseChoice ? "Home chosen" : "Pick a home";
    const statusValue = character ? "Ready to ride" : "Lead not locked";
    const objects: Phaser.GameObjects.GameObject[] = [];

    objects.push(...surfaceFrame(this, 868, 560, 560, 188, 4, "warm"));
    objects.push(this.add.text(614, 484, "CURRENT LOOP", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "11px",
      color: "#65f2ff"
    }).setDepth(6));
    objects.push(this.add.rectangle(868, 560, 516, 136, Palette.darkPanel, 0.9)
      .setStrokeStyle(1, accent, 0.36)
      .setDepth(5));
    objects.push(this.add.rectangle(868, 526, 516, 1, accent, 0.24).setDepth(6));
    objects.push(this.add.rectangle(780, 590, 1, 74, accent, 0.18).setDepth(6));
    objects.push(this.add.rectangle(952, 590, 1, 74, accent, 0.18).setDepth(6));

    const title = this.add.text(640, 502, character ? `${character.name} holds the trail lead.` : "Choose a rider to open the valley loop.", {
      fontFamily: DISPLAY_FONT_FAMILY,
      fontSize: "22px",
      color: PaletteCss.gold,
      wordWrap: { width: 430 }
    }).setDepth(6);
    title.setShadow(0, 2, "#000000", 6, true, true);
    objects.push(title);

    objects.push(this.add.text(640, 544, character
      ? "The menu stays cinematic while your rider, horse, and home state stay visible here."
      : "Use Rider first, then Continue Loop to jump straight into the ranch rhythm.", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "12px",
      color: PaletteCss.cream,
      lineSpacing: 2,
      wordWrap: { width: 454 }
    }).setDepth(6));

    const drawMetric = (x: number, label: string, value: string) => {
      objects.push(this.add.text(x, 586, label, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "10px",
        color: accentCss
      }).setDepth(6).setOrigin(0.5));
      objects.push(this.add.text(x, 610, value, {
        fontFamily: UI_FONT_FAMILY,
        fontSize: "15px",
        color: PaletteCss.cream,
        align: "center",
        wordWrap: { width: 130 }
      }).setDepth(6).setOrigin(0.5));
    };

    drawMetric(696, "RIDER", riderValue);
    drawMetric(868, "HORSE", horseValue);
    drawMetric(1040, "HOME", homeValue);

    objects.push(this.add.rectangle(1098, 500, 84, 24, Palette.panelBrown, 0.96)
      .setStrokeStyle(1, accent, 0.76)
      .setDepth(6));
    objects.push(this.add.text(1098, 500, statusValue.toUpperCase(), {
      fontFamily: UI_FONT_FAMILY,
      fontSize: "10px",
      color: character ? PaletteCss.gold : "#e9fcff"
    }).setOrigin(0.5).setDepth(7));

    if (!prefersReducedMotion()) {
      const pulse = this.add.rectangle(868, 626, 516, 2, accent, 0.3).setDepth(6);
      objects.push(pulse);
      this.tweens.add({
        targets: pulse,
        alpha: { from: 0.18, to: 0.52 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }

    return objects;
  }
}
