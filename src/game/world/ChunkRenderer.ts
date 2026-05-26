import Phaser from "phaser";
import { Palette } from "../art/Palette";
import { createStAnnAmbience, tileHumidityTint, type StAnnAmbienceInput, type StAnnAmbienceState } from "../systems/WeatherSystem";
import { CHUNK_SIZE, ChunkData, TILE_SIZE, TileType, WorldObjectData } from "./ChunkTypes";
import { createFallbackObject, isWildlifeSpawn, objectRenderSpec } from "./WorldObjectFactory";
import { HORSE_ANIMATION_KEYS } from "../systems/AnimationLoader";

export type RenderedChunk = {
  key: string;
  container: Phaser.GameObjects.Container;
  colliders: Phaser.GameObjects.GameObject[];
};

const TILE_TINTS: Record<TileType, number> = {
  grass: 0xffffff,
  grass_dark: 0xa4b98f,
  grass_light: 0xd0dc9d,
  dirt: 0xe5b477,
  dirt_path: 0xffffff,
  mud: 0x88624b,
  water: 0x4f9ab4,
  shallow_water: 0x80b8bd,
  stone: 0xa7a098,
  flowers: 0xf3d2ad,
  forest_floor: 0x91aa78,
  sand: 0xe3ca86,
  ranch_ground: 0xe1b778
};

export class ChunkRenderer {
  private ambience?: StAnnAmbienceState;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly collisionGroup: Phaser.Physics.Arcade.StaticGroup,
    ambience?: StAnnAmbienceInput
  ) {
    if (ambience) this.ambience = createStAnnAmbience(ambience);
  }

  setAmbience(ambience?: StAnnAmbienceInput): void {
    this.ambience = ambience ? createStAnnAmbience(ambience) : undefined;
  }

  render(chunk: ChunkData): RenderedChunk {
    const baseX = chunk.chunkX * CHUNK_SIZE;
    const baseY = chunk.chunkY * CHUNK_SIZE;
    const container = this.scene.add.container(baseX, baseY).setDepth(0);
    const colliders: Phaser.GameObjects.GameObject[] = [];

    chunk.tiles.forEach((row, tileY) => {
      row.forEach((tile, tileX) => {
        const sprite = this.scene.add.sprite(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, this.textureForTile(tile.type))
          .setDisplaySize(TILE_SIZE + 0.5, TILE_SIZE + 0.5)
          .setTint(this.tintForTile(tile.type, tile.variant))
          .setDepth(0);
        container.add(sprite);
        const detail = this.renderTileDetail(tile.type, tile.variant, tileX, tileY);
        if (detail) container.add(detail);
      });
    });

    chunk.objects.forEach((object) => {
      if (isWildlifeSpawn(object.type)) return;
      const child = this.renderObject(object);
      const spec = objectRenderSpec(object);
      (child as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth).setDepth(object.y + spec.depthOffset);
      container.add(child);
    });

    chunk.collisions.forEach((collision, index) => {
      const zone = this.scene.add.zone(baseX + collision.x, baseY + collision.y, collision.width, collision.height);
      this.scene.physics.add.existing(zone, true);
      zone.setData("chunkKey", `${chunk.chunkX},${chunk.chunkY}`);
      zone.setData("debugId", `collider:${index}`);
      this.collisionGroup.add(zone);
      colliders.push(zone);
    });

    return {
      key: `${chunk.chunkX},${chunk.chunkY}`,
      container,
      colliders
    };
  }

  private renderObject(object: WorldObjectData): Phaser.GameObjects.GameObject {
    const spec = objectRenderSpec(object);
    let child: Phaser.GameObjects.GameObject;
    if (spec.texture && this.scene.textures.exists(spec.texture)) {
      const sprite = this.scene.add.sprite(object.x, object.y, spec.texture)
        .setDisplaySize(spec.width, spec.height);
      if (spec.tint) sprite.setTint(spec.tint);
      if (object.type === "wild_horse" && this.scene.anims.exists(HORSE_ANIMATION_KEYS.idleBreathe)) {
        sprite.play(HORSE_ANIMATION_KEYS.idleBreathe, true);
      }
      child = sprite;
    } else {
      child = createFallbackObject(this.scene, object);
    }

    if (object.type === "sign") {
      const sign = child as Phaser.GameObjects.Sprite;
      const label = this.scene.add.text(object.x, object.y - 16, object.variant === 0 ? "Ranch" : "Trail", {
        fontFamily: "Georgia",
        fontSize: "13px",
        color: "#f5e6b8",
        stroke: "#15100a",
        strokeThickness: 3
      }).setOrigin(0.5);
      return this.scene.add.container(0, 0, [sign, label]);
    }

    return child;
  }

  private textureForTile(tile: TileType): string {
    if (tile === "dirt_path" || tile === "dirt" || tile === "ranch_ground" || tile === "sand") return "dirt_tile";
    if (tile === "water" || tile === "shallow_water") return this.scene.textures.exists("world_water") ? "world_water" : "grass_tile";
    if (tile === "stone") return this.scene.textures.exists("world_stone") ? "world_stone" : "dirt_tile";
    if (tile === "mud") return "dirt_tile";
    return "grass_tile";
  }

  private renderTileDetail(tile: TileType, variant: number, tileX: number, tileY: number): Phaser.GameObjects.GameObject | undefined {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;
    if (tile === "flowers" && this.scene.textures.exists("world_flowers")) {
      return this.scene.add.sprite(x, y + 5, "world_flowers")
        .setDisplaySize(34, 22)
        .setAlpha(0.72)
        .setDepth(0.35);
    }
    if ((tile === "forest_floor" || tile === "grass_dark") && variant % 5 === 0 && this.scene.textures.exists("world_tall_grass")) {
      return this.scene.add.sprite(x + (variant % 2 ? -4 : 5), y + 7, "world_tall_grass")
        .setDisplaySize(30, 23)
        .setAlpha(0.58)
        .setDepth(0.32);
    }
    if (tile === "mud" && variant % 3 === 0 && this.scene.textures.exists("world_rain_puddle")) {
      return this.scene.add.sprite(x, y + 4, "world_rain_puddle")
        .setDisplaySize(32, 13)
        .setAlpha(0.48)
        .setDepth(0.31);
    }
    if ((tile === "water" || tile === "shallow_water") && variant % 4 === 0 && this.scene.textures.exists("weather_ripple")) {
      return this.scene.add.sprite(x + 2, y + 1, "weather_ripple")
        .setDisplaySize(26, 10)
        .setAlpha(tile === "water" ? 0.58 : 0.38)
        .setDepth(0.36);
    }
    if (tile === "sand" && variant % 6 === 0 && this.scene.textures.exists("world_coconut_pile")) {
      return this.scene.add.sprite(x + 6, y + 8, "world_coconut_pile")
        .setDisplaySize(19, 14)
        .setAlpha(0.46)
        .setDepth(0.33);
    }
    return undefined;
  }

  private tintForTile(tile: TileType, variant: number): number {
    const base = TILE_TINTS[tile];
    const varied = variant % 3 === 0 ? base : Phaser.Display.Color.ValueToColor(base).brighten(variant % 2 === 0 ? 6 : -7).color;
    if (!this.ambience) return varied;
    let tint = tileHumidityTint(varied, this.ambience.humidity);
    if (this.ambience.timeOfDay === "night") tint = Phaser.Display.Color.ValueToColor(tint).darken(22).color;
    else if (this.ambience.timeOfDay === "dusk") tint = this.mixTint(tint, 0xd88a64, 0.14);
    else if (this.ambience.timeOfDay === "dawn") tint = this.mixTint(tint, 0xf2c27b, 0.1);
    if (this.ambience.rainIntensity > 0.2 && tile !== "water" && tile !== "shallow_water") tint = Phaser.Display.Color.ValueToColor(tint).darken(Math.round(this.ambience.rainIntensity * 10)).color;
    return tint;
  }

  private mixTint(fromTint: number, toTint: number, amount: number): number {
    const from = Phaser.Display.Color.ValueToColor(fromTint);
    const to = Phaser.Display.Color.ValueToColor(toTint);
    return Phaser.Display.Color.GetColor(
      Math.round(from.red + (to.red - from.red) * amount),
      Math.round(from.green + (to.green - from.green) * amount),
      Math.round(from.blue + (to.blue - from.blue) * amount)
    );
  }
}
