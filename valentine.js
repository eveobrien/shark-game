(function(){
  const Valentine={}; window.Valentine=Valentine;

  // Heart sprite (place heart.png beside index.html)
  const heartSprite = new Image();
  heartSprite.src = "heart.png";


  let vHearts=[], vStars=[], vSharks=[];
  let celebrateT=0, kissT=0, finalT=0;
  let bigWhites=[], kissHearts=[];

  Valentine.init=({canvas,COLORS})=>{ initParticles(canvas); celebrateT=kissT=finalT=0; };
  Valentine.startCelebrate=({canvas})=>{ celebrateT=0; bigWhites=mkBigWhites(canvas); };
  Valentine.startKiss=({canvas})=>{ kissT=0; kissHearts=[]; if(!vHearts.length||!vStars.length||!vSharks.length) initParticles(canvas); };
  Valentine.startFinal=()=>{ finalT=0; };

  Valentine.update=({frame,canvas})=>{ updateParticles(frame,canvas); };

  Valentine.handleValentineClick=({x,y,getButtons})=>{
    const {left,right}=getButtons();
    const inRect=r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
    return inRect(left)||inRect(right);
  };

  Valentine.drawValentine = ({ ctx, canvas, COLORS, frame, getButtons, drawSparkles }) => {
  bg(ctx, canvas, COLORS);
  twinkles(ctx, COLORS, frame);
  floatingHearts(ctx, COLORS, frame, canvas);
  tinySharks(ctx, COLORS, frame);

  const cx = canvas.width / 2;
  const y0 = Math.round(canvas.height * 0.28);

  ctx.textAlign = "center";
  ctx.font = "24px 'Press Start 2P'";
  ctx.fillStyle = COLORS.purpleMain;
  ctx.fillText("CATHERINE,", cx, y0);

  ctx.font = "18px 'Press Start 2P'";
  ctx.fillStyle = COLORS.yellowSoft;
  ctx.fillText("WILL YOU BE MY", cx, y0 + 60);

  ctx.font = "22px 'Press Start 2P'";
  ctx.fillStyle = COLORS.pinkSparkle;
  ctx.fillText("VALENTINE?", cx, y0 + 120);

  const { left, right } = getButtons();
  ctx.fillStyle = COLORS.purpleMain;
  ctx.fillRect(left.x, left.y, left.w, left.h);
  ctx.fillRect(right.x, right.y, right.w, right.h);

  ctx.fillStyle = COLORS.white || "#fff";
  ctx.font = "16px 'Press Start 2P'";
  ctx.fillText("YES", left.x + left.w / 2, left.y + Math.round(left.h * 0.67));
  ctx.fillText("YES", right.x + right.w / 2, right.y + Math.round(right.h * 0.67));

  drawSparkles(COLORS.pinkSparkleLight);
};

  Valentine.drawCelebrate=({ctx,canvas,COLORS,frame,drawSparkles,spawnSparkles})=>{
    celebrateT++;
    bg(ctx,canvas,COLORS);
    twinkles(ctx,COLORS,frame);
    floatingHearts(ctx,COLORS,frame);
    tinySharks(ctx,COLORS,frame);

    const floorY=canvas.height*0.85;
    bigWhites.forEach(s=>{
      s.vy+=0.7; s.y+=s.vy; s.x+=s.vx; s.phase+=0.05;
      if(s.y>floorY){
        s.y=floorY; s.vy=-(16+Math.random()*6);
        spawnSparkles(s.x, s.y-60, COLORS.pinkSparkle, 26);
      }
      drawBigWhite(ctx, s.x, s.y+Math.sin(s.phase)*8, 1);
    });

    const cx=canvas.width/2;
    ctx.textAlign="center";
    ctx.fillStyle=COLORS.pinkSparkle;
    ctx.font="26px 'Press Start 2P'";
    ctx.fillText("YAYYYYY 💖", cx, canvas.height*0.28);
    ctx.fillStyle=COLORS.yellowSoft;
    ctx.font="16px 'Press Start 2P'";
    ctx.fillText("SHE SAID YES", cx, canvas.height*0.34);

    drawSparkles(COLORS.pinkSparkleLight);
    return celebrateT>240;
  };

  Valentine.drawKiss=({ctx,canvas,COLORS,frame,drawSparkles,spawnSparkles})=>{
    kissT++;
    bg(ctx,canvas,COLORS);
    twinkles(ctx,COLORS,frame);
    floatingHearts(ctx,COLORS,frame);

    const cx=canvas.width/2, y=canvas.height*0.55;
    const t=Math.min(1, kissT/180);
    const leftX=lerp(-220, cx-110, t);
    const rightX=lerp(canvas.width+220, cx+110, t);
    const bob=Math.sin(frame*0.06)*8;

    drawCuteShark(ctx,COLORS,leftX,y+bob,1,3);
    drawCuteShark(ctx,COLORS,rightX,y-bob,-1,3);

    if(kissT===185){
      kissHearts.push({x:cx,y:y-80,life:140});
      spawnSparkles(cx, y-60, COLORS.pinkSparkle, 56);
    }

    kissHearts.forEach(h=>{
      h.life--; h.y-=0.6;
      const pulse=Math.sin(frame*0.12)>0;
      drawHeart(ctx, COLORS, h.x, h.y, 26 + (pulse ? 2 : 0), frame);
    });
    kissHearts=kissHearts.filter(h=>h.life>0);

    ctx.textAlign="center";
    ctx.font="18px 'Press Start 2P'";
    ctx.fillStyle=COLORS.pinkSparkle;
    ctx.fillText("MWAH 💋", cx, canvas.height*0.22);

    drawSparkles(COLORS.pinkSparkleLight);
    return kissT>360;
  };

  Valentine.drawFinal = ({ ctx, canvas, COLORS: C, frame, drawSparkles }) => {
    finalT++;

    bg(ctx, canvas, C);
    twinkles(ctx, C, frame);
    floatingHearts(ctx, C, frame, canvas);
    tinySharks(ctx, C, frame);

    const cx = canvas.width / 2;

    // Heading
    ctx.textAlign = "center";
    ctx.fillStyle = C.purpleMain;
    ctx.font = "22px 'Press Start 2P'";
    ctx.fillText("CATHERINE 💜", cx, canvas.height * 0.18);

    // Paragraph (gift-ready, forever language)
    const paragraph =
      "I love you more than I can put into words. Every day with you feels like magic, and I want to choose you—today, tomorrow, and forever. You are my soulmate, my best friend, and my favorite adventure. I want to be with you for the rest of my life.";

    ctx.fillStyle = C.white;
    ctx.font = "14px 'Press Start 2P'";
    const maxW = Math.min(620, canvas.width * 0.82);
    const startY = canvas.height * 0.30;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(Math.round(cx - maxW/2) - 18, Math.round(startY) - 34, Math.round(maxW) + 36, 240);

    ctx.fillStyle = C.white;
    wrapText(ctx, paragraph, cx, startY, maxW, 26);

    // Soft prompt
    ctx.fillStyle = C.sparklePinkLight || C.pinkSparkleLight;
    ctx.font = "12px 'Press Start 2P'";
    ctx.fillText("CLICK TO RETURN HOME", cx, canvas.height * 0.86);

    drawSparkles(C.pinkSparkleLight);
  };

  // ===== particles =====
  function initParticles(canvas){
    vHearts=[]; vStars=[]; vSharks=[];
    for(let i=0;i<28;i++){
      vHearts.push({x:Math.random()*canvas.width,y:canvas.height+Math.random()*canvas.height,speed:0.6+Math.random()*0.8,drift:(Math.random()-0.5)*0.6,phase:Math.random()*Math.PI*2,size: 18 + Math.floor(Math.random() * 14),tw: Math.random()*0.08+0.03, seed: Math.random()*Math.PI*2});
    }
    for(let i=0;i<70;i++){
      vStars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,tw:Math.random()*0.12+0.03});
    }
    for(let i=0;i<8;i++){
      const dir=Math.random()<0.5?-1:1;
      vSharks.push({dir,x:dir===1?-200-Math.random()*400:canvas.width+200+Math.random()*400,y:170+Math.random()*(canvas.height-320),speed:1.4+Math.random()*1.6,bob:Math.random()*Math.PI*2});
    }
  }

  function updateParticles(frame,canvas){
    vHearts.forEach(h=>{
      h.y -= h.speed;
      h.x += Math.sin(frame*h.tw + h.phase) * 0.6 + h.drift;
      if(h.y < -80){
        h.y = canvas.height + 80 + Math.random()*300;
        h.x = Math.random()*canvas.width;
      }
    });
    vSharks.forEach(s=>{
      s.x+=s.speed*s.dir; s.bob+=0.03;
      if(s.dir===1 && s.x>canvas.width+300){ s.x=-300-Math.random()*400; s.y=170+Math.random()*(canvas.height-320); }
      if(s.dir===-1 && s.x<-300){ s.x=canvas.width+300+Math.random()*400; s.y=170+Math.random()*(canvas.height-320); }
    });
  }

  // ===== draw helpers =====
  function bg(ctx,canvas,C){ ctx.fillStyle=C.bg; ctx.fillRect(0,0,canvas.width,canvas.height); }

  function twinkles(ctx,C,frame){
    vStars.forEach(st=>{
      if(Math.sin(frame*st.tw+st.x*0.01)>0.65){
        ctx.fillStyle=C.yellowSoft;
        ctx.fillRect(st.x,st.y,2,2);
        ctx.fillRect(st.x-2,st.y,2,2);
        ctx.fillRect(st.x+2,st.y,2,2);
        ctx.fillRect(st.x,st.y-2,2,2);
        ctx.fillRect(st.x,st.y+2,2,2);
      }
    });
  }

  function floatingHearts(ctx, C, frame, canvas) {
    vHearts.forEach(h => {
      drawTinyHeart(ctx, h.x, h.y, h.size, frame, h.seed || 0, canvas);
    });
  }

  function tinySharks(ctx,C,frame){
    vSharks.forEach(s=>{
      const bob=Math.sin(s.bob)*6;
      drawCuteShark(ctx,C,s.x,s.y+bob,s.dir,2);
    });
  }

  function drawTinyHeart(ctx, x, y, size, frame, seed, canvas) {
    const s = Math.round(Math.max(12, Math.min(40, size))); // variable sizes
    const jx = Math.round(Math.sin(frame * 0.11 + seed) * 1); // ±1px
    const jy = Math.round(Math.cos(frame * 0.09 + seed) * 1); // ±1px
    const rot = Math.sin(frame * 0.02 + seed) * 0.08; // subtle rotation

    // Fade as it rises (top = more transparent)
    const fadeDen = canvas.height * 0.75;
    const alpha = Math.max(0, Math.min(1, (y + 120) / fadeDen));

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + jx + s / 2, y + jy + s / 2);
    ctx.rotate(rot);
    ctx.imageSmoothingEnabled = false;
    // If sprite not loaded yet, draw a tiny fallback pixel heart
    if (!heartSprite.complete || heartSprite.naturalWidth === 0) {
      ctx.fillStyle = "#ff6fae";
      ctx.fillRect(-s/4, -s/4, s/2, s/2);
    } else {
      ctx.drawImage(heartSprite, -s / 2, -s / 2, s, s);
    }
    ctx.restore();
  }

  function drawCuteShark(ctx, C, x, y, dir, scale) {
    ctx.save();
    ctx.translate(x, y);
    if (dir === -1) ctx.scale(-1, 1);

    const s = scale;

    // Outline/shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(-2*s, 14*s, 38*s, 2*s);

    // Back ridge
    ctx.fillStyle = C.sharkDark;
    ctx.fillRect(0, 8*s, 34*s, 10*s);
    ctx.fillRect(10*s, 2*s, 18*s, 6*s);

    // Mid body
    ctx.fillStyle = C.sharkMid;
    ctx.fillRect(2*s, 10*s, 32*s, 8*s);
    ctx.fillRect(12*s, 4*s, 16*s, 4*s);

    // Highlight
    ctx.fillStyle = C.sharkLight;
    ctx.fillRect(6*s, 10*s, 18*s, 3*s);
    ctx.fillRect(18*s, 13*s, 10*s, 2*s);

    // Belly
    ctx.fillStyle = C.sharkBelly;
    ctx.fillRect(10*s, 16*s, 20*s, 4*s);

    // Fin
    ctx.fillStyle = C.sharkDark;
    ctx.fillRect(20*s, -4*s, 8*s, 8*s);
    ctx.fillStyle = C.sharkMid;
    ctx.fillRect(21*s, -3*s, 6*s, 6*s);

    // Tail
    ctx.fillStyle = C.sharkMid;
    ctx.fillRect(-12*s, 12*s, 12*s, 6*s);
    ctx.fillStyle = C.sharkDark;
    ctx.fillRect(-16*s, 10*s, 4*s, 4*s);

    // Eye
    ctx.fillStyle = "#000";
    ctx.fillRect(28*s, 12*s, 2*s, 2*s);
    ctx.fillStyle = "#fff";
    ctx.fillRect(29*s, 12*s, 1*s, 1*s);

    ctx.restore();
  }

  function mkBigWhites(canvas){
    const arr=[];
    for(let i=0;i<5;i++){
      arr.push({
        x:(canvas.width*(0.15+i*0.18))+(Math.random()*40-20),
        y:canvas.height+200+Math.random()*400,
        vy:-(14+Math.random()*6),
        vx:(Math.random()-0.5)*1.5,
        phase:Math.random()*Math.PI*2
      });
    }
    return arr;
  }

  function drawBigWhite(ctx,x,y,dir){
    ctx.save(); ctx.translate(x,y);
    if(dir===-1) ctx.scale(-1,1);

    ctx.fillStyle="rgba(0,0,0,0.25)";
    ctx.fillRect(-10,-8,120,26);

    ctx.fillStyle="#ffffff";
    ctx.fillRect(0,0,110,24);
    ctx.fillRect(20,-10,70,10);

    ctx.fillStyle="#b8d3e6";
    ctx.fillRect(0,0,110,10);

    ctx.fillStyle="#ffffff";
    ctx.fillRect(52,-26,18,16);

    ctx.fillStyle="#b8d3e6";
    ctx.fillRect(-26,8,26,10);
    ctx.fillRect(-14,0,14,8);

    ctx.fillStyle="#000";
    ctx.fillRect(88,10,4,4);

    ctx.restore();
  }

  function drawHeart(ctx, C, cx, cy, size, frame) {
    const s = Math.round(size);
    const rot = Math.sin(frame * 0.03) * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.imageSmoothingEnabled = false;
    if (!heartSprite.complete || heartSprite.naturalWidth === 0) {
      ctx.fillStyle = "#ff6fae";
      ctx.fillRect(-s/2, -s/2, s, s);
    } else {
      ctx.drawImage(heartSprite, -s/2, -s/2, s, s);
    }
    ctx.restore();
  }

  
  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    let line = "";
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), x, y);
  }
function lerp(a,b,t){ return a+(b-a)*t; }
})();