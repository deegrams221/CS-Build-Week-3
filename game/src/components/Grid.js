import React from 'react';
import Buttons from './Buttons';

// Grid to display rects
class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPlaying: false,
      grid: [],
      width: 0,
      height: 0,
      gen: 0
    }

    // handlers
    this.prevTimestamp = null;
    this.startHandler = this.startHandler.bind(this);
    this.stepHandler = this.stepHandler.bind(this);
    this.clearHandler = this.clearHandler.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.onAnimate = this.onAnimate.bind(this);
    this.getNeighbors = this.getNeighbors.bind(this);
    this.updateCanvas = this.updateCanvas.bind(this);
    this.drawIt = this.drawIt.bind(this);
    this.populate = this.populate.bind(this);
  }

  componentDidMount() {
    let rectangles = new Array(255).fill(0);
    let canvas = this.refs.canvas;
    let ctx = canvas.getContext('2d');
    // width and height
    let w = ctx.canvas.width;
    let h = ctx.canvas.height;
    let rectw = w/15;
    let recth = h/15;

    console.log(`Canvas Width: ${w}`);

    for (let x = 0; x <= w; x += rectw) {
      for (let y = 0; y <= h; y += recth) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    this.setState({
      grid: rectangles,
      width: rectw,
      height: recth
    }, this.updateCanvas(rectangles));
  }

  // start handler
  startHandler() {
    this.setState((prevState) => ({isPlaying: !prevState.isPlaying}), () => {
      if(this.state.isPlaying) requestAnimationFrame(this.onAnimate);
    })
  }

  // step handler
  stepHandler() {
    if(this.state.isPlaying === false) requestAnimationFrame(this.onAnimate);
  }

  // clear handler
  clearHandler() {
    if (this.state.isPlaying === false) {
      let nextGrid = new Array(255).fill(0);
      let stops = [];

      for (let i = 0; i < this.state.grid.length; i++) {
        if (this.state.grid[i] === 1) {
          stops.push(i);
        }
      }
      this.setState({grid: nextGrid, gen: 0}, this.updateCanvas([], stops));
    }
  }

  // click handler
  clickHandler(e) {
    if (this.state.isPlaying === false) {
      let idxRect = this.refs.canvas.getBoundingClientRect();
      let x = e.clientX - idxRect.left;
      let y = e.clientY - idxRect.top;
      let grid = this.state.grid.slice(0);

      console.log(`idxRect.left: ${idxRect.left}`);
      console.log(`idxRect.right: ${idxRect.right}`);

      x = Math.floor(x/this.state.width);
      y = Math.floor(y/this.state.height);

      console.log(`clientX: ${e.clientX}`);
      console.log(`x: ${x} y: ${y}`);

      let idx = (y * 15) + x;

      if (grid[idx] === 1) {
        grid[idx] = 0;
        this.setState({grid: grid}, this.updateCanvas([], [idx]));
      } else {
        grid[idx] = 1;
        this.setState({grid: grid}, this.updateCanvas([idx], []));
      }
    }
  }

  // animation
  onAnimate(timestamp) {
    if (this.prevTimestamp === null) {
      this.prevTimestamp = timestamp - 30;
    }

    // Find the dif between frames
    const elapsed = timestamp - this.prevTimestamp

    // For next frame
    this.prevTimestamp = timestamp;

    console.log(`Current time: ${timestamp} ms, frame time: ${elapsed} ms`);

    // Find the state of each rect based on getNeighbors
    let nextGen = [];
    let births = [];
    let deaths = [];

      for (let i = 0; i < this.state.grid.length; i++) {
        let curRect = this.state.grid[i];
        let neighbors = this.getNeighbors(i);
        // if a living rect has less than 2 or more than 3 neighbors it dies
        if(curRect === 1 && (neighbors < 2 || neighbors > 3)) {
          nextGen[i] = 0;
          deaths.push(i);
        }
        // if a dead rect has exactly 3 neighbors it comes to life
        else if(curRect === 0 && neighbors === 3) {
          nextGen[i] = 1;
          births.push(i);
        }
        // otherwise the rect persists
        else nextGen[i] = curRect;
      }

      this.updateCanvas(births, deaths);
      this.setState((prevState) => ({
        grid: nextGen,
        gen: prevState.gen + 1
      }));

      if(this.state.isPlaying) {
        setTimeout(() => {
          requestAnimationFrame(this.onAnimate);
        }, 1000);
      }
  }

  // get the neighbors
  getNeighbors(idx) {
    let numNeighbors = 0;
    let neighbors = [-16, -15, -14, -1, 1, 14, 15, 16];

    for(let i = 0; i < neighbors.length; i++){
      let neighborRect = idx + neighbors[i];

      if(neighborRect >= 0 && neighborRect < this.state.grid.length) { // check if inside the array
        if(idx % 15 === 0 && (neighbors[i] === -16 ||
          neighbors[i] === 14 ||
          neighbors[i] === -1)) continue; // ignore left overflow
        if(idx % 15 === 14 && (neighbors[i] === -14 ||
          neighbors[i] === 1 ||
          neighbors[i] === 16)) continue; // ignore right overflow
        if(this.state.grid[idx + neighbors[i]] === 1) numNeighbors++;
      }
    }
    return numNeighbors;
  }

  // Uses double buffering to update grid with next generation
  // draw
  drawIt(ctx, x, y, w, h, type) {
      if(type === 'birth') {
        // The fillRect() method draws a "filled" rectangle. The default color of the fill is black
        ctx.fillRect(x, y, w, h);
      } else if(type === 'death') {
        // The clearRect() method sets the pixels in a rectangular area to transparent black ( rgba(0,0,0,0) ). The rectangle's corner is at (x, y) , and its size is specified by width and height
        ctx.clearRect(x + 1, y + 1, w - 2, h - 2);
      }
  }

  // updateCanvas
  updateCanvas(births, deaths = null) {
    let canvas = this.refs.canvas;
    let ctx = canvas.getContext('2d');

    if(deaths != null) {
      for (let i = 0; i < births.length; i++) {
        // get row and column of the rect
        let x = births[i] % 15;
        let y = Math.floor(births[i] / 15);
        // turn row and column into coordinate values
        x *= this.state.width;
        y *= this.state.height;
        // fillRect birth
        this.drawIt(ctx, x, y, this.state.width, this.state.height, 'birth');
      }
      for (let j = 0; j < deaths.length; j++) {
        // get row and column of the rect
        let x = deaths[j] % 15;
        let y = Math.floor(deaths[j] / 15);
        // turn row and column into coordinate values
        x *= this.state.width;
        y *= this.state.height;
        // fillRect death
        this.drawIt(ctx, x, y, this.state.width, this.state.height, 'death');
      }
    } else {
      for (let k = 0; k < births.length; k++) {
        if(births[k] === 1) {
          let x = k % 15;
          let y = Math.floor(k / 15);
          // turn row and column into coordinate values
          x *= this.state.width;
          y *= this.state.height;
          // fillRect birth
          this.drawIt(ctx, x, y, this.state.width, this.state.height, 'birth');
        }
      }
    }
  }

  // populating
  populate(e) {
    if(this.state.isPlaying === false) {
      this.clearHandler();

      let nextGrid = new Array(255).fill(0);
      let arr = [];

      // switch cases
      switch(e.target.name) {
        case 'random':
          for (let i = 0; i < nextGrid.length; i++) {
            nextGrid[i] = Math.floor(Math.random() * Math.floor(2));
          }
          this.setState({grid: nextGrid}, this.updateCanvas(nextGrid));
          break;
        case 'glider':
          arr = [53,66,67,68,37];
          break;
        case 'pulsar':
          arr = [18,19,20,24,25,26,58,73,88,101,100,99,83,68,53,51,66,81,95,94,93,76,61,46,136,151,166,198,199,200,171,156,141,125,124,123,143,158,173,204,205,206,178,163,148,131,130,129];
          break;
        case 'blinker':
          arr = [67,82,97];
          break;
        case 'beehive':
            arr = [53, 54, 83, 84, 67, 70];
        default:
          break;
      }
      // alg for random canvas
      if(e.target.name !== 'random'){
        for (let i = 0; i < arr.length; i++) {
          nextGrid[arr[i]] = 1;
        }
        this.setState({grid: nextGrid}, this.updateCanvas(arr,[]));
      }
    }
  }

  render() {
    return (
      <div className='grid'>
        <canvas id="canvas" ref="canvas" width="725" height="550" onClick={this.clickHandler}></canvas>
        <Buttons startHandler={this.startHandler} isPlaying={this.state.isPlaying} gen={this.state.gen} stepHandler={this.stepHandler} clearHandler={this.clearHandler} populate={this.populate}/>
      </div>
  )}
}

export default Grid;