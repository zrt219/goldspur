import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const url = process.env.GOLDSPUR_URL ?? "http://127.0.0.1:5173/";
const screenshotDir = path.resolve("screenshots");
const saveKey = "goldspur_valley_save_v1";

await mkdir(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const consoleIssues = [];
const failedRequests = [];

page.on("console", (message) => {
  const text = message.text();
  if (text.includes("GPU stall due to ReadPixels")) return;
  if (text.includes("AudioContext encountered an error from the audio device")) return;
  if (message.type() === "error" || message.type() === "warning") consoleIssues.push(`${message.type()}: ${text}`);
});
page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`.trim()));
page.on("response", (response) => {
  if (response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`);
});

async function settle(ms = 500) {
  await page.waitForTimeout(ms);
}

async function shot(name) {
  const file = path.join(screenshotDir, name);
  await page.screenshot({ path: file });
  return file;
}

try {
  await page.addInitScript((key) => {
    localStorage.setItem(key, JSON.stringify({
      stats: {
        horseName: "Juniper",
        speed: 24,
        stamina: 28,
        health: 92,
        mood: 82,
        bond: 14,
        energy: 88,
        coins: 520,
        houseChoice: "cozy_stable",
        racesWon: 0,
        racesEntered: 0,
        day: 3,
        relaxUsesToday: 3
      },
      inventory: {
        carrots: 12,
        hay: 8,
        bucket: 2,
        horseshoe: 4,
        brush: 1,
        saddle: 1,
        oats: 5,
        apple: 3,
        rope: 2,
        lantern: 1,
        nail_kit: 1,
        watering_can: 1,
        horse_tracker: 1
      },
      world: {
        worldSeed: "goldspur-smoke-openworld-systems",
        openWorldPosition: { x: 256, y: 260, chunkX: 0, chunkY: 0 },
        discoveredChunks: ["0,0"],
        interactedWorldObjects: [],
        boat: { built: false, hull: "blue", sail: "cream", trim: "cedar", name: "Goldspur Skiff", onboard: false },
        currentParishId: "st-ann",
        homeParishId: "st-ann",
        visitedParishIds: ["st-ann"]
      },
      horseCustomization: {
        owned: [
          "coat_bay",
          "coat_black",
          "mane_black",
          "mane_festival_beads",
          "marking_none",
          "marking_blaze",
          "saddle_ranch",
          "saddle_jamaica_trail",
          "blanket_plain",
          "blanket_festival_night",
          "bridle_plain",
          "bridle_festival",
          "wraps_none",
          "wraps_gold",
          "charm_none",
          "charm_goldspur"
        ],
        equipped: {
          coat: "coat_black",
          mane: "mane_festival_beads",
          marking: "marking_blaze",
          saddle: "saddle_jamaica_trail",
          blanket: "blanket_festival_night",
          bridle: "bridle_festival",
          wraps: "wraps_gold",
          charm: "charm_goldspur"
        }
      },
      selectedCharacterId: "mara"
    }));
  }, saveKey);

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    return Boolean(canvas && canvas.width === 1280 && canvas.height === 720);
  }, undefined, { timeout: 10000 });
  await settle(800);

  await page.evaluate(() => {
    const game = window.__goldspurGame;
    if (!game) throw new Error("Dev game handle is unavailable; run this smoke script against npm run dev.");
    game.scene.stop("MainMenuScene");
    game.scene.stop("RanchScene");
    game.scene.start("OpenWorldScene");
  });

  await page.waitForFunction(() => {
    const game = window.__goldspurGame;
    const scene = game?.scene.getScene("OpenWorldScene");
    return Boolean(scene?.scene.isActive() && scene.player && scene.chunkManager);
  }, undefined, { timeout: 10000 });
  await settle(1200);

  const checks = await page.evaluate((key) => {
    const game = window.__goldspurGame;
    const scene = game.scene.getScene("OpenWorldScene");
    const passable = (x, y, mode = "land") => scene.isTravelPointPassable(x, y, mode);
    const objects = scene.chunkManager.loadedObjects();
    const scenarioTypes = new Set([
      "fallen_log",
      "rock_cluster",
      "limestone_outcrop",
      "pond",
      "pond_edge",
      "rain_puddle",
      "herb_patch",
      "flower_patch",
      "hibiscus_bush",
      "fishing_boat",
      "wild_horse",
      "market_stall",
      "fruit_stand",
      "banana_patch",
      "breadfruit_tree",
      "coconut_pile",
      "sugarcane_patch",
      "beach_palms",
      "palm_cluster"
    ]);

    const blocking = objects.find((entry) => entry.object.collides && !passable(entry.worldX, entry.worldY));
    if (!blocking) throw new Error("No blocking world object found near open-world smoke start.");
    const fallbackBefore = { x: scene.player.x, y: scene.player.y };
    scene.player.setPosition(blocking.worldX, blocking.worldY);
    scene.enforceSceneBounds();
    const recovered = { x: scene.player.x, y: scene.player.y };
    const recoveryPassable = passable(recovered.x, recovered.y);

    scene.player.setPosition(fallbackBefore.x, fallbackBefore.y);
    const velocity = new Phaser.Math.Vector2(blocking.worldX - fallbackBefore.x, blocking.worldY - fallbackBefore.y).normalize().scale(315);
    scene.filterVelocityForTerrain(velocity, 140, "land");
    const predicted = {
      x: fallbackBefore.x + velocity.x * 0.14,
      y: fallbackBefore.y + velocity.y * 0.14
    };
    const filteredPassable = passable(predicted.x, predicted.y);

    const scenario = objects.find((entry) => scenarioTypes.has(entry.object.type));
    if (!scenario) throw new Error("No exploration scenario object found near open-world smoke start.");
    scene.player.setPosition(scenario.worldX, scenario.worldY);
    scene.handleWorldInteraction({ object: scenario.object, worldX: scenario.worldX, worldY: scenario.worldY, distance: 0 });
    const save = JSON.parse(localStorage.getItem(key) ?? "null");
    const explored = save?.world?.interactedWorldObjects?.some((id) => id.startsWith("explore:"));

    return {
      blockingType: blocking.object.type,
      recovered,
      recoveryPassable,
      filteredVelocity: { x: Math.round(velocity.x), y: Math.round(velocity.y) },
      filteredPassable,
      scenarioType: scenario.object.type,
      explored,
      stats: save?.stats,
      horseVisuals: {
        coatTint: scene.horseVisuals?.coatTint,
        mountedTint: scene.horseVisuals?.mountedTint,
        styleSummary: scene.horseVisuals?.styleSummary
      }
    };
  }, saveKey);

  const screenshot = await shot("qa-openworld-systems.png");
  const passed = checks.recoveryPassable
    && checks.filteredPassable
    && checks.explored
    && checks.horseVisuals.coatTint !== 0xffffff
    && checks.horseVisuals.mountedTint !== 0xffffff
    && consoleIssues.length === 0
    && failedRequests.length === 0;

  console.log(JSON.stringify({
    url,
    screenshot,
    checks,
    consoleIssues,
    failedRequests
  }, null, 2));

  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
