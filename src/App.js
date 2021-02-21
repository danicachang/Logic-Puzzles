import logo from './logo.svg';
import React from 'react';
import classNames from 'classnames/bind';
import './App.scss';

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
			puzzleState: []
		}
	}
	render() {
		return (
			<div className="puzzle">
				{this.state.puzzle.map((row, i) => {
					return (
						<div key={i}>
							{row.map((cell, j) => {
								var cellClasses = classNames({
									topBorder: 		i === 0 || this.state.puzzle[i-1][j] != cell,
									rightBorder: 	j === this.state.cols-1 || this.state.puzzle[i][j+1] != cell,
									bottomBorder: i === this.state.rows-1 || this.state.puzzle[i+1][j] != cell,
									leftBorder: 	j === 0 || this.state.puzzle[i][j-1] != cell,
									[cell + "-color"]: true
								});
								return <div key={j} className={cellClasses}></div>
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
