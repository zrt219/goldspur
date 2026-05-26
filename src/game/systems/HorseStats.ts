export type HouseChoice = "cozy_stable" | "speed_barn" | "nature_cabin" | null;

export type HorseStats = {
  horseName: string;
  speed: number;
  stamina: number;
  health: number;
  mood: number;
  bond: number;
  energy: number;
  coins: number;
  houseChoice: HouseChoice;
  racesWon: number;
  racesEntered: number;
  day: number;
  relaxUsesToday: number;
};

export type StatDelta = Partial<Record<keyof HorseStats, number>>;

export const DEFAULT_STATS: HorseStats = {
  horseName: "Starter",
  speed: 10,
  stamina: 10,
  health: 100,
  mood: 75,
  bond: 0,
  energy: 100,
  coins: 250,
  houseChoice: null,
  racesWon: 0,
  racesEntered: 0,
  day: 1,
  relaxUsesToday: 3
};

const RANGES: Partial<Record<keyof HorseStats, [number, number]>> = {
  speed: [0, 100],
  stamina: [0, 100],
  health: [0, 100],
  mood: [0, 100],
  bond: [0, 100],
  energy: [0, 100],
  coins: [0, Number.MAX_SAFE_INTEGER],
  racesWon: [0, Number.MAX_SAFE_INTEGER],
  racesEntered: [0, Number.MAX_SAFE_INTEGER],
  day: [1, Number.MAX_SAFE_INTEGER],
  relaxUsesToday: [0, 3]
};

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function normalizeStats(input: unknown): HorseStats {
  const raw = typeof input === "object" && input !== null ? (input as Partial<HorseStats>) : {};
  const stats: HorseStats = { ...DEFAULT_STATS, ...raw };
  stats.horseName = typeof raw.horseName === "string" && raw.horseName.trim() ? raw.horseName : DEFAULT_STATS.horseName;
  stats.houseChoice =
    raw.houseChoice === "cozy_stable" || raw.houseChoice === "speed_barn" || raw.houseChoice === "nature_cabin"
      ? raw.houseChoice
      : null;

  for (const [key, range] of Object.entries(RANGES) as Array<[keyof HorseStats, [number, number]]>) {
    stats[key] = clampNumber(Number(stats[key]), range[0], range[1]) as never;
  }

  return stats;
}

export function applyStatDelta(stats: HorseStats, delta: StatDelta): HorseStats {
  const next = { ...stats };
  for (const [key, value] of Object.entries(delta) as Array<[keyof HorseStats, number]>) {
    const current = Number(next[key]);
    if (Number.isFinite(current)) {
      next[key] = (current + value) as never;
    }
  }
  return normalizeStats(next);
}
