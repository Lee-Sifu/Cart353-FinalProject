// L-system fractal generator
const presets = {
  1: { name: "Koch snowflake",
       axiom: "F--F--F", rules: { F: "F+F--F+F" },
       angle: 55, draws: "F", iterations: 4 },
  2: { name: "Sierpinski triangle",
       axiom: "F-G-G", rules: { F: "F-G+F+G-F", G: "GG" },
       angle: 120, draws: "FG", iterations: 6 },
  3: { name: "Dragon curve",
       axiom: "FX", rules: { X: "X+YF+", Y: "-FX-Y" },
       angle: 90, draws: "F", iterations: 12 },
  4: { name: "Gosper curve",
       axiom: "A", rules: { A: "A-B--B+A++AA+B-", B: "+A-BB--B-A++A+B" },
       angle: 60, draws: "AB", iterations: 4 },
  5: { name: "Hilbert curve",
       axiom: "A", rules: { A: "+BF-AFA-FB+", B: "-AF+BFB+FA-" },
       angle: 90, draws: "F", iterations: 5 },
  6: { name: "Fractal plant",
       axiom: "X", rules: { X: "F-[[X]+X]+F[+FX]-X", F: "FF" },
       angle: 25, draws: "F", iterations: 5 },
  7: { name: "Fractal tree",
       axiom: "F", rules: { F: "FF-[-F+F+F]+[+F-F-F]" },
       angle: 22.5, draws: "F", iterations: 5 },
  8: { name: "Peano curve",
       axiom: "L", rules: { L: "+RF-LFL-FR+", R: "-LF+RFR+FL-" },
       angle: 80, draws: "LR", iterations: 4 }
};

let currentKey = 1;

function setup() {
  createCanvas(600, 600);
  colorMode(HSB, 360, 100, 100);
  noLoop();
}

function draw() {
  const p = presets[currentKey];
  const sentence = build(p);

  // Dry run: find the bounding box with unit-length segments
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let count = 0;
  walk(sentence, p, (x1, y1, x2, y2) => {
    minX = min(minX, x1, x2); maxX = max(maxX, x1, x2);
    minY = min(minY, y1, y2); maxY = max(maxY, y1, y2);
    count++;
  });

  // Scale and center to fit the canvas
  const margin = 30;
  const s = min((width - 2 * margin) / (maxX - minX),
                (height - 2 * margin) / (maxY - minY));
  const offX = (width - (maxX - minX) * s) / 2 - minX * s;
  const offY = (height - (maxY - minY) * s) / 2 - minY * s;

  background(0, 0, 10);
  strokeWeight(1);

  // Real draw, with hue shifting along the path
  let i = 0;
  walk(sentence, p, (x1, y1, x2, y2) => {
    stroke((i / count) * 300, 70, 100);
    line(x1 * s + offX, y1 * s + offY, x2 * s + offX, y2 * s + offY);
    i++;
  });

  noStroke();
  fill(0, 0, 100);
  text(`${currentKey}: ${p.name}  (iterations: ${p.iterations})`, 10, 18);
}

// Expand the axiom by applying the rules
function build(p) {
  let s = p.axiom;
  for (let n = 0; n < p.iterations; n++) {
    let next = "";
    for (const c of s) next += p.rules[c] ?? c;
    s = next;
  }
  return s;
}

// Turtle interpreter: calls cb for each line segment
function walk(sentence, p, cb) {
  let x = 0, y = 0, a = 0;
  const turn = radians(p.angle);
  const stack = [];

  for (const c of sentence) {
    if (p.draws.includes(c)) {
      const nx = x + cos(a);
      const ny = y + sin(a);
      cb(x, y, nx, ny);
      x = nx; y = ny;
    } else if (c === "+") a += turn;
    else if (c === "-") a -= turn;
    else if (c === "[") stack.push([x, y, a]);
    else if (c === "]") [x, y, a] = stack.pop();
  }
}

// Preset selection via number keys from 1-8
function keyPressed() {
  if (presets[key]) {
    currentKey = key;
    redraw();
  }
}

// Optional: click to add an iteration (wraps around at 8)
function mousePressed() {
  const p = presets[currentKey];
  p.iterations = p.iterations >= 8 ? 1 : p.iterations + 1;
  redraw();
}