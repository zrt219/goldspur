export type RanchNpcId = "auntie_marva" | "coach_devon" | "nurse_lorna" | "boatwright_kofi";

export type RanchNpcDefinition = {
  id: RanchNpcId;
  label: string;
  role: string;
  x: number;
  y: number;
  color: number;
  accent: number;
  prompt: string;
};

export const RANCH_NPCS: RanchNpcDefinition[] = [
  {
    id: "auntie_marva",
    label: "Auntie Marva",
    role: "Ranch Guide",
    x: 675,
    y: 330,
    color: 0x8a4f2a,
    accent: 0xf8dd91,
    prompt: "E - Talk to Auntie Marva"
  },
  {
    id: "coach_devon",
    label: "Coach Devon",
    role: "Riding Coach",
    x: 740,
    y: 470,
    color: 0x244d6f,
    accent: 0xd4af37,
    prompt: "E - Talk Training"
  },
  {
    id: "nurse_lorna",
    label: "Nurse Lorna",
    role: "Horse Care",
    x: 510,
    y: 520,
    color: 0x2e6b55,
    accent: 0xf5e6b8,
    prompt: "E - Health Check"
  },
  {
    id: "boatwright_kofi",
    label: "Kofi",
    role: "Boatwright",
    x: 1008,
    y: 455,
    color: 0x6b4b2b,
    accent: 0x79c5b7,
    prompt: "E - Ask About Boats"
  }
];

export function ranchNpcById(id: RanchNpcId): RanchNpcDefinition {
  return RANCH_NPCS.find((npc) => npc.id === id) ?? RANCH_NPCS[0];
}
