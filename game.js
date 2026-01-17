// Flappy Shark (GitHub Pages safe)
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

// Turn DEV_MODE off before gifting
const DEV_MODE = false;

// Palette + shark ramp
const COLORS = {
  purpleMain: "#9b7bd3",
  purpleDark: "#6f4fa3",
  redCoral: "#7a2b3a",
  redCoralDark: "#5b1e2d",
  yellowSoft: "#f2d16b",
  yellowGold: "#d6b85a",
  bg: "#1a1429",
  white: "#ffffff",

  // sparkles
  pinkSparkle: "#ff4fd8",
  pinkSparkleLight: "#ff8fe7",

  // shark ramp (blue/yellow vibe)
  sharkDark:  "#24506a",
  sharkMid:   "#3f87a7",
  sharkLight: "#8fd6ff",
  sharkBelly: "#f3fbff",
  sharkStripe:"#f2d16b",
};

// Initialize Valentine module if present
if (window.Valentine && typeof Valentine.init === "function") {
  Valentine.init({ canvas, COLORS });
}

// --- Game state ---
let gameState = "start"; // start|playing|gameover|freeze|transition|valentine|celebrate|kiss|final
let frame = 0;
let score = 0;

// Transition/freeze
let freezeTimer = 0;
let transitionOffset = 0;
let fadeAlpha = 0;

// Particles
let sparkles = [];
let stars = [];
let bubbles = [];

// Physics
const gravity = 0.5;
const jumpStrength = -8;
const pipeGap = 120;
const pipeWidth = 54;
const pipeSpeed = 3;

// Shark
const shark = { x: 140, y: canvas.height / 2, size: 34, velocity: 0 };

// Pipes
let pipes = [];

// Ghost
let currentRunPath = [];
let ghostPath = JSON.parse(localStorage.getItem("ghostPath") || "[]");
let bestScore = Number(localStorage.getItem("bestScore") || 0);
let secretUnlocked = localStorage.getItem("secretUnlocked") === "true";

// --- Background init ---
function initBackground() {
  stars = [];
  bubbles = [];
  for (let i = 0; i < 90; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 0.5 + 0.2 });
  }
  for (let i = 0; i < 40; i++) {
    bubbles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, s: Math.random() * 0.9 + 0.3, r: Math.random() * 4 + 2 });
  }
}
initBackground();

// --- Input ---
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (gameState === "start") resetGame();
    else if (gameState === "playing") shark.velocity = jumpStrength;
    else if (gameState === "gameover") gameState = "start";
  }

  if (!DEV_MODE) return;
  if (e.code === "KeyB") { enterValentine(); }         // jump to valentine
  if (e.code === "KeyC") { enterCelebrate(); }         // jump to celebrate
  if (e.code === "KeyK") { enterKiss(); }              // jump to kiss
  if (e.code === "KeyF") { enterFinal(); }             // jump to final
});

// Clicks for valentine and returning home
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (gameState === "valentine" && window.Valentine) {
    const accepted = Valentine.handleValentineClick({ x, y, getButtons: getValentineButtons });
    if (accepted) enterCelebrate();
    return;
  }
  if (gameState === "final") {
    gameState = "start";
    return;
  }
});

// --- Helpers ---
function getValentineButtons() {
  const cx = canvas.width / 2;
  const y = Math.round(canvas.height * 0.62);
  const w = 160, h = 56, gap = 40;
  return {
    left:  { x: Math.round(cx - gap/2 - w), y, w, h },
    right: { x: Math.round(cx + gap/2),     y, w, h },
  };
}

function resetGame() {
  shark.y = canvas.height / 2;
  shark.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  currentRunPath = [];
  freezeTimer = 0;
  transitionOffset = 0;
  fadeAlpha = 0;
  sparkles = [];
  gameState = "playing";
}

function spawnSparkles(x, y, n = 18, color = COLORS.yellowSoft) {
  for (let i = 0; i < n; i++) {
    sparkles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.8) * 7,
      life: 35,
      c: color
    });
  }
}

function drawSparkles() {
  sparkles.forEach(s => {
    ctx.fillStyle = s.c;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
  });
}

function spawnPipe() {
  const top = Math.floor(Math.random() * (canvas.height - pipeGap - 260) + 120);
  pipes.push({
    x: canvas.width + 20,
    top,
    bottom: top + pipeGap,
    swaySeed: Math.random() * Math.PI * 2,
    polyps: Array.from({ length: 14 }, () => Math.random()),
    scored: false
  });
}

// --- Update ---
function updateBackground() {
  stars.forEach(s => { s.y += s.s; if (s.y > canvas.height) s.y = 0; });
  bubbles.forEach(b => { b.y -= b.s; if (b.y < -10) b.y = canvas.height + 10; });
}

function update() {
  frame++;
  updateBackground();

  // Update Valentine module timers/particles
  if (window.Valentine && typeof Valentine.update === "function") {
    Valentine.update({ frame, canvas });
  }

  // Sparkles update
  sparkles.forEach(s => { s.x += s.vx; s.y += s.vy; s.life--; s.vy += 0.12; });
  sparkles = sparkles.filter(s => s.life > 0);

  if (gameState === "playing") {
    shark.velocity += gravity;
    shark.y += shark.velocity;
    currentRunPath.push({ y: shark.y });

    if (frame % 120 === 0) spawnPipe();

    pipes.forEach(p => {
      p.x -= pipeSpeed;
      if (!p.scored && p.x + pipeWidth < shark.x) { score++; p.scored = true; }
      const hitX = shark.x + shark.size > p.x && shark.x < p.x + pipeWidth;
      const hitY = shark.y < p.top || shark.y + shark.size > p.bottom;
      if (hitX && hitY) endGame();
    });

    pipes = pipes.filter(p => p.x + pipeWidth > -50);

    if (shark.y < 0 || shark.y + shark.size > canvas.height) endGame();
  }

  if (gameState === "freeze") {
    freezeTimer++;
    if (freezeTimer > 180) gameState = "transition";
  }

  if (gameState === "transition") {
    transitionOffset += 10;
    fadeAlpha = Math.min(1, fadeAlpha + 0.02);
    if (fadeAlpha >= 1) gameState = "valentine";
  }
}

// --- End game + unlock logic ---
function endGame() {
  const hadGhost = ghostPath.length > 0;

  if (score > bestScore) {
    bestScore = score;
    ghostPath = currentRunPath;
    localStorage.setItem("bestScore", String(bestScore));
    localStorage.setItem("ghostPath", JSON.stringify(ghostPath));

    // Trigger cinematic once: first time beating an existing ghost
    if (hadGhost && !secretUnlocked) {
      secretUnlocked = true;
      localStorage.setItem("secretUnlocked", "true");
      gameState = "freeze";
      freezeTimer = 0;
      transitionOffset = 0;
      fadeAlpha = 0;
      spawnSparkles(canvas.width/2, canvas.height/2, 30, COLORS.pinkSparkleLight);
      return;
    }
  }

  gameState = "gameover";
}

// --- Scene enters ---
function enterValentine() {
  gameState = "valentine";
}
function enterCelebrate() {
  gameState = "celebrate";
  if (window.Valentine && Valentine.startCelebrate) Valentine.startCelebrate();
}
function enterKiss() {
  gameState = "kiss";
  if (window.Valentine && Valentine.startKiss) Valentine.startKiss();
}
function enterFinal() {
  gameState = "final";
  if (window.Valentine && Valentine.startFinal) Valentine.startFinal();
}

// --- Draw helpers ---
function drawBackground() {
  const cycle = Math.sin(frame * 0.002) * 0.5 + 0.5;
  ctx.fillStyle = `rgb(${Math.floor(32 + cycle*25)},${Math.floor(24 + cycle*20)},${Math.floor(60 + cycle*45)})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.yellowSoft;
  stars.forEach(s => ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2));

  ctx.fillStyle = "rgba(200,210,255,0.35)";
  bubbles.forEach(b => ctx.fillRect(Math.round(b.x), Math.round(b.y), b.r, b.r));
}

function drawCoral(pipe, y, h, flip) {
  const sway = Math.sin(frame * 0.02 + pipe.swaySeed) * 4;
  const x = pipe.x + sway * flip;

  ctx.fillStyle = COLORS.redCoral;
  ctx.fillRect(x, y, pipeWidth, h);

  for (let i = 0; i < h; i += 18) {
    ctx.fillRect(x - 6, y + i, 6, 12);
    ctx.fillRect(x + pipeWidth, y + i + 7, 6, 12);
  }

  ctx.fillStyle = COLORS.redCoralDark;
  ctx.fillRect(x + pipeWidth - 6, y, 6, h);

  ctx.fillStyle = COLORS.yellowSoft;
  pipe.polyps.forEach((p, i) => {
    if (Math.sin(frame * 0.05 + p * 10) > 0.6) {
      const px = x + (i * 9) % (pipeWidth - 2);
      const py = y + (i * 33) % Math.max(1, h - 2);
      ctx.fillRect(px, py, 2, 2);
    }
  });
}

function drawPipes() {
  pipes.forEach(p => {
    drawCoral(p, 0, p.top, 1);
    drawCoral(p, p.bottom, canvas.height - p.bottom, -1);
  });
}

function drawGhost() {
  if (gameState === "playing" && ghostPath.length > frame) {
    drawPixelShark(shark.x, ghostPath[frame].y, 0.18);
  }
}

// Detailed main shark (blue/yellow)
function drawPixelShark(x, y, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x - 6, y + 26, 46, 3);

  // back ridge
  ctx.fillStyle = COLORS.sharkDark;
  ctx.fillRect(x + 6, y + 10, 34, 14);
  ctx.fillRect(x + 16, y + 4, 18, 6);

  // body mid
  ctx.fillStyle = COLORS.sharkMid;
  ctx.fillRect(x + 8, y + 12, 34, 12);
  ctx.fillRect(x + 18, y + 6, 16, 6);

  // highlight
  ctx.fillStyle = COLORS.sharkLight;
  ctx.fillRect(x + 12, y + 12, 18, 4);
  ctx.fillRect(x + 24, y + 16, 12, 3);

  // belly
  ctx.fillStyle = COLORS.sharkBelly;
  ctx.fillRect(x + 18, y + 22, 18, 6);

  // yellow stripe accent
  ctx.fillStyle = COLORS.sharkStripe;
  ctx.fillRect(x + 14, y + 18, 10, 2);

  // fin
  ctx.fillStyle = COLORS.sharkDark;
  ctx.fillRect(x + 26, y - 4, 8, 10);
  ctx.fillStyle = COLORS.sharkMid;
  ctx.fillRect(x + 27, y - 3, 6, 8);

  // tail
  ctx.fillStyle = COLORS.sharkMid;
  ctx.fillRect(x - 10, y + 16, 14, 10);
  ctx.fillStyle = COLORS.sharkDark;
  ctx.fillRect(x - 16, y + 14, 6, 6);

  // eye
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 36, y + 16, 3, 3);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x + 37, y + 16, 1, 1);

  ctx.restore();
}

function drawText() {
  ctx.textAlign = "center";

  if (gameState === "start") {
    drawBackground();
    ctx.font = "22px 'Press Start 2P'";
    ctx.fillStyle = COLORS.yellowSoft;
    ctx.fillText("FLAPPY SHARK", canvas.width/2, canvas.height*0.30);

    ctx.font = "12px 'Press Start 2P'";
    ctx.fillStyle = COLORS.purpleMain;
    ctx.fillText("PRESS SPACE", canvas.width/2, canvas.height*0.38);

    if (DEV_MODE) {
      ctx.fillStyle = COLORS.white;
      ctx.font = "10px 'Press Start 2P'";
      ctx.fillText("DEV: B=VAL C=CELE K=KISS F=FINAL", canvas.width/2, canvas.height*0.44);
    }
  }

  if (gameState === "playing") {
    ctx.font = "22px 'Press Start 2P'";
    ctx.fillStyle = COLORS.yellowGold;
    ctx.fillText(String(score), canvas.width/2, 80);
  }

  if (gameState === "gameover") {
    ctx.font = "22px 'Press Start 2P'";
    ctx.fillStyle = COLORS.purpleMain;
    ctx.fillText("AGAIN?", canvas.width/2, canvas.height/2);

    ctx.font = "12px 'Press Start 2P'";
    ctx.fillStyle = COLORS.yellowSoft;
    ctx.fillText("PRESS SPACE", canvas.width/2, canvas.height/2 + 48);
  }

  if (gameState === "freeze") {
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillStyle = COLORS.white;
    ctx.fillText("IF YOU CAN OUTSWIM", canvas.width/2, canvas.height*0.30);
    ctx.fillText("YOUR PAST,", canvas.width/2, canvas.height*0.34);
    ctx.fillStyle = COLORS.yellowSoft;
    ctx.fillText("IMAGINE WHAT WE", canvas.width/2, canvas.height*0.40);
    ctx.fillStyle = COLORS.white;
    ctx.fillText("CAN BUILD TOGETHER", canvas.width/2, canvas.height*0.44);
  }
}

// --- Main draw ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Cutscenes: let Valentine module handle full-screen drawing
  if (gameState === "valentine" || gameState === "celebrate" || gameState === "kiss" || gameState === "final") {
    try {
      if (gameState === "valentine") {
        Valentine.drawValentine({ ctx, canvas, COLORS, frame, getButtons: getValentineButtons, drawSparkles });
      } else if (gameState === "celebrate") {
        const done = Valentine.drawCelebrate({ ctx, canvas, COLORS, frame, drawSparkles, spawnSparkles });
        if (done) enterKiss();
      } else if (gameState === "kiss") {
        const done = Valentine.drawKiss({ ctx, canvas, COLORS, frame, drawSparkles, spawnSparkles });
        if (done) enterFinal();
      } else if (gameState === "final") {
        Valentine.drawFinal({ ctx, canvas, COLORS, frame, drawSparkles });
      }
    } catch (err) {
      // fail safe (won't brick on GitHub Pages)
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "center";
      ctx.fillStyle = COLORS.yellowSoft;
      ctx.font = "14px 'Press Start 2P'";
      ctx.fillText("SCENE ERROR", canvas.width/2, canvas.height/2 - 30);
      ctx.font = "10px 'Press Start 2P'";
      ctx.fillText(String(err && err.message ? err.message : err), canvas.width/2, canvas.height/2 + 10);
      ctx.fillText("PRESS SPACE", canvas.width/2, canvas.height/2 + 50);
      if (DEV_MODE) console.error(err);
    }
    return;
  }

  // Normal world draw
  ctx.save();
  if (gameState === "transition") ctx.translate(0, -transitionOffset);

  drawBackground();
  drawPipes();
  drawGhost();
  drawPixelShark(shark.x, shark.y);

  drawText();
  ctx.restore();

  if (gameState === "transition") {
    ctx.fillStyle = `rgba(26,20,41,${fadeAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawSparkles();
}

// --- Loop ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
