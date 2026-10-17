import './style.css';
import {starterStages,themes,validateStage,rankings,timedRankings,Run,PracticeRun,TimedRun} from './logic.js';
import {createScene} from './scene.js';
import {audio} from './audio.js';
import {characters,portrait} from './characters.js';
const KEY='word-runner-v1';const defaults=()=>({players:[{id:'jamie',name:'Jamie'},{id:'jeremy',name:'Jeremy'}],stages:structuredClone(starterStages),runs:[]});
let data;try{data=JSON.parse(localStorage.getItem(KEY));if(!data||!Array.isArray(data.players)||!data.players.length||!Array.isArray(data.stages)||!data.stages.length||!Array.isArray(data.runs))throw Error();data.stages.forEach(validateStage);}catch{data=defaults();}
if(!Array.isArray(data.timedRuns))data.timedRuns=[];
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let playerId=data.players[0].id,stageId=data.stages[0].id,actorId=0,mode='challenge',selectedTile=0,selectedSlot=0,practiceFocus='letters',countingDown=false,countdownTimer,run=null,lane=2,screen='home',scene=null,feedbackTimer,hitTimer,resolveTimer,jumping=false;
const actors=characters;
const app=document.querySelector('#app');
app.innerHTML=`<header><a class="brand" href="#" aria-label="Word Runner home"><span class="brand-mark">W↗</span> WORD<span>RUNNER</span></a><nav><span class="platform">3D VOCABULARY ADVENTURE</span><button id="admin" class="quiet">Stage studio ↗</button></nav></header><main><div id="scene"></div><div class="vignette"></div><div id="content"></div></main><footer><span>SMALL WORDS. BIG WORLDS.</span><div class="audio-controls"><button id="sound" class="quiet" aria-pressed="false">♫ Sound on</button><label class="volume-label">Volume<input id="volume" type="range" min="0" max="100" aria-label="Sound volume"></label></div><label class="speed-control">Running speed <input id="running-speed" type="range" min="0" max="5" step="0.5" value="2.5" aria-label="Running speed"><output id="speed-value" for="running-speed">2.5 · 1×</output></label><label>Graphics <select id="quality"><option value="high">High</option><option value="low">Performance</option></select></label><span>LINUX + MAC · PLAY IN YOUR BROWSER</span></footer>`;
try{scene=createScene(document.querySelector('#scene'));}catch{document.querySelector('#scene').innerHTML='<div class="webgl-error">3D rendering requires WebGL. Enable hardware acceleration or use a WebGL-capable browser.</div>';}
const content=document.querySelector('#content');
scene?.onTargetLayout(targets=>{if(screen!=='game'||mode==='practice')return;const root=content.getBoundingClientRect();const canvas=document.querySelector('#scene').getBoundingClientRect();const gap=targets[1].x-targets[0].x;const width=Math.max(44,Math.min(166,gap-8,root.width/5-8));document.querySelectorAll('.word').forEach((word,i)=>{const x=targets[i].x+canvas.left-root.left;word.style.left=`${Math.max(width/2+4,Math.min(root.width-width/2-4,x))}px`;word.style.top=`${targets[i].y+canvas.top-root.top}px`;word.style.width=`${width}px`;});});
function setJumping(value){jumping=value;const jump=document.querySelector('#jump');if(jump)jump.disabled=value;const undo=document.querySelector('#undo');if(undo)undo.disabled=value;}
function cancelInteraction(){clearTimeout(countdownTimer);countingDown=false;clearTimeout(hitTimer);clearTimeout(resolveTimer);setJumping(false);}
const stage=()=>data.stages.find(s=>s.id===stageId);const player=()=>data.players.find(p=>p.id===playerId);
function home(){const worldScroll=screen==='home'?document.querySelector('.stage-list')?.scrollTop||0:0;audio.stopMusic();cancelInteraction();clearTimeout(feedbackTimer);screen='home';run=null;scene?.setPreview(true);scene?.setRunning(true);scene?.setLane(2);scene?.setTheme(stage().theme);document.querySelector('main').className='home';content.innerHTML=`<section class="intro"><div class="eyebrow"><span></span> YOUR NEXT ADVENTURE STARTS HERE</div><h1>Words worth<br><em>running for.</em></h1><p>Think fast. Pick your lane. Jump into English.<br>A little learning, a whole lot of adventure.</p><div class="controls-note"><kbd>←</kbd><kbd>→</kbd> change lanes <kbd>↑</kbd> jump & choose</div><div class="world-label">${themes[stage().theme].icon} <span>LIVE WORLD PREVIEW</span></div></section><section class="setup panel"><div class="section-top"><span class="eyebrow">LET’S GET YOU READY</span><span class="pill">01 / START</span></div><div class="player-row"><label for="player">Who's running?</label><button id="new-player" class="text-button">+ New player</button></div><select id="player">${data.players.map(p=>`<option value="${esc(p.id)}" ${p.id===playerId?'selected':''}>${esc(p.name)}</option>`).join('')}</select><div id="new-player-form"></div><h2><span>01</span> Choose your runner</h2><div class="actor-grid">${actors.map((a,i)=>`<button class="actor ${actorId===i?'selected':''}" data-actor="${i}" aria-pressed="${actorId===i}" style="--actor:${a.color}">${portrait(a)}<strong>${a.name}</strong><small>${a.role}</small></button>`).join('')}</div><h2><span>02</span> Pick a world</h2><div class="stage-list" role="region" aria-label="Pick a world" tabindex="0">${[...data.stages].reverse().map(s=>`<button class="stage-card ${stageId===s.id?'selected':''}" data-stage="${esc(s.id)}" style="--accent:${themes[s.theme].color}"><span class="stage-icon">${themes[s.theme].icon}</span><span><strong>${esc(s.name)}</strong><small>${themes[s.theme].name} · ${s.questions.length} words</small></span><span class="stage-arrow">${stageId===s.id?'✓':'↗'}</span></button>`).join('')}</div><h2><span>03</span> Choose how to play</h2><div class="mode-picker" role="group" aria-label="Game mode"><button id="challenge-mode" aria-pressed="${mode==='challenge'}">Adventure</button><button id="practice-mode" aria-pressed="${mode==='practice'}">Practice spelling</button><button id="timed-mode" aria-pressed="${mode==='timed'}">60-second challenge</button></div><button class="primary" id="start" ${!scene?'disabled':''}>${mode==='practice'?'Start practice':mode==='timed'?'Start 60-second challenge':'Let’s run'} <span>→</span></button><p class="hint">${mode==='practice'?'All letters are visible. ↑ places a letter; ↓ removes the selected letter.':mode==='timed'?'60 seconds · All stages, shuffled · 1 point per correct word. Your chosen world sets the scenery.':'Chase your best time. Every correct word earns 100 points.'}</p>${mode!=='practice'?`<button id="view-ranks" class="text-button rank-link">${mode==='timed'?'View 60-second top 5 ↗':'View this world’s top 5 ↗'}</button>`:''}</section>`;
 document.querySelector('#player').onchange=e=>playerId=e.target.value;
 document.querySelector('#new-player').onclick=()=>{document.querySelector('#new-player-form').innerHTML='<form id="add-player"><input maxlength="24" placeholder="Player name" aria-label="New player name" required><button class="small-button">Add</button></form>';document.querySelector('#add-player input').focus();document.querySelector('#add-player').onsubmit=e=>{e.preventDefault();const name=e.target.querySelector('input').value.trim();if(!name)return;const existing=data.players.find(p=>p.name.toLowerCase()===name.toLowerCase());if(existing)playerId=existing.id;else{playerId=crypto.randomUUID();data.players.push({id:playerId,name});save();}home();};};
 document.querySelectorAll('[data-actor]').forEach(b=>b.onclick=()=>{actorId=Number(b.dataset.actor);scene?.setActor(actors[actorId].id);home();});document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stageId=b.dataset.stage;home();});document.querySelector('#challenge-mode').onclick=()=>{mode='challenge';home();};document.querySelector('#practice-mode').onclick=()=>{mode='practice';home();};document.querySelector('#timed-mode').onclick=()=>{mode='timed';home();};document.querySelector('#start').onclick=start;document.querySelector('.stage-list').scrollTop=worldScroll;const rankButton=document.querySelector('#view-ranks');if(rankButton)rankButton.onclick=()=>showRanks();
}
function rankTable(){const rows=mode==='timed'?timedRankings(data.timedRuns):rankings(data.runs,stageId);return rows.length?`<ol class="rankings">${rows.map((r,i)=>`<li><span class="place">${String(i+1).padStart(2,'0')}</span><strong>${esc(data.players.find(p=>p.id===r.playerId)?.name||'Runner')}</strong><span>${mode==='timed'?`${r.points}<small> words</small>`:`${r.seconds.toFixed(2)}<small> s</small>`}</span></li>`).join('')}</ol>`:'<div class="empty">The leaderboard is waiting for its first explorer.<br>Finish a run to set the pace.</div>';}
function showRanks(){screen='ranks';content.innerHTML=`<section class="modal panel"><div class="eyebrow">THE FAST FIVE</div><h1 class="small-title">${mode==='timed'?'60-second challenge':esc(stage().name)}</h1><p>${mode==='timed'?'Best score per player · most correct words first':'Best time per player · fastest first'}</p>${rankTable()}<button id="back" class="primary">Back to adventure →</button></section>`;document.querySelector('#back').onclick=home;}
function start(){void audio.unlock().then(ready=>{if(ready&&screen==='game')audio.startMusic(stage().theme);});cancelInteraction();scene.setPreview(false);screen='game';lane=2;selectedTile=0;selectedSlot=0;practiceFocus='letters';run=mode==='practice'?new PracticeRun(stage(),performance.now()):mode==='timed'?new TimedRun(data.stages,performance.now()):new Run(stage(),performance.now());scene.setRunning(true);scene.setLane(lane);document.querySelector('main').className=mode==='practice'?'playing practicing':'playing';content.innerHTML=`<div class="hud"><button id="exit" class="quiet">← Leave run</button><span>${mode==='timed'?'60-SECOND CHALLENGE':esc(stage().name)} / ${esc(player().name)}${mode==='practice'?' · PRACTICE':''}</span>${mode==='practice'?'<span class="practice-badge">SPELL AT YOUR OWN PACE</span>':'<div><strong id="timer">0.00</strong><small>SECONDS</small></div><div><strong id="points">0</strong><small>SPEED POINTS</small></div>'}</div><section class="prompt"><div class="eyebrow" id="progress"></div><h1 id="chinese" lang="zh-Hant"></h1><p>${mode==='practice'?'Choose a letter below, then ↑ to place it. Select a box and ↓ to return its letter.':'Find the English word. Jump to lock it in.'}</p>${mode==='practice'?'<div class="spelling-panel"><span class="eyebrow">YOUR SPELLING</span><div id="sequence" aria-live="polite" aria-label="Current spelling"></div></div>':''}<div id="feedback" aria-live="polite"></div></section><div class="word-targets" id="words"></div><div class="touch-controls">${mode==='practice'?'<button id="undo" aria-label="Remove selected letter">↓ Remove</button>':''}<button id="left" aria-label="Move left">←</button><button id="jump">↑ Jump</button><button id="right" aria-label="Move right">→</button></div><div class="game-tip">← → MOVE BETWEEN LANES <span>•</span> ↑ JUMP ${mode==='practice'?'<span>•</span> ↓ REMOVE · Q / E SELECT BOX':'TO ANSWER'}</div>`;document.querySelector('#exit').onclick=home;document.querySelector('#left').onclick=()=>move(-1);document.querySelector('#right').onclick=()=>move(1);document.querySelector('#jump').onclick=hit;if(mode==='practice')document.querySelector('#undo').onclick=undoLetter;renderQuestion();if(mode==='timed'){document.querySelector('#timer').textContent='60.00';document.querySelector('#timer + small').textContent='SECONDS LEFT';document.querySelector('#points + small').textContent='CORRECT WORDS';}if(mode!=='practice')startCountdown();}
function startCountdown(){
 countingDown=true;scene.setRunning(false);let count=3;
 const overlay=document.createElement('div');overlay.id='countdown';overlay.setAttribute('role','status');overlay.innerHTML='<small>GET READY</small><strong>3</strong>';content.append(overlay);
 const tick=()=>{count--;if(count>0){overlay.querySelector('strong').textContent=count;countdownTimer=setTimeout(tick,1000);}else{overlay.remove();countingDown=false;run.started=performance.now();scene.setRunning(true);}};
 countdownTimer=setTimeout(tick,1000);
}
function renderSequence(completed){
 const letters=Array.from(completed??run.answer);
 const sequence=document.querySelector('#sequence');sequence.dataset.spelling=completed??run.sequence;
 sequence.innerHTML=letters.map((answer,i)=>{
  const char=completed?answer:run.picks[i]!=null?run.choices[run.picks[i]]:'';
  const status=char?(char===answer?'correct':'incorrect'):'empty';
  return `<button class="spelling-slot ${status} ${i===selectedSlot?'selected':''}" data-slot="${i}" aria-label="Position ${i+1}: ${char||'empty'}, ${status}" aria-pressed="${i===selectedSlot}"><small>${i+1}</small><strong>${char===' '?'␣':esc(char)||'·'}</strong><span>${char?(status==='correct'?'✓':'✕'):'&nbsp;'}</span></button>`;
 }).join('');
 sequence.querySelectorAll('[data-slot]').forEach(button=>button.onclick=()=>{if(jumping)return;selectedSlot=Number(button.dataset.slot);practiceFocus='boxes';renderQuestion();});
}
function renderQuestion(){
 document.querySelector('#chinese').textContent=run.stage.questions[run.index].chinese;
 document.querySelector('#progress').textContent=mode==='timed'?`ALL ${data.stages.length} STAGES · ${run.pool.length} WORDS · SHUFFLED`:`WORD ${String(run.index+1).padStart(2,'0')} / ${String(run.stage.questions.length).padStart(2,'0')}`;
 if(mode==='practice'){
  renderSequence();
  document.querySelector('#words').innerHTML=run.choices.map((char,i)=>`<button class="letter-tile ${i===selectedTile?'active':''}" data-tile="${i}" aria-label="Letter ${char}, tile ${i+1}" aria-pressed="${i===selectedTile}" ${run.picks.includes(i)?'disabled':''}><strong>${char===' '?'␣':esc(char)}</strong><small>${run.picks.includes(i)?'IN BOX':'↑ PLACE'}</small></button>`).join('');
  document.querySelectorAll('[data-tile]').forEach(button=>button.onclick=()=>{if(jumping)return;selectedTile=Number(button.dataset.tile);practiceFocus='letters';scene.setLane(selectedTile%5);renderQuestion();});
  return;
 }
 document.querySelector('#points').textContent=run.points;
 document.querySelector('#words').innerHTML=run.choices.map((word,i)=>`<button class="word ${i===lane?'active':''}" data-lane="${i}"><small>LANE ${i+1}</small><strong>${esc(word)}</strong><span>${i===lane?'↑ JUMP':'◇'}</span></button>`).join('');
 document.querySelectorAll('[data-lane]').forEach(button=>button.onclick=()=>{if(jumping||countingDown||performance.now()<run.lockedUntil)return;lane=Number(button.dataset.lane);scene.setLane(lane);renderQuestion();});
 scene?.refreshLayout();
}
function selectBox(direction){if(screen!=='game'||mode!=='practice'||jumping)return;practiceFocus='boxes';selectedSlot=Math.max(0,Math.min(run.choices.length-1,selectedSlot+direction));renderQuestion();}
function undoLetter(){if(screen!=='game'||mode!=='practice'||jumping)return;const tile=run.picks[selectedSlot];if(run.undo(selectedSlot)){selectedTile=tile;practiceFocus='letters';audio.play('undo');document.querySelector('#feedback').textContent='';renderQuestion();}}
function move(direction){
 if(screen!=='game'||jumping||countingDown||performance.now()<run.lockedUntil)return;
 if(mode==='practice'){
  if(practiceFocus==='boxes'){selectBox(direction);return;}
  selectedTile=Math.max(0,Math.min(run.choices.length-1,selectedTile+direction));scene.setLane(selectedTile%5);
 }else{lane=Math.max(0,Math.min(4,lane+direction));scene.setLane(lane);}
 renderQuestion();
}
function placeLetter(){
 const feedback=document.querySelector('#feedback');
 if(run.picks.includes(selectedTile))return;
 if(run.picks[selectedSlot]!=null){feedback.textContent='This box is full. Press ↓ to return its letter, or select an empty box.';return;}
 setJumping(true);scene.jump();audio.play('jump');
 hitTimer=setTimeout(()=>{
  const position=selectedSlot,answer=run.answer,char=run.choices[selectedTile];
  const outcome=run.hit(selectedTile,performance.now(),position);
  const complete=outcome==='correct'||outcome==='finished';
  if(complete){renderSequence(run.completedWord);audio.play('correct');feedback.textContent='✓ Word spelled correctly!';feedback.className='correct';}
  else{
   renderQuestion();const correct=char===Array.from(answer)[position];audio.play(correct?'letter':'wrong');feedback.textContent=correct?'✓ Correct position':'✕ Try another position · select this box and press ↓';feedback.className=correct?'correct':'wrong';
  }
  resolveTimer=setTimeout(()=>{
   setJumping(false);
   if(outcome==='finished'){finish();return;}
   if(complete){selectedSlot=0;selectedTile=0;feedback.textContent='';}
   else if(char===Array.from(answer)[position]){const next=Array.from({length:run.choices.length},(_,i)=>i).find(i=>run.picks[i]==null);if(next!=null)selectedSlot=next;}
   practiceFocus='letters';renderQuestion();
  },complete?850:240);
 },240);
}
function hit(){
 if(screen!=='game'||jumping||countingDown||performance.now()<run.lockedUntil)return;
 if(mode==='practice'){placeLetter();return;}
 const target=document.querySelector(`[data-lane="${lane}"]`);if(target.disabled)return;
 setJumping(true);const selected=document.querySelector(`[data-lane="${lane}"]`);scene.jump();audio.play('jump');
 hitTimer=setTimeout(()=>{
  if(screen!=='game')return;
  const outcome=run.hit(lane,performance.now());if(outcome==='expired'){finish();return;}if(outcome==='locked'){setJumping(false);return;}const feedback=document.querySelector('#feedback');clearTimeout(feedbackTimer);
  if(outcome==='wrong'){
   audio.play('wrong');
   setJumping(false);selected.classList.add('hit-wrong');feedback.textContent='✕ Try again · 1 second pause';feedback.className='wrong';scene.setRunning(false);
   feedbackTimer=setTimeout(()=>{if(screen==='game'){feedback.textContent='';selected.classList.remove('hit-wrong');scene.setRunning(true);}},1000);
  }else{
   audio.play('correct');selected.classList.add('hit-correct');const star=document.createElement('span');star.className='golden-star';star.textContent='★';star.setAttribute('aria-hidden','true');selected.append(star);
   feedback.textContent=mode==='timed'?'✓ Correct word! +1':'✓ Nice jump! +100';feedback.className='correct';document.querySelector('#points').textContent=run.points;
   resolveTimer=setTimeout(()=>{if(screen!=='game')return;setJumping(false);if(outcome==='finished')finish();else{feedback.textContent='';selectedSlot=0;renderQuestion();}},850);
  }
 },240);
}
function finish(){if(screen!=='game')return;cancelInteraction();clearTimeout(feedbackTimer);audio.stopMusic();audio.play('finish');screen='results';scene.setRunning(false);if(mode==='practice'){practiceResults();return;}if(mode==='timed'){timedResults();return;}const result={stageId,playerId,seconds:run.seconds,points:run.points,mistakes:run.mistakes,date:new Date().toISOString()};data.runs.push(result);save();const best=Math.min(...data.runs.filter(r=>r.stageId===stageId&&r.playerId===playerId).map(r=>r.seconds));content.innerHTML=`<section class="modal panel results"><div class="eyebrow">FINISH LINE / ${esc(stage().name)}</div><div class="finish-icon">✦</div><h1 class="small-title">What a run, ${esc(player().name)}.</h1><p>${run.seconds===best?'A personal best. Keep the momentum!':'Another adventure in the books.'}</p><div class="result-stats"><div><strong>${run.seconds.toFixed(2)}<small>s</small></strong><span>COMPLETION TIME</span></div><div><strong>${run.points}</strong><span>SPEED POINTS</span></div></div><p>Personal best: ${best.toFixed(2)} s · ${run.mistakes} wrong ${run.mistakes===1?'answer':'answers'}</p><h2>Top 5 · this world</h2>${rankTable()}<button id="retry" class="primary">Run it again ↻</button><button id="home" class="text-button">Choose another adventure</button></section>`;document.querySelector('#retry').onclick=start;document.querySelector('#home').onclick=home;}
function timedResults(){
 data.timedRuns.push({playerId,points:run.points,mistakes:run.mistakes,date:new Date().toISOString()});save();
 const best=Math.max(...data.timedRuns.filter(result=>result.playerId===playerId).map(result=>result.points));
 content.innerHTML=`<section class="modal panel results"><div class="eyebrow">60-SECOND CHALLENGE COMPLETE</div><div class="finish-icon">★</div><h1 class="small-title">Time’s up, ${esc(player().name)}!</h1><div class="result-stats"><div><strong>${run.points}</strong><span>CORRECT WORDS</span></div></div><p>Personal best: ${best} words · ${run.mistakes} wrong answers</p><h2>Top 5 · 60-second challenge</h2>${rankTable()}<p>Best score per player · Stored in this browser</p><button id="retry" class="primary">Try another minute ↻</button><button id="home" class="text-button">Choose another adventure</button></section>`;
 document.querySelector('#retry').onclick=start;document.querySelector('#home').onclick=home;
}
function practiceResults(){
 content.innerHTML=`<section class="modal panel results"><div class="eyebrow">PRACTICE COMPLETE / ${esc(stage().name)}</div><div class="finish-icon">★</div><h1 class="small-title">Spelling unlocked!</h1><p>Well done, ${esc(player().name)}. You spelled every word.</p><div class="result-stats"><div><strong>${run.stage.questions.length}</strong><span>WORDS PRACTICED</span></div></div><p>${run.mistakes} spelling retries · Practice does not affect challenge rankings.</p><button id="retry" class="primary">Practice again ↻</button><button id="home" class="text-button">Choose another adventure</button></section>`;
 document.querySelector('#retry').onclick=start;document.querySelector('#home').onclick=home;
}
function admin(editId=data.stages[0].id){audio.stopMusic();cancelInteraction();clearTimeout(feedbackTimer);screen='admin';run=null;scene?.setRunning(false);const selected=data.stages.find(s=>s.id===editId);content.innerHTML=`<section class="studio panel"><div class="section-top"><div><div class="eyebrow">BUILD THE NEXT ADVENTURE</div><h1 class="small-title">Stage studio</h1></div><button class="quiet" id="studio-back">← Back</button></div><p>Local editing tools · saved on this browser. Editing vocabulary resets that stage’s rankings.</p><label for="edit-stage">Edit a stage</label><select id="edit-stage"><option value="new" ${!selected?'selected':''}>+ Create a stage</option>${data.stages.map(s=>`<option value="${esc(s.id)}" ${s.id===editId?'selected':''}>${esc(s.name)}</option>`).join('')}</select><form id="stage-form"><div class="form-row"><label>Stage name<input id="stage-name" required maxlength="48" value="${esc(selected?.name||'')}"></label><label>World<select id="stage-theme">${Object.entries(themes).map(([id,t])=>`<option value="${id}" ${id===selected?.theme?'selected':''}>${t.name}</option>`).join('')}</select></label></div><label for="questions">Vocabulary</label><p class="hint">One line per question: Chinese | correct answer | distractor 1 | distractor 2 | distractor 3 | distractor 4</p><textarea id="questions" rows="8" required placeholder="蘋果 | apple | apply | ample | maple | angle">${esc(selected?.questions.map(q=>[q.chinese,q.answer,...q.choices.filter(c=>c!==q.answer)].join(' | ')).join('\n')||'')}</textarea><div id="studio-message" role="status"></div><button class="primary">Save stage →</button></form>${selected?'<button id="delete-stage" class="text-button danger">Delete this stage</button>':''}<p class="hint">This studio has no authentication. For a shared deployment, add a server and administrator sign-in.</p></section>`;document.querySelector('#studio-back').onclick=home;document.querySelector('#edit-stage').onchange=e=>admin(e.target.value);document.querySelector('#stage-form').onsubmit=e=>{e.preventDefault();const message=document.querySelector('#studio-message');try{const questions=document.querySelector('#questions').value.trim().split('\n').filter(l=>l.trim()).map(line=>{const parts=line.split('|').map(p=>p.trim());if(parts.length!==6)throw Error('Each question needs a Chinese prompt and exactly five English words.');return {chinese:parts[0],answer:parts[1],choices:parts.slice(1)};});const s=validateStage({id:selected?.id||crypto.randomUUID(),name:document.querySelector('#stage-name').value.trim(),theme:document.querySelector('#stage-theme').value,questions});if(selected){data.stages[data.stages.findIndex(x=>x.id===s.id)]=s;data.runs=data.runs.filter(r=>r.stageId!==s.id);}else data.stages.push(s);stageId=s.id;save();admin(s.id);document.querySelector('#studio-message').textContent='Stage saved. Ready to run!';}catch(error){message.textContent=error.message;}};if(selected)document.querySelector('#delete-stage').onclick=()=>{if(data.stages.length===1){document.querySelector('#studio-message').textContent='Keep at least one stage.';return;}if(!confirm(`Delete “${selected.name}” and its rankings?`))return;data.stages=data.stages.filter(s=>s.id!==selected.id);data.runs=data.runs.filter(r=>r.stageId!==selected.id);stageId=data.stages[0].id;save();admin();};}
window.addEventListener('keydown',e=>{if(screen!=='game'||e.target.matches('input,select,textarea'))return;if(['ArrowLeft','ArrowRight','ArrowUp',...(mode==='practice'?['ArrowDown','Delete','Backspace','q','e']:[])].includes(e.key)){e.preventDefault();if(e.repeat)return;if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='ArrowUp')hit();if(['ArrowDown','Delete','Backspace'].includes(e.key))undoLetter();if(e.key==='q')selectBox(-1);if(e.key==='e')selectBox(1);}});
document.querySelector('#admin').onclick=()=>admin();document.querySelector('.brand').onclick=e=>{e.preventDefault();home();};document.querySelector('#quality').onchange=e=>scene?.setQuality(e.target.value);
setInterval(()=>{
 if(screen!=='game'||mode==='practice'||!run||countingDown)return;
 const now=performance.now();
 if(mode==='timed'){
  if(run.expire(now)){finish();return;}
  document.querySelector('#timer').textContent=run.remaining(now).toFixed(2);
  document.querySelector('#timer').classList.toggle('time-low',run.remaining(now)<=10);
 }else document.querySelector('#timer').textContent=(run.finished?run.seconds:(now-run.started)/1000).toFixed(2);
},40);
const soundButton=document.querySelector('#sound');const volumeSlider=document.querySelector('#volume');
function updateAudioControls(){soundButton.textContent=audio.available?(audio.muted?'♫ Sound off':'♫ Sound on'):'Audio unavailable';soundButton.setAttribute('aria-pressed',String(!audio.muted));soundButton.disabled=!audio.available;volumeSlider.value=String(Math.round(audio.volume*100));volumeSlider.disabled=!audio.available;}
soundButton.onclick=()=>{audio.setMuted(!audio.muted);updateAudioControls();void audio.unlock().then(ready=>{if(ready&&screen==='game'&&!audio.track)audio.startMusic(stage().theme);});};
volumeSlider.oninput=e=>audio.setVolume(Number(e.target.value)/100);
document.addEventListener('visibilitychange',()=>{void audio.handleVisibility(document.hidden).catch(()=>{});});
const speedSlider=document.querySelector('#running-speed');
let savedSpeed=2.5;
try{const stored=localStorage.getItem('word-runner-speed');if(stored!==null&&Number.isFinite(Number(stored)))savedSpeed=Math.max(0,Math.min(5,Math.round(Number(stored)*2)/2));}catch{}
function updateRunningSpeed(){
 const speed=Number(speedSlider.value);
 scene?.setSpeed(speed);
 const description=speed===0?'Stopped':`${speed/2.5}×`;
 document.querySelector('#speed-value').textContent=`${speed} · ${description}`;
 speedSlider.setAttribute('aria-valuetext',`${speed}, ${description}`);
}
speedSlider.value=String(savedSpeed);updateRunningSpeed();
speedSlider.oninput=()=>{updateRunningSpeed();try{localStorage.setItem('word-runner-speed',speedSlider.value);}catch{}};
updateAudioControls();
home();
