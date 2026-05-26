import Phaser from "phaser";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const SAVE_KEY = "goldspur_valley_save_v1";
export const ASSET_BASE_PATH = "/assets";

export function assetUrl(file: string): string {
  return `${ASSET_BASE_PATH}/${file.replace(/^\/+/, "")}`;
}

export const IMAGE_KEYS = {
  ranchClean: "ranch_clean_bg",
  trainingClean: "training_clean_bg",
  racingClean: "racing_clean_bg",
  healthClean: "health_clean_bg",
  relaxationClean: "relaxation_clean_bg",
  ranchReference: "reference_ranch_mockup",
  travelReference: "reference_travel_mockup",
  trainingReference: "reference_training_mockup",
  trainingResult: "training_result",
  raceStartReference: "reference_race_start_mockup",
  raceProgressReference: "reference_race_progress_mockup",
  raceResultsReference: "reference_race_results_mockup",
  healthReference: "reference_health_mockup",
  relaxationReference: "reference_relaxation_mockup",
  inventoryReference: "reference_inventory_mockup",
  titleBackground: "title_background",
  player: "rider_idle_down",
  horse: "horse_idle_down"
} as const;

export const IMAGE_FILES: Record<string, string> = {
  [IMAGE_KEYS.ranchReference]: "reference/ranch_hub.png",
  [IMAGE_KEYS.travelReference]: "reference/travel_hub.png",
  [IMAGE_KEYS.trainingReference]: "reference/training_area.png",
  [IMAGE_KEYS.raceStartReference]: "reference/race_start.png",
  [IMAGE_KEYS.raceProgressReference]: "reference/race_in_progress.png",
  [IMAGE_KEYS.raceResultsReference]: "reference/race_results.png",
  [IMAGE_KEYS.healthReference]: "reference/health_area.png",
  [IMAGE_KEYS.relaxationReference]: "reference/relaxation_area.png",
  [IMAGE_KEYS.inventoryReference]: "reference/inventory_screen.png",
  [IMAGE_KEYS.titleBackground]: "generated/title_background.png",
  [IMAGE_KEYS.player]: "sprites/rider_idle_down.png",
  [IMAGE_KEYS.horse]: "sprites/horse_idle_down.png"
};

export const BOOT_IMAGE_FILES: Record<string, string> = {
  [IMAGE_KEYS.player]: IMAGE_FILES[IMAGE_KEYS.player],
  [IMAGE_KEYS.horse]: IMAGE_FILES[IMAGE_KEYS.horse]
};

export const STREAMED_IMAGE_FILES: Record<string, string> = {
  [IMAGE_KEYS.titleBackground]: IMAGE_FILES[IMAGE_KEYS.titleBackground]
};

export const QUEST_ITEM_KEYS = {
  coinCache: "quest_coin_cache",
  messageBottle: "quest_message_bottle",
  trailPouch: "quest_trail_pouch",
  ackee: "quest_ackee",
  shell: "quest_shell"
} as const;

export const QUEST_ITEM_FILES: Record<string, string> = {
  [QUEST_ITEM_KEYS.coinCache]: "generated/quest_coin_cache.png",
  [QUEST_ITEM_KEYS.messageBottle]: "generated/quest_message_bottle.png",
  [QUEST_ITEM_KEYS.trailPouch]: "generated/quest_trail_pouch.png",
  [QUEST_ITEM_KEYS.ackee]: "generated/quest_ackee.png",
  [QUEST_ITEM_KEYS.shell]: "generated/quest_shell.png"
};

export const WORLD_BOUNDS = new Phaser.Geom.Rectangle(64, 76, 1152, 568);
