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
    this.recentlyGuessed = Utils.empty2DArray(this.size, false);
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

  tryGuesses(puzzleStateInfo, solveLoops = 1) {
    if (this.guessIndexes.length >= this.maxGuessDepth) return false;

    this.guessIndexes.push(this.history.length);
    console.log("tryGuesses", this.guessIndexes);

    var originalHistoryIndex = this.history.length - 1;

    // Reorder emptyLocations to start with the next one from where we left off
    /* const index = puzzleStateInfo.emptyLocations.findIndex((loc) => {
      return (
        (loc.i === this.lastGuessLoc.i && loc.j >= this.lastGuessLoc.j) ||
        loc.i > this.lastGuessLoc.i
      );
    });
    var emptyLocations = puzzleStateInfo.emptyLocations
      .slice(index)
      .concat(puzzleStateInfo.emptyLocations.slice(0, index));*/
    this.reorderEmptyLocations(puzzleStateInfo);
    const result = puzzleStateInfo.emptyLocations.some((loc) => {
      this.recentlyGuessed[loc.i][loc.j] = true;
      //this.lastGuessLoc = loc;
      if (loc.i === 1 && loc.j === 0) {
        console.log("break");
      }
      this.setPuzzleState(loc.i, loc.j, Constants.onState);
      var result = this.solve(solveLoops);
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

  reorderEmptyLocations(info) {
    var self = this;
    var emptyLocationsInColor = this.puzzle.map((row, x) => {
      return row.map((color, y) => {
        return info.colors[Utils.alphaToNum(color)][Constants.emptyState].length;
      });
    });

    info.emptyLocations.sort((a, b) => {
      var recentlyA = this.recentlyGuessed[a.i][a.j] ? 100 : 0;
      var recentlyB = this.recentlyGuessed[b.i][b.j] ? 100 : 0;
      var countA = emptyLocationsInColor[a.i][a.j] + recentlyA;
      var countB = emptyLocationsInColor[b.i][b.j] + recentlyB;

      if (countA < 7 || countB < 7) {
        return countA - countB;
      }

      countA =
        Math.min(
          emptyLocationsInColorCheckBounds(a.i - 1, a.j),
          emptyLocationsInColorCheckBounds(a.i + 1, a.j),
          emptyLocationsInColorCheckBounds(a.i, a.j - 1),
          emptyLocationsInColorCheckBounds(a.i, a.j + 1)
        ) + recentlyA;

      countB =
        Math.min(
          emptyLocationsInColorCheckBounds(b.i - 1, b.j),
          emptyLocationsInColorCheckBounds(b.i + 1, b.j),
          emptyLocationsInColorCheckBounds(b.i, b.j - 1),
          emptyLocationsInColorCheckBounds(b.i, b.j + 1)
        ) + recentlyB;

      return countA - countB;
    });

    function emptyLocationsInColorCheckBounds(i, j, outOfBoundsValue = 1000) {
      if (i < 0 || j < 0 || i >= self.size || j >= self.size) return outOfBoundsValue;
      return emptyLocationsInColor[i][j];
    }
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
    if (!guessIndex) {
      var diff = lastHistory.map((row, x) => {
        return row.map((val, y) => {
          return val !== newHistory[x][y] ? Constants.onState : Constants.emptyState;
        });
      });
      var info = Utils.computeInfo(diff, this.puzzle);
      this.recentlyGuessed = this.recentlyGuessed.map((row, x) => {
        return row.map((val, y) => {
          if (!val) return false;
          var letter = this.puzzle[x][y];
          if (
            info.rows[x][Constants.onState].length ||
            info.columns[y][Constants.onState].length ||
            info.colors[Utils.alphaToNum(letter)][Constants.onState].length
          ) {
            return false;
          }
          return true;
        });
      });
    }

    this.history.push(newHistory);
  }

  resetState(historyIndex) {
    this.puzzleState = this.history[historyIndex];
    this.saveHistory(this.puzzleState, this.history[historyIndex], this.guessHistory[historyIndex]);
  }
}

export default PuzzleSolver;
