import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.GOLDSPUR_URL ?? "http://127.0.0.1:5173/";
const screenshotDir = path.resolve("screenshots");
const reportFile = path.resolve("test-artifacts", "traversal-routes-smoke.json");
const saveKey = "goldspur_valley_save_v1";
const chunkSize = 512;

const destinations = [
  { id: "hanover", name: "Hanover", shoreName: "Lucea Harbour", chunkX: -4400, chunkY: 160 },
  { id: "st-elizabeth", name: "St Elizabeth", shoreName: "Treasure Beach", chunkX: -1380, chunkY: 3920 },
  { id: "st-james", name: "St James", shoreName: "Montego Bay Harbour", chunkX: -3020, chunkY: 40 },
  { id: "trelawny", name: "Trelawny", shoreName: "Falmouth Pier", chunkX: -1420, chunkY: -80 },
  { id: "westmoreland", name: "Westmoreland", shoreName: "Negril Beach", chunkX: -3360, chunkY: 2200 },
  { id: "clarendon", name: "Clarendon", shoreName: "Rocky Point", chunkX: 1180, chunkY: 3300 },
  { id: "manchester", name: "Manchester", shoreName: "Alligator Pond", chunkX: -120, chunkY: 3800 },
  { id: "st-ann", name: "St Ann", shoreName: "Steer Town Landing", chunkX: 0, chunkY: 0 },
  { id: "st-catherine", name: "St Catherine", shoreName: "Portmore Causeway", chunkX: 2440, chunkY: 2460 },
  { id: "st-mary", name: "St Mary", shoreName: "Port Maria Bay", chunkX: 1320, chunkY: -260 },
  { id: "kingston", name: "Kingston", shoreName: "Kingston Harbour", chunkX: 3260, chunkY: 2240 },
  { id: "portland", name: "Portland", shoreName: "Port Antonio Harbour", chunkX: 2860, chunkY: -520 },
  { id: "st-andrew", name: "St Andrew", shoreName: "Palisadoes Shore", chunkX: 3000, chunkY: 1780 },
  { id: "st-thomas", name: "St Thomas", shoreName: "Morant Bay", chunkX: 4240, chunkY: 1760 }
];

const routeTestDestinations = destinations.filter((destination) => [
  "st-ann",
  "st-james",
  "trelawny",
  "st-elizabeth",
  "kingston",
  "portland"
].includes(destination.id));

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
        speed: 30,
        stamina: 34,
        health: 96,
        mood: 86,
        bond: 18,
        energy: 92,
        coins: 640,
        houseChoice: "cozy_stable",
        racesWon: 0,
        racesEntered: 0,
        day: 4,
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
        worldSeed: "goldspur-smoke-traversal-routes",
        openWorldPosition: { x: 256, y: 260, chunkX: 0, chunkY: 0 },
        discoveredChunks: ["0,0"],
        interactedWorldObjects: [],
        boat: {
          built: true,
          hull: "green",
          sail: "festival",
          trim: "bamboo",
          name: "Goldspur Skiff",
          x: 324,
          y: 298,
          chunkX: 0,
          chunkY: 0,
          onboard: false
        },
        currentParishId: "st-ann",
        homeParishId: "st-ann",
        visitedParishIds: ["st-ann"]
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
    return Boolean(scene?.scene.isActive() && scene.player && scene.chunkManager && scene.boatSprite);
  }, undefined, { timeout: 10000 });
  await settle(1000);

  const checks = await page.evaluate(({ destinations, chunkSize, key }) => {
    const game = window.__goldspurGame;
    const scene = game.scene.getScene("OpenWorldScene");
    const passable = (x, y, mode = "land") => scene.isTravelPointPassable(x, y, mode);
    const worldPoint = (destination) => ({
      x: destination.chunkX * chunkSize + chunkSize / 2,
      y: destination.chunkY * chunkSize + chunkSize / 2,
      chunkX: destination.chunkX,
      chunkY: destination.chunkY
    });
    const dockPoint = (destination) => {
      const shore = worldPoint(destination);
      const x = shore.x + 68;
      const y = shore.y + 42;
      return { x, y, chunkX: Math.floor(x / chunkSize), chunkY: Math.floor(y / chunkSize) };
    };
    const distance = (a, b) => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
    const setBoatAt = (point) => {
      scene.isBoating = true;
      scene.player.setVelocity(0);
      scene.player.setTexture("player_boat").setDisplaySize(122, 78).setPosition(point.x, point.y);
      scene.configurePlayerBody(true);
      scene.boatSprite.enableBody(true, point.x, point.y, true, true);
      scene.boatSprite.disableBody(true, true);
      scene.horse.disableBody(true, true);
      scene.ambientHorse?.setEnabled(false);
    };

    const routeChecks = [];
    const failures = [];

    for (const destination of destinations) {
      const shore = worldPoint(destination);
      const dock = dockPoint(destination);
      scene.chunkManager.update(shore.x, shore.y);

      scene.isMounted = true;
      const mountedLand = scene.safeResolvedTravelPoint(shore.x, shore.y, "land", 96);
      const mountedLandPassable = passable(mountedLand.x, mountedLand.y, "land");

      scene.isMounted = false;
      const unmountedLand = scene.safeResolvedTravelPoint(shore.x, shore.y, "land", 96);
      const unmountedLandPassable = passable(unmountedLand.x, unmountedLand.y, "land");

      const boat = scene.safeResolvedTravelPoint(dock.x, dock.y, "boat", 96);
      const boatPassable = passable(boat.x, boat.y, "boat");
      setBoatAt(boat);

      const velocity = new Phaser.Math.Vector2(mountedLand.x - boat.x, mountedLand.y - boat.y).normalize().scale(185);
      scene.filterVelocityForTerrain(velocity, 360, "boat");
      const predictedBoat = { x: boat.x + velocity.x * 0.36, y: boat.y + velocity.y * 0.36 };
      const filteredBoatPassable = passable(predictedBoat.x, predictedBoat.y, "boat");

      const landingPreview = scene.findDisembarkPoint(boat.x, boat.y);
      const landingPreviewPassable = Boolean(landingPreview && passable(landingPreview.x, landingPreview.y, "land"));
      scene.disembarkBoat(false);
      const disembarked = scene.isBoating === false;
      const playerLand = { x: scene.player.x, y: scene.player.y };
      const playerLandPassable = passable(playerLand.x, playerLand.y, "land");
      const landingDistance = distance(playerLand, boat);
      const afterDisembarkSave = JSON.parse(localStorage.getItem(key) ?? "null");
      const horsePosition = afterDisembarkSave?.world?.horsePosition;
      const horseSavedDistance = horsePosition
        ? Phaser.Math.Distance.Between(playerLand.x, playerLand.y, horsePosition.x, horsePosition.y)
        : Number.POSITIVE_INFINITY;
      const horseSavedNearPlayer = horseSavedDistance <= 220;

      const result = {
        id: destination.id,
        mountedLandPassable,
        unmountedLandPassable,
        boatPassable,
        filteredBoatPassable,
        landingPreviewPassable,
        disembarked,
        playerLandPassable,
        horseSavedNearPlayer,
        horseSavedDistance: Math.round(horseSavedDistance),
        landingDistance: Math.round(landingDistance),
        shoreChunk: `${destination.chunkX},${destination.chunkY}`,
        land: { x: Math.round(playerLand.x), y: Math.round(playerLand.y) },
        boat: { x: Math.round(boat.x), y: Math.round(boat.y) }
      };
      routeChecks.push(result);

      if (!mountedLandPassable || !unmountedLandPassable || !boatPassable || !filteredBoatPassable || !landingPreviewPassable || !disembarked || !playerLandPassable || !horseSavedNearPlayer || landingDistance > 900) {
        failures.push(result);
      }
    }

    const noLandingBoat = routeChecks.find((entry) => entry.boatPassable)?.boat;
    let noLandingCheck = { forced: false, stayedBoating: false, distanceMoved: Number.POSITIVE_INFINITY, onboardSaved: false };
    if (noLandingBoat) {
      const forcedPoint = { x: noLandingBoat.x, y: noLandingBoat.y };
      setBoatAt(forcedPoint);
      const originalFindDisembarkPoint = scene.findDisembarkPoint.bind(scene);
      scene.findDisembarkPoint = () => undefined;
      const before = { x: scene.player.x, y: scene.player.y };
      scene.disembarkBoat(false);
      const after = { x: scene.player.x, y: scene.player.y };
      scene.findDisembarkPoint = originalFindDisembarkPoint;
      const noLandingSave = JSON.parse(localStorage.getItem(key) ?? "null");
      noLandingCheck = {
        forced: true,
        stayedBoating: scene.isBoating === true,
        distanceMoved: Math.round(distance(before, after)),
        onboardSaved: noLandingSave?.world?.boat?.onboard === true,
        point: forcedPoint
      };
    }
    if (!noLandingCheck.forced || !noLandingCheck.stayedBoating || noLandingCheck.distanceMoved > 2 || !noLandingCheck.onboardSaved) failures.push({ id: "no-landing-disembark", ...noLandingCheck });

    return {
      routeChecks,
      failures,
      noLandingCheck,
      save: JSON.parse(localStorage.getItem(key) ?? "null")
    };
  }, { destinations: routeTestDestinations, chunkSize, key: saveKey });

  const screenshot = await shot("qa-traversal-routes.png");
  const passed = checks.routeChecks.length === routeTestDestinations.length
    && checks.failures.length === 0
    && checks.noLandingCheck?.stayedBoating
    && checks.noLandingCheck?.onboardSaved
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
