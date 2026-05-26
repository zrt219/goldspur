import { HouseChoice, StatDelta } from "../systems/HorseStats";

export type HouseDefinition = {
  id: Exclude<HouseChoice, null>;
  label: string;
  prompt: string;
  message: string;
  bonus: StatDelta;
  x: number;
  y: number;
};

export const HOUSES: HouseDefinition[] = [
  {
    id: "cozy_stable",
    label: "Cozy Stable",
    prompt: "E - Choose Cozy Stable",
    message: "Cozy Stable selected. Mood +10.",
    bonus: { mood: 10 },
    x: 280,
    y: 560
  },
  {
    id: "speed_barn",
    label: "Speed Barn",
    prompt: "E - Choose Speed Barn",
    message: "Speed Barn selected. Speed +5.",
    bonus: { speed: 5 },
    x: 640,
    y: 560
  },
  {
    id: "nature_cabin",
    label: "Nature Cabin",
    prompt: "E - Choose Nature Cabin",
    message: "Nature Cabin selected. Bond +5.",
    bonus: { bond: 5 },
    x: 1000,
    y: 560
  }
];
