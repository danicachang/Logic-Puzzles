import React from "react";
import classNames from "classnames/bind";
import { CSSTransition } from "react-transition-group";
import { GiSittingDog } from "react-icons/gi";
import { FaTrophy } from "react-icons/fa";
import { IoReload, IoArrowUndo, IoArrowRedo, IoPlaySharp } from "react-icons/io5";
import * as Constants from "./constants.js";
import * as Utils from "./utils.js";
import PuzzleSolver from "./PuzzleSolver.js";
import "./Puzzle.scss";

class Puzzle extends React.Component {
  animationTimer = null;

  constructor(props) {
    super(props);

    const size = 5;
    const puzzleState = Utils.empty2DArray(size, Constants.emptyState);
    this.circleRef = React.createRef();
    this.state = {
      size: size,
      puzzle: [
        ["A", "B", "B", "C", "C"],
        ["A", "A", "B", "D", "D"],
        ["A", "A", "D", "D", "D"],
        ["E", "E", "E", "D", "D"],
        ["E", "E", "E", "D", "D"],
      ],
      puzzleState: puzzleState,
      errors: Utils.empty2DArray(size, false),
      animating: Utils.empty2DArray(size, false),
      history: [puzzleState],
      historyIndex: 0,
      animatingMarkedLocation: false,
      completed: false,
    };
    this.initialState = this.state;
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
    e.preventDefault();
    var newVal;
    var setClearAnimationsTimer = false;
    this.setState(
      (state) => {
        const currentVal = state.puzzleState[i][j];
        if (alt) {
          newVal = currentVal === Constants.emptyState ? Constants.onState : Constants.emptyState;
        } else {
          newVal =
            currentVal === Constants.emptyState
              ? Constants.markedState
              : currentVal === Constants.markedState
              ? Constants.onState
              : Constants.emptyState;
        }

        // const newState = state.puzzleState[i][j]=newVal;
        var newState = state.puzzleState.map((row, x) => {
          return row.map((val, y) => {
            if (i === x && j === y) {
              return newVal;
            } else {
              return val;
            }
          });
        });

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
      if (state.historyIndex + 1 < history.length) {
        history = history.slice(0, state.historyIndex + 1);
      }
      return {
        history: history.concat([state.puzzleState]),
        historyIndex: history.length,
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

      const puzzleVal = state.puzzle[i][j];
      var animating = Utils.empty2DArray(state.size, true);
      const puzzleState = state.puzzleState.map((row, x) => {
        return row.map((val, y) => {
          if (val === Constants.emptyState) {
            // same row or column
            if (i === x || j === y) return Constants.markedState;

            // diagonally adjacent
            if ((i === x + 1 || i === x - 1) && (j === y + 1 || j === y - 1))
              return Constants.markedState;

            // same color background
            if (puzzleVal === state.puzzle[x][y]) return Constants.markedState;
          }
          animating[x][y] = false;
          return val;
        });
      });

      return {
        animatingMarkedLocation: { i: i, j: j },
        puzzleState: puzzleState,
        animating: animating,
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
      var listOfOnLocations = [];
      var errors = Array(5)
        .fill()
        .map((row) => new Array(5).fill(false));
      var errorCount = 0;
      state.puzzleState.forEach((row, x) => {
        return row.forEach((val, y) => {
          if (val === Constants.onState)
            listOfOnLocations.push({
              x: x,
              y: y,
              puzzleVal: state.puzzle[x][y],
            });
        });
      });

      listOfOnLocations.forEach((loc, i) => {
        listOfOnLocations.forEach((loc2, j) => {
          if (i >= j) return;
          if (
            loc.x === loc2.x || // same row
            loc.y === loc2.y || // same col
            loc.puzzleVal === loc2.puzzleVal || // same color
            ((loc.x === loc2.x + 1 || loc.x === loc2.x - 1) && // diagonal
              (loc.y === loc2.y + 1 || loc.y === loc2.y - 1))
          ) {
            errors[loc.x][loc.y] = true;
            errors[loc2.x][loc2.y] = true;
            errorCount++;
          }
        });
      });

      return {
        errors: errors,
        completed: errorCount === 0 && listOfOnLocations.length === state.puzzle.length,
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
    this.setState(this.initialState);
  }

  solvePuzzle() {
    this.setState((state) => {
      return {
        history: PuzzleSolver(state.puzzle),
        historyIndex: 0,
      };
    });
  }

  render() {
    return (
      <div className="puzzleContainer">
        <div className="puzzle">
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
          {this.state.completed && (
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
                  });
                  var icon = val === Constants.onState ? <GiSittingDog /> : "";
                  return (
                    <div
                      key={j}
                      className={cellClasses}
                      onClick={(e) => this.handleClick(e, i, j)}
                      onContextMenu={(e) => this.handleRightClick(e, i, j)}
                    >
                      <div className="content">{icon}</div>
                    </div>
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
