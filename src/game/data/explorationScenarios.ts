import type { InventoryItemId } from "./items";
import { ITEM_LABELS } from "./items";
import type { StatDelta } from "../systems/HorseStats";
import type { WorldObjectData } from "../world/ChunkTypes";

export type ExplorationScenarioDefinition = {
  id: string;
  objectTypes: readonly WorldObjectData["type"][];
  item: InventoryItemId;
  title: string;
  prompt: string;
  reward: StatDelta;
  journalLabel: string;
  hint: string;
  message: (locationName: string) => string;
};

export type ResolvedExplorationScenario = Omit<ExplorationScenarioDefinition, "message"> & {
  message: string;
};

export type ExplorationProgress = {
  uniqueScenarioCount: number;
  completedSites: number;
  totalScenarioTypes: number;
  completedLabels: string[];
  nextHint: string;
};

export type ExplorationMilestone = {
  id: string;
  count: number;
  title: string;
  reward: StatDelta;
  message: string;
};

export const EXPLORATION_SCENARIOS: ExplorationScenarioDefinition[] = [
  {
    id: "rope-log",
    objectTypes: ["fallen_log"],
    item: "rope",
    title: "Rope Line",
    prompt: "Use Rope",
    reward: { bond: 2, mood: 2, coins: 10 },
    journalLabel: "Rope lines",
    hint: "fallen logs",
    message: () => "You loop a rope around the fallen log and clear a safer trail line for the horse"
  },
  {
    id: "horseshoe-marker",
    objectTypes: ["rock_cluster", "limestone_outcrop"],
    item: "horseshoe",
    title: "Trail Marker Set",
    prompt: "Set Horseshoe Marker",
    reward: { stamina: 2, coins: 14 },
    journalLabel: "footing markers",
    hint: "rocks or limestone",
    message: (locationName) => `A spare horseshoe marks the footing near ${locationName}; future riders will spot the safe path sooner`
  },
  {
    id: "water-can-refill",
    objectTypes: ["pond", "pond_edge", "rain_puddle"],
    item: "watering_can",
    title: "Water Refill",
    prompt: "Use Watering Can",
    reward: { health: 3, energy: 3 },
    journalLabel: "water refills",
    hint: "ponds or rain puddles",
    message: () => "You refill the watering can and cool the horse down before the next stretch"
  },
  {
    id: "careful-harvest",
    objectTypes: ["herb_patch", "flower_patch", "hibiscus_bush"],
    item: "lantern",
    title: "Careful Search",
    prompt: "Use Lantern",
    reward: { mood: 2, coins: 8 },
    journalLabel: "lantern searches",
    hint: "flowers, herbs, or hibiscus",
    message: () => "The lantern catches a small glint under the leaves and turns a quick stop into a useful find"
  },
  {
    id: "boat-repair",
    objectTypes: ["fishing_boat"],
    item: "nail_kit",
    title: "Cove Repair",
    prompt: "Use Nail Kit",
    reward: { bond: 1, coins: 24 },
    journalLabel: "cove repairs",
    hint: "fishing boats",
    message: () => "You tighten a loose plank for the cove fishermen and they pay you for the careful repair"
  },
  {
    id: "gentle-brush",
    objectTypes: ["wild_horse"],
    item: "brush",
    title: "Gentle Approach",
    prompt: "Use Brush",
    reward: { bond: 3, mood: 2 },
    journalLabel: "wild horse approaches",
    hint: "wild horses",
    message: () => "You hold the brush low and let the wild horse settle nearby; your own horse mirrors the calm"
  },
  {
    id: "saddle-packs",
    objectTypes: ["market_stall", "fruit_stand", "banana_patch", "breadfruit_tree", "coconut_pile", "sugarcane_patch"],
    item: "saddle",
    title: "Packed For The Road",
    prompt: "Use Saddle Packs",
    reward: { stamina: 2, energy: 2, coins: 6 },
    journalLabel: "saddle-pack stops",
    hint: "markets or food patches",
    message: () => "You balance a few supplies in the saddle packs and make the next ride easier"
  },
  {
    id: "tracker-bearing",
    objectTypes: ["beach_palms", "palm_cluster"],
    item: "horse_tracker",
    title: "Tracker Bearing",
    prompt: "Use Horse Tracker",
    reward: { stamina: 1, bond: 1, coins: 12 },
    journalLabel: "tracker bearings",
    hint: "beach palms",
    message: (locationName) => `The horse tracker settles on a clean bearing along ${locationName}, adding a useful route note to the ride`
  }
];

export const EXPLORATION_MILESTONES: ExplorationMilestone[] = [
  {
    id: "trail-scout",
    count: 3,
    title: "Trail Scout Bonus",
    reward: { bond: 1, coins: 35 },
    message: "Three different tool routes are now logged in the trail journal"
  },
  {
    id: "parish-pathfinder",
    count: 6,
    title: "Parish Pathfinder Bonus",
    reward: { stamina: 2, coins: 60 },
    message: "Your route notes now cover most of the core exploration tools"
  },
  {
    id: "goldspur-wayfinder",
    count: 8,
    title: "Goldspur Wayfinder Bonus",
    reward: { bond: 2, mood: 2, coins: 100 },
    message: "Every known trail tool has at least one field note"
  }
];

const SCENARIO_BY_TYPE = new Map<WorldObjectData["type"], ExplorationScenarioDefinition>(
  EXPLORATION_SCENARIOS.flatMap((scenario) => scenario.objectTypes.map((type) => [type, scenario] as const))
);

const SCENARIO_BY_ID = new Map(EXPLORATION_SCENARIOS.map((scenario) => [scenario.id, scenario]));

export function explorationScenarioForObjectType(type: WorldObjectData["type"]): ExplorationScenarioDefinition | undefined {
  return SCENARIO_BY_TYPE.get(type);
}

export function explorationScenarioKey(objectId: string, scenarioId: string): string {
  return `explore:${scenarioId}:${objectId}`;
}

export function explorationMilestoneKey(milestoneId: string): string {
  return `explore_bonus:${milestoneId}`;
}

export function explorationProgress(interactedWorldObjects: readonly string[]): ExplorationProgress {
  const completedScenarioIds = interactedWorldObjects
    .map(scenarioIdFromInteractionKey)
    .filter((id): id is string => Boolean(id && SCENARIO_BY_ID.has(id)));
  const uniqueScenarioIds = Array.from(new Set(completedScenarioIds));
  const completedLabels = uniqueScenarioIds
    .map((id) => SCENARIO_BY_ID.get(id)?.journalLabel)
    .filter((label): label is string => Boolean(label));
  const next = EXPLORATION_SCENARIOS.find((scenario) => !uniqueScenarioIds.includes(scenario.id));
  return {
    uniqueScenarioCount: uniqueScenarioIds.length,
    completedSites: completedScenarioIds.length,
    totalScenarioTypes: EXPLORATION_SCENARIOS.length,
    completedLabels,
    nextHint: next ? `${next.title}: ${ITEM_LABELS[next.item]} near ${next.hint}.` : "All trail tool routes have field notes."
  };
}

function scenarioIdFromInteractionKey(key: string): string | undefined {
  if (!key.startsWith("explore:")) return undefined;
  const value = key.slice("explore:".length);
  const separator = value.indexOf(":");
  return separator > 0 ? value.slice(0, separator) : undefined;
}
