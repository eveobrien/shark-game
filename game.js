const canvas=document.getElementById("game");
const ctx=canvas.getContext("2d"); ctx.imageSmoothingEnabled=false;

// Turn this off before shipping
const DEV_MODE=true;

const COLORS={
  purpleMain:"#9b7bd3", purpleDark:"#6f4fa3",
  redCoral:"#7a2b3a", redCoralDark:"#5b1e2d",
  yellowSoft:"#f2d16b", yellowGold:"#d6b85a",
  bg:"#1a1429",
  pinkSparkle:"#ff4fd8", pinkSparkleLight:"#ff8fe7",
  blueShark:"#8fd3ff", white:"#ffffff",
};

let gameState="start"; // start|playing|gameover|freeze|transition|valentine|celebrate|kiss|final
let frame=0, score=0;

let freezeTimer=0, transitionOffset=0, fadeAlpha=0;
let sparkles=[];

const gravity=0.5, jumpStrength=-7, pipeGap=110, pipeWidth=40, pipeSpeed=2;
const shark={x:90,y:canvas.height/2,size:16,velocity:0};
let pipes=[];

let stars=[], bubbles=[];
let currentRunPath=[];
let ghostPath=JSON.parse(localStorage.getItem("ghostPath"))||[];
let bestScore=Number(localStorage.getItem("bestScore"))||0;
let secretUnlocked = localStorage.getItem("secretUnlocked") === "true";
let storySeen = localStorage.getItem("storySeen") === "true";

for(let i=0;i<80;i++) stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,speed:Math.random()*0.25+0.1});
for(let i=0;i<30;i++) bubbles.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*3+2,speed:Math.random()*0.35+0.2});

document.addEventListener("keydown",(e)=>{
  if(e.code!=="Space") return;
  if(gameState==="start") resetGame();
  else if(gameState==="playing") shark.velocity=jumpStrength;
  else if(gameState==="gameover") gameState="start";
});

document.addEventListener("keydown",(e)=>{
  if(!DEV_MODE) return;
  if(e.code==="KeyB") enterValentine();
  if(e.code==="KeyC") enterCelebrate();
  if(e.code==="KeyK") enterKiss();
  if(e.code==="KeyV"){ gameState="freeze"; freezeTimer=0; transitionOffset=0; fadeAlpha=0; }
});

canvas.addEventListener("click", (e) => {

  // Home screen replay button (available after the story has been seen once)
  if (gameState === "start" && storySeen) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const r = getReplayButtonRect();
    const inRect = x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (inRect) {
      enterValentine(); // replay the whole love story
      return;
    }
  }

  if(gameState==="valentine"){
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    const didYes=Valentine.handleValentineClick({canvas,x,y,getButtons:getValentineButtons});
    if(didYes){
      spawnSparkles(canvas.width/2, canvas.height*0.46, COLORS.pinkSparkleLight, 56);
      enterCelebrate();
    }
    return;
  }
  if(gameState==="final") gameState="start";
});

function getReplayButtonRect(){
  const w = 420;
  const h = 60;
  const x = Math.round((canvas.width - w) / 2);
  const y = Math.round(canvas.height * 0.58);
  return { x, y, w, h };
}

function getValentineButtons(){
  const cx=canvas.width/2;
  const y=Math.round(canvas.height*0.60);
  const w=170,h=60,gap=40;
  return {
    left:{x:Math.round(cx-gap/2-w),y,w,h},
    right:{x:Math.round(cx+gap/2),y,w,h}
  };
}

function resetGame(){
  shark.y=canvas.height/2; shark.velocity=0;
  pipes=[]; score=0; frame=0; currentRunPath=[];
  freezeTimer=0; transitionOffset=0; fadeAlpha=0; sparkles=[];
  gameState="playing";
}

function createPipe(){
  const topHeight=Math.floor(Math.random()*(canvas.height-pipeGap-140)+70);
  pipes.push({x:canvas.width,top:topHeight,bottom:topHeight+pipeGap,swaySeed:Math.random()*Math.PI*2,polyps:Array.from({length:10},()=>Math.random()),scored:false});
}

function update(){
  frame++; updateBackground();

  if(gameState==="playing"){
    shark.velocity+=gravity; shark.y+=shark.velocity;
    currentRunPath.push({y:shark.y});
    if(frame%120===0) createPipe();

    pipes.forEach(p=>{
      p.x-=pipeSpeed;
      if(!p.scored && p.x+pipeWidth<shark.x){ score++; p.scored=true; }
      if(shark.x+shark.size>p.x && shark.x<p.x+pipeWidth && (shark.y<p.top || shark.y+shark.size>p.bottom)) endGame();
    });
    pipes=pipes.filter(p=>p.x+pipeWidth>0);
    if(shark.y<0 || shark.y+shark.size>canvas.height) endGame();
  }

  if(gameState==="freeze"){
    freezeTimer++;
    if(freezeTimer>180) gameState="transition";
  }
  if(gameState==="transition"){
    transitionOffset+=8;
    fadeAlpha=Math.min(1, fadeAlpha+0.02);
    if(fadeAlpha>=1) enterValentine();
  }

  if(["valentine","celebrate","kiss","final"].includes(gameState)){
    Valentine.update({frame,canvas});
  }

  sparkles.forEach(s=>{ s.x+=s.vx; s.y+=s.vy; s.life--; });
  sparkles=sparkles.filter(s=>s.life>0);
}

function enterValentine() {
  gameState = "valentine";
  if (window.Valentine && Valentine.init) Valentine.init({ canvas, COLORS });
}
function enterCelebrate() {
  gameState = "celebrate";
  if (window.Valentine && Valentine.startCelebrate) Valentine.startCelebrate({ canvas, COLORS });
}
function enterKiss() {
  gameState = "kiss";
  if (window.Valentine && Valentine.startKiss) Valentine.startKiss({ canvas, COLORS });
}
function enterFinal() {
  gameState = "final";
  if (window.Valentine && Valentine.startFinal) Valentine.startFinal({ canvas, COLORS });
}

function endGame(){
  if(DEV_MODE){ gameState="freeze"; freezeTimer=0; transitionOffset=0; fadeAlpha=0; return; }

  const hadGhost=ghostPath.length>0;
  if(score>bestScore){
    bestScore=score; ghostPath=currentRunPath;
    localStorage.setItem("bestScore", bestScore);
    localStorage.setItem("ghostPath", JSON.stringify(ghostPath));
    if(hadGhost && !secretUnlocked){
      secretUnlocked=true; localStorage.setItem("secretUnlocked","true");
      gameState="freeze"; freezeTimer=0; transitionOffset=0; fadeAlpha=0;
      return;
    }
  }
  gameState="gameover";
}

function updateBackground(){
  stars.forEach(s=>{ s.y+=s.speed; if(s.y>canvas.height) s.y=0; });
  bubbles.forEach(b=>{ b.y-=b.speed; if(b.y<0) b.y=canvas.height; });
}

function drawBackground(){
  const cycle=Math.sin(frame*0.002)*0.5+0.5;
  ctx.fillStyle=`rgb(${Math.floor(32+cycle*25)},${Math.floor(24+cycle*20)},${Math.floor(60+cycle*45)})`;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=COLORS.yellowSoft; stars.forEach(s=>ctx.fillRect(s.x,s.y,2,2));
  ctx.fillStyle="rgba(200,210,255,0.5)"; bubbles.forEach(b=>ctx.fillRect(b.x,b.y,b.size,b.size));
}

function drawPixelShark(x,y,a=1){
  ctx.save(); ctx.globalAlpha=a;
  ctx.fillStyle=COLORS.purpleDark; ctx.fillRect(x-1,y+1,18,10);
  ctx.fillStyle=COLORS.purpleMain; ctx.fillRect(x,y,16,8); ctx.fillRect(x+2,y-4,12,4);
  ctx.fillStyle=COLORS.purpleDark; ctx.fillRect(x+6,y-8,4,4); ctx.fillRect(x-4,y+2,4,4);
  ctx.fillStyle="#000"; ctx.fillRect(x+12,y+2,2,2);
  ctx.restore();
}

function drawCoral(p,y,height,flip=1){
  const sway=Math.sin(frame*0.02+p.swaySeed)*3;
  const x=p.x+sway*flip;
  ctx.fillStyle=COLORS.redCoral; ctx.fillRect(x,y,pipeWidth,height);
  for(let i=0;i<height;i+=16){ ctx.fillRect(x-4,y+i,4,10); ctx.fillRect(x+pipeWidth,y+i+6,4,10); }
  ctx.fillStyle=COLORS.redCoralDark; ctx.fillRect(x+pipeWidth-4,y,4,height);
  ctx.fillStyle=COLORS.yellowSoft;
  p.polyps.forEach((pp,i)=>{
    if(Math.sin(frame*0.05+pp*10)>0.6){
      const px=x+(i*7)%(pipeWidth-2);
      const py=y+(i*29)%Math.max(1,height-2);
      ctx.fillRect(px,py,2,2);
    }
  });
}

function drawPipes(){ pipes.forEach(p=>{ drawCoral(p,0,p.top,1); drawCoral(p,p.bottom,canvas.height-p.bottom,-1); }); }


function drawGhost(){
  if(gameState==="playing" && ghostPath.length>frame){
    drawPixelShark(shark.x, ghostPath[frame].y, 0.22);
  }
}

function drawText(){
  ctx.textAlign="center";
  if(gameState==="start"){
    ctx.font="20px 'Press Start 2P'"; ctx.fillStyle=COLORS.purpleMain; ctx.fillText("FLAPPY SHARK", canvas.width/2, 220);
    ctx.font="12px 'Press Start 2P'"; ctx.fillStyle=COLORS.yellowSoft; ctx.fillText("IT REMEMBERS YOU", canvas.width/2, 300);
    ctx.fillText("PRESS SPACE", canvas.width/2, 340);
    if(DEV_MODE){
      ctx.font="10px 'Press Start 2P'"; ctx.fillStyle=COLORS.pinkSparkleLight;
      ctx.fillText("DEV: B=valentine  C=celebrate  K=kiss", canvas.width/2, 420);
    }
    if (storySeen) {
      const r = getReplayButtonRect();
      ctx.fillStyle = COLORS.purpleMain;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = "#fff";
      ctx.font = "16px \'Press Start 2P\'";
      ctx.fillText("REPLAY LOVE STORY", canvas.width / 2, r.y + 40);
      ctx.font = "10px \'Press Start 2P\'";
      ctx.fillStyle = COLORS.yellowSoft;
      ctx.fillText("(no need to beat anything)", canvas.width / 2, r.y + 78);
    }

  }
  if(gameState==="playing"){
    ctx.font="18px 'Press Start 2P'"; ctx.fillStyle=COLORS.yellowGold; ctx.fillText(score, canvas.width/2, 70);
  }
  if(gameState==="gameover"){
    ctx.font="18px 'Press Start 2P'"; ctx.fillStyle=COLORS.purpleMain; ctx.fillText("AGAIN?", canvas.width/2, canvas.height/2);
    ctx.font="12px 'Press Start 2P'"; ctx.fillStyle=COLORS.yellowSoft; ctx.fillText("PRESS SPACE", canvas.width/2, canvas.height/2+40);
  }
  if(gameState==="freeze"){
    ctx.font="12px 'Press Start 2P'"; ctx.fillStyle="#fff";
    ctx.fillText("IF YOU CAN OUTSWIM", canvas.width/2, 260);
    ctx.fillText("YOUR PAST,", canvas.width/2, 290);
    ctx.fillStyle=COLORS.yellowSoft; ctx.fillText("IMAGINE WHAT WE", canvas.width/2, 330);
    ctx.fillStyle="#fff"; ctx.fillText("CAN BUILD TOGETHER", canvas.width/2, 360);
  }
}

function spawnSparkles(x,y,color=COLORS.yellowSoft,count=24){
  for(let i=0;i<count;i++){
    sparkles.push({x,y,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.7)*6,life:40,color});
  }
}
function drawSparkles(){
  sparkles.forEach(s=>{ ctx.fillStyle=s.color||COLORS.yellowSoft; ctx.fillRect(s.x,s.y,2,2); });
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.save();
  if(gameState==="transition") ctx.translate(0,-transitionOffset);

  drawBackground(); drawPipes(); drawGhost(); drawPixelShark(shark.x, shark.y); drawText();

  ctx.restore();

  if(gameState==="transition"){
    ctx.fillStyle=`rgba(26,20,41,${fadeAlpha})`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  if(gameState==="valentine"){
    Valentine.drawValentine({ctx,canvas,COLORS,frame,getButtons:getValentineButtons,drawSparkles});
  }else if(gameState==="celebrate"){
    const done=Valentine.drawCelebrate({ctx,canvas,COLORS,frame,drawSparkles,spawnSparkles});
    if(done) enterKiss();
  }else if(gameState==="kiss"){
    const done=Valentine.drawKiss({ctx,canvas,COLORS,frame,drawSparkles,spawnSparkles});
    if(done) enterFinal();
  }else if(gameState==="final"){
    Valentine.drawFinal({ctx,canvas,COLORS,frame,drawSparkles});
  }

  drawSparkles();
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
