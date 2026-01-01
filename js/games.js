// js/game.js
// Main game module: wire UI, create characters/maps, run loop.
// Import Character and SimpleAI from the other modules.

import { Character } from './character.js';
import { SimpleAI } from './ai.js';

// --- Data: 10 characters, 5 maps (same as index.html)
const CHARACTERS = [
  { id:0, name:'Kage', color:'#4db8ff', speed:240, jump:360, attack:18, weight:95 },
  { id:1, name:'Rin',  color:'#ff9f6b', speed:260, jump:340, attack:14, weight:88 },
  { id:2, name:'Tora', color:'#ff6b6b', speed:220, jump:380, attack:22, weight:110 },
  { id:3, name:'Mika', color:'#9b8cff', speed:270, jump:360, attack:13, weight:80 },
  { id:4, name:'Sora', color:'#7bffb2', speed:230, jump:400, attack:16, weight:92 },
  { id:5, name:'Hana', color:'#ffd76b', speed:250, jump:340, attack:15, weight:86 },
  { id:6, name:'Goro', color:'#ff8fbf', speed:200, jump:320, attack:26, weight:130 },
  { id:7, name:'Yuki', color:'#6ee7ff', speed:265, jump:420, attack:12, weight:76 },
  { id:8, name:'Shin', color:'#d7ff6b', speed:240, jump:350, attack:17, weight:98 },
  { id:9, name:'Kai',  color:'#c792ff', speed:255, jump:360, attack:15, weight:90 },
];

const MAPS = [
  { id:0, name:'Plain Stage', bg:'#081826', platforms: [{x:220,y:380,w:520,h:12},{x:420,y:300,w:120,h:10}]},
  { id:1, name:'Floating Isles', bg:'#0b1720', platforms: [{x:120,y:360,w:180,h:12},{x:380,y:260,w:220,h:12},{x:680,y:360,w:160,h:12}]},
  { id:2, name:'Ruins', bg:'#1a1016', platforms: [{x:150,y:380,w:200,h:12},{x:430,y:340,w:220,h:12},{x:700,y:380,w:160,h:12},{x:420,y:240,w:120,h:10}]},
  { id:3, name:'Tech Lab', bg:'#051425', platforms: [{x:0,y:420,w:200,h:12},{x:760,y:420,w:200,h:12},{x:360,y:320,w:240,h:12}]},
  { id:4, name:'Temple', bg:'#071214', platforms: [{x:200,y:400,w:560,h:12},{x:420,y:300,w:120,h:10},{x:60,y:320,w:120,h:10},{x:780,y:320,w:120,h:10}]},
];

// Canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// UI nodes
const charGrid = document.getElementById('char-grid');
const mapGrid = document.getElementById('map-grid');
const startBtn = document.getElementById('startBtn');
const randomBtn = document.getElementById('randomBtn');
const matchInfo = document.getElementById('matchInfo');
const overlay = document.getElementById('overlay');
const modal = document.getElementById('modal');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const chooseBtn = document.getElementById('chooseBtn');
const rematchBtn = document.getElementById('rematchBtn');

let selectedChar = 0;
let selectedMap = 0;

// Build char / map UI
CHARACTERS.forEach(ch => {
  const el = document.createElement('div');
  el.className = 'char-tile';
  el.style.background = ch.color;
  el.textContent = ch.name;
  el.dataset.id = ch.id;
  el.addEventListener('click', () => {
    selectedChar = ch.id;
    refreshSelectionUI();
  });
  charGrid.appendChild(el);
});
MAPS.forEach(m => {
  const el = document.createElement('div');
  el.className = 'map-tile';
  el.style.background = m.bg;
  el.textContent = m.name;
  el.dataset.id = m.id;
  el.addEventListener('click', () => {
    selectedMap = m.id;
    refreshSelectionUI();
  });
  mapGrid.appendChild(el);
});

function refreshSelectionUI(){
  Array.from(charGrid.children).forEach(chEl => {
    chEl.classList.toggle('selected', Number(chEl.dataset.id) === selectedChar);
    chEl.style.opacity = Number(chEl.dataset.id) === selectedChar ? '1' : '0.86';
  });
  Array.from(mapGrid.children).forEach(mEl => {
    mEl.classList.toggle('selected', Number(mEl.dataset.id) === selectedMap);
  });
  const p = CHARACTERS[selectedChar];
  const m = MAPS[selectedMap];
  matchInfo.textContent = `Player: ${p.name} • Map: ${m.name}`;
}

refreshSelectionUI();

// Game objects & state
let player = null;
let ai = null;
let aiController = null;
let platforms = [];
let map = null;
let running = false;
let lastTime = 0;

// input
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if([" ","k"].includes(e.key.toLowerCase())) e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// buttons
startBtn.addEventListener('click', () => startMatch());
randomBtn.addEventListener('click', () => {
  selectedChar = Math.floor(Math.random()*CHARACTERS.length);
  selectedMap = Math.floor(Math.random()*MAPS.length);
  refreshSelectionUI();
});
chooseBtn.addEventListener('click', () => { hideOverlay(); matchInfo.textContent = 'Pick a character & map and Start Match.'; });
rematchBtn.addEventListener('click', () => { hideOverlay(); startMatch(true); });

// map builder
function makeMap(mapId){
  map = MAPS[mapId];
  platforms = [];
  platforms.push({x:0,y:500,w:960,h:40});
  map.platforms.forEach(p => platforms.push({x:p.x,y:p.y,w:p.w,h:p.h}));
}

// create fighters
function createFighter(chData, x, facing){
  return new Character({
    id: chData.id, name: chData.name, color: chData.color,
    speed: chData.speed, jump: chData.jump, attack: chData.attack, weight: chData.weight,
    x: x, facing: facing
  });
}

function startMatch(rematch=false){
  makeMap(selectedMap);
  const pChar = CHARACTERS[selectedChar];
  const aiChar = CHARACTERS[Math.floor(Math.random()*CHARACTERS.length)];
  player = createFighter(pChar, 220, 1);
  ai = createFighter(aiChar, 680, -1);
  player.health = 0; ai.health = 0;
  player.alive = true; ai.alive = true;
  aiController = new SimpleAI(ai, 0.68);
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(loop);
  matchInfo.textContent = `Player: ${pChar.name} vs AI: ${aiChar.name} • Map: ${map.name}`;
}

// physics constants
const GRAV = 1200;

// helpers
function rectsIntersect(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function resolvePlatform(entity){
  entity.onGround = false;
  for(const p of platforms){
    if(entity.x + entity.w > p.x && entity.x < p.x + p.w){
      if(entity.vy >= 0 && (entity.y + entity.h) <= p.y + 12 && (entity.y + entity.h + entity.vy * 0.016) >= p.y){
        entity.y = p.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      }
    }
  }
}

function applyKnockback(target, power, dir){
  const kb = (power * (1 + target.health/100)) * (160 / target.weight);
  target.vx += dir * (kb * 0.6);
  target.vy -= Math.abs(kb) * 0.45;
}

// AI state for small randomness
let aiState = { timer:0, action:'' };

// main update
function update(dt){
  // player input
  let move = 0;
  if(keys['a']||keys['arrowleft']) move -= 1;
  if(keys['d']||keys['arrowright']) move += 1;
  player.applyInput(move, (keys['w']||keys['arrowup']), (keys[' ']||keys['k']));

  // player physics
  player.update(dt, GRAV);
  resolvePlatform(player);
  if(player.isOffstage(W,H)) player.alive = false;

  // AI decision
  if(ai.alive){
    const action = aiController.decide(player, platforms);
    aiController.apply(action);
    ai.update(dt, GRAV);
    resolvePlatform(ai);
    if(ai.isOffstage(W,H)) ai.alive = false;
  }

  // attack logic
  function handleAttack(attacker, defender){
    if(attacker.attackTimer > 0 && defender.alive){
      const rangeW = 60, rangeH = 36;
      const ax = attacker.facing > 0 ? attacker.x + attacker.w : attacker.x - rangeW;
      const ay = attacker.y + attacker.h * 0.35;
      const aBox = {x:ax, y:ay, w:rangeW, h:rangeH};
      const dBox = {x:defender.x, y:defender.y + 8, w:defender.w, h:defender.h - 12};
      if(rectsIntersect(aBox, dBox)){
        defender.health = Math.min(999, defender.health + attacker.attackPower);
        applyKnockback(defender, attacker.attackPower, attacker.facing);
        attacker.attackTimer = 0;
      }
    }
  }
  handleAttack(player, ai);
  handleAttack(ai, player);

  // clamp positions (soft)
  player.x = Math.max(-400, Math.min(W+400, player.x));
  ai.x = Math.max(-400, Math.min(W+400, ai.x));

  // check finish
  if(!player.alive || !ai.alive){
    running = false;
    const winner = (player.alive ? 'You' : 'AI');
    endMatch(winner);
  }
}

// rendering
function render(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = map ? map.bg : '#071225';
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for(const p of platforms) ctx.fillRect(p.x,p.y,p.w,p.h);

  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.strokeRect(0,0,W,H);

  if(ai) drawFighter(ai);
  if(player) drawFighter(player);

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(10,10,360,60);
  ctx.fillStyle = '#cfeaff';
  ctx.font = '16px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(`Player: ${player ? CHARACTERS[player.id].name : ''}`, 18, 32);
  ctx.font = '14px system-ui';
  ctx.fillStyle = '#d6f8ff';
  ctx.fillText(`Damage: ${player ? Math.round(player.health) : 0}%`, 18, 52);

  ctx.textAlign = 'right';
  ctx.font = '16px system-ui';
  ctx.fillStyle = '#ffcfcf';
  ctx.fillText(`AI: ${ai ? CHARACTERS[ai.id].name : ''}`, W-18, 32);
  ctx.font = '14px system-ui';
  ctx.fillStyle = '#ffdede';
  ctx.fillText(`Damage: ${ai ? Math.round(ai.health) : 0}%`, W-18, 52);

  // attack visuals
  function drawAttackVisual(ent){
    if(ent && ent.attackTimer > 0){
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = ent.color;
      const rx = ent.facing > 0 ? ent.x + ent.w : ent.x - 60;
      ctx.fillRect(rx, ent.y + ent.h * 0.35, 60, 36);
      ctx.restore();
    }
  }
  drawAttackVisual(player);
  drawAttackVisual(ai);

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0,H-36,W,36);
}

function drawFighter(ent){
  if(!ent || !ent.alive) return;
  ctx.save();
  if(ent.health > 120 && Math.floor(performance.now()/120)%2===0) ctx.globalAlpha = 0.6;
  ctx.fillStyle = ent.color;
  ctx.fillRect(ent.x, ent.y, ent.w, ent.h);
  ctx.fillStyle = '#071225';
  ctx.fillRect(ent.x+6, ent.y+6, ent.w-12, 12);
  ctx.fillStyle = '#fff';
  const eyeX = ent.facing>0 ? ent.x+ent.w-18 : ent.x+12;
  ctx.fillRect(eyeX, ent.y+14, 6,6);
  ctx.restore();
}

function loop(t){
  const dt = Math.min(0.033, (t - lastTime)/1000);
  lastTime = t;
  if(running) update(dt);
  render();
  if(running) requestAnimationFrame(loop);
}

// end match overlay
function endMatch(winner){
  resultTitle.textContent = winner === 'You' ? 'Victory!' : 'Defeat';
  resultText.textContent = winner === 'You' ? `You beat the AI! (${CHARACTERS[ai.id].name})` : `You were defeated by ${CHARACTERS[ai.id].name}.`;
  overlay.style.display = 'flex';
  modal.style.display = 'block';
}
function hideOverlay(){
  overlay.style.display = 'none';
  modal.style.display = 'none';
}

// initialize
selectedChar = 0; selectedMap = 0;
makeMap(selectedMap);
refreshSelectionUI();

// export small API for console debugging
window.ninjafight = {
  startMatch: () => startMatch(false),
  CHARACTERS, MAPS
};

// show a static preview
player = createFighter(CHARACTERS[selectedChar], 220, 1);
ai = createFighter(CHARACTERS[1], 680, -1);
player.health = 0; ai.health = 0;
player.alive = true; ai.alive = true;
render();
