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
  sharkDark: "#24506a",
  sharkMid: "#3f87a7",
  sharkLight: "#8fd6ff",
  sharkBelly: "#f4fbff",
  sharkAccent: "#f2d16b",
};

let gameState="start"; // start|playing|gameover|freeze|transition|valentine|celebrate|kiss|final
let frame=0, score=0;

let freezeTimer=0, transitionOffset=0, fadeAlpha=0;
let sparkles=[];

const gravity=0.5, jumpStrength=-7, pipeGap=110, pipeWidth=40, pipeSpeed=2;
const shark={x:90,y:canvas.height/2,size:28,velocity:0};
let pipes=[];

let stars=[], bubbles=[];
let currentRunPath=[];
let ghostPath=JSON.parse(localStorage.getItem("ghostPath"))||[];
let bestScore=Number(localStorage.getItem("bestScore"))||0;
let secretUnlocked=localStorage.getItem("secretUnlocked")==="true";

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

canvas.addEventListener("click",(e)=>{
  if(gameState==="valentine"||gameState==="celebrate"||gameState==="kiss"||gameState==="final"){
    try{
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
    }catch(err){
      // fail gracefully: show error on canvas (gift-safe)
      ctx.fillStyle=COLORS.bg;
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.textAlign="center";
      ctx.fillStyle=COLORS.yellowSoft;
      ctx.font="14px 'Press Start 2P'";
      ctx.fillText("OOPS! SCENE ERROR", canvas.width/2, canvas.height/2 - 30);
      ctx.font="10px 'Press Start 2P'";
      ctx.fillText(String(err&&err.message?err.message:err), canvas.width/2, canvas.height/2 + 10);
      ctx.fillText("PRESS SPACE TO PLAY", canvas.width/2, canvas.height/2 + 50);
      if(DEV_MODE && err && err.stack){
        console.error(err);
      }
    }
  }else{
    // normal game render already drawn above
  }

  drawSparkles();
  drawDevOverlay();
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
