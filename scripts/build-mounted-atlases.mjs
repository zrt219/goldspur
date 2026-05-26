import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceRoot = path.join(root, "public/assets/sprites/mounted");
const outputRoot = path.join(root, "public/assets/sprites/mounted_atlas");
const frameWidth = 384;
const frameHeight = 384;

const atlases = [
  { name: "idle_breathe", directory: "idle_breathe", basename: "idle_breathe" },
  { name: "ride_right", directory: "ride_right", basename: "ride_right" },
  { name: "jump", directory: "jump", basename: "jump" }
];

await fs.mkdir(outputRoot, { recursive: true });

for (const atlas of atlases) {
  const inputs = Array.from({ length: 10 }, (_value, index) => {
    const frame = String(index + 1).padStart(2, "0");
    return path.join(sourceRoot, atlas.directory, `${atlas.basename}_${frame}.png`);
  });
  const composite = inputs.map((input, index) => ({
    input,
    left: index * frameWidth,
    top: 0
  }));
  await sharp({
    create: {
      width: frameWidth * inputs.length,
      height: frameHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composite)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(outputRoot, `${atlas.name}.png`));
}

console.log(`Mounted atlases written to ${outputRoot}`);
