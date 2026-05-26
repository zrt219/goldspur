export type RaceDefinition = {
  id: "beginner_sprint";
  label: string;
  staminaRequired: number;
  healthRequired: number;
  energyRequired: number;
  x: number;
  y: number;
};

export type RaceOutcome = {
  place: "1st Place" | "2nd Place" | "3rd Place" | "Finished";
  coins: number;
  mood: number;
  won: boolean;
};

export const BEGINNER_SPRINT: RaceDefinition = {
  id: "beginner_sprint",
  label: "Beginner Sprint Race",
  staminaRequired: 15,
  healthRequired: 20,
  energyRequired: 20,
  x: 638,
  y: 515
};

export function getRaceOutcome(score: number): RaceOutcome {
  if (score >= 65) return { place: "1st Place", coins: 100, mood: 3, won: true };
  if (score >= 45) return { place: "2nd Place", coins: 60, mood: 1, won: false };
  if (score >= 30) return { place: "3rd Place", coins: 30, mood: 1, won: false };
  return { place: "Finished", coins: 10, mood: -5, won: false };
}
