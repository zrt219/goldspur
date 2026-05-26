import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "src/assets/source_reference/rider");
const fallbackDir = path.join(root, "goldspur_valley_playable_mvp_beta_prompt_pack/references/sprites/girl");
const walkOutDir = path.join(root, "src/assets/sprites/rider/walk_right");
const idleOutDir = path.join(root, "src/assets/sprites/rider/idle_breathe");
const frameSize = 256;
const frameCount = 8;
const maxBodyHeight = 224;
const maxBodyWidth = 172;
const bottomPad = 12;

const canonicalNames = [
  "cowgirl_in_confident_stride.png",
  "confident_cowgirl_in_mid_stride_pose.png",
  "confident_cowgirl_in_dynamic_stride.png",
  "confident_cowgirl_in_motion.png",
  "confident_walk_in_cowgirl_style.png",
  "confident_cowgirl_in_pixel_art.png",
  "cowgirl_in_motion.png",
  "confident_cowgirl_mid_stride_in_style.png",
  "western_cowgirl_sprite_in_motion.png",
  "confident_stroll_in_western_style.png"
];

await fs.mkdir(sourceDir, { recursive: true });
await fs.mkdir(walkOutDir, { recursive: true });
await fs.mkdir(idleOutDir, { recursive: true });
await bootstrapSourceReferences();

const sources = (await fs.readdir(sourceDir))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort()
  .map((file) => path.join(sourceDir, file));

if (sources.length === 0) {
  throw new Error(`No rider source PNGs found in ${sourceDir}`);
}

const selected = pickAnimationFrames(sources, frameCount);
await clearOutput(walkOutDir);
await clearOutput(idleOutDir);

const cleanedFrames = [];
for (let index = 0; index < selected.length; index += 1) {
  const output = path.join(walkOutDir, `walk_right_${String(index + 1).padStart(2, "0")}.png`);
  const cleaned = await cleanFrame(selected[index]);
  cleanedFrames.push(cleaned);
  await sharp(cleaned).toFile(output);
}

const idleSource = cleanedFrames[0];
for (let index = 0; index < frameCount; index += 1) {
  const output = path.join(idleOutDir, `idle_breathe_${String(index + 1).padStart(2, "0")}.png`);
  await makeBreathingFrame(idleSource, output, index);
}

console.log(`Built ${frameCount} rider walk frames and ${frameCount} idle frames.`);

async function bootstrapSourceReferences() {
  const existing = await safePngList(sourceDir);
  if (existing.length >= frameCount) return;

  const fallbackFiles = (await safePngList(fallbackDir))
    .filter((file) => file.includes("02_40"))
    .sort((a, b) => frameNumber(a) - frameNumber(b))
    .slice(0, canonicalNames.length);

  for (let index = 0; index < Math.min(canonicalNames.length, fallbackFiles.length); index += 1) {
    const destination = path.join(sourceDir, canonicalNames[index]);
    try {
      await fs.access(destination);
    } catch {
      await fs.copyFile(path.join(fallbackDir, fallbackFiles[index]), destination);
    }
  }
}

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

function pickAnimationFrames(files, count) {
  const preferred = canonicalNames
    .map((name) => files.find((file) => path.basename(file) === name))
    .filter(Boolean);
  const pool = preferred.length > 0 ? preferred : files;
  const strideOrder = preferred.length >= 8
    ? [0, 1, 2, 3, 4, 6, 8, 9]
    : Array.from({ length: pool.length }, (_value, index) => index);
  const ordered = strideOrder
    .map((index) => pool[index])
    .filter(Boolean);

  return Array.from({ length: count }, (_value, index) => ordered[index % ordered.length]);
}

async function clearOutput(directory) {
  for (const file of await safePngList(directory)) {
    await fs.unlink(path.join(directory, file));
  }
}

async function cleanFrame(input) {
  const image = sharp(input).ensureAlpha();
  const { width = 0, height = 0 } = await image.metadata();
  const raw = await image.raw().toBuffer();
  const transparent = Buffer.from(raw);
  const bounds = isolateForeground(transparent, width, height);

  const cropWidth = Math.max(1, bounds.right - bounds.left + 1);
  const cropHeight = Math.max(1, bounds.bottom - bounds.top + 1);
  const scale = Math.min(maxBodyWidth / cropWidth, maxBodyHeight / cropHeight);
  const resizedWidth = Math.max(1, Math.round(cropWidth * scale));
  const resizedHeight = Math.max(1, Math.round(cropHeight * scale));
  const left = Math.round((frameSize - resizedWidth) / 2);
  const top = frameSize - bottomPad - resizedHeight;

  const cleaned = await sharp(transparent, { raw: { width, height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width: cropWidth, height: cropHeight })
    .resize(resizedWidth, resizedHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const frame = await sharp({
    create: {
      width: frameSize,
      height: frameSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: cleaned, left, top }])
    .png()
    .toBuffer();

  return frame;
}

function isolateForeground(buffer, width, height) {
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const r = buffer[idx];
      const g = buffer[idx + 1];
      const b = buffer[idx + 2];
      const alpha = buffer[idx + 3];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const lightBackground = r > 238 && g > 238 && b > 238 && max - min < 16;
      const faintEdge = r > 248 && g > 248 && b > 248;

      if (alpha < 8 || lightBackground || faintEdge) {
        buffer[idx + 3] = 0;
        continue;
      }

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (left > right || top > bottom) {
    return { left: 0, top: 0, right: width - 1, bottom: height - 1 };
  }

  const margin = 10;
  return {
    left: Math.max(0, left - margin),
    top: Math.max(0, top - margin),
    right: Math.min(width - 1, right + margin),
    bottom: Math.min(height - 1, bottom + margin)
  };
}

async function makeBreathingFrame(source, output, index) {
  const phase = Math.sin((index / frameCount) * Math.PI * 2);
  const image = sharp(source).ensureAlpha();
  const { width = 0, height = 0 } = await image.metadata();
  const raw = await image.raw().toBuffer();
  const bounds = alphaBounds(raw, width, height);
  const cropWidth = bounds.right - bounds.left + 1;
  const cropHeight = bounds.bottom - bounds.top + 1;
  const breathe = Math.max(0, phase);
  const resizedWidth = Math.min(frameSize, Math.round(cropWidth * (1 + breathe * 0.012)));
  const resizedHeight = Math.min(frameSize, Math.round(cropHeight * (1 + breathe * 0.018)));
  const left = Math.round((frameSize - resizedWidth) / 2);
  const top = frameSize - bottomPad - resizedHeight - Math.round(breathe * 2);
  const frame = await sharp(raw, { raw: { width, height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width: cropWidth, height: cropHeight })
    .resize(resizedWidth, resizedHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: frameSize,
      height: frameSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: frame, left, top }])
    .png()
    .toFile(output);
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
