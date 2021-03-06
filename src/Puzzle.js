import React from "react";
import classNames from "classnames/bind";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { CSSTransition } from "react-transition-group";
import { FaTrophy } from "react-icons/fa";
import {
  IoReload,
  IoArrowUndo,
  IoArrowRedo,
  IoPlaySharp,
  IoAlertCircleSharp,
  IoExtensionPuzzle,
} from "react-icons/io5";
import DogSVG from "./images/dog.svg";
import * as Constants from "./constants.js";
import * as Utils from "./utils.js";
import PuzzleSolver from "./PuzzleSolver.js";
import "./Puzzle.scss";
import PuzzleGenerator from "./PuzzleGenerator";

class Puzzle extends React.Component {
  animationTimer = null;

  constructor(props) {
    super(props);
    /* spell-checker: disable */
    const puzzle = Utils.stringArrayTo2DArray([
      ["AAAAAAAABB"],
      ["AAAAAACABB"],
      ["DEEEACCCBB"],
      ["DDDDFGGCBB"],
      ["DDDFFFGGBB"],
      ["DDHFFFGGBB"],
      ["DDHHHGGGIB"],
      ["DDDDDDGGIB"],
      ["DJJJJJJJII"],
      ["JJJJJJJJJI"],
    ]);
    /* spell-checker: enabled */
    const size = puzzle.length;
    const puzzleState = Utils.empty2DArray(size, Constants.emptyState);
    this.state = {
      size: size,
      numPerRow: 2,
      puzzle: puzzle,
      puzzleState: puzzleState,
      errors: Utils.empty2DArray(size, false),
      animating: Utils.empty2DArray(size, false),
      history: [puzzleState],
      historyIndex: 0,
      animatingMarkedLocation: false,
      completed: false,
      guessHistory: [Utils.empty2DArray(size, false)],
      guessIndexes: [],
      contextMenu: Utils.empty2DArray(size, false),
    };
    this.initialState = this.state;
    this.circleRef = React.createRef();
  }

  /*componentDidMount() {
    window.addEventListener('beforeunload', this.handleLeavePage);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleLeavePage);
  }

  handleLeavePage(e) {
    const confirmationMessage = 'Are you sure you want to leave?';
    e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
    return confirmationMessage;              // Gecko, WebKit, Chrome <34
  }*/

  handleClick(e, i, j, alt = false) {
    //e.preventDefault();
    var newVal;
    var setClearAnimationsTimer = false;
    this.setState(
      (state) => {
        const currentVal = state.puzzleState[i][j];
        if (alt) {
          newVal = Constants.onState;
        } else {
          newVal =
            currentVal === Constants.emptyState
              ? Constants.markedState
              : currentVal === Constants.markedState
              ? Constants.onState
              : Constants.emptyState;
        }

        var newState = Utils.setValue2D(state.puzzleState, i, j, newVal);

        var animating = Utils.empty2DArray(state.size, false);

        // removing when it was the last thing toggled on
        if (
          currentVal === Constants.onState &&
          state.animatingMarkedLocation.i === i &&
          state.animatingMarkedLocation.j === j
        ) {
          newState = newState.map((row, x) => {
            return row.map((val, y) => {
              if (val === Constants.markedState && state.animating[x][y]) {
                return Constants.emptyState;
              } else {
                return val;
              }
            });
          });
          setClearAnimationsTimer = true;
          animating = state.animating;
        }

        return {
          puzzleState: newState,
          animating: animating,
          animatingMarkedLocation: false,
        };
      },
      () => {
        this.checkForErrors();

        if (newVal === Constants.onState) {
          this.autoMarkNeighbors(i, j, this.saveHistory);
        } else {
          this.saveHistory();
        }

        this.checkForErrors();

        if (setClearAnimationsTimer) {
          this.animationTimer = setTimeout(() => {
            this.clearAnimations();
            this.animationTimer = null;
          }, 1000);
        }
      }
    );
  }
  handleRightClick(e, i, j) {
    this.handleClick(e, i, j, true);
  }

  saveHistory() {
    this.setState((state) => {
      var history = state.history;
      var guessHistory = state.guessHistory;
      var newGuessIndexes = state.guessIndexes;
      if (state.historyIndex + 1 < history.length) {
        history = history.slice(0, state.historyIndex + 1);
        guessHistory = guessHistory.slice(0, state.historyIndex + 1);
        newGuessIndexes = [];
        state.guessIndexes.forEach((i) => {
          if (i < history.length - 1) newGuessIndexes.push(i);
        });
      }
      const lastHistory = history[history.length - 1];
      const lastGuess = guessHistory[history.length - 1];
      var guessIndex = newGuessIndexes.length;
      guessIndex = guessIndex === 0 ? false : guessIndex;

      return {
        history: history.concat([state.puzzleState]),
        historyIndex: history.length,
        guessHistory: guessHistory.concat([
          Utils.guesses(lastHistory, state.puzzleState, lastGuess, guessIndex),
        ]),
        guessIndexes: newGuessIndexes,
      };
    });
  }

  autoMarkNeighbors(i, j, callback) {
    this.setState((state) => {
      if (state.puzzleState[i][j] !== Constants.onState) return;
      if (state.errors[i][j]) return;

      if (this.animationTimer) {
        clearTimeout(this.animationTimer);
        this.animationTimer = null;
      }

      const result = Utils.markNeighbors(i, j, state.puzzleState, state.puzzle, state.numPerRow);

      return {
        animatingMarkedLocation: { i: i, j: j },
        puzzleState: result.puzzleState,
        animating: result.changed,
      };
    }, callback);
  }

  clearAnimations() {
    this.setState((state) => {
      return {
        animatingMarkedLocation: false,
        animating: Utils.empty2DArray(state.size, false),
      };
    });
  }

  checkForErrors() {
    this.setState((state) => {
      var result = Utils.checkPuzzle(state.puzzle, state.puzzleState, state.numPerRow);

      return {
        errors: result.errors,
        completed: result.completed,
      };
    });
  }

  undo() {
    this.setState((state) => {
      if (state.historyIndex < 1) return;

      const newState = state.history[state.historyIndex - 1];

      return {
        historyIndex: state.historyIndex - 1,
        puzzleState: newState,
        animatingMarkedLocation: false,
        animating: Utils.empty2DArray(state.size, false),
      };
    });
    this.checkForErrors();
  }

  redo() {
    this.setState((state) => {
      if (state.historyIndex >= state.history.length) return;

      const newState = state.history[state.historyIndex + 1];

      return {
        historyIndex: state.historyIndex + 1,
        puzzleState: newState,
      };
    });

    this.checkForErrors();
  }

  resetPuzzle() {
    delete this.initialState.puzzle;
    this.setState(this.initialState);
  }

  branch() {
    this.setState((state) => {
      return {
        guessIndexes: this.state.guessIndexes.concat(state.historyIndex),
      };
    });
  }

  undoBranch() {
    this.setState((state) => {
      const guessIndex = this.state.guessIndexes[this.state.guessIndexes.length - 1];
      const newState = state.history[guessIndex];
      return {
        historyIndex: guessIndex,
        puzzleState: newState,
        animatingMarkedLocation: false,
        animating: Utils.empty2DArray(state.size, false),
        guessIndexes: this.state.guessIndexes.slice(0, -1),
      };
    });
    this.checkForErrors();
  }

  generatePuzzle() {
    var generator = new PuzzleGenerator(this.state.size, this.state.numPerRow);
    generator.createPuzzle();
    this.resetPuzzle();
    this.setState((state) => {
      if (generator.history.length > 1) {
        var guessHistory = Array(generator.history.length)
          .fill()
          .map((row) => Utils.empty2DArray(state.size, false));
        return {
          puzzle: generator.puzzle,
          history: generator.history,
          guessHistory: guessHistory,
          historyIndex: 0,
          puzzleState: Utils.clone2D(generator.history[0]),
        };
      } else {
        return {
          puzzle: generator.puzzle,
        };
      }
    });
  }

  solvePuzzle() {
    var solver = new PuzzleSolver(this.state.puzzle, this.state.numPerRow);
    var result = solver.solve();
    this.setState((state) => {
      return {
        history: result.history,
        guessHistory: result.guessHistory,
        historyIndex: 0,
      };
    });
  }

  setContextMenu(i, j, value) {
    console.log(this.state.contextMenu);
    this.setState((state) => {
      return {
        contextMenu: Utils.setValue2D(state.contextMenu, i, j, value),
      };
    });
  }

  render() {
    return (
      <div className="puzzleContainer">
        <div className={"puzzle size-" + this.state.size}>
          <div className="animatedBackground">
            <CSSTransition
              in={this.state.animatingMarkedLocation !== false}
              timeout={1000}
              classNames="grow"
              nodeRef={this.circleRef}
            >
              <div
                className="circle"
                ref={this.circleRef}
                style={{
                  top: ((this.state.animatingMarkedLocation.i + 0.5) * 100) / this.state.size + "%",
                  left:
                    ((this.state.animatingMarkedLocation.j + 0.5) * 100) / this.state.size + "%",
                }}
              ></div>
            </CSSTransition>
          </div>
          {false && this.state.completed && (
            <div className="completedOverlay">
              <div className="completedModal">
                <FaTrophy />
                <br />
                Completed
                <br />
                in 5:00
                <br />
                <button onClick={(e) => this.newPuzzle()}>New Puzzle</button>
              </div>
            </div>
          )}
          {this.state.puzzle.map((row, i) => {
            return (
              <div key={i} className="row">
                {row.map((cell, j) => {
                  const val = this.state.puzzleState[i][j];
                  const guess = this.state.guessHistory[this.state.historyIndex][i][j];
                  var cellClasses = classNames({
                    cell: true,
                    topBorder: i === 0 || this.state.puzzle[i - 1][j] !== cell,
                    rightBorder: j === this.state.size - 1 || this.state.puzzle[i][j + 1] !== cell,
                    bottomBorder: i === this.state.size - 1 || this.state.puzzle[i + 1][j] !== cell,
                    leftBorder: j === 0 || this.state.puzzle[i][j - 1] !== cell,
                    marked: val === Constants.markedState,
                    newlyMarked: this.state.animating[i][j],
                    [cell + "-color"]: true,
                    error: this.state.errors[i][j],
                    guess: !!guess,
                    ["guess-" + guess]: !!guess,
                  });
                  var dog = val === Constants.onState ? <img src={DogSVG} alt="Dog" /> : "";
                  var icon = this.state.errors[i][j] ? <IoAlertCircleSharp /> : "";
                  return (
                    <Tippy
                      key={j}
                      content={
                        <span>
                          Guess here?
                          <button
                            onClick={(e) => {
                              this.branch();
                              this.handleClick(e, i, j, true);
                              this.setContextMenu(i, j, false);
                              return false;
                            }}
                          >
                            Guess
                          </button>
                          <button
                            onClick={(e) => {
                              this.setContextMenu(i, j, false);
                            }}
                          >
                            Cancel
                          </button>
                        </span>
                      }
                      onClickOutside={() => this.setContextMenu(i, j, false)}
                      visible={this.state.contextMenu[i][j]}
                      interactive="true"
                    >
                      <div
                        className={cellClasses}
                        onClick={(e) => this.handleClick(e, i, j)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          this.setContextMenu(i, j, true);
                        }}
                      >
                        <div className="content">
                          {dog}

                          <CSSTransition
                            in={this.state.errors[i][j]}
                            timeout={2000}
                            classNames="fade"
                            unmountOnExit
                          >
                            <IoAlertCircleSharp />
                          </CSSTransition>
                        </div>
                      </div>
                    </Tippy>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="puzzleControls">
          <button onClick={(e) => this.resetPuzzle()}>
            <IoReload />
          </button>
          <button onClick={(e) => this.generatePuzzle()}>
            <IoExtensionPuzzle />
          </button>
          <button onClick={(e) => this.solvePuzzle()}>
            <IoPlaySharp />
          </button>
          <button onClick={(e) => this.undo()} disabled={this.state.historyIndex < 1}>
            <IoArrowUndo />
          </button>
          <button
            onClick={(e) => this.redo()}
            disabled={this.state.historyIndex + 1 >= this.state.history.length}
          >
            <IoArrowRedo />
          </button>
        </div>
      </div>
    );
  }
}
export default Puzzle;
