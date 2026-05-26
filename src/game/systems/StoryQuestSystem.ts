import { STORY_QUESTS, storyQuestById, StoryQuest, StoryQuestId } from "../data/storyQuests";
import { applyStatDelta, StatDelta } from "./HorseStats";
import { SaveData } from "./SaveSystem";

export type StoryQuestCompletion = {
  completed: boolean;
  quest?: StoryQuest;
  save: SaveData;
};

export function completeQuestInSave(save: SaveData, questId: StoryQuestId): StoryQuestCompletion {
  const quest = storyQuestById(questId);
  if (!quest || !canCompleteQuest(save, quest)) {
    return { completed: false, quest, save };
  }

  const completedQuestIds = [...save.story.completedQuestIds, quest.id];
  const unlockedQuestIds = Array.from(new Set([...save.story.unlockedQuestIds, ...quest.unlocks]));
  const story = {
    activeQuestId: nextAvailableQuestId(completedQuestIds, unlockedQuestIds, quest.id),
    completedQuestIds,
    unlockedQuestIds
  };
  return {
    completed: true,
    quest,
    save: {
      ...save,
      stats: applyStatDelta(save.stats, quest.reward),
      story
    }
  };
}

export function rewardSummary(reward: StatDelta): string {
  const parts = Object.entries(reward)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .map(([key, value]) => `${value > 0 ? "+" : ""}${value} ${key}`);
  return parts.length > 0 ? parts.join(", ") : "story progress";
}

function canCompleteQuest(save: SaveData, quest: StoryQuest): boolean {
  if (save.story.completedQuestIds.includes(quest.id)) return false;
  if (!save.story.unlockedQuestIds.includes(quest.id)) return false;
  return quest.requiredQuestIds.every((requiredId) => save.story.completedQuestIds.includes(requiredId));
}

function nextAvailableQuestId(completedQuestIds: StoryQuestId[], unlockedQuestIds: StoryQuestId[], fallback: StoryQuestId): StoryQuestId {
  const completed = new Set(completedQuestIds);
  const unlocked = new Set(unlockedQuestIds);
  return STORY_QUESTS.find((quest) => {
    if (completed.has(quest.id) || !unlocked.has(quest.id)) return false;
    return quest.requiredQuestIds.every((requiredId) => completed.has(requiredId));
  })?.id ?? STORY_QUESTS.find((quest) => !completed.has(quest.id))?.id ?? fallback;
}
