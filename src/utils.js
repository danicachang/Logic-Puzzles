import * as Constants from "./constants.js";

export function empty2DArray(size, value) {
  return Array(size)
    .fill()
    .map((row) => new Array(size).fill(value));
}

export function alphaToNum(letter) {
  return parseInt(letter, 36) - 10;
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

export function checkPuzzle(puzzle, puzzleState, numPerRow, info) {
  if (!info) {
    info = computeInfo(puzzleState, puzzle);
  }

  var size = puzzle.length;
  var errors = empty2DArray(size, false);
  var errorCount = [0];

  for (const [typeOfCriteria, valueOfCriteria] of Object.entries(info)) {
    if (typeOfCriteria === "onLocations") continue;
    if (typeOfCriteria === "emptyLocations") continue;
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

export function markNeighbors(i, j, puzzleState, puzzle, numPerRow) {
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
