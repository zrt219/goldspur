import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "src/assets/source_reference/horse");
const fallbackDir = path.join(root, "goldspur_valley_playable_mvp_beta_prompt_pack/references/sprites");
const outDir = path.join(root, "src/assets/sprites/horse");
const idleOutDir = path.join(outDir, "idle_breathe");
const walkOutDir = path.join(outDir, "walk_right");
const grazeOutDir = path.join(outDir, "graze");
const frameSize = 256;
const frameCount = 8;

const canonicalNames = [
  "cute_cartoon_horse_sprite_design.png",
  "top_down_view_of_a_black_horse.png",
  "stylized_palomino_horse_with_saddle.png",
  "dapple_gray_horse_with_tack.png",
  "stylized_pinto_horse_game_sprite.png"
];

await fs.mkdir(sourceDir, { recursive: true });
await fs.mkdir(outDir, { recursive: true });
await fs.mkdir(idleOutDir, { recursive: true });
await fs.mkdir(walkOutDir, { recursive: true });
await fs.mkdir(grazeOutDir, { recursive: true });
await bootstrapSourceReferences();

const sources = (await fs.readdir(sourceDir))
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort()
  .map((file) => path.join(sourceDir, file));

if (sources.length === 0) {
  throw new Error(`No horse source PNGs found in ${sourceDir}`);
}

const primary = sources.find((file) => path.basename(file) === "stylized_palomino_horse_with_saddle.png") ?? sources[0];
const idleFrame = await cleanHorse(primary);

await clearOutput(idleOutDir);
await clearOutput(walkOutDir);
await clearOutput(grazeOutDir);

await sharp(idleFrame).png().toFile(path.join(outDir, "horse_idle.png"));
await makeHorsePose(idleFrame, path.join(outDir, "horse_graze.png"), {
  scaleX: 0.96,
  scaleY: 0.9,
  offsetX: 0,
  offsetY: 22
});

for (let index = 0; index < frameCount; index += 1) {
  const suffix = String(index + 1).padStart(2, "0");
  await makeIdleFrame(idleFrame, path.join(idleOutDir, `idle_breathe_${suffix}.png`), index);
  await makeWalkFrame(idleFrame, path.join(walkOutDir, `walk_right_${suffix}.png`), index);
  await makeGrazeFrame(idleFrame, path.join(grazeOutDir, `graze_${suffix}.png`), index);
}

console.log(`Built horse idle, walk, and graze sprites in ${path.relative(root, outDir)}`);

async function bootstrapSourceReferences() {
  const existing = await safePngList(sourceDir);
  if (existing.length >= 3) return;

  const fallbackFiles = (await safePngList(fallbackDir))
    .filter((file) => file.includes("02_33"))
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

async function clearOutput(directory) {
  for (const file of await safePngList(directory)) {
    await fs.unlink(path.join(directory, file));
  }
}

async function cleanHorse(input) {
  const image = sharp(input).ensureAlpha();
  const { width = 0, height = 0 } = await image.metadata();
  const raw = await image.raw().toBuffer();
  const transparent = Buffer.from(raw);
  const bounds = isolateForeground(transparent, width, height);
  const cropWidth = Math.max(1, bounds.right - bounds.left + 1);
  const cropHeight = Math.max(1, bounds.bottom - bounds.top + 1);

  const cleaned = await sharp(transparent, { raw: { width, height, channels: 4 } })
    .extract({ left: bounds.left, top: bounds.top, width: cropWidth, height: cropHeight })
    .resize(190, 218, { fit: "inside", kernel: sharp.kernel.lanczos3 })
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
    .composite([{ input: cleaned, gravity: "center" }])
    .png()
    .toBuffer();
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
      const lightBackground = r > 238 && g > 238 && b > 238 && max - min < 18;
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

  const margin = 12;
  return {
    left: Math.max(0, left - margin),
    top: Math.max(0, top - margin),
    right: Math.min(width - 1, right + margin),
    bottom: Math.min(height - 1, bottom + margin)
  };
}

async function makeIdleFrame(source, output, index) {
  const phase = Math.sin((index / frameCount) * Math.PI * 2);
  await makeHorsePose(source, output, {
    scaleX: 1 + Math.max(0, phase) * 0.012,
    scaleY: 1 - Math.max(0, phase) * 0.018,
    offsetX: 0,
    offsetY: Math.round(Math.max(0, phase) * 3)
  });
}

async function makeWalkFrame(source, output, index) {
  const phase = Math.sin((index / frameCount) * Math.PI * 2);
  const stride = Math.sin((index / frameCount) * Math.PI * 4);
  await makeHorsePose(source, output, {
    scaleX: 1 + stride * 0.018,
    scaleY: 1 - Math.abs(stride) * 0.012,
    offsetX: Math.round(stride * 3),
    offsetY: Math.round(phase * 4)
  });
}

async function makeGrazeFrame(source, output, index) {
  const phase = Math.sin((index / frameCount) * Math.PI * 2);
  await makeHorsePose(source, output, {
    scaleX: 0.96 + Math.max(0, phase) * 0.01,
    scaleY: 0.9 - Math.max(0, phase) * 0.02,
    offsetX: Math.round(phase * 2),
    offsetY: 22 + Math.round(Math.max(0, phase) * 5)
  });
}

async function makeHorsePose(source, output, pose) {
  const image = sharp(source).ensureAlpha();
  const { width = 0, height = 0 } = await image.metadata();
  const raw = await image.raw().toBuffer();
  const bounds = alphaBounds(raw, width, height);
  const cropWidth = bounds.right - bounds.left + 1;
  const cropHeight = bounds.bottom - bounds.top + 1;
  const resizedWidth = Math.min(frameSize, Math.max(1, Math.round(cropWidth * pose.scaleX)));
  const resizedHeight = Math.min(frameSize, Math.max(1, Math.round(cropHeight * pose.scaleY)));
  const left = Math.round((frameSize - resizedWidth) / 2 + pose.offsetX);
  const top = Math.round((frameSize - resizedHeight) / 2 + pose.offsetY);
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
