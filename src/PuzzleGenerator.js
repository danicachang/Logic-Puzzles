import * as Constants from "./constants.js";
import * as Utils from "./utils.js";
import PuzzleSolver from "./PuzzleSolver.js";

class PuzzleGenerator {
  constructor(size, numPerRow) {
    this.size = size;
    this.numPerRow = numPerRow;
    this.puzzle = Utils.empty2DArray(size, "A");
    this.puzzleState = Utils.empty2DArray(size, Constants.emptyState);
    this.history = [Utils.empty2DArray(size, Constants.emptyState)];
    this.count = 0; // prevent infinite loops
    this.errorCount = 0;
  }
  createPuzzle() {
    this.createSolution();
    this.growColors();
    if (this.numPerRow > 1) this.combineColors();
    this.allowOnlyOneSolution();
  }

  testCombineColorErrorRate() {
    var tries = 1000;
    this.errorCount = 0;
    for (let i = 0; i < tries; i++) {
      this.createPuzzle();
    }
    console.log("Errors:", this.errorCount, tries);
  }

  createSolution() {
    var solver = new PuzzleSolver(this.puzzle, this.numPerRow, { ignoreColors: true });
    var result = solver.solve();
    this.puzzleState = result.solutions[0];
  }

  growColors() {
    var growLocations = this.initializeColors();
    this.growToLocations(growLocations);
  }

  initializeColors() {
    var count = 0;
    var growLocations = [];
    this.puzzle = this.puzzleState.map((row, i) => {
      return row.map((value, j) => {
        if (value === Constants.onState) {
          growLocations.push({ i: i, j: j });
          return Utils.numToAlpha(count++);
        }
        return false;
      });
    });
    return growLocations;
  }

  growToLocations(growLocations) {
    this.count = 0;
    while (growLocations.length > 0 && this.count < 1000) {
      //console.log(this.count, growLocations.slice());
      const randomIndex =
        this.numPerRow === 1 && this.count < this.size
          ? this.count
          : Utils.getRandomInt(growLocations.length);
      this.count++;
      const loc = growLocations[randomIndex];
      const value = this.puzzle[loc.i][loc.j];
      var directions = Utils.shuffle([
        { i: -1, j: 0 },
        { i: 1, j: 0 },
        { i: 0, j: -1 },
        { i: 0, j: 1 },
      ]);
      var grew = directions.some((direction) => {
        const i = loc.i + direction.i;
        const j = loc.j + direction.j;
        if (this.growToLocation(i, j, value)) {
          growLocations.push({ i: i, j: j });
          return true;
        }
        return false;
      });
      if (!grew) {
        growLocations.splice(randomIndex, 1);
      }
    }
  }

  growToLocation(i, j, value) {
    if (Utils.withinBounds(i, j, this.size) && !this.puzzle[i][j]) {
      this.puzzle[i][j] = value;
      return true;
    }
    return false;
  }

  combineColors() {
    var adjacent = {};
    this.puzzle.forEach((row, i) => {
      row.forEach((value, j) => {
        if (!(value in adjacent)) adjacent[value] = new Set();

        var directions = [
          { i: -1, j: 0 },
          { i: 1, j: 0 },
          { i: 0, j: -1 },
          { i: 0, j: 1 },
        ];
        directions.forEach((direction) => {
          const x = i + direction.i;
          const y = j + direction.j;
          if (Utils.withinBounds(x, y, this.size)) {
            var neighborValue = this.puzzle[x][y];
            if (neighborValue !== value) adjacent[value].add(neighborValue);
          }
        });
      });
    });
    var sortedAdjacent = Object.entries(adjacent).sort(([A, setA], [B, setB]) => {
      return setA.size - setB.size;
    });
    //console.log(this.puzzle);
    //console.log(sortedAdjacent);

    var colorMapping = {};
    var success = combine(sortedAdjacent);

    function combine(neighbors) {
      if (neighbors.length === 0) return true;
      var myColor = neighbors[0][0];
      var setOfNeighbors = neighbors[0][1];

      return Array.from(setOfNeighbors).some((combineColor) => {
        colorMapping[myColor] = neighbors.length / 2 - 1;
        colorMapping[combineColor] = neighbors.length / 2 - 1;
        //console.log(myColor, combineColor);

        var updatedNeighbors = [];
        var noErrors = neighbors.every(([color, set]) => {
          if (color === myColor || color === combineColor) return true;
          var newSet = new Set(set);
          newSet.delete(myColor);
          newSet.delete(combineColor);
          updatedNeighbors.push([color, newSet]);
          return newSet.size > 0;
        });

        if (!noErrors) {
          //console.log("error", neighbors);
          return false;
        }
        return combine(updatedNeighbors);
      });
    }
    //console.log(success, colorMapping);
    if (!success) {
      // 3-5% chance of not being able to be combined
      this.errorCount++;
      this.growColors();
      this.combineColors();
      return;
    }
    this.puzzle = this.puzzle.map((row) => {
      return row.map((value) => Utils.numToAlpha(colorMapping[value]));
    });
    //console.log(this.puzzle);
  }

  allowOnlyOneSolution() {
    this.count = 0;
    var lastPuzzle = Utils.clone2D(this.puzzle);
    while (true) {
      this.count++;
      //console.log("attempt", this.count, this.puzzle);
      var solver = new PuzzleSolver(this.puzzle, this.numPerRow, { findMultipleSolutions: true });
      var result = solver.solve();
      this.history = result.solutions;
      //console.log("solutions", result.solutions.length, result.solutions);
      if (result.solutions.length === 1) {
        console.log("YAY! Only 1 solution");
        break;
      } else if (this.count >= 50) {
        console.log("Give Up");
        break;
      } else if (result.solutions.length === 0) {
        //console.log("Broken!");
        this.puzzle = lastPuzzle;
      } else {
        lastPuzzle = Utils.clone2D(this.puzzle);
        this.fixPuzzle(result.solutions);
      }
    }
  }

  fixPuzzle(solutions) {
    return Utils.shuffle(solutions).some((solution, solutionIndex) => {
      if (solutionIndex === 0) {
        this.puzzleState = solution;
        return false;
      }
      //console.log("solution Index", solutionIndex);
      var wrongLocations = [];
      solution.forEach((row, i) => {
        row.forEach((value, j) => {
          if (value === Constants.onState && this.puzzleState[i][j] !== value) {
            wrongLocations.push({ i: i, j: j });
          }
        });
      });
      return Utils.shuffle(wrongLocations).some((location) => {
        return this.fixLocation(location.i, location.j);
      });
    });
  }

  fixLocation(i, j) {
    var color = this.puzzle[i][j];
    var directions = Utils.shuffle([
      { i: -1, j: 0 },
      { i: 1, j: 0 },
      { i: 0, j: -1 },
      { i: 0, j: 1 },
    ]);
    return directions.some((direction) => {
      for (let x = 1; x < this.size / 2; x++) {
        const newI = i + direction.i * x;
        const newJ = j + direction.j * x;
        if (Utils.withinBounds(newI, newJ, this.size)) {
          var newColor = this.puzzle[newI][newJ];
          if (newColor !== color) {
            var tempPuzzle = Utils.clone2D(this.puzzle);
            for (let y = x - 1; y >= 0; y--) {
              tempPuzzle[i + direction.i * y][j + direction.j * y] = newColor;
            }
            //console.log(i, j, "changed from", color, "to", newColor);
            if (this.isContiguous(Utils.clone2D(tempPuzzle), color)) {
              this.puzzle = tempPuzzle;
              return true;
            }
            break;
          }
        }
      }
      return false;
    });
  }

  isContiguous(puzzle, color) {
    var areaCount = 0;
    var maxSize = 0;
    puzzle.forEach((row, i) => {
      row.forEach((value, j) => {
        var size = this.markContiguous(i, j, puzzle, color);
        maxSize = Math.max(size, maxSize);
        if (size > 0) {
          areaCount++;
        }
      });
    });
    return areaCount === 1 && maxSize > 1;
  }

  markContiguous(i, j, puzzle, color) {
    if (!Utils.withinBounds(i, j, this.size)) return 0;
    if (puzzle[i][j] !== color) return 0;

    puzzle[i][j] = false;
    var sum =
      1 +
      this.markContiguous(i - 1, j, puzzle, color) +
      this.markContiguous(i, j - 1, puzzle, color) +
      this.markContiguous(i + 1, j, puzzle, color) +
      this.markContiguous(i, j + 1, puzzle, color);
    return sum;
  }
}
export default PuzzleGenerator;
