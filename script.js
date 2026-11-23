// L-system fractal presets
const presets = {
  1: { name: "Koch snowflake",
       axiom: "F--F--F", rules: { F: "F+F--F+F" },
       angle: 60, draws: "F", iterations: 7 },
  2: { name: "Another fractal",
       axiom: "f-f-f-f", rules: { f: "ff-f-f-f-f-f+f" },
       angle: 85, draws: "f", iterations: 4 },
  3: { name: "Dragon curve",
       axiom: "FX", rules: { X: "X+YF+", Y: "-FX-Y" },
       angle: 90, draws: "F", iterations: 9 },
  4: { name: "Gosper curve",
       axiom: "A", rules: { A: "A-B--B+A++AA+B-", B: "+A-BB--B-A++A+B" },
       angle: 60, draws: "AB", iterations: 3 },
  5: { name: "Hilbert curve",
       axiom: "A", rules: { A: "+BF-AFA-FB+", B: "-AF+BFB+FA-" },
       angle: 90, draws: "F", iterations: 5 },
  6: { name: "Three-Sided Koch Curve Island",
       axiom: "F++F++F", rules: { F: "F-F++F-F" },
       angle: 60, draws: "F", iterations: 3 },
  7: { name: "Levy C curve",
        axiom: "F", rules: { F: "+F--F+" },
        angle: 45, draws: "F", iterations: 3 },
  8: { name: "Peano curve",
       axiom: "L", rules: { L: "+RF-LFL-FR+", R: "-LF+RFR+FL-" },
       angle: 80, draws: "LR", iterations: 4 },
  9: { name: "Quadratic Koch island",
        axiom: "F+F+F+F", rules: { F: "F+F-F-FF+F+F-F" },
        angle: 90, draws: "F", iterations: 1 },
};

let currentKey = 1; // The currently selected preset key
const maxSymbols = 200000; // Limit to avoid freezing the browser
let currentSentence = ""; // The current expanded L-system string
let statusMessage = ""; // Message to display if the drawing limit is exceeded

let segs = [];          // flat array: x1, y1, x2, y2, ... in unit coordinates
let segCount = 0;
let failed = false;     // true if the preset exceeds the drawing limit
let scl = 1, offX = 0, offY = 0;
 
// Animation state
let startMs = 0;        // when the current growth animation began
let growSeconds = 3;    // how long the growth phase lasts

//animation tweaks
const rippleAmp = 10; // amplitude of the ripple effect
const rippleFreq = 5.5; // frequency of the ripple effect
const rippleScale = 1.5; // scale of the ripple effect
const hueSpeed = 40; // speed of hue change in degrees per second

// mouse interaction
const mouseRadius = 50; // how far the cursor's influence reaches (px)
const mouseStrength = 0.5; // strength of mouse interaction for ripple effect
let rx, ry; // output of mouse interaction for warp effect

function setup() {
  createCanvas(700, 700);
  colorMode(HSB, 360, 100, 100);
  rebuild();
}
// Rebuild the current preset and compute the segments
function rebuild() {
  const p = presets[currentKey];
  const sentence = build(p);
  segs = [];
  segCount = 0;
  startMs = millis();

  if (sentence === null) {
    failed = true;
    return;
  }
  failed = false;
  currentSentence = sentence;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  walk(sentence, p, (x1, y1, x2, y2) => {
    segs.push(x1, y1, x2, y2);
    minX = min(minX, x1, x2); maxX = max(maxX, x1, x2);
    minY = min(minY, y1, y2); maxY = max(maxY, y1, y2);
  });
  segCount = segs.length / 4;

  const margin = 30;
  scl = min((width - 2 * margin) / (maxX - minX),
            (height - 2 * margin) / (maxY - minY));
  offX = (width - (maxX - minX) * scl) / 2 - minX * scl;
  offY = (height - (maxY - minY) * scl) / 2 - minY * scl;

  // Bigger fractals take a little longer to draw
  growSeconds = constrain(segCount / 1500, 1.5, 6);
}

function draw() {
   background(0, 0, 10);

  if (failed) {
    noStroke();
    fill(0, 0, 100);
    textSize(16);
    textAlign(LEFT, TOP);
    text("This preset exceeds the drawing limit.", 10, 18);
    drawUI();
    return;
  }

  const t = millis() / 1000;
  const elapsed = (millis() - startMs) / 1000;


  // Growth progress, eased so it starts fast and settles
  const g = constrain(elapsed / growSeconds, 0, 1);
  const eased = 1 - pow(1 - g, 3);
  const n = floor(eased * segCount);

  // Ripples fade in as the drawing finishes, so growth looks clean
  const amp = rippleAmp * g;

  strokeWeight(1);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    let x1 = segs[j] * scl + offX, y1 = segs[j + 1] * scl + offY;
    let x2 = segs[j + 2] * scl + offX, y2 = segs[j + 3] * scl + offY;

    // Warp depends on position, not index, so shared endpoints stay connected
    [x1, y1] = warp(x1, y1, t, amp, g);
    [x2, y2] = warp(x2, y2, t, amp, g);

    stroke(((i / segCount) * 300 + t * hueSpeed) % 360, 70, 100);
    line(x1, y1, x2, y2);

    // Additional ripple effect based on frequency
    x1 += sin(y1 * rippleFreq + t * 2) * rippleScale;
    y1 += cos(x1 * rippleFreq + t * 1.4) * rippleScale;
    x2 += sin(y2 * rippleFreq + t * 2.2) * rippleScale;
    y2 += cos(x2 * rippleFreq + t * 3.3) * rippleScale;

    stroke(((i / segCount) * 300 + t * hueSpeed) % 360, 70, 100);
    line(x1, y1, x2, y2);
  }

  drawUI();
}

// Draw the UI text overlay
function drawUI() {
  const p = presets[currentKey];
  noStroke();
  fill(0, 0, 100);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`${currentKey}: ${p.name}  (iterations: ${p.iterations})`, 10, 18);
  text("Press 1-9 to select a preset, click to add an iteration, SPACE to replay",
       10, height - 30);
  if (statusMessage) text(statusMessage, 10, height - 52);
}

// Warp a point based on mouse position and ripple effect
function warp(x, y, t, amp, g) {
  const ox = x, oy = y;

  x += sin(oy * rippleScale + t * rippleFreq) * amp;
  y += cos(ox * rippleScale + t * rippleFreq * 0.87) * amp;

  const dx = ox - mouseX, dy = oy - mouseY;
  const d2 = dx * dx + dy * dy;
  if (d2 < mouseRadius * mouseRadius && d2 > 0.01) {
    const d = sqrt(d2);
    const k = 1 - d / mouseRadius;          // 1 at cursor, 0 at the edge
    const push = k * k * mouseStrength * g; // soft falloff
    x += (dx / d) * push;
    y += (dy / d) * push;
  }

  rx = x; ry = y;
}

// Expand the axiom by applying the rules
function build(p) {
  let s = p.axiom;
  for (let n = 0; n < p.iterations; n++) {
    if (expandedLength(s, p) > maxSymbols) return null;
    const next = [];
    for (const c of s) next.push(p.rules[c] ?? c);
    s = next.join("");
  }
  return s;
}

function expandedLength(sentence, p) {
  let length = 0;
  for (const c of sentence) {
    length += (p.rules[c] ?? c).length;
    if (length > maxSymbols) return length;
  }
  return length;
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

// Preset selection via number keys from 1-9
function keyPressed() {
  if (presets[key]) {
    currentKey = key;
    statusMessage = "";
    rebuild();
  } else if (key === " ") {
    rebuild();
    return false; // prevent scrolling
  }    
}

// Click to add an iteration (wraps around at 9)
function mousePressed() {
  const p = presets[currentKey];
  if (p.iterations >= 9) {
    p.iterations = 1;
    statusMessage = "";
  } else if (expandedLength(currentSentence, p) > maxSymbols) {
    p.iterations = 1;
    statusMessage = "Detail limit reached; restarting at iteration 1";
  } else {
    p.iterations++;
    statusMessage = "";
  }
  rebuild();
}