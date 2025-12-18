let pg;
let particles = [];
let targets = [];
let txt = "PLURIBUS";

let cfg = {
  fontSize: 120,
  sampleStep: 4,        
  particleCount: 1200,  
  attract: 0.055,       
  maxForce: 1.2,
  maxSpeed: 2.5,
  noiseScale: 0.006,
  noiseAmp: 1.1,
  curlEps: 0.8,
  damping: 0.92,
  jitter: 0.05,
  mouseRadius: 140,
  mouseForce: 2.4
};

function setup() {
  createCanvas(2400, 800);
  pixelDensity(1);
  pg = createGraphics(width, height);
  pg.pixelDensity(1);

  buildTargets(txt);
  initParticles();
  background(0);
}

function draw() {
  background(0, 40);

  // bg dots (not interactive)
  // drawStars(250);

  let t = millis() * 0.0002;

  for (let i = 0; i < particles.length; i++) {
    let p = particles[i];

    // le attraction to its assigned target
    let tgt = targets[p.ti];
    let toT = createVector(tgt.x - p.pos.x, tgt.y - p.pos.y);
    let d = toT.mag() + 1e-6;
    toT.mult(cfg.attract);

    // le curl-ish noise field
    let curl = curlField(p.pos.x, p.pos.y, t);
    curl.mult(cfg.noiseAmp);

    // le mouse repulsion
    let repel = createVector(0, 0);
    let md = dist(mouseX, mouseY, p.pos.x, p.pos.y);
    if (md < cfg.mouseRadius) {
      let away = createVector(p.pos.x - mouseX, p.pos.y - mouseY);
      away.normalize();
      let s = (1 - md / cfg.mouseRadius);
      away.mult(cfg.mouseForce * s * s);
      repel.add(away);
    }

    // total force
    p.vel.add(limitVec(toT, cfg.maxForce));
    p.vel.add(limitVec(curl, cfg.maxForce));
    p.vel.add(repel);

    // tiny jitter so it shimmers
    p.vel.x += random(-cfg.jitter, cfg.jitter);
    p.vel.y += random(-cfg.jitter, cfg.jitter);

    // integrate
    p.vel.mult(cfg.damping);
    p.vel = limitVec(p.vel, cfg.maxSpeed);
    p.pos.add(p.vel);

    // wrap
    if (p.pos.x < -10) p.pos.x = width + 10;
    if (p.pos.x > width + 10) p.pos.x = -10;
    if (p.pos.y < -10) p.pos.y = height + 10;
    if (p.pos.y > height + 10) p.pos.y = -10;

    // draw particle
    stroke(255);
    strokeWeight(1);
    point(p.pos.x, p.pos.y);
  }
  // le mask
  // image(pg, 0, 0, 240, 120);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    buildTargets(txt);
    initParticles();
    background(0);
  }
  if (key === 's' || key === 'S') {
    saveCanvas("particle_text", "png");
  }
}

function buildTargets(str) {
  pg.clear();
  pg.background(0);
  pg.fill(255);
  pg.noStroke();
  pg.textAlign(CENTER, CENTER);
  pg.textSize(cfg.fontSize);
  pg.textStyle(BOLD);

  // simple centering
  pg.text(str, width * 0.3, height * 0.36);

  pg.loadPixels();
  targets = [];

  for (let y = 0; y < height; y += cfg.sampleStep) {
    for (let x = 0; x < width; x += cfg.sampleStep) {
      let idx = 4 * (y * width + x);
      let v = pg.pixels[idx]; // red channel
      if (v > 10) targets.push({ x, y });
    }
  }

  // if super dense, thin it a bit
  shuffle(targets, true);
  let want = min(targets.length, cfg.particleCount);
  targets = targets.slice(0, want);
}

function initParticles() {
  particles = [];
  let n = cfg.particleCount;

  // if we have fewer targets than particles, reuse targets
  if (targets.length === 0) return;

  for (let i = 0; i < n; i++) {
    let ti = i % targets.length;
    particles.push({
      pos: createVector(random(width), random(height)),
      vel: createVector(random(-1, 1), random(-1, 1)),
      ti
    });
  }
}

// take noise gradients and rotate 90°
function curlField(x, y, t) {
  let s = cfg.noiseScale;
  let e = cfg.curlEps;

  let n1 = noise((x + e) * s, y * s, t);
  let n2 = noise((x - e) * s, y * s, t);
  let a = (n1 - n2) / (2 * e);

  let n3 = noise(x * s, (y + e) * s, t);
  let n4 = noise(x * s, (y - e) * s, t);
  let b = (n3 - n4) / (2 * e);

  // rotate gradient to get divergence-free-ish flow
  return createVector(-b, a);
}

function limitVec(v, m) {
  let vv = v.copy();
  let mag = vv.mag();
  if (mag > m) vv.mult(m / (mag + 1e-6));
  return vv;
}

function drawStars(count) {
  noStroke();
  fill(255, 90);
  for (let i = 0; i < count; i++) {
    let x = (frameCount * 0.2 + i * 71.3) % width;
    let y = (noise(i * 0.13, frameCount * 0.002) * height);
    circle(x, y, noise(i * 0.5, 10) * 2.2 + 0.4);
  }
}
