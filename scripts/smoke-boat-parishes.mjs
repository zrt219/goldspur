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
  if (message.type() === "error" || message.type() === "warning") {
    consoleIssues.push(`${message.type()}: ${text}`);
  }
});
page.on("pageerror", (error) => {
  consoleIssues.push(`pageerror: ${error.message}`);
});
page.on("requestfailed", (request) => {
  failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`.trim());
});
page.on("response", (response) => {
  if (response.status() >= 400) {
    failedRequests.push(`${response.status()} ${response.url()}`);
  }
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
  await page.addInitScript((key) => {
    localStorage.removeItem(key);
  }, saveKey);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => {
    const canvas = document.querySelector("canvas");
    return Boolean(canvas && canvas.width === 1280 && canvas.height === 720);
  }, undefined, { timeout: 10000 });
  await settle(1000);

  const shots = [];
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

  await page.mouse.click(1048, 555);
  await settle(500);
  shots.push(await shot("qa-08-boat-shed-before.png"));
  await page.mouse.click(640, 268);
  await settle(500);
  await page.mouse.click(640, 448);
  await settle(350);

  await page.mouse.click(1048, 555);
  await settle(500);
  shots.push(await shot("qa-09-boat-shed-built.png"));
  await page.mouse.click(475, 390);
  await settle(1700);
  shots.push(await shot("qa-10-st-james-shore.png"));

  const beforeRow = await loadSave();
  await page.keyboard.press("KeyE");
  await settle(350);
  await page.keyboard.down("ArrowRight");
  await settle(1250);
  await page.keyboard.up("ArrowRight");
  await settle(4200);
  shots.push(await shot("qa-11-rowing-boat.png"));

  const afterRow = await loadSave();
  const report = {
    url,
    shots,
    boat: afterRow?.world?.boat,
    currentParishId: afterRow?.world?.currentParishId,
    homeParishId: afterRow?.world?.homeParishId,
    visitedParishIds: afterRow?.world?.visitedParishIds,
    beforePosition: beforeRow?.world?.openWorldPosition,
    afterPosition: afterRow?.world?.openWorldPosition,
    consoleIssues,
    failedRequests
  };
  console.log(JSON.stringify(report, null, 2));

  const rowed = typeof afterRow?.world?.openWorldPosition?.x === "number"
    && typeof beforeRow?.world?.openWorldPosition?.x === "number"
    && afterRow.world.openWorldPosition.x > beforeRow.world.openWorldPosition.x + 80;
  const passed = afterRow?.world?.boat?.built === true
    && afterRow?.world?.currentParishId === "st-james"
    && afterRow?.world?.homeParishId === "st-james"
    && afterRow?.world?.visitedParishIds?.includes("st-james")
    && rowed
    && consoleIssues.length === 0
    && failedRequests.length === 0;

  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
