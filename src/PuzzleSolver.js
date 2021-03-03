import * as Constants from "./constants.js";
import * as Utils from "./utils.js";

class PuzzleSolver {
  constructor(puzzle) {
    this.puzzle = puzzle;
    this.size = puzzle.length;
    this.puzzleState = Utils.empty2DArray(this.size, Constants.emptyState);
    this.history = [this.puzzleState];
    this.isSolved = false;
  }

  solve(maxLoops = 10) {
    for (let i = 0; i < maxLoops; i++) {
      console.log("compute");
      var puzzleStateInfo = Utils.computeInfo(this.puzzleState, this.puzzle);
      if (
        !(
          this.onIfLastEmpty(puzzleStateInfo) ||
          this.markIfColorInUniqueRowOrColumn(puzzleStateInfo)
        )
      ) {
        console.log("Stuck");
        break;
      }
    }

    console.log(this.history);
    return this.history;
  }

  markIfColorInUniqueRowOrColumn(puzzleStateInfo) {
    console.log("markIfColorInUniqueRowOrColumn");
    var rowsMustBe = Array(this.size).fill(-1);
    var colsMustBe = Array(this.size).fill(-1);
    puzzleStateInfo.colors.forEach((value, puzzleVal) => {
      if (value[Constants.onState].length >= 1) return false;

      var rows = new Set();
      var cols = new Set();
      value[Constants.emptyState].forEach((location) => {
        rows.add(location.i);
        cols.add(location.j);
      });

      if (rows.size === 1) {
        var rowNum = rows.values().next().value;
        rowsMustBe[rowNum] = puzzleVal;
      }

      if (cols.size === 1) {
        var colNum = cols.values().next().value;
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
    if (change) {
      this.history.push(this.puzzleState);
    }
    return change;
  }

  onIfLastEmpty(puzzleStateInfo) {
    console.log("onIfLastEmpty");
    for (const [typeOfCriteria, valueOfCriteria] of Object.entries(puzzleStateInfo)) {
      if (typeOfCriteria === "onLocations") continue;
      for (let i = 0; i < valueOfCriteria.length; i++) {
        const value = valueOfCriteria[i];
        if (value[Constants.onState].length === 0 && value[Constants.emptyState].length === 1) {
          this.setPuzzleState(
            value[Constants.emptyState][0].i,
            value[Constants.emptyState][0].j,
            Constants.onState
          );
          return true;
        }
      }
    }
    return false;
  }

  setPuzzleState(i, j, val) {
    console.log(i, j, val);
    this.puzzleState = Utils.setPuzzleState(this.puzzleState, i, j, val);

    if (val === Constants.onState) {
      var results = Utils.markNeighbors(i, j, this.puzzleState, this.puzzle);
      this.puzzleState = results.puzzleState;
    }

    this.history.push(this.puzzleState);
  }
}

export default PuzzleSolver;
