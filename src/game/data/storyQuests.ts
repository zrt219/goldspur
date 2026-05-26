import { StatDelta } from "../systems/HorseStats";

export type StoryQuestId = string;

export type StoryQuest = {
  id: StoryQuestId;
  chapter: number;
  title: string;
  location: string;
  summary: string;
  objective: string;
  reward: StatDelta;
  requiredQuestIds: StoryQuestId[];
  unlocks: StoryQuestId[];
};

export const STORY_QUESTS: StoryQuest[] = [
  {
    id: "welcome-to-goldspur",
    chapter: 1,
    title: "Welcome to Goldspur",
    location: "Ranch",
    summary: "Meet the ranch hands and get your horse settled.",
    objective: "Visit the Starter Stable and choose a home base.",
    reward: { bond: 3, coins: 25 },
    requiredQuestIds: [],
    unlocks: ["first-brush"]
  },
  {
    id: "first-brush",
    chapter: 1,
    title: "First Brush",
    location: "Health & Care",
    summary: "A calm grooming session starts the partnership right.",
    objective: "Open care, groom your horse, and raise mood.",
    reward: { mood: 5, bond: 2 },
    requiredQuestIds: ["welcome-to-goldspur"],
    unlocks: ["morning-feed"]
  },
  {
    id: "morning-feed",
    chapter: 1,
    title: "Morning Feed",
    location: "Ranch",
    summary: "Stock the stall and learn how feed affects energy.",
    objective: "Use hay, carrots, or apples from inventory.",
    reward: { energy: 8, coins: 20 },
    requiredQuestIds: ["first-brush"],
    unlocks: ["training-ring"]
  },
  {
    id: "training-ring",
    chapter: 1,
    title: "Training Ring",
    location: "Training Grounds",
    summary: "Run basic drills before the first public ride.",
    objective: "Complete a training action at the grounds.",
    reward: { speed: 4, stamina: 4 },
    requiredQuestIds: ["morning-feed"],
    unlocks: ["ranch-errand"]
  },
  {
    id: "ranch-errand",
    chapter: 1,
    title: "Ranch Errand",
    location: "St Ann Route",
    summary: "Carry a small note to the trail board outside the ranch.",
    objective: "Ride onto the St Ann Route and inspect a route marker.",
    reward: { bond: 3, coins: 35 },
    requiredQuestIds: ["training-ring"],
    unlocks: ["first-timed-run"]
  },
  {
    id: "first-timed-run",
    chapter: 2,
    title: "First Timed Run",
    location: "Racing Track",
    summary: "Try a low-stakes run and learn the track rhythm.",
    objective: "Enter a race and finish clean.",
    reward: { speed: 5, coins: 50 },
    requiredQuestIds: ["ranch-errand"],
    unlocks: ["quiet-meadow"]
  },
  {
    id: "quiet-meadow",
    chapter: 2,
    title: "Quiet Meadow",
    location: "Relaxation Meadow",
    summary: "Recovery matters after a hard run.",
    objective: "Spend time resting in the meadow.",
    reward: { mood: 6, energy: 6 },
    requiredQuestIds: ["first-timed-run"],
    unlocks: ["north-coast-signs"]
  },
  {
    id: "north-coast-signs",
    chapter: 2,
    title: "St Ann Route Signs",
    location: "St Ann Route",
    summary: "Follow the old coastal markers westward.",
    objective: "Find and read two route markers on the trail.",
    reward: { stamina: 4, coins: 45 },
    requiredQuestIds: ["quiet-meadow"],
    unlocks: ["market-day"]
  },
  {
    id: "market-day",
    chapter: 2,
    title: "Market Day",
    location: "St Ann Route",
    summary: "A parish stall needs a friendly rider to draw visitors.",
    objective: "Visit a market stall or fruit stand along the road.",
    reward: { mood: 4, coins: 60 },
    requiredQuestIds: ["north-coast-signs"],
    unlocks: ["stable-challenge"]
  },
  {
    id: "stable-challenge",
    chapter: 2,
    title: "Stable Challenge",
    location: "Training Grounds",
    summary: "Local riders test your control and consistency.",
    objective: "Complete another training session with high energy.",
    reward: { speed: 4, stamina: 5, bond: 2 },
    requiredQuestIds: ["market-day"],
    unlocks: ["hidden-cache"]
  },
  {
    id: "hidden-cache",
    chapter: 3,
    title: "Hidden Cache",
    location: "St Ann Route",
    summary: "Rumors point to something tucked away near the road.",
    objective: "Find a hidden quest item along the Steer Town to St Ann Route.",
    reward: { coins: 80, bond: 3 },
    requiredQuestIds: ["stable-challenge"],
    unlocks: ["rainy-day-care"]
  },
  {
    id: "rainy-day-care",
    chapter: 3,
    title: "Rainy Day Care",
    location: "Health & Care",
    summary: "The weather turns, and good care keeps spirits high.",
    objective: "Restore health or mood before returning to the trail.",
    reward: { health: 7, mood: 4 },
    requiredQuestIds: ["hidden-cache"],
    unlocks: ["runaway-bay-ride"]
  },
  {
    id: "runaway-bay-ride",
    chapter: 3,
    title: "Runaway Bay Ride",
    location: "St Ann Route",
    summary: "Scout the road toward Runaway Bay and report back.",
    objective: "Ride west until the terrain changes near the coast.",
    reward: { stamina: 6, coins: 70 },
    requiredQuestIds: ["rainy-day-care"],
    unlocks: ["rival-at-the-rail"]
  },
  {
    id: "rival-at-the-rail",
    chapter: 3,
    title: "Rival at the Rail",
    location: "Racing Track",
    summary: "A confident rival wants to see what your horse can do.",
    objective: "Enter another race after training speed and stamina.",
    reward: { speed: 7, coins: 90 },
    requiredQuestIds: ["runaway-bay-ride"],
    unlocks: ["old-bridle"]
  },
  {
    id: "old-bridle",
    chapter: 3,
    title: "The Old Bridle",
    location: "Ranch",
    summary: "An old bridle in storage connects the ranch to past champions.",
    objective: "Return to the ranch and check in at the stable.",
    reward: { bond: 7, mood: 3 },
    requiredQuestIds: ["rival-at-the-rail"],
    unlocks: ["discovery-bay-map"]
  },
  {
    id: "discovery-bay-map",
    chapter: 4,
    title: "Discovery Bay Map",
    location: "St Ann Route",
    summary: "The bridle points to a half-faded coastal map.",
    objective: "Find a landmark in limestone country.",
    reward: { stamina: 5, coins: 85 },
    requiredQuestIds: ["old-bridle"],
    unlocks: ["beach-sprint"]
  },
  {
    id: "beach-sprint",
    chapter: 4,
    title: "Beach Sprint",
    location: "St Ann Route",
    summary: "A flat stretch of sand becomes a test of trust.",
    objective: "Ride the coast and keep your horse energized.",
    reward: { speed: 6, bond: 4 },
    requiredQuestIds: ["discovery-bay-map"],
    unlocks: ["championship-trial"]
  },
  {
    id: "championship-trial",
    chapter: 4,
    title: "Championship Trial",
    location: "Racing Track",
    summary: "Qualify for Goldspur's biggest local race.",
    objective: "Win or place well in a race after careful preparation.",
    reward: { speed: 5, stamina: 5, coins: 120 },
    requiredQuestIds: ["beach-sprint"],
    unlocks: ["valley-homecoming"]
  },
  {
    id: "valley-homecoming",
    chapter: 4,
    title: "Valley Homecoming",
    location: "Ranch",
    summary: "Neighbors gather to celebrate how far you have come.",
    objective: "Return to the ranch with a healthy, happy horse.",
    reward: { mood: 8, bond: 8, coins: 100 },
    requiredQuestIds: ["championship-trial"],
    unlocks: ["goldspur-legacy"]
  },
  {
    id: "goldspur-legacy",
    chapter: 5,
    title: "Goldspur Legacy",
    location: "Ranch",
    summary: "Write your name into the ranch's next chapter.",
    objective: "Finish the story with strong bond, health, and spirit.",
    reward: { bond: 10, mood: 10, coins: 250 },
    requiredQuestIds: ["valley-homecoming"],
    unlocks: []
  }
];

export const FIRST_STORY_QUEST_ID = STORY_QUESTS[0].id;

export function storyQuestById(id: StoryQuestId): StoryQuest | undefined {
  return STORY_QUESTS.find((quest) => quest.id === id);
}

export function nextIncompleteQuest(completedQuestIds: string[]): StoryQuest {
  const completed = new Set(completedQuestIds);
  return STORY_QUESTS.find((quest) => !completed.has(quest.id)) ?? STORY_QUESTS[STORY_QUESTS.length - 1];
}
