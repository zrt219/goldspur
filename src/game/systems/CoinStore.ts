import {
  horseCustomizationItem,
  normalizeHorseCustomization
} from "../data/horseCustomization";
import { SaveData } from "./SaveSystem";
import { normalizeStats } from "./HorseStats";

export type PurchaseResult =
  | { ok: true; status: "equipped" | "purchased"; save: SaveData; message: string }
  | { ok: false; status: "missing" | "insufficient"; save: SaveData; message: string };

export function buyOrEquipHorseCustomization(save: SaveData, itemId: string): PurchaseResult {
  const item = horseCustomizationItem(itemId);
  const customization = normalizeHorseCustomization(save.horseCustomization);
  if (!item) {
    return { ok: false, status: "missing", save, message: "That tack item is no longer available." };
  }

  const alreadyOwned = customization.owned.includes(item.id);
  if (!alreadyOwned && save.stats.coins < item.price) {
    return {
      ok: false,
      status: "insufficient",
      save,
      message: `${item.label} costs ${item.price} coins. You need ${item.price - save.stats.coins} more.`
    };
  }

  const owned = alreadyOwned ? customization.owned : Array.from(new Set([...customization.owned, item.id]));
  const nextSave: SaveData = {
    ...save,
    stats: normalizeStats({
      ...save.stats,
      coins: alreadyOwned ? save.stats.coins : save.stats.coins - item.price
    }),
    horseCustomization: {
      owned,
      equipped: {
        ...customization.equipped,
        [item.category]: item.id
      }
    }
  };

  return {
    ok: true,
    status: alreadyOwned ? "equipped" : "purchased",
    save: nextSave,
    message: alreadyOwned ? `${item.label} equipped.` : `${item.label} purchased and equipped. -${item.price} coins.`
  };
}
