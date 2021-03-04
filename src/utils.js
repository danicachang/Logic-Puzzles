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

export function checkPuzzle(puzzle, puzzleState, info) {
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
      if (value[Constants.onState].length > 1) {
        value[Constants.onState].forEach((loc) => {
          errors[loc.i][loc.j] = true;
          errorCount[0]++;
        });
      }
      if (value[Constants.onState].length === 0 && value[Constants.emptyState].length === 0) {
        value[Constants.markedState].forEach((loc) => {
          errors[loc.i][loc.j] = true;
          errorCount[0]++;
        });
      }
    }
  }

  info.onLocations.forEach((loc, i) => {
    info.onLocations.forEach((loc2, j) => {
      if (i >= j) return;
      if (
        (loc.x === loc2.x + 1 || loc.x === loc2.x - 1) && // diagonal
        (loc.y === loc2.y + 1 || loc.y === loc2.y - 1)
      ) {
        errors[loc.x][loc.y] = true;
        errors[loc2.x][loc2.y] = true;
        errorCount[0]++;
      }
    });
  });

  return {
    errors: errors,
    errorCount: errorCount[0],
    completed: errorCount[0] === 0 && info.onLocations.length === size,
  };
}

export function markNeighbors(i, j, puzzleState, puzzle) {
  if (puzzleState[i][j] !== Constants.onState)
    return { puzzleState: puzzleState, changed: empty2DArray(puzzle.length, false) };

  const puzzleVal = puzzle[i][j];
  var changed = empty2DArray(puzzle.length, true);

  const newPuzzleState = puzzleState.map((row, x) => {
    return row.map((val, y) => {
      if (val === Constants.emptyState) {
        // same row or column
        if (i === x || j === y) return Constants.markedState;

        // diagonally adjacent
        if ((i === x + 1 || i === x - 1) && (j === y + 1 || j === y - 1))
          return Constants.markedState;

        // same color background
        if (puzzleVal === puzzle[x][y]) return Constants.markedState;
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
  var data = {
    rows: new Array(size),
    columns: new Array(size),
    colors: new Array(size),
    onLocations: [],
    emptyLocations: [],
  };

  for (let i = 0; i < size; i++) {
    data.rows[i] = {
      [Constants.emptyState]: [],
      [Constants.markedState]: [],
      [Constants.onState]: [],
    };
    data.columns[i] = {
      [Constants.emptyState]: [],
      [Constants.markedState]: [],
      [Constants.onState]: [],
    };
    data.colors[i] = {
      [Constants.emptyState]: [],
      [Constants.markedState]: [],
      [Constants.onState]: [],
    };
  }

  puzzleState.forEach((row, x) => {
    row.forEach((val, y) => {
      const letter = puzzle[x][y];
      const location = { i: x, j: y };
      data.rows[x][val].push(location);
      data.columns[y][val].push(location);
      data.colors[alphaToNum(letter)][val].push(location);

      if (val === Constants.onState) {
        data.onLocations.push(location);
      } else if (val === Constants.emptyState) {
        data.emptyLocations.push(location);
      }
    });
  });
  return data;
}
