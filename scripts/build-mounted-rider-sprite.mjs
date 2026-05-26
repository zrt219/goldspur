import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "goldspur_valley_playable_mvp_beta_prompt_pack/references/sprites/girl");
const outRoots = [
  path.join(root, "src/assets/sprites/mounted"),
  path.join(root, "public/assets/sprites/mounted")
];
const frameSize = 384;
const rideFrameCount = 10;

const sourceFrames = (await safePngList(sourceDir))
  .filter((file) => file.includes("02_36"))
  .sort((a, b) => frameNumber(a) - frameNumber(b))
  .slice(0, rideFrameCount)
  .map((file) => path.join(sourceDir, file));

if (sourceFrames.length !== rideFrameCount) {
  throw new Error(`Expected ${rideFrameCount} mounted reference frames in ${sourceDir}, found ${sourceFrames.length}`);
}

const rideFrames = [];
for (const source of sourceFrames) {
  rideFrames.push(await cleanMountedReference(source));
}

const idleBase = rideFrames[6] ?? rideFrames[0];
const idleFrames = [];
const jumpFrames = [];
for (let index = 0; index < rideFrameCount; index += 1) {
  idleFrames.push(await makeIdleFrame(idleBase, index));
  jumpFrames.push(await makeJumpFrame(rideFrames[index], index));
}

for (const outDir of outRoots) {
  const rideOutDir = path.join(outDir, "ride_right");
  const idleOutDir = path.join(outDir, "idle_breathe");
  const jumpOutDir = path.join(outDir, "jump");
  await fs.mkdir(rideOutDir, { recursive: true });
  await fs.mkdir(idleOutDir, { recursive: true });
  await fs.mkdir(jumpOutDir, { recursive: true });
  await clearOutput(rideOutDir);
  await clearOutput(idleOutDir);
  await clearOutput(jumpOutDir);

  for (let index = 0; index < rideFrameCount; index += 1) {
    const suffix = String(index + 1).padStart(2, "0");
    await sharp(rideFrames[index]).png().toFile(path.join(rideOutDir, `ride_right_${suffix}.png`));
    await sharp(idleFrames[index]).png().toFile(path.join(idleOutDir, `idle_breathe_${suffix}.png`));
    await sharp(jumpFrames[index]).png().toFile(path.join(jumpOutDir, `jump_${suffix}.png`));
  }

  await fs.copyFile(path.join(idleOutDir, "idle_breathe_01.png"), path.join(outDir, "mounted_idle.png"));
}

console.log(`Built ${rideFrameCount} mounted ride, idle, and jump frames from ${path.relative(root, sourceDir)}.`);

async function safePngList(directory) {
  try {
    return (await fs.readdir(directory)).filter((file) => file.toLowerCase().endsWith(".png"));
  } catch {
    return [];
  }
}

function frameNumber(file) {
  const match = file.match(/\((\d+)\)\.png$/);
  return match ? Number(match[1]) : 999;
}

async function clearOutput(directory) {
  for (const file of await safePngList(directory)) {
    await fs.unlink(path.join(directory, file));
  }
}

async function cleanMountedReference(input) {
  const image = sharp(input).ensureAlpha();
  const { width = 0, height = 0 } = await image.metadata();
  const raw = await image.raw().toBuffer();
  const transparent = Buffer.from(raw);
  removeConnectedLightBackground(transparent, width, height);
  const bounds = alphaBounds(transparent, width, height);
  const crop = expandBounds(bounds, width, height, 12);
  const foreground = await sharp(transparent, { raw: { width, height, channels: 4 } })
    .extract({
      left: crop.left,
      top: crop.top,
      width: crop.right - crop.left + 1,
      height: crop.bottom - crop.top + 1
    })
    .resize(354, 354, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3
    })
    .png()
    .toBuffer();

  const meta = await sharp(foreground).metadata();
  const left = Math.round((frameSize - (meta.width ?? frameSize)) / 2);
  const top = Math.round((frameSize - (meta.height ?? frameSize)) / 2 + 4);

  return sharp({
    create: {
      width: frameSize,
      height: frameSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: foreground, left, top }])
    .png()
    .toBuffer();
}

async function makeIdleFrame(source, index) {
  const phase = Math.sin((index / rideFrameCount) * Math.PI * 2);
  const image = sharp(source).ensureAlpha();
  const { width = frameSize, height = frameSize } = await image.metadata();
  const raw = await image.raw().toBuffer();
  const bounds = alphaBounds(raw, width, height);
  const objectWidth = bounds.right - bounds.left + 1;
  const objectHeight = bounds.bottom - bounds.top + 1;
  const scaleY = 1 - Math.max(0, phase) * 0.012;
  const scaleX = 1 + Math.max(0, phase) * 0.006;
  const resizedWidth = Math.max(1, Math.round(objectWidth * scaleX));
  const resizedHeight = Math.max(1, Math.round(objectHeight * scaleY));
  const frame = await sharp(raw, { raw: { width, height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width: objectWidth, height: objectHeight })
    .resize(resizedWidth, resizedHeight, {
      fit: "fill",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: frameSize,
      height: frameSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{
      input: frame,
      left: Math.round((frameSize - resizedWidth) / 2),
      top: Math.round((frameSize - resizedHeight) / 2 + Math.max(0, phase) * 3)
    }])
    .png()
    .toBuffer();
}

async function makeJumpFrame(source, index) {
  const t = index / (rideFrameCount - 1);
  const arc = Math.sin(t * Math.PI);
  const tuck = Math.sin(t * Math.PI * 2);
  const image = sharp(source).ensureAlpha();
  const { width = frameSize, height = frameSize } = await image.metadata();
  const raw = await image.raw().toBuffer();
  const bounds = alphaBounds(raw, width, height);
  const objectWidth = bounds.right - bounds.left + 1;
  const objectHeight = bounds.bottom - bounds.top + 1;
  const resizedWidth = Math.max(1, Math.round(objectWidth * (1 + arc * 0.018)));
  const resizedHeight = Math.max(1, Math.round(objectHeight * (1 - arc * 0.025)));
  const frame = await sharp(raw, { raw: { width, height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width: objectWidth, height: objectHeight })
    .resize(resizedWidth, resizedHeight, {
      fit: "fill",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3
    })
    .rotate(tuck * 2.5, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(frame).metadata();
  const frameWidth = meta.width ?? resizedWidth;
  const frameHeight = meta.height ?? resizedHeight;

  return sharp({
    create: {
      width: frameSize,
      height: frameSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{
      input: frame,
      left: Math.round((frameSize - frameWidth) / 2 + tuck * 3),
      top: Math.round((frameSize - frameHeight) / 2 + 10 - arc * 34)
    }])
    .png()
    .toBuffer();
}

function removeConnectedLightBackground(buffer, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x += 1) {
    enqueueIfBackground(x, 0);
    enqueueIfBackground(x, height - 1);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueueIfBackground(0, y);
    enqueueIfBackground(width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % width;
    const y = Math.floor(index / width);
    const pixel = index * 4;
    buffer[pixel + 3] = 0;
    enqueueIfBackground(x + 1, y);
    enqueueIfBackground(x - 1, y);
    enqueueIfBackground(x, y + 1);
    enqueueIfBackground(x, y - 1);
  }

  function enqueueIfBackground(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const index = y * width + x;
    if (visited[index]) return;
    visited[index] = 1;
    const pixel = index * 4;
    if (buffer[pixel + 3] < 8 || isLightBackground(buffer[pixel], buffer[pixel + 1], buffer[pixel + 2])) {
      queue.push(index);
    }
  }
}

function isLightBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return r > 235 && g > 235 && b > 235 && max - min < 24;
}

function alphaBounds(raw, width, height) {
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = raw[(y * width + x) * 4 + 3];
      if (alpha < 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (left > right || top > bottom) {
    return { left: 0, top: 0, right: width - 1, bottom: height - 1 };
  }

  return { left, top, right, bottom };
}

function expandBounds(bounds, width, height, margin) {
  return {
    left: Math.max(0, bounds.left - margin),
    top: Math.max(0, bounds.top - margin),
    right: Math.min(width - 1, bounds.right + margin),
    bottom: Math.min(height - 1, bounds.bottom + margin)
  };
}
