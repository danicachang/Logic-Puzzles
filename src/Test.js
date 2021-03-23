import React, { useState } from "react";
import PuzzleSolver from "./PuzzleSolver";
import TestPuzzles from "./test_puzzles";
import * as Utils from "./utils.js";

export default function Test() {
  const [times, setTimes] = useState({});

  function runTests() {
    var allTimes = {};
    Object.entries(TestPuzzles).forEach(([numPerRow, puzzles]) => {
      console.log(numPerRow, "dogs");
      Object.entries(puzzles).forEach(([name, value]) => {
        var puzzle = Utils.stringArrayTo2DArray(value);
        var solver = new PuzzleSolver(puzzle, numPerRow, { findMultipleSolutions: true });
        var startTime = performance.now();
        var result = solver.solve();
        var endTime = performance.now();
        var elapsedTime = (endTime - startTime) / 1000;
        allTimes[name] = elapsedTime.toFixed(4);
        setTimes(allTimes);

        console.log(
          name,
          "\t",
          result.isSolved,
          elapsedTime.toFixed(6) + "s",
          result.history.length
        );
      });
    });
  }

  return (
    <div style={{ textAlign: "center" }}>
      <button onClick={(e) => runTests()}>Run Tests</button>
      {Object.entries(times).map(([name, time]) => {
        return (
          <div key={name} style={{ color: "white" }}>
            {name}: {time} s
          </div>
        );
      })}
    </div>
  );
}
