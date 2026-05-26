import { SAVE_KEY } from "../data/constants";
import { DEFAULT_INVENTORY, InventoryState, normalizeInventory } from "../data/items";
import { characterById, CharacterId } from "../data/characters";
import { FIRST_STORY_QUEST_ID, nextIncompleteQuest, STORY_QUESTS, StoryQuestId } from "../data/storyQuests";
import { DEFAULT_STATS, HorseStats, normalizeStats } from "./HorseStats";
import { normalizeWorldSave, WorldSaveData } from "../world/WorldSeed";
import { DEFAULT_HORSE_CUSTOMIZATION, HorseCustomizationSave, normalizeHorseCustomization } from "../data/horseCustomization";

export type StoryProgress = {
  activeQuestId: StoryQuestId;
  completedQuestIds: StoryQuestId[];
  unlockedQuestIds: StoryQuestId[];
};

export type SaveData = {
  stats: HorseStats;
  inventory: InventoryState;
  world: WorldSaveData;
  horseCustomization: HorseCustomizationSave;
  story: StoryProgress;
  selectedCharacterId: CharacterId | null;
};

export type SaveInput = {
  stats: HorseStats;
  inventory: InventoryState;
  world?: WorldSaveData;
  horseCustomization?: HorseCustomizationSave;
  story?: StoryProgress;
  selectedCharacterId?: CharacterId | null;
};

export class SaveSystem {
  static load(): SaveData {
    if (typeof localStorage === "undefined") {
      return defaultSave();
    }

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return defaultSave();
      const parsed = JSON.parse(raw) as Partial<SaveData> | Partial<HorseStats>;
      const statsSource = "stats" in parsed ? parsed.stats : parsed;
      const inventorySource = "inventory" in parsed ? parsed.inventory : undefined;
      const worldSource = "world" in parsed ? parsed.world : undefined;
      const horseCustomizationSource = "horseCustomization" in parsed ? parsed.horseCustomization : undefined;
      const storySource = "story" in parsed ? parsed.story : undefined;
      const characterSource = "selectedCharacterId" in parsed ? parsed.selectedCharacterId : undefined;
      return {
        stats: normalizeStats(statsSource),
        inventory: normalizeInventory(inventorySource),
        world: normalizeWorldSave(worldSource),
        horseCustomization: normalizeHorseCustomization(horseCustomizationSource),
        story: normalizeStoryProgress(storySource),
        selectedCharacterId: normalizeCharacterId(characterSource)
      };
    } catch {
      return defaultSave();
    }
  }

  static save(data: SaveInput): void {
    if (typeof localStorage === "undefined") return;
    try {
      const current = SaveSystem.load();
      const currentWorld = data.world ?? current.world;
      const currentHorseCustomization = data.horseCustomization ?? current.horseCustomization;
      const currentStory = data.story ?? current.story;
      const selectedCharacterId = data.selectedCharacterId === undefined ? current.selectedCharacterId : data.selectedCharacterId;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        stats: normalizeStats(data.stats),
        inventory: normalizeInventory(data.inventory),
        world: normalizeWorldSave(currentWorld),
        horseCustomization: normalizeHorseCustomization(currentHorseCustomization),
        story: normalizeStoryProgress(currentStory),
        selectedCharacterId: normalizeCharacterId(selectedCharacterId)
      }));
    } catch {
      // Private browsing or quota failures should not stop play.
    }
  }

  static reset(): SaveData {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        // Ignore storage failures.
      }
    }
    return defaultSave();
  }
}

function defaultSave(): SaveData {
  return {
    stats: { ...DEFAULT_STATS },
    inventory: { ...DEFAULT_INVENTORY },
    world: normalizeWorldSave(undefined),
    horseCustomization: normalizeHorseCustomization(DEFAULT_HORSE_CUSTOMIZATION),
    story: normalizeStoryProgress(undefined),
    selectedCharacterId: null
  };
}

function normalizeStoryProgress(input: unknown): StoryProgress {
  const raw = typeof input === "object" && input !== null ? (input as Partial<StoryProgress>) : {};
  const validQuestIds = new Set(STORY_QUESTS.map((quest) => quest.id));
  const completedQuestIds = normalizeQuestList(raw.completedQuestIds, validQuestIds);
  const unlockedQuestIds = normalizeQuestList(raw.unlockedQuestIds, validQuestIds);
  if (!unlockedQuestIds.includes(FIRST_STORY_QUEST_ID)) unlockedQuestIds.unshift(FIRST_STORY_QUEST_ID);
  completedQuestIds.forEach((questId) => {
    const quest = STORY_QUESTS.find((entry) => entry.id === questId);
    quest?.unlocks.forEach((unlocked) => {
      if (!unlockedQuestIds.includes(unlocked)) unlockedQuestIds.push(unlocked);
    });
  });

  const activeQuestId = typeof raw.activeQuestId === "string" && validQuestIds.has(raw.activeQuestId)
    ? raw.activeQuestId
    : nextIncompleteQuest(completedQuestIds).id;
  const activeIsAvailable = unlockedQuestIds.includes(activeQuestId) && !completedQuestIds.includes(activeQuestId);

  return {
    activeQuestId: activeIsAvailable ? activeQuestId : nextIncompleteQuest(completedQuestIds).id,
    completedQuestIds,
    unlockedQuestIds
  };
}

function normalizeQuestList(input: unknown, validQuestIds: Set<string>): StoryQuestId[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input.filter((item): item is string => typeof item === "string" && validQuestIds.has(item))));
}

function normalizeCharacterId(input: unknown): CharacterId | null {
  return typeof input === "string" && characterById(input) ? input as CharacterId : null;
}
