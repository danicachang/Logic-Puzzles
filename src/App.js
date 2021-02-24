import logo from './logo.svg';
import React from 'react';
import classNames from 'classnames/bind';
import { GiSittingDog } from 'react-icons/gi';
import './App.scss';

const onState = "O";
const markedState = "x";
const newlyMarkedState = "X";
const emptyState = "";

class Puzzle extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			rows: 5,
			cols: 5,
			puzzle: [
				['A', 'B', 'B', 'C', 'C'],
				['A', 'A', 'B', 'D', 'D'],
				['A', 'A', 'D', 'D', 'D'],
				['E', 'E', 'E', 'D', 'D'],
				['E', 'E', 'E', 'D', 'D']
			],
			puzzleState: Array(5).fill().map(row => new Array(5).fill(emptyState)),
			errors: Array(5).fill().map(row => new Array(5).fill(false)),
			history: [],
			animatingMarkedLocation: false
		}
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

	handleClick(e,i,j, alt = false){
		e.preventDefault();
    this.setState(state => {
			var currentVal = state.puzzleState[i][j];
			var newVal;
			if (alt) {
				newVal = (currentVal === markedState || currentVal === newlyMarkedState)?
									emptyState : markedState;
			} else {
				newVal = currentVal === emptyState? onState :
								 currentVal === onState? markedState : emptyState;
			}

			var action = {
				i: i,
				j: j,
				oldVal: currentVal,
				newVal: newVal
			};

			if (newVal === onState) {
				setTimeout(()=>{
					this.autoMarkNeighbors(i,j);
				}, 500);
			}

			// const newState = state.puzzleState[i][j]=newVal;
			const newState = state.puzzleState.map((row, x) => {
				return row.map((val, y) => {
					if (i===x && j===y) {
						return newVal;
					} else {
						return val;
					}
				});
			});

      return {
				history : state.history.concat(action),
				puzzleState : newState
			};
		});

		this.checkForErrors();
	}
	handleRightClick(e,i,j){
		this.handleClick(e,i,j, true);
	}

	autoMarkNeighbors(i, j) {
    this.setState(state => {
			if (state.puzzleState[i][j] !== onState) return;

			var puzzleVal = state.puzzle[i][j];
			return {
				animatingMarkedLocation: {
					top: (i*20 + 10) + "%",
					left: (j*20 + 10) + "%"
				},
				puzzleState :
					state.puzzleState.map((row, x) => {
						return row.map((val, y) => {
							if (val === emptyState) {
								 // same row or coloumn
								if (i===x || j===y)
									return newlyMarkedState;

								// diagonally adjecent
								if ((i === (x+1) || i === (x-1)) && (j === (y+1) || j === (y-1)))
									return newlyMarkedState;

								// same color background
								if (puzzleVal === state.puzzle[x][y])
									return newlyMarkedState;
							}
							return val;
						});
					})
			};
		});
		setTimeout(() => {
			this.setState(state => {
				return {
					animatingMarkedLocation: false,
					puzzleState :
						state.puzzleState.map((row, x) => {
							return row.map((val, y) => {
								if (val===newlyMarkedState) {
									return markedState;
								}
								return val;
							});
						})
				};
			});
		}, 1500); // Value must match .animatedBackground animation-duration
	}

	checkForErrors() {
		this.setState(state => {
			var listOfOnLocations = [];
			var errors = Array(5).fill().map(row => new Array(5).fill(false));
			state.puzzleState.forEach((row, x) => {
				return row.forEach((val, y) => {
					if (val === onState)
						listOfOnLocations.push({
							x: x,
							y: y,
							puzzleVal: state.puzzle[x][y]
						})
				});
			});

			listOfOnLocations.forEach((loc, i) => {
				listOfOnLocations.forEach((loc2, j) => {
					if (i >= j) return;
					if (loc.x === loc2.x || loc.y === loc2.y || loc.puzzleVal === loc2.puzzleVal) {
						errors[loc.x][loc.y] = true;
						errors[loc2.x][loc2.y] = true;
					}
				});
			});


      return {
				errors : errors
			};
		});
	}

	render() {
		return (
			<div className="puzzle">
				{this.state.animatingMarkedLocation &&
					<div className="animatedBackground">
						<div className="circle" style={this.state.animatingMarkedLocation}></div>
					</div>
				}
				{this.state.puzzle.map((row, i) => {
					return (
						<div key={i}>
							{row.map((cell, j) => {
								const val = this.state.puzzleState[i][j]
								var cellClasses = classNames({
									cell: true,
									topBorder: 		i === 0 || this.state.puzzle[i-1][j] != cell,
									rightBorder: 	j === this.state.cols-1 || this.state.puzzle[i][j+1] != cell,
									bottomBorder: i === this.state.rows-1 || this.state.puzzle[i+1][j] != cell,
									leftBorder: 	j === 0 || this.state.puzzle[i][j-1] != cell,
									marked:			  val === markedState,
									newlyMarked: 	val === newlyMarkedState,
									[cell + "-color"]: true,
									error: 				this.state.errors[i][j]
								});
								var icon = val === onState? <GiSittingDog /> : "";
								return (
									<div key={j} className={cellClasses} onClick={(e) => this.handleClick(e,i,j)} onContextMenu={(e) => this.handleRightClick(e,i,j)}>
										<div className="content">{icon}</div>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		);
	}
}

function App() {
  return (
    <Puzzle />
  );
}

export default App;
