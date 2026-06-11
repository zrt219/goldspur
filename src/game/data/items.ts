export type InventoryItemId =
  | "carrots"
  | "hay"
  | "bucket"
  | "horseshoe"
  | "brush"
  | "saddle"
  | "oats"
  | "apple"
  | "rope"
  | "lantern"
  | "nail_kit"
  | "watering_can"
  | "horse_tracker";

export type InventoryState = Record<InventoryItemId, number>;

export const DEFAULT_INVENTORY: InventoryState = {
  carrots: 12,
  hay: 8,
  bucket: 2,
  horseshoe: 4,
  brush: 1,
  saddle: 1,
  oats: 5,
  apple: 3,
  rope: 2,
  lantern: 1,
  nail_kit: 1,
  watering_can: 1,
  horse_tracker: 1
};

export const ITEM_LABELS: Record<InventoryItemId, string> = {
  carrots: "Carrots",
  hay: "Hay",
  bucket: "Bucket",
  horseshoe: "Horseshoe",
  brush: "Brush",
  saddle: "Saddle",
  oats: "Oats",
  apple: "Apple",
  rope: "Rope",
  lantern: "Lantern",
  nail_kit: "Nail Kit",
  watering_can: "Watering Can",
  horse_tracker: "Horse Tracker"
};

export const ITEM_DESCRIPTIONS: Record<InventoryItemId, string> = {
  carrots: "A crisp snack. Use to restore +5 energy and +1 health.",
  hay: "Clean feed. Use to restore +5 stamina and +2 health.",
  bucket: "Fresh water for cooling down. Use to restore +5 health and +3 energy.",
  horseshoe: "A spare shoe. Carry it near rocks or limestone to mark safer footing and earn trail rewards.",
  brush: "Keeps the coat tidy. Use to restore +4 mood and +2 bond.",
  saddle: "Your reliable starter saddle. Saddle packs help carry supplies from markets, fruit stands, and food patches.",
  oats: "A hearty feed for a long ride. Use to restore +10 energy and +5 stamina.",
  apple: "A sweet treat. Use to restore +5 mood and +1 energy.",
  rope: "Useful for ranch chores. Carry it near fallen logs to clear safer trail lines.",
  lantern: "Warm light for late barn checks. Carry it near flowers, herbs, or hibiscus to spot hidden finds.",
  nail_kit: "Repair kit for stable work. Carry it near cove boats to help with small repairs.",
  watering_can: "For garden beds and troughs. Carry it near ponds or rain puddles to refill and cool down.",
  horse_tracker: "A brass compass tag tuned to your horse. Opens a tracker panel and marks your horse on the mini map."
};

export function normalizeInventory(input: unknown): InventoryState {
  const raw = typeof input === "object" && input !== null ? input as Partial<Record<InventoryItemId, unknown>> : {};
  const next = { ...DEFAULT_INVENTORY };
  for (const key of Object.keys(next) as InventoryItemId[]) {
    const value = Number(raw[key]);
    next[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : next[key];
  }
  return next;
}
