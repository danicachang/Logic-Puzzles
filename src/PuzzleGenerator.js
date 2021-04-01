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
  }
  createPuzzle() {
    this.createSolution();
    this.growColors();
    if (this.numPerRow > 1) this.combineColors();
    //this.allowOnlyOneSolution();
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
    console.log(this.puzzle);
    console.log(sortedAdjacent);

    var colorMapping = {};
    var errorCount = 0;
    var success = combine(sortedAdjacent);

    function combine(neighbors) {
      if (neighbors.length === 0) return true;
      var myColor = neighbors[0][0];
      var setOfNeighbors = neighbors[0][1];

      return Array.from(setOfNeighbors).some((combineColor) => {
        colorMapping[myColor] = neighbors.length / 2 - 1;
        colorMapping[combineColor] = neighbors.length / 2 - 1;
        console.log(myColor, combineColor);

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
          console.log("error", neighbors);
          errorCount++;
          return false;
        }
        return combine(updatedNeighbors);
      });
    }
    console.log(success, colorMapping);
    console.log("errorCount", errorCount);
    this.puzzle = this.puzzle.map((row) => {
      return row.map((value) => Utils.numToAlpha(colorMapping[value]));
    });
    console.log(this.puzzle);
  }

  allowOnlyOneSolution() {
    this.count = 0;
    var lastPuzzle = Utils.clone2D(this.puzzle);
    while (this.count < 50) {
      this.count++;
      //console.log("attempt", this.count, this.puzzle);
      var solver = new PuzzleSolver(this.puzzle, this.numPerRow, { findMultipleSolutions: true });
      var result = solver.solve();
      this.history = result.solutions;
      //console.log("solutions", result.solutions.length, result.solutions);
      if (result.solutions.length === 1) {
        console.log("YAY! Only 1 solution");
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

  /*createSolution() {
    var columns = Array(this.size * this.numPerRow)
      .fill()
      .map((v, i) => Math.floor(i / this.numPerRow));

    this.count = 0;
    this.puzzle = Utils.empty2DArray(this.size, Constants.emptyState);
    this.createSolutionRow(columns.slice(), columns.slice(), 0);
    console.log(this.count);
  }

  createSolutionRow(columnsToGuess, unusedColumns, index) {
    //console.log(columnsToGuess.slice(), unusedColumns.slice());
    if (this.count > 10000) {
      console.log("Count Reached");
      console.log(this.clone2D(this.puzzle));
      return false;
    }
    this.count++;

    const rowNum = Math.floor(index / this.numPerRow);
    if (rowNum >= this.size) return true;
    if (columnsToGuess.length === 0) return false;

    const randomIndex = this.getRandomInt(columnsToGuess.length);
    const newColumnsToGuess = columnsToGuess.slice();
    const columnNum = newColumnsToGuess.splice(randomIndex, 1)[0];
    //console.log("guess", index, rowNum, columnNum);
    if (
      (rowNum > 0 &&
        (this.puzzle[rowNum - 1][columnNum] === Constants.onState ||
          (columnNum > 0 && this.puzzle[rowNum - 1][columnNum - 1] === Constants.onState) ||
          (columnNum < this.size - 1 &&
            this.puzzle[rowNum - 1][columnNum + 1] === Constants.onState))) ||
      this.puzzle[rowNum][columnNum] === Constants.onState ||
      this.puzzle[rowNum][columnNum - 1] === Constants.onState ||
      this.puzzle[rowNum][columnNum + 1] === Constants.onState
    ) {
      //console.log("try again");
      return this.createSolutionRow(newColumnsToGuess.slice(), unusedColumns.slice(), index);
    }
    this.puzzle[rowNum][columnNum] = Constants.onState;
    const usedIndex = unusedColumns.indexOf(columnNum);
    const newUnusedColumns = unusedColumns.slice();
    newUnusedColumns.splice(usedIndex, 1);
    //console.log(this.clone2D(this.puzzle));
    if (this.createSolutionRow(newUnusedColumns.slice(), newUnusedColumns.slice(), index + 1))
      return true;

    console.log("undo", index, newColumnsToGuess.slice(), unusedColumns.slice());
    this.puzzle[rowNum][columnNum] = Constants.emptyState;
    return this.createSolutionRow(newColumnsToGuess.slice(), unusedColumns.slice(), index);
  }*/
}
export default PuzzleGenerator;
