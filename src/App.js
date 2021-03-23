import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import Puzzle from "./Puzzle";
import Test from "./Test";
import "./App.scss";

export default function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/test">Test</Link>
            </li>
          </ul>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/test">
            <Test />
          </Route>
          <Route path="/">
            <Puzzle />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
