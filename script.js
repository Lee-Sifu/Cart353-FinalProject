const axiom = "F";
const rules = {
  "F": "FF+[+F-F-F]-[-F+F+F]"
};

let sentence = axiom;
let len = 100;
let angle;

function generate() {
  let nextSentence = "";
  for (let i = 0; i < sentence.length; i++) {
    let current = sentence.charAt(i);
    if (rules[current]) {
      nextSentence += rules[current];
    } else {
      nextSentence += current;
    }
  }
  sentence = nextSentence;
  len *= 0.5;
}

function setup() {
  createCanvas(500, 500);
  angle = radians(25);
  background(51);
  generate();
}

function draw() {
  background(51);
  translate(width / 2, height);
  stroke(255);
  for (let i = 0; i < sentence.length; i++) {
    let current = sentence.charAt(i);

    if (current == "F") {
      line(0, 0, 0, -len);
      translate(0, -len);
    } else if (current == "+") {
      rotate(angle);
    } else if (current == "-") {
      rotate(-angle);
    } else if (current == "[") {
      push();
    } else if (current == "]") {
      pop();
    }
  }
}