export type HorseCustomizationCategory =
  | "coat"
  | "mane"
  | "marking"
  | "saddle"
  | "blanket"
  | "bridle"
  | "wraps"
  | "charm";

export type HorseCustomizationItem = {
  id: string;
  category: HorseCustomizationCategory;
  label: string;
  price: number;
  tint: number;
  accent?: number;
  description: string;
};

export type HorseCustomizationSave = {
  owned: string[];
  equipped: Record<HorseCustomizationCategory, string>;
};

export const HORSE_CUSTOMIZATION_CATEGORIES: Array<{ id: HorseCustomizationCategory; label: string }> = [
  { id: "coat", label: "Coat" },
  { id: "mane", label: "Mane" },
  { id: "marking", label: "Markings" },
  { id: "saddle", label: "Saddle" },
  { id: "blanket", label: "Blanket" },
  { id: "bridle", label: "Bridle" },
  { id: "wraps", label: "Wraps" },
  { id: "charm", label: "Charm" }
];

export const HORSE_CUSTOMIZATION_ITEMS: HorseCustomizationItem[] = [
  { id: "coat_bay", category: "coat", label: "Bay Coat", price: 0, tint: 0x8a4f2c, accent: 0x3b2114, description: "A warm bay coat with dark points." },
  { id: "coat_chestnut", category: "coat", label: "Chestnut Coat", price: 65, tint: 0xb46533, accent: 0x6a331d, description: "A copper chestnut coat with bright shine." },
  { id: "coat_black", category: "coat", label: "Black Coat", price: 90, tint: 0x27211d, accent: 0x15110f, description: "A polished black coat for moonlit rides." },
  { id: "coat_palomino", category: "coat", label: "Palomino Coat", price: 120, tint: 0xd6b15f, accent: 0xf2df9b, description: "Golden palomino color with a light mane." },
  { id: "coat_dapple_gray", category: "coat", label: "Dapple Gray Coat", price: 140, tint: 0xb8b3a8, accent: 0x6f6a62, description: "A dapple gray coat with show-ring presence." },
  { id: "coat_pinto", category: "coat", label: "Pinto Coat", price: 180, tint: 0x7f4b2d, accent: 0xf3ead4, description: "Bold pinto splashes across the body." },
  { id: "coat_blue_roan", category: "coat", label: "Blue Roan Coat", price: 220, tint: 0x586b72, accent: 0x22282c, description: "A rare blue roan look with cool depth." },
  { id: "coat_cremello", category: "coat", label: "Cremello Coat", price: 260, tint: 0xf0ddad, accent: 0xfff4d2, description: "A pale cream coat that reads bright on sunrise trails." },
  { id: "coat_red_roan", category: "coat", label: "Red Roan Coat", price: 285, tint: 0x9d614c, accent: 0xd7c1a2, description: "A red roan coat with dusty trail texture." },

  { id: "mane_black", category: "mane", label: "Black Mane", price: 0, tint: 0x211610, description: "Classic dark mane and tail." },
  { id: "mane_flaxen", category: "mane", label: "Flaxen Mane", price: 45, tint: 0xe8d68c, description: "Soft flaxen mane for lighter coats." },
  { id: "mane_white", category: "mane", label: "White Mane", price: 85, tint: 0xf7f0d0, description: "Bright white mane and tail." },
  { id: "mane_braided", category: "mane", label: "Braided Mane", price: 95, tint: 0x3b2114, accent: 0xd4af37, description: "Braided mane with gold ties." },
  { id: "mane_festival_beads", category: "mane", label: "Festival Beads", price: 130, tint: 0x22160d, accent: 0x2f9f5f, description: "Festival beads woven into the mane." },
  { id: "mane_two_tone", category: "mane", label: "Two-Tone Mane", price: 165, tint: 0xd8c08a, accent: 0x2a1a0e, description: "Two-tone mane bands that stand out on darker coats." },

  { id: "marking_none", category: "marking", label: "No Marking", price: 0, tint: 0x000000, description: "No additional coat markings." },
  { id: "marking_star", category: "marking", label: "Forehead Star", price: 35, tint: 0xf6ecd0, description: "A clean star marking on the forehead." },
  { id: "marking_blaze", category: "marking", label: "White Blaze", price: 60, tint: 0xf6ecd0, description: "A white blaze down the face." },
  { id: "marking_socks", category: "marking", label: "White Socks", price: 80, tint: 0xf6ecd0, description: "White socks on the lower legs." },
  { id: "marking_dapples", category: "marking", label: "Soft Dapples", price: 130, tint: 0xe3ded0, description: "Subtle dapple spots across the body." },
  { id: "marking_pinto_splash", category: "marking", label: "Pinto Splash", price: 150, tint: 0xf3ead4, description: "Large showy white splashes." },

  { id: "saddle_ranch", category: "saddle", label: "Ranch Saddle", price: 0, tint: 0x5b321c, accent: 0x9c6537, description: "Reliable starter saddle." },
  { id: "saddle_racing", category: "saddle", label: "Racing Saddle", price: 140, tint: 0x2f2a22, accent: 0xd4af37, description: "Lightweight racing saddle with gold trim." },
  { id: "saddle_endurance", category: "saddle", label: "Endurance Saddle", price: 180, tint: 0x33483d, accent: 0x87a96b, description: "Trail-ready saddle for long parish rides." },
  { id: "saddle_parade", category: "saddle", label: "Parade Saddle", price: 220, tint: 0x7a1f25, accent: 0xf0c66a, description: "A proud parade saddle with brass detail." },
  { id: "saddle_carved", category: "saddle", label: "Carved Leather Saddle", price: 260, tint: 0x6b3c1f, accent: 0xf5e6b8, description: "Carved leather tack with premium stitching." },
  { id: "saddle_jamaica_trail", category: "saddle", label: "Jamaica Trail Saddle", price: 310, tint: 0x214f38, accent: 0xd4af37, description: "A reinforced trail saddle for parish exploration." },

  { id: "blanket_plain", category: "blanket", label: "Plain Blanket", price: 0, tint: 0x3f5d7d, description: "A practical blue saddle blanket." },
  { id: "blanket_maroon", category: "blanket", label: "Maroon Blanket", price: 70, tint: 0x7c2430, accent: 0xf5e6b8, description: "Deep maroon wool with light trim." },
  { id: "blanket_goldspur", category: "blanket", label: "Goldspur Blanket", price: 110, tint: 0xd4af37, accent: 0x2a1a0e, description: "Goldspur colors for home pride." },
  { id: "blanket_reggae", category: "blanket", label: "Reggae Stripe Blanket", price: 160, tint: 0x1f8f4d, accent: 0xd4af37, description: "Green, gold, and black striping." },
  { id: "blanket_blue_mountain", category: "blanket", label: "Blue Mountain Blanket", price: 190, tint: 0x315b72, accent: 0x9ec7c2, description: "Cool mountain blues with pale trim." },
  { id: "blanket_festival_night", category: "blanket", label: "Festival Night Blanket", price: 230, tint: 0x2a244f, accent: 0xf0c66a, description: "Dark festival cloth with gold edge stitching." },

  { id: "bridle_plain", category: "bridle", label: "Plain Bridle", price: 0, tint: 0x2f1b11, description: "Simple dark leather bridle." },
  { id: "bridle_braided", category: "bridle", label: "Braided Bridle", price: 80, tint: 0x71421f, accent: 0xd4af37, description: "Braided leather with small gold knots." },
  { id: "bridle_brass", category: "bridle", label: "Brass Bridle", price: 130, tint: 0x3a2416, accent: 0xc9a03b, description: "Dark leather with brass fittings." },
  { id: "bridle_silver", category: "bridle", label: "Silver Bridle", price: 190, tint: 0x292929, accent: 0xd6d6d6, description: "Black leather with silver fittings." },
  { id: "bridle_festival", category: "bridle", label: "Festival Bridle", price: 240, tint: 0x3a2416, accent: 0x2f9f5f, description: "Festival colored bands on the cheek pieces." },
  { id: "bridle_pearl", category: "bridle", label: "Pearl Bridle", price: 280, tint: 0xefe4c9, accent: 0x3d3428, description: "Light pearl leather for a clean show finish." },

  { id: "wraps_none", category: "wraps", label: "No Wraps", price: 0, tint: 0x000000, description: "No leg wraps." },
  { id: "wraps_white", category: "wraps", label: "White Wraps", price: 45, tint: 0xf5e6d0, description: "Clean white leg wraps." },
  { id: "wraps_crimson", category: "wraps", label: "Crimson Wraps", price: 85, tint: 0xa83a34, description: "Crimson wraps for race day." },
  { id: "wraps_gold", category: "wraps", label: "Gold Wraps", price: 110, tint: 0xd4af37, description: "Gold wraps with show-ring flash." },
  { id: "wraps_turquoise", category: "wraps", label: "Turquoise Wraps", price: 120, tint: 0x3bb3a6, description: "Turquoise wraps that pop against the coat." },
  { id: "wraps_midnight", category: "wraps", label: "Midnight Wraps", price: 150, tint: 0x1b2633, accent: 0xa7c7d9, description: "Dark wraps with pale stitching for night rides." },

  { id: "charm_none", category: "charm", label: "No Charm", price: 0, tint: 0x000000, description: "No bridle charm." },
  { id: "charm_shell", category: "charm", label: "Shell Charm", price: 55, tint: 0xf5e6d0, description: "A small shell charm from the coast." },
  { id: "charm_feather", category: "charm", label: "Feather Charm", price: 80, tint: 0x4d2e1a, accent: 0xf5e6d0, description: "A feather charm tied into the bridle." },
  { id: "charm_lucky_coin", category: "charm", label: "Lucky Coin Charm", price: 125, tint: 0xd4af37, description: "A coin charm that catches the sun." },
  { id: "charm_goldspur", category: "charm", label: "Goldspur Medallion", price: 210, tint: 0xd4af37, accent: 0x7a1f25, description: "A Goldspur medallion for the stable's champion." },
  { id: "charm_blue_mountain", category: "charm", label: "Blue Mountain Charm", price: 255, tint: 0x6ca4b8, accent: 0xf5e6d0, description: "A cool blue charm for long mountain routes." }
];

export const DEFAULT_HORSE_CUSTOMIZATION: HorseCustomizationSave = {
  owned: HORSE_CUSTOMIZATION_ITEMS.filter((item) => item.price === 0).map((item) => item.id),
  equipped: {
    coat: "coat_bay",
    mane: "mane_black",
    marking: "marking_none",
    saddle: "saddle_ranch",
    blanket: "blanket_plain",
    bridle: "bridle_plain",
    wraps: "wraps_none",
    charm: "charm_none"
  }
};

const ITEM_BY_ID = new Map(HORSE_CUSTOMIZATION_ITEMS.map((item) => [item.id, item]));

export function normalizeHorseCustomization(input: unknown): HorseCustomizationSave {
  const raw = typeof input === "object" && input !== null ? input as Partial<HorseCustomizationSave> : {};
  const rawOwned = Array.isArray(raw.owned) ? raw.owned.filter((id): id is string => typeof id === "string" && ITEM_BY_ID.has(id)) : [];
  const owned = new Set([...DEFAULT_HORSE_CUSTOMIZATION.owned, ...rawOwned]);
  const equipped = { ...DEFAULT_HORSE_CUSTOMIZATION.equipped };
  const rawEquipped = typeof raw.equipped === "object" && raw.equipped !== null ? raw.equipped as Partial<Record<HorseCustomizationCategory, string>> : {};

  HORSE_CUSTOMIZATION_CATEGORIES.forEach((category) => {
    const id = rawEquipped[category.id];
    const item = id ? ITEM_BY_ID.get(id) : undefined;
    if (item?.category === category.id && owned.has(item.id)) equipped[category.id] = item.id;
  });

  return {
    owned: Array.from(owned),
    equipped
  };
}

export function horseCustomizationItem(id: string | undefined): HorseCustomizationItem | undefined {
  return id ? ITEM_BY_ID.get(id) : undefined;
}

export function horseCustomizationItemsFor(category: HorseCustomizationCategory): HorseCustomizationItem[] {
  return HORSE_CUSTOMIZATION_ITEMS.filter((item) => item.category === category);
}

export function equippedHorseItem(save: HorseCustomizationSave, category: HorseCustomizationCategory): HorseCustomizationItem {
  return horseCustomizationItem(save.equipped[category]) ?? horseCustomizationItem(DEFAULT_HORSE_CUSTOMIZATION.equipped[category])!;
}

export function horseCustomizationSignature(save: HorseCustomizationSave): string {
  return HORSE_CUSTOMIZATION_CATEGORIES.map((category) => save.equipped[category.id].replace(`${category.id}_`, "")).join("_");
}

export function horseCustomizationSummary(save: HorseCustomizationSave): string {
  const coat = equippedHorseItem(save, "coat").label;
  const saddle = equippedHorseItem(save, "saddle").label;
  const blanket = equippedHorseItem(save, "blanket").label;
  return `${coat}, ${saddle}, ${blanket}`;
}
