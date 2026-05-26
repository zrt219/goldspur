import { QUEST_ITEM_KEYS } from "./constants";
import { parishRouteY } from "../world/Biomes";
import { CHUNK_SIZE } from "../world/ChunkTypes";

export type HiddenQuestItem = {
  id: string;
  title: string;
  texture: string;
  x: number;
  y: number;
  prompt: string;
  foundMessage: string;
  repeatMessage: string;
  rewardCoins: number;
  requires?: string;
};

function routePoint(chunkX: number, localX: number, localY: number): { x: number; y: number } {
  return {
    x: chunkX * CHUNK_SIZE + localX,
    y: parishRouteY(chunkX) * CHUNK_SIZE + localY
  };
}

const steerTownPouch = routePoint(2, 330, 315);
const stAnnsBayBottle = routePoint(5, 285, 235);
const ochoShell = routePoint(11, 360, 210);
const runawayAckee = routePoint(16, 210, 320);
const puertoSecoCache = routePoint(21, 300, 185);

export const HIDDEN_QUEST_NAME = "St Ann Coin Trail";

export const HIDDEN_QUEST_ITEMS: HiddenQuestItem[] = [
  {
    id: "hidden-quest:north-coast:pouch",
    title: "Trail Pouch",
    texture: QUEST_ITEM_KEYS.trailPouch,
    x: steerTownPouch.x,
    y: steerTownPouch.y,
    prompt: "E - Inspect Trail Pouch",
    foundMessage: "A woven pouch is tucked beside the Steer Town road. Inside: 20 coins and a note pointing toward Mammee Bay and St Ann's Bay.",
    repeatMessage: "The trail pouch is empty now. Its note points east along the St Ann road.",
    rewardCoins: 20
  },
  {
    id: "hidden-quest:north-coast:bottle",
    title: "Message Bottle",
    texture: QUEST_ITEM_KEYS.messageBottle,
    x: stAnnsBayBottle.x,
    y: stAnnsBayBottle.y,
    prompt: "E - Open Message Bottle",
    foundMessage: "The bottle rests near St Ann's Bay. The message hides 25 coins and names a shell near Ocho Rios.",
    repeatMessage: "The opened bottle still points toward Ocho Rios.",
    rewardCoins: 25,
    requires: "hidden-quest:north-coast:pouch"
  },
  {
    id: "hidden-quest:north-coast:shell",
    title: "Beach Shell",
    texture: QUEST_ITEM_KEYS.shell,
    x: ochoShell.x,
    y: ochoShell.y,
    prompt: "E - Lift Beach Shell",
    foundMessage: "A shell near Ocho Rios hides 30 coins and a scratch mark shaped like Runaway Bay limestone.",
    repeatMessage: "The shell is only a keepsake now. The mark points toward Runaway Bay.",
    rewardCoins: 30,
    requires: "hidden-quest:north-coast:bottle"
  },
  {
    id: "hidden-quest:north-coast:ackee",
    title: "Ackee Marker",
    texture: QUEST_ITEM_KEYS.ackee,
    x: runawayAckee.x,
    y: runawayAckee.y,
    prompt: "E - Check Ackee Marker",
    foundMessage: "The ackee cluster marks a limestone hiding place. You find 35 coins and one final clue: Puerto Seco in Discovery Bay.",
    repeatMessage: "The ackee marker points west, toward Puerto Seco in Discovery Bay.",
    rewardCoins: 35,
    requires: "hidden-quest:north-coast:shell"
  },
  {
    id: "hidden-quest:north-coast:coin-cache",
    title: "Buried Coin Cache",
    texture: QUEST_ITEM_KEYS.coinCache,
    x: puertoSecoCache.x,
    y: puertoSecoCache.y,
    prompt: "E - Dig Up Coin Cache",
    foundMessage: "Under the Puerto Seco beach grass is the hidden cache: 150 coins wrapped for the rider who followed St Ann.",
    repeatMessage: "The Puerto Seco cache has already been claimed.",
    rewardCoins: 150,
    requires: "hidden-quest:north-coast:ackee"
  }
];

export function hiddenQuestProgress(completedIds: string[]): { complete: boolean; current?: HiddenQuestItem; found: number; total: number } {
  const completed = new Set(completedIds);
  return {
    complete: HIDDEN_QUEST_ITEMS.every((item) => completed.has(item.id)),
    current: HIDDEN_QUEST_ITEMS.find((item) => !completed.has(item.id)),
    found: HIDDEN_QUEST_ITEMS.filter((item) => completed.has(item.id)).length,
    total: HIDDEN_QUEST_ITEMS.length
  };
}
