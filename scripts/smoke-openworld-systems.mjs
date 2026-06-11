import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.GOLDSPUR_URL ?? "http://127.0.0.1:5173/";
const screenshotDir = path.resolve("screenshots");
const reportFile = path.resolve("test-artifacts", "openworld-systems-smoke.json");
const saveKey = "goldspur_valley_save_v1";

await mkdir(screenshotDir, { recursive: true });
await mkdir(path.dirname(reportFile), { recursive: true });

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
    const chunkSize = 512;
    const sweepDeltaMs = 360;
    const sweepSeconds = sweepDeltaMs / 1000;
    const passable = (x, y, mode = "land") => scene.isTravelPointPassable(x, y, mode);
    const fallbackBefore = { x: scene.player.x, y: scene.player.y };

    const objectsById = new Map();
    for (let chunkX = -1; chunkX <= 14; chunkX += 1) {
      for (let chunkY = -2; chunkY <= 6; chunkY += 1) {
        const x = chunkX * chunkSize + chunkSize / 2;
        const y = chunkY * chunkSize + chunkSize / 2;
        scene.chunkManager.update(x, y);
        scene.chunkManager.loadedObjects().forEach((entry) => objectsById.set(entry.object.id, entry));
      }
    }
    const objects = Array.from(objectsById.values());

    const blockingObjects = objects.filter((entry) => entry.object.collides && !passable(entry.worldX, entry.worldY));
    const collisionFailures = [];
    let collisionChecks = 0;
    for (const blocking of blockingObjects.slice(0, 18)) {
      const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];
      for (const angle of angles) {
        const rawStart = {
          x: blocking.worldX + Math.cos(angle) * 132,
          y: blocking.worldY + Math.sin(angle) * 132
        };
        const start = scene.safeResolvedTravelPoint(rawStart.x, rawStart.y, "land", 24);
        if (!passable(start.x, start.y)) continue;
        scene.player.setPosition(start.x, start.y);
        scene.chunkManager.update(start.x, start.y);
        const velocity = new Phaser.Math.Vector2(blocking.worldX - start.x, blocking.worldY - start.y).normalize().scale(315);
        scene.filterVelocityForTerrain(velocity, sweepDeltaMs, "land");
        const predicted = {
          x: start.x + velocity.x * sweepSeconds,
          y: start.y + velocity.y * sweepSeconds
        };
        if (!passable(predicted.x, predicted.y)) {
          collisionFailures.push({
            type: blocking.object.type,
            start: { x: Math.round(start.x), y: Math.round(start.y) },
            predicted: { x: Math.round(predicted.x), y: Math.round(predicted.y) },
            velocity: { x: Math.round(velocity.x), y: Math.round(velocity.y) }
          });
        }
        collisionChecks += 1;
        break;
      }
    }

    scene.player.setPosition(fallbackBefore.x, fallbackBefore.y);
    scene.chunkManager.update(fallbackBefore.x, fallbackBefore.y);
    const hitchVelocity = new Phaser.Math.Vector2(1, 0).scale(315);
    scene.filterVelocityForTerrain(hitchVelocity, 900, "land");
    const hitchStopped = hitchVelocity.lengthSq() === 0;

    const scenarioById = new Map();
    objects.forEach((entry) => {
      const interaction = { object: entry.object, worldX: entry.worldX, worldY: entry.worldY, distance: 0 };
      const scenario = scene.explorationScenarioFor(interaction);
      if (scenario && !scenarioById.has(scenario.id)) scenarioById.set(scenario.id, { ...entry, scenario });
    });
    const selectedScenarios = Array.from(scenarioById.values()).slice(0, 3);
    if (selectedScenarios.length < 3) {
      throw new Error(`Only found ${selectedScenarios.length} unique exploration scenarios during open-world scan.`);
    }

    selectedScenarios.forEach((entry) => {
      scene.player.setPosition(entry.worldX, entry.worldY);
      scene.chunkManager.update(entry.worldX, entry.worldY);
      scene.handleWorldInteraction({ object: entry.object, worldX: entry.worldX, worldY: entry.worldY, distance: 0 });
      scene.ui.messageBox.close();
    });

    scene.player.setPosition(fallbackBefore.x, fallbackBefore.y);
    scene.chunkManager.update(fallbackBefore.x, fallbackBefore.y);
    scene.ui.messageBox.close();

    const save = JSON.parse(localStorage.getItem(key) ?? "null");
    const exploreKeys = save?.world?.interactedWorldObjects?.filter((id) => id.startsWith("explore:")) ?? [];
    const uniqueScenarioIds = Array.from(new Set(exploreKeys.map((id) => id.slice("explore:".length).split(":")[0])));
    const milestoneAwarded = save?.world?.interactedWorldObjects?.includes("explore_bonus:trail-scout") ?? false;

    return {
      scannedObjects: objects.length,
      blockingObjects: blockingObjects.length,
      collisionChecks,
      collisionFailures,
      hitchStopped,
      scenarioTypes: selectedScenarios.map((entry) => entry.scenario.id),
      exploreKeys,
      uniqueScenarioIds,
      milestoneAwarded,
      stats: save?.stats,
      horseVisuals: {
        coatTint: scene.horseVisuals?.coatTint,
        mountedTint: scene.horseVisuals?.mountedTint,
        styleSummary: scene.horseVisuals?.styleSummary
      }
    };
  }, saveKey);

  const screenshot = await shot("qa-openworld-systems.png");
  const passed = checks.collisionChecks >= 6
    && checks.collisionFailures.length === 0
    && checks.hitchStopped
    && checks.uniqueScenarioIds.length >= 3
    && checks.milestoneAwarded
    && checks.horseVisuals.coatTint !== 0xffffff
    && checks.horseVisuals.mountedTint !== 0xffffff
    && consoleIssues.length === 0
    && failedRequests.length === 0;

  const report = {
    url,
    screenshot,
    checks,
    consoleIssues,
    failedRequests
  };
  await writeFile(reportFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, reportFile }, null, 2));

  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
