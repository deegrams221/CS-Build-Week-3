import React, {Component} from 'react';
import './App.css';
import Grid from './components/Grid';


class App extends Component {
  render() {
    return (
      <div className="App">
        <h1>Conway's Game of Life</h1>
        <Grid />
      </div>
    );
  }
}

export default App;