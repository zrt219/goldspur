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

async function shot(name) {
  const file = path.join(screenshotDir, name);
  await page.screenshot({ path: file });
  return file;
}

async function settle(ms = 600) {
  await page.waitForTimeout(ms);
}

async function loadSave() {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), saveKey);
}

try {
  await page.addInitScript((key) => localStorage.removeItem(key), saveKey);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    return Boolean(canvas && canvas.width === 1280 && canvas.height === 720);
  }, undefined, { timeout: 10000 });
  await settle(1000);

  await page.mouse.click(316, 394);
  await settle(700);
  await page.mouse.click(500, 334);
  await settle(150);
  await page.mouse.click(845, 610);
  await settle(1100);

  await page.mouse.click(420, 560);
  await settle(500);
  await page.mouse.click(390, 420);
  await settle(500);
  await page.mouse.click(640, 448);
  await settle(350);

  await page.mouse.click(250, 430);
  await settle(700);
  const shots = [await shot("qa-12-horse-customization-store.png")];

  await page.mouse.click(790, 264);
  await settle(500);
  await page.mouse.click(790, 264);
  await settle(300);
  await page.mouse.click(498, 290);
  await settle(350);
  await page.mouse.click(790, 225);
  await settle(500);
  shots.push(await shot("qa-13-horse-customization-purchased.png"));

  await page.mouse.click(1052, 642);
  await settle(850);
  shots.push(await shot("qa-14-custom-horse-ranch.png"));

  await page.keyboard.down("KeyA");
  await settle(550);
  await page.keyboard.up("KeyA");
  await page.keyboard.down("KeyS");
  await settle(150);
  await page.keyboard.up("KeyS");
  await page.keyboard.press("KeyE");
  await settle(700);
  shots.push(await shot("qa-15-custom-mounted-horse.png"));

  await page.keyboard.press("Space");
  await settle(180);
  shots.push(await shot("qa-16-mounted-jump.png"));
  await settle(650);

  const save = await loadSave();
  const report = {
    url,
    shots,
    coins: save?.stats?.coins,
    horseName: save?.stats?.horseName,
    equipped: save?.horseCustomization?.equipped,
    owned: save?.horseCustomization?.owned,
    consoleIssues,
    failedRequests
  };
  console.log(JSON.stringify(report, null, 2));

  const passed = save?.stats?.coins === 45
    && save?.horseCustomization?.equipped?.coat === "coat_black"
    && save?.horseCustomization?.equipped?.saddle === "saddle_racing"
    && save?.horseCustomization?.owned?.includes("coat_black")
    && save?.horseCustomization?.owned?.includes("saddle_racing")
    && consoleIssues.length === 0
    && failedRequests.length === 0;
  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
