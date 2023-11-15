import * as PIXI from "pixi.js";
import { App } from "../system/App";
import { Field } from "./Field";
import { Tile } from "./Tile";
import { TileFactory } from "./TileFactory";
import debounce from "lodash/debounce";

export class Board {
  constructor() {
    this.container = new PIXI.Container();
    this.fields = [];
    this.rows = App.config.board.rows;
    this.cols = App.config.board.cols;
    this.create();
    this.adjustPosition();
    this.startTouch = null;
  }

  create() {
    this.createFields();
    this.createTiles();
  }

  createTiles() {
    this.fields.forEach((field) => this.createTile(field));
  }

  createTile(field) {
    const tile = TileFactory.generate();
    field.setTile(tile);
    this.container.addChild(tile.sprite);

    tile.sprite.interactive = true;
    tile.sprite.tile = tile;

    tile.sprite.on("touchstart", (event) => {
      event.data.originalEvent.preventDefault();

      this.startTouch = {
        x: event.data.originalEvent.changedTouches[0].clientX,
        y: event.data.originalEvent.changedTouches[0].clientY,
      };

      this.currentTile = event.currentTarget.tile;
      this.container.emit("tile-touch-start", event.currentTarget.tile);
    });

    tile.sprite.on("touchmove", (event) => {
      event.data.originalEvent.preventDefault();
      const tile = this.currentTile;

      const currentTouch = {
        x: event.data.originalEvent.changedTouches[0].clientX,
        y: event.data.originalEvent.changedTouches[0].clientY,
      };

      if (!this.debounceFlag) {
        const debouncedFunction = debounce(() => {
          const deltaX = currentTouch.x - this.startTouch.x;
          const deltaY = currentTouch.y - this.startTouch.y;

          let field;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            field = this.getField(
              tile.field.row,
              deltaX > 0 ? tile.field.col + 1 : tile.field.col - 1
            );
          } else {
            field = this.getField(
              deltaY > 0 ? tile.field.row + 1 : tile.field.row - 1,
              tile.field.col
            );
          }

          if (field) {
            this.container.emit("tile-touch-start", field.tile);
          }

          tile.sprite.off("touchmove");
          this.debounceFlag = false; // Reset the flag after the debounced function runs
        }, 100);

        debouncedFunction();
        this.debounceFlag = true; // Set the flag to prevent subsequent calls
      }
    });

    return tile;
  }

  getField(row, col) {
    return this.fields.find((field) => field.row === row && field.col === col);
  }

  createFields() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.createField(row, col);
      }
    }
  }

  createField(row, col) {
    const field = new Field(row, col);
    this.fields.push(field);
    this.container.addChild(field.sprite);
  }

  adjustPosition() {
    this.fieldSize = this.fields[0].sprite.width;
    this.width = this.cols * this.fieldSize;
    this.height = this.rows * this.fieldSize;
    this.container.x =
      (window.innerWidth - this.width) / 2 + this.fieldSize / 2;
    this.container.y =
      (window.innerHeight - this.height) / 2 + this.fieldSize / 2;
  }

  swap(tile1, tile2) {
    const tile1Field = tile1.field;
    const tile2Field = tile2.field;

    tile1Field.tile = tile2;
    tile2.field = tile1Field;

    tile2Field.tile = tile1;
    tile1.field = tile2Field;
  }
}
