import Phaser from "phaser";

export type InteractionTarget<T> = {
  id: string;
  label: string;
  prompt: string;
  x: number;
  y: number;
  radius?: number;
  data: T;
};

export class InteractionSystem<T> {
  constructor(private readonly targets: InteractionTarget<T>[]) {}

  nearest(point: Phaser.Math.Vector2, maxRadius = 96): InteractionTarget<T> | null {
    let nearest: InteractionTarget<T> | null = null;
    let best = Number.MAX_SAFE_INTEGER;
    for (const target of this.targets) {
      const distance = Phaser.Math.Distance.Between(point.x, point.y, target.x, target.y);
      const radius = target.radius ?? maxRadius;
      if (distance <= radius && distance < best) {
        nearest = target;
        best = distance;
      }
    }
    return nearest;
  }
}
