import * as Constants from "./constants.js";
import * as Utils from "./utils.js";

class PuzzleSolver {
  constructor(puzzle, numPerRow, options = {}) {
    this.puzzle = puzzle;
    this.size = puzzle.length;
    this.numPerRow = numPerRow;
    this.puzzleState = Utils.empty2DArray(this.size, Constants.emptyState);
    this.history = [this.puzzleState];
    this.guessHistory = [Utils.empty2DArray(this.size, false)];
    this.isSolved = false;
    this.guessIndexes = [];
    this.maxGuessDepth = options.maxGuessDepth || 1;
    this.findMultipleSolutions = !!options.findMultipleSolutions;
    this.solutions = [];
    this.lastGuessLoc = { i: -1, j: -1 };
  }

  solve(maxLoops = 50) {
    for (let i = 0; i < maxLoops + 1; i++) {
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
          guessHistory: this.guessHistory,
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
          guessHistory: this.guessHistory,
          isSolved: true,
          error: false,
        };
      }
      // Check for errors/completed one last time before quitting the last loop
      if (i >= maxLoops) {
        break;
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
      guessHistory: this.guessHistory,
      isSolved: false,
      error: false,
    };
  }

  onIfLastEmpty(puzzleStateInfo) {
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
      this.saveHistory(this.puzzleState);
    }
    return change;
  }

  tryGuesses(puzzleStateInfo) {
    if (this.guessIndexes.length >= this.maxGuessDepth) return false;

    this.guessIndexes.push(this.history.length);
    console.log("tryGuesses", this.guessIndexes);

    var originalHistoryIndex = this.history.length - 1;

    // Reorder emptyLocations to start with the next one from where we left off
    const index = puzzleStateInfo.emptyLocations.findIndex((loc) => {
      return (
        (loc.i === this.lastGuessLoc.i && loc.j >= this.lastGuessLoc.j) ||
        loc.i > this.lastGuessLoc.i
      );
    });
    var emptyLocations = puzzleStateInfo.emptyLocations
      .slice(index)
      .concat(puzzleStateInfo.emptyLocations.slice(0, index));
    const result = emptyLocations.some((loc) => {
      this.lastGuessLoc = loc;
      if (loc.i === 1 && loc.j === 0) {
        console.log("break");
      }
      this.setPuzzleState(loc.i, loc.j, Constants.onState);
      var result = this.solve(1);
      if (result.error || (result.isSolved && this.findMultipleSolutions)) {
        this.resetState(originalHistoryIndex);
        this.guessIndexes.pop();
        this.setPuzzleState(loc.i, loc.j, Constants.markedState);
        return true;
      }
      if (result.isSolved) {
        return true;
      }
      console.log("inconclusive");
      this.resetState(originalHistoryIndex);
      return false;
    });

    this.guessIndexes.pop();
    return result;
  }

  setPuzzleState(i, j, val, saveHistory = true) {
    console.log(i, j, val);
    this.puzzleState = Utils.setPuzzleState(this.puzzleState, i, j, val);

    if (val === Constants.onState) {
      var results = Utils.markNeighbors(i, j, this.puzzleState, this.puzzle, this.numPerRow);
      this.puzzleState = results.puzzleState;
    }

    if (saveHistory) this.saveHistory(this.puzzleState);
  }

  saveHistory(newHistory, lastHistory = null, lastGuess = null) {
    lastHistory = lastHistory ? lastHistory : this.history[this.history.length - 1];
    lastGuess = lastGuess ? lastGuess : this.guessHistory[this.history.length - 1];
    var guessIndex = this.guessIndexes.length;
    guessIndex = guessIndex === 0 ? false : guessIndex;
    this.guessHistory.push(Utils.guesses(lastHistory, newHistory, lastGuess, guessIndex));

    this.history.push(newHistory);
  }

  resetState(historyIndex) {
    this.puzzleState = this.history[historyIndex];
    this.saveHistory(this.puzzleState, this.history[historyIndex], this.guessHistory[historyIndex]);
  }
}

export default PuzzleSolver;
