import { InventoryItemId } from "../data/items";
import { HorseStats, StatDelta } from "./HorseStats";

export type HealthStatus = {
  label: string;
  advice: string;
  color: string;
};

export function healthStatus(stats: HorseStats): HealthStatus {
  if (stats.health <= 25) {
    return {
      label: "Rest now",
      advice: "Your horse is sore. Use water, feed, or visit Health & Care before racing.",
      color: "#ff8a65"
    };
  }
  if (stats.health <= 50) {
    return {
      label: "Needs care",
      advice: "Your horse can still travel, but slower. Recovery will make riding easier.",
      color: "#ffcf8a"
    };
  }
  if (stats.energy <= 25) {
    return {
      label: "Low energy",
      advice: "Give feed or let your horse rest before a long ride.",
      color: "#f8dd91"
    };
  }
  return {
    label: "Ready",
    advice: "Your horse is fit for everyday riding.",
    color: "#9be07d"
  };
}

export function travelSpeedFactor(stats: HorseStats): number {
  const healthFactor = stats.health <= 20 ? 0.62 : stats.health <= 40 ? 0.78 : stats.health <= 60 ? 0.9 : 1;
  const energyFactor = stats.energy <= 15 ? 0.72 : stats.energy <= 30 ? 0.86 : 1;
  return Math.min(healthFactor, energyFactor);
}

export function careDeltaForItem(item: InventoryItemId): StatDelta | undefined {
  if (item === "carrots") return { energy: 5, health: 1 };
  if (item === "apple") return { mood: 5, energy: 1 };
  if (item === "hay") return { stamina: 5, health: 2 };
  if (item === "oats") return { energy: 10, stamina: 5 };
  if (item === "bucket") return { health: 5, energy: 3 };
  if (item === "brush") return { mood: 4, bond: 2 };
  return undefined;
}

export function careItemActionLabel(item: InventoryItemId): string {
  if (item === "bucket") return "Watered horse";
  if (item === "brush") return "Brushed coat";
  return "Fed horse";
}

export function isCareItem(item: InventoryItemId): boolean {
  return careDeltaForItem(item) !== undefined;
}

export function isConsumableCareItem(item: InventoryItemId): boolean {
  return item === "carrots" || item === "apple" || item === "hay" || item === "oats" || item === "bucket";
}
