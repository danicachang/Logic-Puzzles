import * as Constants from "./constants.js";
import * as Utils from "./utils.js";

class PuzzleSolver {
  constructor(puzzle, numPerRow, options = {}) {
    this.puzzle = puzzle;
    this.size = puzzle.length;
    this.numPerRow = numPerRow;
    this.puzzleState = Utils.empty2DArray(this.size, Constants.emptyState);
    this.history = [this.puzzleState];
    this.isSolved = false;
    this.guessIndexes = [];
    this.maxGuessDepth = options.maxGuessDepth || 1;
    this.findMultipleSolutions = !!options.findMultipleSolutions;
    this.solutions = [];
  }

  solve(maxLoops = 100) {
    for (let i = 0; i < maxLoops; i++) {
      console.log("compute");
      var puzzleStateInfo = Utils.computeInfo(this.puzzleState, this.puzzle);
      var errors = Utils.checkPuzzle(
        this.puzzle,
        this.puzzleState,
        this.numPerRow,
        puzzleStateInfo
      );
      if (errors.errorCount > 0) {
        console.log("Error");
        return {
          history: this.history,
          isSolved: false,
          error: true,
        };
      }
      if (errors.completed) {
        console.log("Solved");
        this.isSolved = true;
        this.solutions.push(this.puzzleState);
        return {
          history: this.history,
          isSolved: true,
          error: false,
        };
      }

      if (
        !(
          this.onIfLastEmpty(puzzleStateInfo) ||
          this.markIfColorInUniqueRowOrColumn(puzzleStateInfo) ||
          this.tryGuesses(puzzleStateInfo)
        )
      ) {
        console.log("Stuck");
        break;
      }
    }

    return {
      history: this.history,
      isSolved: false,
      error: false,
    };
  }

  onIfLastEmpty(puzzleStateInfo) {
    //console.log("onIfLastEmpty");
    for (const [typeOfCriteria, valueOfCriteria] of Object.entries(puzzleStateInfo)) {
      if (typeOfCriteria === "onLocations") continue;
      if (typeOfCriteria === "emptyLocations") continue;
      for (let i = 0; i < valueOfCriteria.length; i++) {
        const value = valueOfCriteria[i];
        const numOnState = value[Constants.onState].length;
        const numEmptyState = value[Constants.emptyState].length;
        if (numOnState < this.numPerRow && numOnState + numEmptyState === this.numPerRow) {
          value[Constants.emptyState].forEach((loc) => {
            this.setPuzzleState(loc.i, loc.j, Constants.onState);
          });
          console.log("onIfLastEmpty", true);
          return true;
        }
      }
    }
    console.log("onIfLastEmpty", false);
    return false;
  }

  markIfColorInUniqueRowOrColumn(puzzleStateInfo) {
    //console.log("markIfColorInUniqueRowOrColumn");
    var rowsMustBe = Array(this.size).fill(-1);
    var colsMustBe = Array(this.size).fill(-1);
    puzzleStateInfo.colors.forEach((value, puzzleVal) => {
      var numOnInColor = value[Constants.onState].length;
      if (numOnInColor >= this.numPerRow) return false;

      var rows = new Set();
      var cols = new Set();
      value[Constants.emptyState].forEach((location) => {
        rows.add(location.i);
        cols.add(location.j);
      });

      if (rows.size === 1) {
        var rowNum = rows.values().next().value;
        if (numOnInColor === puzzleStateInfo.rows[rowNum][Constants.onState].length)
          rowsMustBe[rowNum] = puzzleVal;
      }
      if (cols.size === 1) {
        var colNum = cols.values().next().value;
        if (numOnInColor === puzzleStateInfo.columns[colNum][Constants.onState].length)
          colsMustBe[colNum] = puzzleVal;
      }
    });
    var change = false;
    this.puzzleState = this.puzzleState.map((row, x) => {
      return row.map((val, y) => {
        if (val === Constants.emptyState) {
          if (rowsMustBe[x] >= 0 && Utils.alphaToNum(this.puzzle[x][y]) !== rowsMustBe[x]) {
            change = true;
            return Constants.markedState;
          }
          if (colsMustBe[y] >= 0 && Utils.alphaToNum(this.puzzle[x][y]) !== colsMustBe[y]) {
            change = true;
            return Constants.markedState;
          }
        }
        return val;
      });
    });
    console.log("markIfColorInUniqueRowOrColumn", change);
    if (change) {
      this.history.push(this.puzzleState);
      console.log(this.puzzleState);
    }
    return change;
  }

  tryGuesses(puzzleStateInfo) {
    if (this.guessIndexes.length > this.maxGuessDepth) return false;

    console.log("tryGuesses");
    this.guessIndexes.push(this.history.length);

    var originalPuzzleState = this.puzzleState;
    return puzzleStateInfo.emptyLocations.some((loc) => {
      this.setPuzzleState(loc.i, loc.j, Constants.onState, false);
      var result = this.solve(20);
      if (result.error || (result.isSolved && this.findMultipleSolutions)) {
        this.resetState(originalPuzzleState, this.guessIndexes.pop());
        this.setPuzzleState(loc.i, loc.j, Constants.markedState);
        return true;
      }
      if (result.isSolved) {
        return true;
      }
      console.log("inconclusive");
      this.resetState(originalPuzzleState, this.guessIndexes[this.guessIndexes.length - 1]);
      return false;
    });
  }

  setPuzzleState(i, j, val, saveHistory = true) {
    console.log(i, j, val);
    this.puzzleState = Utils.setPuzzleState(this.puzzleState, i, j, val);

    if (val === Constants.onState) {
      var results = Utils.markNeighbors(i, j, this.puzzleState, this.puzzle, this.numPerRow);
      this.puzzleState = results.puzzleState;
    }

    if (saveHistory) this.history.push(this.puzzleState);
  }

  resetState(puzzleState, guessIndex) {
    this.puzzleState = puzzleState;
    //this.history = this.history.slice(0, guessIndex);
  }
}

export default PuzzleSolver;
