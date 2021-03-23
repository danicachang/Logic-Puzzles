import PuzzleSolver from "./PuzzleSolver";
import TestPuzzles from "./test_puzzles";
import * as Utils from "./utils.js";

describe("1 Dog puzzles", () => {
  test.each(Object.entries(TestPuzzles[1]))("%s", (name, puzzle) => {
    solvePuzzle(name, puzzle);
  });
});

describe("2 Dog puzzles", () => {
  test.each(Object.entries(TestPuzzles[2]))("%s", (name, puzzle) => {
    solvePuzzle(name, puzzle);
  });
});

function solvePuzzle(name, puzzleData) {
  var puzzle = Utils.rotateClockwise(Utils.stringArrayTo2DArray(puzzleData));
  var solver = new PuzzleSolver(puzzle, 1);
  var result = solver.solve();

  expect(result.isSolved).toBeTruthy();
}
