import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
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
  shots.push(await shot("qa-01-main-menu.png"));

  await page.mouse.click(316, 394);
  await settle(700);
  shots.push(await shot("qa-02-character-select.png"));

  await page.mouse.click(500, 334);
  await settle(150);
  await page.mouse.click(845, 610);
  await settle(1100);
  shots.push(await shot("qa-03-ranch.png"));

  await page.mouse.click(420, 560);
  await settle(550);
  shots.push(await shot("qa-04-starter-home-modal.png"));

  await page.mouse.click(390, 420);
  await settle(700);
  shots.push(await shot("qa-05-home-selected.png"));

  await page.mouse.click(640, 448);
  await settle(250);
  await page.mouse.click(850, 330);
  await settle(400);
  await page.mouse.click(640, 468);
  await settle(1400);
  shots.push(await shot("qa-06-open-world-weather.png"));

  await page.keyboard.press("KeyM");
  await settle(550);
  shots.push(await shot("qa-07-open-world-map.png"));

  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return { exists: false };
    const rect = canvas.getBoundingClientRect();
    return {
      exists: true,
      width: canvas.width,
      height: canvas.height,
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    };
  });
  const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), saveKey);

  const report = {
    url,
    shots,
    canvasInfo,
    story: save?.story,
    selectedCharacterId: save?.selectedCharacterId,
    stats: save?.stats,
    consoleIssues,
    failedRequests
  };
  console.log(JSON.stringify(report, null, 2));

  if (consoleIssues.length > 0 || failedRequests.length > 0 || !canvasInfo.exists) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
