(function(){
  const Valentine={}; window.Valentine=Valentine;

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

  Valentine.drawValentine=({ctx,canvas,COLORS,frame,getButtons,drawSparkles})=>{
    bg(ctx,canvas,COLORS);
    twinkles(ctx,COLORS,frame);
    floatingHearts(ctx,COLORS,frame);
    tinySharks(ctx,COLORS,frame);

    const cx=canvas.width/2;
    ctx.textAlign="center";
    ctx.font="22px 'Press Start 2P'";
    ctx.fillStyle=COLORS.purpleMain; ctx.fillText("CATHERINE,", cx, 280);
    ctx.fillStyle=COLORS.yellowSoft; ctx.fillText("WILL YOU BE MY", cx, 330);
    ctx.fillStyle=COLORS.pinkSparkle; ctx.fillText("VALENTINE?", cx, 380);

    const {left,right}=getButtons();
    ctx.fillStyle=COLORS.purpleMain;
    ctx.fillRect(left.x,left.y,left.w,left.h);
    ctx.fillRect(right.x,right.y,right.w,right.h);

    ctx.fillStyle="#fff";
    ctx.font="16px 'Press Start 2P'";
    ctx.fillText("YES", left.x+left.w/2, left.y+38);
    ctx.fillText("YES", right.x+right.w/2, right.y+38);

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

  Valentine.drawKiss = ({ ctx, canvas, COLORS: C, frame, drawSparkles, spawnSparkles }) => {
  kissT++;

  // Background
  bg(ctx, canvas, C);
  twinkles(ctx, C, frame);
  floatingHearts(ctx, C, frame); // now pink/white hearts if you updated drawTinyHeart

  const cx = canvas.width / 2;
  const cy = canvas.height * 0.58;

  // Approach timing
  const approachT = Math.min(1, kissT / 200); // slower + calmer
  const leftTargetX = cx - 90;
  const rightTargetX = cx + 90;

  const leftX = lerp(-260, leftTargetX, approachT);
  const rightX = lerp(canvas.width + 260, rightTargetX, approachT);

  const bob = Math.sin(frame * 0.045) * 6;

  // Draw sharks approaching
  drawCuteShark(ctx, C, leftX, cy + bob, 1, 3);
  drawCuteShark(ctx, C, rightX, cy - bob, -1, 3);

  // Nose boop moment window
  const boopStart = 210;
  const boopEnd = 270;
  const isBooping = kissT >= boopStart && kissT <= boopEnd;

  // When boop happens, add a gentle sparkle burst once
  if (kissT === boopStart) {
    spawnSparkles(cx, cy - 40, C.sparklePink2 || C.pinkSparkleLight, 28);

    // Spawn bubble-heart trail particles
    for (let i = 0; i < 40; i++) {
      // heart curve (parametric-ish)
      const t = (i / 39) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));

      kissHearts.push({
        x: cx + hx * 5,
        y: (cy - 70) + hy * 5,
        life: 160,
        r: 2 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 0.6
      });
    }
  }

  // If booping, do a tiny "nose boop" bounce
  if (isBooping) {
    const p = (kissT - boopStart) / (boopEnd - boopStart); // 0..1
    const bounce = Math.sin(p * Math.PI) * 6;

    drawCuteShark(ctx, C, leftTargetX + bounce, cy + bob, 1, 3);
    drawCuteShark(ctx, C, rightTargetX - bounce, cy - bob, -1, 3);
  }

  // Bubble-heart particles update + draw
  // (reusing kissHearts array as bubble points)
  kissHearts.forEach(b => {
    b.life--;
    b.y -= 0.15;           // slow float up
    b.x += b.drift * 0.2;  // tiny drift
  });
  kissHearts = kissHearts.filter(b => b.life > 0);

  // Draw bubble heart
  ctx.fillStyle = "rgba(180, 220, 255, 0.55)";
  kissHearts.forEach(b => {
    ctx.fillRect(b.x, b.y, b.r, b.r);
    // tiny highlight pixel
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillRect(b.x + 1, b.y, 1, 1);
    ctx.fillStyle = "rgba(180, 220, 255, 0.55)";
  });

  // Text (soft, not meme-y)
  ctx.textAlign = "center";
  ctx.font = "16px 'Press Start 2P'";
  ctx.fillStyle = C.sparklePink || C.pinkSparkle;
  ctx.fillText("A LITTLE NOSE BOOP", cx, canvas.height * 0.22);

  ctx.fillStyle = C.white;
  ctx.font = "12px 'Press Start 2P'";
  ctx.fillText("AND A LOT OF LOVE", cx, canvas.height * 0.27);

  // Soft sparkles overlay
  drawSparkles(C.sparklePink2 || C.pinkSparkleLight);

  // End after ~7 seconds
  return kissT > 420;
};


  Valentine.drawFinal=({ctx,canvas,COLORS,frame,drawSparkles})=>{
    finalT++;
    bg(ctx,canvas,COLORS);
    twinkles(ctx,COLORS,frame);
    floatingHearts(ctx,COLORS,frame);
    tinySharks(ctx,COLORS,frame);

    const cx=canvas.width/2;
    ctx.textAlign="center";
    ctx.fillStyle=COLORS.yellowSoft;
    ctx.font="22px 'Press Start 2P'";
    ctx.fillText("HAPPY VALENTINE'S", cx, canvas.height*0.40);
    ctx.fillStyle=COLORS.purpleMain;
    ctx.font="26px 'Press Start 2P'";
    ctx.fillText("CATHERINE 💜", cx, canvas.height*0.48);
    ctx.fillStyle=COLORS.white;
    ctx.font="14px 'Press Start 2P'";
    ctx.fillText("(click to return)", cx, canvas.height*0.62);

    drawSparkles(COLORS.pinkSparkleLight);
  };

  // ===== particles =====
  function initParticles(canvas){
    vHearts=[]; vStars=[]; vSharks=[];
    for(let i=0;i<28;i++){
      vHearts.push({x:Math.random()*canvas.width,y:canvas.height+Math.random()*canvas.height,speed:0.6+Math.random()*0.8,drift:(Math.random()-0.5)*0.6,phase:Math.random()*Math.PI*2,size:10+Math.floor(Math.random()*10),tw:Math.random()*0.08+0.03});
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
      h.y-=h.speed;
      h.x+=Math.sin(frame*h.tw+h.phase)*0.9+h.drift;
      if(h.y<-60){ h.y=canvas.height+60+Math.random()*300; h.x=Math.random()*canvas.width; }
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

  function floatingHearts(ctx, C, frame){
  vHearts.forEach(h=>{
    drawTinyHeart(ctx, h.x, h.y, h.size, C);
  });
}


  function tinySharks(ctx,C,frame){
    vSharks.forEach(s=>{
      const bob=Math.sin(s.bob)*6;
      drawCuteShark(ctx,C,s.x,s.y+bob,s.dir,2);
    });
  }

function drawTinyHeart(ctx, x, y, size, C) {
  const s = Math.max(6, size);

  // Outer heart (pink)
  ctx.fillStyle = C.heartPink;
  ctx.fillRect(x, y, s, s);
  ctx.fillRect(x + s + 2, y, s, s);
  ctx.fillRect(x + 2, y + s, (s * 2), s);
  ctx.fillRect(x + 4, y + (s * 2), (s * 2) - 4, s);

  // Highlight (light)
  ctx.fillStyle = C.heartLight;
  ctx.fillRect(x + 2, y + 2, s - 3, s - 3);
  ctx.fillRect(x + s + 4, y + 2, s - 3, s - 3);
}


 function drawCuteShark(ctx, C, x, y, dir, scale) {
  ctx.save();
  ctx.translate(x, y);
  if (dir === -1) ctx.scale(-1, 1);

  const s = scale;

  // Outline
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(-2*s, 12*s, 34*s, 2*s);

  // Dark back
  ctx.fillStyle = C.sharkDark;
  ctx.fillRect(0, 8*s, 32*s, 10*s);
  ctx.fillRect(10*s, 2*s, 16*s, 6*s);

  // Mid
  ctx.fillStyle = C.sharkMid;
  ctx.fillRect(2*s, 10*s, 30*s, 8*s);
  ctx.fillRect(12*s, 4*s, 14*s, 4*s);

  // Light highlight (top ridge)
  ctx.fillStyle = C.sharkLight;
  ctx.fillRect(6*s, 10*s, 18*s, 3*s);
  ctx.fillRect(18*s, 13*s, 10*s, 2*s);

  // Belly
  ctx.fillStyle = C.sharkBelly;
  ctx.fillRect(10*s, 16*s, 18*s, 4*s);

  // Fin
  ctx.fillStyle = C.sharkDark;
  ctx.fillRect(18*s, -4*s, 8*s, 8*s);

  // Tail
  ctx.fillStyle = C.sharkMid;
  ctx.fillRect(-10*s, 12*s, 10*s, 6*s);
  ctx.fillStyle = C.sharkDark;
  ctx.fillRect(-14*s, 10*s, 4*s, 4*s);

  // Eye
  ctx.fillStyle = "#000";
  ctx.fillRect(26*s, 12*s, 2*s, 2*s);
  ctx.fillStyle = "#fff";
  ctx.fillRect(27*s, 12*s, 1*s, 1*s);

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

  function drawBigWhite(ctx, x, y, dir) {
  ctx.save();
  ctx.translate(x, y);
  if (dir === -1) ctx.scale(-1, 1);

  // Size ~140x40 sprite
  // Shadow/outline
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fillRect(-12, -6, 150, 44);

  // Back dark
  ctx.fillStyle = "#5f7f93";
  ctx.fillRect(0, 0, 135, 34);
  ctx.fillRect(28, -14, 78, 14);

  // Mid
  ctx.fillStyle = "#89a9bf";
  ctx.fillRect(6, 6, 125, 24);
  ctx.fillRect(34, -10, 68, 10);

  // Belly
  ctx.fillStyle = "#f4fbff";
  ctx.fillRect(18, 22, 96, 12);

  // Fin
  ctx.fillStyle = "#5f7f93";
  ctx.fillRect(66, -30, 18, 18);
  ctx.fillStyle = "#89a9bf";
  ctx.fillRect(68, -28, 14, 14);

  // Tail
  ctx.fillStyle = "#5f7f93";
  ctx.fillRect(-34, 14, 34, 14);
  ctx.fillStyle = "#89a9bf";
  ctx.fillRect(-20, 6, 20, 10);

  // Eye
  ctx.fillStyle = "#000";
  ctx.fillRect(110, 16, 4, 4);
  ctx.fillStyle = "#fff";
  ctx.fillRect(112, 16, 2, 2);

  // Mouth hint
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(92, 28, 24, 2);

  ctx.restore();
}


  function drawHeart(ctx,C,cx,cy,size){
    const s=size;
    ctx.fillStyle=C.pinkSparkleLight;
    ctx.fillRect(cx-s-2,cy,s,s);
    ctx.fillRect(cx+2,cy,s,s);
    ctx.fillRect(cx-s,cy+s-2,s*2+4,s);
    ctx.fillRect(cx-(s-2),cy+(s*2)-4,(s*2)-4,s);
  }

  function lerp(a,b,t){ return a+(b-a)*t; }
})();