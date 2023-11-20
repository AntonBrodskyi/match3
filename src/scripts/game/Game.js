import * as PIXI from "pixi.js";
import gsap from "gsap";
import { App } from "../system/App";
import { Board } from "./Board";
import { CombinationManager } from "./CombinationManager";

export class Game {
  constructor() {
    this.container = new PIXI.Container();
    this.createBackground();

    this.scoresText = new PIXI.Text("Scores: 0", App.config.fontStyle);
    this.scoresText.position.set(20, 10);
    this.container.addChild(this.scoresText);

    this.goalsText = new PIXI.Text("Goal: 0", App.config.fontStyle);
    this.goalsText.position.set(
      window.innerWidth - this.goalsText.width - 100,
      10
    );
    this.container.addChild(this.goalsText);

    this.board = new Board();
    this.container.addChild(this.board.container);

    this.board.container.on("tile-touch-start", this.onTileClick.bind(this));

    this.combinationManager = new CombinationManager(this.board);
    this.removeStartMatches();

    this.scores = 0;
    this.goals = 100; // Set your initial goal count here
    this.updateScoresAndGoals();

    this.winImage = App.sprite("win");
    this.winImage.position.set(
      window.innerWidth / 2 - this.winImage.width / 2,
      window.innerHeight / 2 - this.winImage.height / 2
    );
    this.winImage.interactive = true;
    this.winImage.buttonMode = true;
    this.winImage.visible = false;
    this.winImage.on("pointerdown", this.restartGame.bind(this));
    this.container.addChild(this.winImage);
  }

  removeStartMatches() {
    let matches = this.combinationManager.getMatches();

    while (matches.length) {
      this.removeMatches(matches);

      const fields = this.board.fields.filter((field) => field.tile === null);

      fields.forEach((field) => {
        this.board.createTile(field);
      });

      matches = this.combinationManager.getMatches();
    }
  }

  createBackground() {
    this.bg = App.sprite("bg");
    this.bg.width = window.innerWidth;
    this.bg.height = window.innerHeight;
    this.container.addChild(this.bg);
  }

  onTileClick(tile) {
    if (this.disabled) {
      return;
    }
    if (this.selectedTile) {
      // select new tile or make swap
      if (!this.selectedTile.isNeighbour(tile)) {
        this.clearSelection(tile);
        this.selectTile(tile);
      } else {
        console.log("switch");
        let redFields = this.board.fields.filter(
          (field) => field?.tile?.color === "red"
        );

        if (this.selectedTile?.color === "red") {
          redFields.forEach((field) => {
            field?.tile?.setDirectionTexture(this.board.currentDirection);
          });

          setTimeout(() => {
            // Use the captured value of 'field' here
            console.log(redFields);
            redFields.forEach((field) => {
              field?.tile?.setDirectionTexture();
            });
          }, 500);
        }

        this.swap(this.selectedTile, tile);
      }
    } else {
      this.selectTile(tile);
    }
  }

  swap(selectedTile, tile, reverse) {
    this.disabled = true;
    selectedTile.sprite.zIndex = 2;

    selectedTile.moveTo(tile.field.position, 0.2);

    this.clearSelection();

    tile.moveTo(selectedTile.field.position, 0.2).then(() => {
      this.board.swap(selectedTile, tile);

      if (!reverse) {
        const matches = this.combinationManager.getMatches();
        if (matches.length) {
          this.processMatches(matches);
        } else {
          this.swap(tile, selectedTile, true);
        }
      } else {
        this.disabled = false;
      }
    });
  }

  removeMatches(matches) {
    matches.forEach((match) => {
      match.forEach((tile) => {
        tile.remove();
      });
    });
  }

  processMatches(matches) {
    this.removeMatches(matches);

    this.scores += matches.length * 10;
    this.updateScoresAndGoals();

    if (this.scores >= this.goals) {
      this.handleGoalAchievement();
    }

    this.processFallDown()
      .then(() => this.addTiles())
      .then(() => this.onFallDownOver());
  }

  handleGoalAchievement() {
    if (!this.winImage.visible) {
      this.winImage.visible = true;
      gsap.from(this.winImage, {
        duration: 0.8,
        y: -100,
        ease: "bounce.out",
        onComplete: () => {
          this.container.addChild(this.winImage);
        },
      });
    }
  }

  onFallDownOver() {
    const matches = this.combinationManager.getMatches();

    if (matches.length) {
      this.processMatches(matches);
    } else {
      this.disabled = false;
    }
  }

  addTiles() {
    return new Promise((resolve) => {
      const fields = this.board.fields.filter((field) => field.tile === null);
      let total = fields.length;
      let completed = 0;

      fields.forEach((field) => {
        const tile = this.board.createTile(field);
        tile.sprite.y = -500;
        const delay = (Math.random() * 2) / 10 + 0.3 / (field.row + 1);
        tile.fallDownTo(field.position, delay).then(() => {
          ++completed;
          if (completed >= total) {
            resolve();
          }
        });
      });
    });
    ``;
  }

  processFallDown() {
    return new Promise((resolve) => {
      let completed = 0;
      let started = 0;

      for (let row = this.board.rows - 1; row >= 0; row--) {
        for (let col = this.board.cols - 1; col >= 0; col--) {
          const field = this.board.getField(row, col);

          if (!field.tile) {
            ++started;
            this.fallDownTo(field).then(() => {
              ++completed;
              if (completed >= started) {
                resolve();
              }
            });
          }
        }
      }
    });
  }

  fallDownTo(emptyField) {
    for (let row = emptyField.row - 1; row >= 0; row--) {
      let fallingField = this.board.getField(row, emptyField.col);

      if (fallingField.tile) {
        const fallingTile = fallingField.tile;
        fallingTile.field = emptyField;
        emptyField.tile = fallingTile;
        fallingField.tile = null;
        return fallingTile.fallDownTo(emptyField.position);
      }
    }

    return Promise.resolve();
  }

  clearSelection() {
    if (this.selectedTile) {
      this.selectedTile.field.unselect();
      this.selectedTile = null;
    }
  }

  selectTile(tile) {
    this.selectedTile = tile;
    this.selectedTile.field.select();
  }

  updateScoresAndGoals() {
    this.scoresText.text = `Scores: ${this.scores}`;
    this.goalsText.text = `Goals: ${this.goals}`;
  }

  restartGame() {
    // Reset game state
    this.scores = 0;
    this.goals = 100; // Set your initial goal count here
    this.level = 1;

    // Hide win image
    this.winImage.visible = false;

    // Update scores, goals, and level display
    this.updateScoresAndGoals();

    // Remove existing tiles and start a new game
    this.removeStartMatches();
  }
}
