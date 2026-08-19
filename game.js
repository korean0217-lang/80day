const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const boyImg=new Image(), girlImg=new Image();
boyImg.src='assets/boy.png'; girlImg.src='assets/girl.png';
const W=1280,H=720; let scale=1;
function resize(){scale=Math.min(innerWidth/W,innerHeight/H); canvas.style.width=W*scale+'px'; canvas.style.height=H*scale+'px';}
addEventListener('resize',resize); resize();

const regions=[
 {name:'대한민국',city:'서울 → 부산',days:10,sky:'#bfe6ff',ground:'#78b56a',land:'🏙️',desc:'한강과 푸른 산길'},
 {name:'일본',city:'후쿠오카 → 오사카 → 도쿄',days:10,sky:'#ffd8e8',ground:'#80bd72',land:'🗻',desc:'벚꽃과 후지산'},
 {name:'중국',city:'상하이 → 베이징 → 시안',days:10,sky:'#f5d7b0',ground:'#b68a5b',land:'🏯',desc:'만리장성과 고대 도시'},
 {name:'티베트',city:'라싸 → 히말라야',days:10,sky:'#9ed9ff',ground:'#a99a78',land:'🏔️',desc:'고산과 설산'},
 {name:'유럽',city:'이스탄불 → 로마 → 파리 → 런던',days:10,sky:'#cfe1ff',ground:'#6ca66a',land:'🗼',desc:'유럽의 도시와 초원'},
 {name:'아프리카',city:'카이로 → 나이로비 → 케이프타운',days:10,sky:'#f6c57c',ground:'#c79b51',land:'🐘',desc:'사막과 사바나'},
 {name:'미국',city:'뉴욕 → 시카고 → 샌프란시스코 → LA',days:10,sky:'#b9d8ff',ground:'#77a45c',land:'🗽',desc:'대도시와 광활한 대륙'},
 {name:'남미·아시아',city:'리마 → 리우 → 방콕 → 홍콩 → 서울',days:10,sky:'#b7e8ff',ground:'#67ad69',land:'🌴',desc:'안데스와 열대 바다'}
];
let state={day:1,region:0,localDay:1,x:120,y:520,vx:0,vy:0,hp:5,score:0,flowers:Infinity,started:false,paused:false,muted:false,obstacles:[],projectiles:[],particles:[],last:performance.now(),sound:null,travelX:0,throwTimer:0};
const keys={}; addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault(); if(e.key.toLowerCase()==='f') throwFlowers(); if(e.key.toLowerCase()==='p') togglePause();});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

function sound(){if(state.muted)return; try{if(!state.sound){state.sound=new (AudioContext||webkitAudioContext)();} if(state.sound.state==='suspended')state.sound.resume();}catch(e){}}
function beep(freq=440,dur=.08,type='sine',gain=.04){if(state.muted)return; sound(); if(!state.sound)return; const o=state.sound.createOscillator(),g=state.sound.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(state.sound.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,state.sound.currentTime+dur);o.stop(state.sound.currentTime+dur)}
function music(){if(state.muted)return; sound(); if(!state.sound)return; const notes=[262,330,392,523]; notes.forEach((n,i)=>setTimeout(()=>beep(n,.16,'triangle',.025),i*180));}

function makeObstacles(){
 state.obstacles=[]; const types=region().name==='티베트'?['mountain','snow','bird','wind']:region().name==='아프리카'?['sun','bird','wind','mountain']:region().name==='일본'?['rain','bird','wind','mountain']:['wind','rain','cloud','bird','mountain','wave'];
 for(let i=0;i<3;i++){state.obstacles.push({type:types[Math.floor(Math.random()*types.length)],x:420+i*300+Math.random()*180,y:300+Math.random()*260,r:38,hits:0,phase:Math.random()*6,baseY:300+Math.random()*260,dead:false});}
}
function region(){return regions[state.region]}
function startGame(){state.started=true;state.paused=false;sound();music();makeObstacles();document.getElementById('start').style.display='none';}
function togglePause(){if(!state.started)return;state.paused=!state.paused;document.getElementById('pause').textContent=state.paused?'▶ 계속':'Ⅱ 일시정지';}
function throwFlowers(){if(!state.started||state.paused)return;sound();state.throwTimer=.35;for(const off of [0,55]){state.projectiles.push({x:state.x+35,y:state.y-105-off*.08,vx:560,vy:(off? -35:-5),life:2});} beep(760,.12,'sine',.06);}
function nextDay(){
 state.day++; state.localDay++; state.x=100; state.y=520; state.vx=0; state.vy=0; state.hp=Math.min(5,state.hp+1); state.travelX=0;
 if(state.localDay>10){state.region++;state.localDay=1; if(state.region>=regions.length){win();return;} }
 makeObstacles(); beep(880,.12,'triangle',.06); setTimeout(()=>beep(1175,.18,'triangle',.05),120);
}
function win(){document.getElementById('finalScore').textContent=state.score;state.paused=true; document.getElementById('win').style.display='flex'; beep(523,.2,'triangle',.08);setTimeout(()=>beep(659,.2,'triangle',.08),220);setTimeout(()=>beep(784,.4,'triangle',.08),440);}
function damage(){state.hp--; beep(110,.2,'sawtooth',.08); if(state.hp<=0){state.hp=5;state.x=100;state.score=Math.max(0,state.score-100);}}
function particle(x,y,text){state.particles.push({x,y,text,life:1});}
function update(dt){if(!state.started||state.paused)return;
 state.throwTimer=Math.max(0,state.throwTimer-dt);
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 if(joy.active){dx=joy.dx;dy=joy.dy;}
 const sp=240; state.vx=dx*sp;state.vy=dy*sp;state.x=Math.max(50,Math.min(1160,state.x+state.vx*dt));state.y=Math.max(280,Math.min(560,state.y+state.vy*dt));
 state.travelX+=Math.max(0,state.vx*dt); if(state.x>1120){nextDay();return;}
 for(const o of state.obstacles){if(o.dead)continue;o.phase+=dt; o.y=o.baseY+Math.sin(o.phase*2)*35; if(o.type==='bird')o.x-=120*dt;else if(o.type==='wind')o.x-=65*dt;else if(o.type==='wave')o.x-=45*dt; if(o.x< -100)o.x=1350;
   const d=Math.hypot(o.x-(state.x+50),o.y-(state.y-50)); if(d<65){damage();o.x+=90;}
 }
 for(const p of state.projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt; for(const o of state.obstacles){if(o.dead)continue;if(Math.hypot(p.x-o.x,p.y-o.y)<60){o.hits++;p.life=0;particle(o.x,o.y,'🌸 '+o.hits+'/3');beep(520+o.hits*120,.1,'sine',.05);if(o.hits>=3){o.dead=true;state.score+=250;particle(o.x,o.y,'💥 제거!');beep(100,.1,'square',.05);setTimeout(()=>beep(700,.16,'triangle',.05),80);}}}}
 state.projectiles=state.projectiles.filter(p=>p.life>0); state.obstacles=state.obstacles.filter(o=>!o.dead || Math.random()>.01); state.particles.forEach(p=>{p.y-=35*dt;p.life-=dt});state.particles=state.particles.filter(p=>p.life>0);
}
function drawBackground(){const r=region();const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,r.sky);g.addColorStop(.72,r.sky);g.addColorStop(.73,r.ground);g.addColorStop(1,r.ground);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='rgba(255,255,255,.45)';for(let i=0;i<7;i++){let cx=((i*230-state.travelX*.08)%1450)-100;ctx.beginPath();ctx.arc(cx,130+(i%3)*35,35,0,7);ctx.arc(cx+35,135+(i%3)*35,28,0,7);ctx.arc(cx-30,140+(i%3)*35,25,0,7);ctx.fill();}
 // distant hills
 ctx.fillStyle='rgba(70,90,80,.35)';ctx.beginPath();ctx.moveTo(0,480);for(let x=0;x<=W;x+=80)ctx.lineTo(x,430+Math.sin(x*.01+state.travelX*.002)*45);ctx.lineTo(W,720);ctx.lineTo(0,720);ctx.fill();
 ctx.font='110px serif';ctx.globalAlpha=.82;ctx.fillText(r.land,1000,300);ctx.globalAlpha=1;
 ctx.font='bold 30px sans-serif';ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillText(r.desc,40,170);
}
function drawObstacle(o){ctx.save();ctx.translate(o.x,o.y);ctx.font='72px serif';let e={wind:'🌪️',rain:'🌧️',cloud:'☁️',bird:'🦅',mountain:'🏔️',wave:'🌊',snow:'❄️',sun:'☀️'}[o.type]||'⚠️';ctx.fillText(e,-36,25);ctx.font='16px sans-serif';ctx.fillStyle='white';ctx.fillText('🌸 '+o.hits+'/3',-28,58);ctx.restore();}
function draw(){ctx.clearRect(0,0,W,H);drawBackground();
 // route line
 ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(70,610);ctx.lineTo(1180,610);ctx.stroke();ctx.fillStyle='white';ctx.font='bold 18px sans-serif';ctx.fillText('출발',55,650);ctx.fillText('다음 도시',1090,650);
 state.obstacles.forEach(drawObstacle);
 for(const p of state.projectiles){ctx.font='32px serif';ctx.fillText('🌸',p.x,p.y);}
 // characters
 const bob=Math.sin(performance.now()*.01)*3; const chH=210; const throwTilt=state.throwTimer>0?-.12:0; ctx.save();ctx.translate(state.x+65,state.y-85+bob);ctx.rotate(throwTilt);ctx.drawImage(boyImg,-65,-105,130,210);ctx.restore(); ctx.save();ctx.translate(state.x+155,state.y-85-bob);ctx.rotate(throwTilt*.75);ctx.drawImage(girlImg,-65,-105,130,210);ctx.restore();
 // flower throw visual hands via text
 for(const p of state.projectiles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle='white';ctx.font='18px sans-serif';ctx.fillText('✦',p.x-5,p.y-8);ctx.globalAlpha=1;}
 for(const p of state.particles){ctx.globalAlpha=Math.max(0,p.life);ctx.font='24px sans-serif';ctx.fillText(p.text,p.x,p.y);ctx.globalAlpha=1;}
 // HUD
 ctx.fillStyle='rgba(0,0,0,.48)';ctx.fillRect(20,20,600,100);ctx.fillStyle='white';ctx.font='bold 28px sans-serif';ctx.fillText(`DAY ${state.day} / 80  ·  ${region().name}`,40,58);ctx.font='20px sans-serif';ctx.fillText(`${region().city}  ·  ${state.localDay}/10일`,40,90);ctx.fillText(`❤️ ${'♥'.repeat(state.hp)}${'♡'.repeat(5-state.hp)}   ⭐ ${state.score}`,380,58);ctx.fillText('🌸 무제한',380,90);
}
let joy={active:false,dx:0,dy:0}; const pad=document.getElementById('joystick'); const knob=document.getElementById('knob');
function joyMove(e){const t=e.touches?e.touches[0]:e;const r=pad.getBoundingClientRect();let x=t.clientX-(r.left+r.width/2),y=t.clientY-(r.top+r.height/2),m=Math.hypot(x,y),max=r.width*.36;if(m>max){x*=max/m;y*=max/m;}joy.dx=x/max;joy.dy=y/max;knob.style.transform=`translate(${x}px,${y}px)`;}
['pointerdown','touchstart'].forEach(ev=>pad.addEventListener(ev,e=>{e.preventDefault();joy.active=true;joyMove(e);},{passive:false}));['pointermove','touchmove'].forEach(ev=>pad.addEventListener(ev,e=>{if(joy.active){e.preventDefault();joyMove(e)}},{passive:false}));['pointerup','pointercancel','touchend','touchcancel'].forEach(ev=>pad.addEventListener(ev,e=>{joy.active=false;joy.dx=joy.dy=0;knob.style.transform='translate(0,0)';},{passive:false}));
document.getElementById('startBtn').onclick=startGame;document.getElementById('pause').onclick=togglePause;document.getElementById('flower').onclick=throwFlowers;document.getElementById('mute').onclick=()=>{state.muted=!state.muted;document.getElementById('mute').textContent=state.muted?'🔇 소리 켜기':'🔊 소리 끄기';if(!state.muted){sound();music();}};document.getElementById('restart').onclick=()=>location.reload();
function loop(t){let dt=Math.min(.033,(t-state.last)/1000);state.last=t;update(dt);draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
