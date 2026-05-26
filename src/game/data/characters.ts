import { StatDelta } from "../systems/HorseStats";

export type CharacterId = "mara" | "eli" | "nia" | "sol";

export type CharacterDefinition = {
  id: CharacterId;
  name: string;
  title: string;
  hometown: string;
  horseName: string;
  color: number;
  accentColor: number;
  summary: string;
  starterBonus: StatDelta;
};

export const DEFAULT_CHARACTER_ID: CharacterId = "mara";

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: "mara",
    name: "Mara James",
    title: "Steady Trail Rider",
    hometown: "Steer Town",
    horseName: "Juniper",
    color: 0x3f6f35,
    accentColor: 0xd4af37,
    summary: "Balanced, patient, and trusted by nervous horses.",
    starterBonus: { bond: 6, mood: 4 }
  },
  {
    id: "eli",
    name: "Eli Morgan",
    title: "Track Prospect",
    hometown: "Ocho Rios",
    horseName: "Comet",
    color: 0x244d6f,
    accentColor: 0x79c5b7,
    summary: "Fast out of the gate and happiest near the racing rail.",
    starterBonus: { speed: 7, stamina: 3 }
  },
  {
    id: "nia",
    name: "Nia Clarke",
    title: "Ranch Caretaker",
    hometown: "Runaway Bay",
    horseName: "Honey",
    color: 0x7f2e20,
    accentColor: 0xf1c86d,
    summary: "Knows feed, grooming, and how to keep a horse healthy.",
    starterBonus: { health: 8, energy: 5 }
  },
  {
    id: "sol",
    name: "Sol Bennett",
    title: "Coast Scout",
    hometown: "Discovery Bay",
    horseName: "Drift",
    color: 0x7a4a24,
    accentColor: 0x8ee06d,
    summary: "A curious explorer who reads old roads and open country.",
    starterBonus: { stamina: 6, bond: 4 }
  }
];

export function characterById(id: string | null | undefined): CharacterDefinition | undefined {
  return CHARACTERS.find((character) => character.id === id);
}
