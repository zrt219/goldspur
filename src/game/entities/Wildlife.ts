import Phaser from "phaser";
import { pickJamaicanBird } from "../data/jamaicaContent";
import { LoadedWorldObject } from "../world/ChunkManager";
import { WorldObjectData } from "../world/ChunkTypes";

export type WildlifeKind = "rabbit" | "snake" | "coyote" | "bird" | "goat" | "mongoose" | "frigatebird" | "pelican";
export type WildlifeState = "idle" | "wander" | "flee" | "retreat" | "fly";
export type WildlifeSpawnType = Extract<
  WorldObjectData["type"],
  "rabbit_spawn" | "snake_spawn" | "coyote_spawn" | "bird_spawn" | "goat_spawn" | "mongoose_spawn" | "frigatebird_spawn" | "pelican_spawn"
>;

export type WildlifeThreat = {
  x: number;
  y: number;
};

export type WildlifeSpawn = {
  id?: string;
  type: WildlifeSpawnType;
  variant?: number;
  worldX: number;
  worldY: number;
};

type WildlifeProfile = {
  texture: string;
  width: number;
  height: number;
  idleMs: [number, number];
  wanderDistance: [number, number];
  wanderSpeed: number;
  fleeSpeed: number;
  noticeRadius: number;
  calmRadius: number;
  roamRadius: number;
  depthOffset: number;
  tint?: number;
};

const PROFILES: Record<WildlifeKind, WildlifeProfile> = {
  rabbit: {
    texture: "world_coney",
    width: 46,
    height: 32,
    idleMs: [900, 2200],
    wanderDistance: [26, 88],
    wanderSpeed: 42,
    fleeSpeed: 138,
    noticeRadius: 116,
    calmRadius: 190,
    roamRadius: 150,
    depthOffset: 6
  },
  snake: {
    texture: "world_jamaican_boa",
    width: 62,
    height: 26,
    idleMs: [1300, 3200],
    wanderDistance: [22, 64],
    wanderSpeed: 24,
    fleeSpeed: 72,
    noticeRadius: 92,
    calmRadius: 150,
    roamRadius: 120,
    depthOffset: 4
  },
  coyote: {
    texture: "world_feral_dog",
    width: 70,
    height: 45,
    idleMs: [1100, 2600],
    wanderDistance: [44, 128],
    wanderSpeed: 48,
    fleeSpeed: 108,
    noticeRadius: 132,
    calmRadius: 230,
    roamRadius: 190,
    depthOffset: 10
  },
  bird: {
    texture: "world_jamaican_bird",
    width: 36,
    height: 28,
    idleMs: [700, 1900],
    wanderDistance: [32, 110],
    wanderSpeed: 56,
    fleeSpeed: 150,
    noticeRadius: 104,
    calmRadius: 210,
    roamRadius: 170,
    depthOffset: 34
  },
  goat: {
    texture: "world_goat",
    width: 58,
    height: 42,
    idleMs: [1200, 2800],
    wanderDistance: [24, 76],
    wanderSpeed: 34,
    fleeSpeed: 96,
    noticeRadius: 100,
    calmRadius: 180,
    roamRadius: 145,
    depthOffset: 8
  },
  mongoose: {
    texture: "world_mongoose",
    width: 52,
    height: 25,
    idleMs: [600, 1600],
    wanderDistance: [34, 112],
    wanderSpeed: 66,
    fleeSpeed: 158,
    noticeRadius: 118,
    calmRadius: 210,
    roamRadius: 175,
    depthOffset: 7
  },
  frigatebird: {
    texture: "world_frigatebird",
    width: 58,
    height: 34,
    idleMs: [500, 1400],
    wanderDistance: [48, 140],
    wanderSpeed: 72,
    fleeSpeed: 172,
    noticeRadius: 132,
    calmRadius: 240,
    roamRadius: 210,
    depthOffset: 46
  },
  pelican: {
    texture: "world_pelican",
    width: 66,
    height: 42,
    idleMs: [900, 2100],
    wanderDistance: [34, 118],
    wanderSpeed: 48,
    fleeSpeed: 126,
    noticeRadius: 112,
    calmRadius: 220,
    roamRadius: 190,
    depthOffset: 38
  }
};

export class Wildlife {
  readonly id: string;
  readonly kind: WildlifeKind;
  readonly sprite: Phaser.GameObjects.Sprite;

  private state: WildlifeState = "idle";
  private stateUntil = 0;
  private target = new Phaser.Math.Vector2();
  private readonly spawn = new Phaser.Math.Vector2();
  private readonly roamBounds: Phaser.Geom.Rectangle;
  private readonly profile: WildlifeProfile;
  private readonly baseScaleX: number;
  private readonly baseScaleY: number;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    spawn: LoadedWorldObject | WildlifeSpawn,
    roamRadius?: number
  ) {
    const normalized = normalizeSpawn(spawn);
    this.id = normalized.id ?? `${normalized.type}:${Math.round(normalized.worldX)},${Math.round(normalized.worldY)}`;
    this.kind = kindFromSpawnType(normalized.type);
    this.profile = PROFILES[this.kind];
    this.spawn.set(normalized.worldX, normalized.worldY);
    const radius = roamRadius ?? this.profile.roamRadius;
    this.roamBounds = new Phaser.Geom.Rectangle(normalized.worldX - radius, normalized.worldY - radius, radius * 2, radius * 2);

    this.sprite = scene.add.sprite(normalized.worldX, normalized.worldY, this.profile.texture)
      .setDisplaySize(this.profile.width, this.profile.height)
      .setOrigin(0.5, 0.76);
    if (this.profile.tint) this.sprite.setTint(this.profile.tint);
    this.sprite.setData("wildlifeId", this.id);
    this.sprite.setData("wildlifeKind", this.kind);
    if (this.kind === "pelican") this.sprite.setData("wildlifeName", "Brown pelican");
    else if (this.kind === "frigatebird") this.sprite.setData("wildlifeName", "Magnificent frigatebird");
    else if (this.kind === "bird") this.sprite.setData("wildlifeName", pickJamaicanBird(this.id));
    if (normalized.variant !== undefined) this.sprite.setData("variant", normalized.variant);
    this.baseScaleX = this.sprite.scaleX;
    this.baseScaleY = this.sprite.scaleY;

    this.enterIdle(scene.time.now);
    this.sortDepth();
  }

  update(time: number, deltaOrThreat: number | WildlifeThreat = this.scene.game.loop.delta, maybeThreat?: WildlifeThreat): void {
    if (this.destroyed || !this.sprite.active) return;

    const delta = typeof deltaOrThreat === "number" ? deltaOrThreat : this.scene.game.loop.delta;
    const threat = typeof deltaOrThreat === "number" ? maybeThreat : deltaOrThreat;
    this.reactToThreat(time, threat);

    if (this.state === "wander" || this.state === "flee" || this.state === "retreat" || this.state === "fly") {
      this.moveTowardTarget(delta);
    }

    if (time >= this.stateUntil && (this.state === "idle" || this.state === "wander")) {
      this.nextAmbientState(time);
    }

    this.animate(time);
    this.sortDepth();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.sprite.destroy();
  }

  private nextAmbientState(time: number): void {
    if (Phaser.Math.Between(0, 100) < 55) this.enterIdle(time);
    else this.enterWander(time);
  }

  private reactToThreat(time: number, threat?: WildlifeThreat): void {
    if (!threat) return;
    const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, threat.x, threat.y);
    if (distance <= this.profile.noticeRadius) {
      if (this.isBirdKind()) this.enterFly(time, threat);
      else if (this.kind === "rabbit" || this.kind === "mongoose") this.enterFlee(time, threat);
      else this.enterRetreat(time, threat);
      return;
    }
    if ((this.state === "flee" || this.state === "retreat" || this.state === "fly") && distance >= this.profile.calmRadius) {
      this.enterIdle(time);
    }
  }

  private enterIdle(time: number): void {
    this.state = "idle";
    this.stateUntil = time + Phaser.Math.Between(this.profile.idleMs[0], this.profile.idleMs[1]);
    this.target.set(this.sprite.x, this.sprite.y);
  }

  private enterWander(time: number): void {
    this.state = "wander";
    this.stateUntil = time + Phaser.Math.Between(1600, 3600);
    const distance = Phaser.Math.Between(this.profile.wanderDistance[0], this.profile.wanderDistance[1]);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.setTarget(this.sprite.x + Math.cos(angle) * distance, this.sprite.y + Math.sin(angle) * distance);
  }

  private enterFlee(time: number, threat: WildlifeThreat): void {
    this.state = "flee";
    this.stateUntil = time + 1200;
    this.setAwayTarget(threat, this.profile.roamRadius * 0.9);
  }

  private enterRetreat(time: number, threat: WildlifeThreat): void {
    this.state = "retreat";
    this.stateUntil = time + 1500;
    this.setAwayTarget(threat, this.profile.roamRadius * 0.65);
  }

  private enterFly(time: number, threat: WildlifeThreat): void {
    this.state = "fly";
    this.stateUntil = time + 1700;
    this.setAwayTarget(threat, this.profile.roamRadius);
  }

  private setAwayTarget(threat: WildlifeThreat, distance: number): void {
    const away = new Phaser.Math.Vector2(this.sprite.x - threat.x, this.sprite.y - threat.y);
    if (away.lengthSq() === 0) away.set(Phaser.Math.FloatBetween(-1, 1), Phaser.Math.FloatBetween(-1, 1));
    away.normalize();
    this.setTarget(this.sprite.x + away.x * distance, this.sprite.y + away.y * distance);
  }

  private setTarget(x: number, y: number): void {
    this.target.set(
      Phaser.Math.Clamp(x, this.roamBounds.left, this.roamBounds.right),
      Phaser.Math.Clamp(y, this.roamBounds.top, this.roamBounds.bottom)
    );
  }

  private moveTowardTarget(delta: number): void {
    const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, this.target.x, this.target.y);
    if (distance < 4) {
      if (this.state === "wander") this.enterIdle(this.scene.time.now);
      return;
    }

    const speed = this.state === "flee" || this.state === "retreat" || this.state === "fly"
      ? this.profile.fleeSpeed
      : this.profile.wanderSpeed;
    const step = Math.min(distance, speed * (delta / 1000));
    const direction = new Phaser.Math.Vector2(this.target.x - this.sprite.x, this.target.y - this.sprite.y).normalize();
    this.sprite.setPosition(this.sprite.x + direction.x * step, this.sprite.y + direction.y * step);
    if (Math.abs(direction.x) > 0.08) this.sprite.setFlipX(direction.x < 0);
  }

  private animate(time: number): void {
    const pulse = Math.sin(time / 110);
    if (this.state === "fly" || this.isBirdKind()) {
      this.sprite.setAngle(Math.sin(time / 95) * 5);
      this.sprite.setScale(this.baseScaleX * (1 + pulse * 0.05), this.baseScaleY * (1 - pulse * 0.03));
      return;
    }
    this.sprite.setScale(this.baseScaleX, this.baseScaleY);
    this.sprite.setAngle(this.state === "idle" ? 0 : Math.sin(time / 130) * 2);
  }

  private sortDepth(): void {
    this.sprite.setDepth(this.sprite.y + this.profile.depthOffset);
  }

  private isBirdKind(): boolean {
    return this.kind === "bird" || this.kind === "frigatebird" || this.kind === "pelican";
  }
}

export function isWildlifeSpawnObject(object: WorldObjectData): object is WorldObjectData & { type: WildlifeSpawnType } {
  return object.type === "rabbit_spawn"
    || object.type === "snake_spawn"
    || object.type === "coyote_spawn"
    || object.type === "bird_spawn"
    || object.type === "goat_spawn"
    || object.type === "mongoose_spawn"
    || object.type === "frigatebird_spawn"
    || object.type === "pelican_spawn";
}

export function kindFromSpawnType(type: WildlifeSpawnType): WildlifeKind {
  if (type === "rabbit_spawn") return "rabbit";
  if (type === "snake_spawn") return "snake";
  if (type === "coyote_spawn") return "coyote";
  if (type === "goat_spawn") return "goat";
  if (type === "mongoose_spawn") return "mongoose";
  if (type === "frigatebird_spawn") return "frigatebird";
  if (type === "pelican_spawn") return "pelican";
  return "bird";
}

function normalizeSpawn(spawn: LoadedWorldObject | WildlifeSpawn): WildlifeSpawn {
  if ("object" in spawn) {
    if (!isWildlifeSpawnObject(spawn.object)) {
      throw new Error(`Cannot create Wildlife from non-wildlife object type: ${spawn.object.type}`);
    }
    return {
      id: spawn.object.id,
      type: spawn.object.type,
      variant: spawn.object.variant,
      worldX: spawn.worldX,
      worldY: spawn.worldY
    };
  }
  return spawn;
}
