import { StatDelta } from "../systems/HorseStats";

export type TrainingDrill = {
  id: "sprint" | "endurance" | "bond";
  label: string;
  prompt: string;
  requirement: number;
  energyCost: number;
  delta: StatDelta;
  x: number;
  y: number;
};

export const TRAINING_DRILLS: TrainingDrill[] = [
  {
    id: "sprint",
    label: "Sprint Drill",
    prompt: "E - Start Sprint Drill",
    requirement: 10,
    energyCost: 10,
    delta: { speed: 3, energy: -10 },
    x: 360,
    y: 440
  },
  {
    id: "endurance",
    label: "Endurance Drill",
    prompt: "E - Start Endurance Drill",
    requirement: 10,
    energyCost: 10,
    delta: { stamina: 3, energy: -10 },
    x: 640,
    y: 370
  },
  {
    id: "bond",
    label: "Bond Drill",
    prompt: "E - Start Bond Drill",
    requirement: 8,
    energyCost: 8,
    delta: { bond: 2, mood: 3, energy: -8 },
    x: 930,
    y: 445
  }
];
