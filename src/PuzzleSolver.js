import * as Constants from "./constants.js";
import * as Utils from "./utils.js";

function PuzzleSolver(puzzle) {
  var size = puzzle.length();
  var history = [];
  var puzzleState = Utils.empty2DArray(size, Constants.emptyState);

  return history;
}

export default PuzzleSolver;
