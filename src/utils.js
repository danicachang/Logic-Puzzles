import * as Constants from "./constants.js";

export function empty2DArray(size, value) {
  return Array(size)
    .fill()
    .map((row) => new Array(size).fill(value));
}

export function clone2D(array2d) {
  return array2d.map((row) => {
    return row.map((val) => val);
  });
}

export function alphaToNum(letter) {
  return parseInt(letter, 36) - 10;
}
export function numToAlpha(num) {
  return String.fromCharCode(97 + num).toUpperCase();
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

export function withinBounds(i, j, size) {
  return i >= 0 && j >= 0 && i < size && j < size;
}

export function shuffle(array) {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

export function stringArrayTo2DArray(stringArray) {
  return stringArray.map((row) => {
    return row.toString().split("");
  });
}

export function rotateClockwise(puzzle) {
  const size = puzzle.length;
  var rotated = empty2DArray(size, null);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      rotated[i][j] = puzzle[size - 1 - j][i];
    }
  }
  return rotated;
}

export function setPuzzleState(puzzleState, i, j, newVal) {
  // non-modifying version of state.puzzleState[i][j]=newVal;
  return puzzleState.map((row, x) => {
    return row.map((val, y) => {
      if (i === x && j === y) {
        return newVal;
      } else {
        return val;
      }
    });
  });
}

export function checkPuzzle(puzzle, puzzleState, numPerRow, info, ignoreColors = false) {
  if (!info) {
    info = computeInfo(puzzleState, puzzle);
  }

  var size = puzzle.length;
  var errors = empty2DArray(size, false);
  var errorCount = [0];

  for (const [typeOfCriteria, valueOfCriteria] of Object.entries(info)) {
    if (typeOfCriteria === "onLocations") continue;
    if (typeOfCriteria === "emptyLocations") continue;
    if (ignoreColors && typeOfCriteria === "colors") continue;
    for (let i = 0; i < valueOfCriteria.length; i++) {
      const value = valueOfCriteria[i];
      const numOnState = value[Constants.onState].length;
      const numEmptyState = value[Constants.emptyState].length;
      if (numOnState > numPerRow) {
        value[Constants.onState].forEach((loc) => {
          errors[loc.i][loc.j] = true;
          errorCount[0]++;
        });
      }
      if (numOnState + numEmptyState < numPerRow) {
        value[Constants.markedState].forEach((loc) => {
          errors[loc.i][loc.j] = true;
          errorCount[0]++;
        });
      }

      if (
        !ignoreColors &&
        typeOfCriteria === "colors" &&
        numEmptyState <= 4 &&
        numPerRow - numOnState === 2
      ) {
        var isPossible = false;
        for (let a = 0; a < numEmptyState; a++) {
          const loc1 = value[Constants.emptyState][a];
          for (let b = a + 1; b < numEmptyState; b++) {
            const loc2 = value[Constants.emptyState][b];
            if (
              loc1.i > loc2.i + 1 ||
              loc1.i < loc2.i - 1 ||
              loc1.j > loc2.j + 1 ||
              loc1.j < loc2.j - 1
            ) {
              isPossible = true;
              break;
            }
          }
        }
        if (!isPossible) {
          value[Constants.markedState].forEach((loc) => {
            errors[loc.i][loc.j] = true;
            errorCount[0]++;
          });
        }
      }
    }
  }

  // adjacent
  info.onLocations.forEach((loc, i) => {
    info.onLocations.forEach((loc2, j) => {
      if (i >= j) return;
      if (
        loc.i <= loc2.i + 1 &&
        loc.i >= loc2.i - 1 &&
        loc.j <= loc2.j + 1 &&
        loc.j >= loc2.j - 1
      ) {
        errors[loc.i][loc.j] = true;
        errors[loc2.i][loc2.j] = true;
        errorCount[0]++;
      }
    });
  });

  return {
    errors: errors,
    errorCount: errorCount[0],
    completed: errorCount[0] === 0 && info.onLocations.length === size * numPerRow,
  };
}

export function markNeighbors(i, j, puzzleState, puzzle, numPerRow, ignoreColors = false) {
  if (puzzleState[i][j] !== Constants.onState)
    return { puzzleState: puzzleState, changed: empty2DArray(puzzle.length, false) };

  const puzzleVal = puzzle[i][j];
  var changed = empty2DArray(puzzle.length, true);
  var info = computeInfo(puzzleState, puzzle);

  const newPuzzleState = puzzleState.map((row, x) => {
    return row.map((val, y) => {
      if (val === Constants.emptyState) {
        // adjacent
        if (i <= x + 1 && i >= x - 1 && j <= y + 1 && j >= y - 1) {
          return Constants.markedState;
        }

        // filled row
        if (i === x && info.rows[i][Constants.onState].length === numPerRow)
          return Constants.markedState;

        // filled column
        if (j === y && info.columns[j][Constants.onState].length === numPerRow)
          return Constants.markedState;

        // filled color
        const letter = puzzle[x][y];
        if (
          !ignoreColors &&
          puzzleVal === letter &&
          info.colors[alphaToNum(letter)][Constants.onState].length === numPerRow
        )
          return Constants.markedState;
      }
      changed[x][y] = false;
      return val;
    });
  });

  return {
    puzzleState: newPuzzleState,
    changed: changed,
  };
}

export function computeInfo(puzzleState, puzzle) {
  var size = puzzle.length;
  var info = {
    rows: new Array(size),
    columns: new Array(size),
    colors: new Array(size),
    onLocations: [],
    emptyLocations: [],
  };

  for (let i = 0; i < size; i++) {
    info.rows[i] = {
      [Constants.emptyState]: [],
      [Constants.markedState]: [],
      [Constants.onState]: [],
    };
    info.columns[i] = {
      [Constants.emptyState]: [],
      [Constants.markedState]: [],
      [Constants.onState]: [],
    };
    info.colors[i] = {
      [Constants.emptyState]: [],
      [Constants.markedState]: [],
      [Constants.onState]: [],
    };
  }

  puzzleState.forEach((row, x) => {
    row.forEach((val, y) => {
      const letter = puzzle[x][y];
      const location = { i: x, j: y };
      info.rows[x][val].push(location);
      info.columns[y][val].push(location);
      info.colors[alphaToNum(letter)][val].push(location);

      if (val === Constants.onState) {
        info.onLocations.push(location);
      } else if (val === Constants.emptyState) {
        info.emptyLocations.push(location);
      }
    });
  });
  return info;
}

export function guesses(prevState, state, prevGuess, value) {
  return prevState.map((row, x) => {
    return row.map((val, y) => {
      return val !== state[x][y] ? value : prevGuess[x][y];
    });
  });
}
