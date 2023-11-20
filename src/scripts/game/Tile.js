import { gsap } from "gsap";
import { App } from "../system/App";

export class Tile {
  constructor(color) {
    this.color = color;
    this.sprite = App.sprite(this.color);
    this.spritesList = {
      default: App.sprite(this.color),
      left: this.loadSpriteSafely(this.color + "_left"),
      right: this.loadSpriteSafely(this.color + "_right"),
      top: this.loadSpriteSafely(this.color + "_top"),
      bottom: this.loadSpriteSafely(this.color + "_bottom"),
    };

    this.sprite.anchor.set(0.5);
  }

  loadSpriteSafely(spriteKey) {
    try {
      return App.sprite(spriteKey);
    } catch (error) {
      console.error(`Error loading sprite for ${spriteKey}:`, error);
      return this.sprite;
    }
  }

  setDirectionTexture(direction = "default") {
    const newTexture = this.spritesList[direction].texture;
    if (newTexture) {
      this.sprite.texture = newTexture;
    } else {
      console.error(`Missing texture for direction: ${direction}`);
    }
  }

  setPosition(position) {
    this.sprite.x = position.x;
    this.sprite.y = position.y;
  }

  moveTo(position, duration, delay, ease) {
    return new Promise((resolve) => {
      gsap.to(this.sprite, {
        duration,
        delay,
        ease,
        pixi: {
          x: position.x,
          y: position.y,
        },
        onComplete: () => {
          resolve();
        },
      });
    });
  }
  isNeighbour(tile) {
    return (
      Math.abs(this.field.row - tile.field.row) +
        Math.abs(this.field.col - tile.field.col) ===
      1
    );
  }

  remove() {
    if (!this.sprite) {
      return;
    }
    this.sprite.destroy();
    this.sprite = null;
    if (this.field) {
      this.field.tile = null;
      this.field = null;
    }
  }

  fallDownTo(position, delay) {
    return this.moveTo(position, 0.5, delay, "bounce.out");
  }
}
