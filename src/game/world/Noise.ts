import { randomForCoord } from "./SeededRandom";

function smoothStep(value: number): number {
  return value * value * (3 - 2 * value);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function valueNoise2D(seed: string, x: number, y: number, scale: number, salt = "noise"): number {
  const scaledX = x / scale;
  const scaledY = y / scale;
  const x0 = Math.floor(scaledX);
  const y0 = Math.floor(scaledY);
  const xf = smoothStep(scaledX - x0);
  const yf = smoothStep(scaledY - y0);
  const a = randomForCoord(seed, x0, y0, salt);
  const b = randomForCoord(seed, x0 + 1, y0, salt);
  const c = randomForCoord(seed, x0, y0 + 1, salt);
  const d = randomForCoord(seed, x0 + 1, y0 + 1, salt);
  return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
}

export function layeredNoise2D(seed: string, x: number, y: number, salt = "layered"): number {
  return (
    valueNoise2D(seed, x, y, 3.5, `${salt}:wide`) * 0.55 +
    valueNoise2D(seed, x, y, 1.45, `${salt}:mid`) * 0.3 +
    valueNoise2D(seed, x, y, 0.72, `${salt}:fine`) * 0.15
  );
}
