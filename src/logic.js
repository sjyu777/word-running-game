export const themes = {galaxy:{name:'Galaxy',icon:'✦',color:'#b6a0ff',subtitle:'Across the vocabulary universe'},jungle:{name:'Jungle',icon:'❋',color:'#9fe591',subtitle:'Find your wild side'},ocean:{name:'Undersea',icon:'≈',color:'#80dce8',subtitle:'Dive into a world of words'}};
const question = (chinese,answer,others) => ({chinese,answer,choices:[answer,...others]});
export const starterStages = [
{id:'galaxy',name:'Cosmic sprint',theme:'galaxy',questions:[question('星星','star',['start','stair','store','storm']),question('月亮','moon',['mood','noon','room','move']),question('天空','sky',['ski','shy','spy','say']),question('光','light',['night','right','tight','flight']),question('地球','earth',['heart','early','worth','north'])]},
{id:'jungle',name:'Wild word trail',theme:'jungle',questions:[question('樹','tree',['three','free','true','train']),question('葉子','leaf',['leap','left','loaf','life']),question('老虎','tiger',['timer','tired','tighter','trigger']),question('河流','river',['rider','rival','driver','raven']),question('森林','forest',['forget','frost','first','flower'])]},
{id:'ocean',name:'Deep blue dash',theme:'ocean',questions:[question('魚','fish',['dish','wish','finish','fist']),question('海洋','ocean',['often','open','owner','oval']),question('鯨魚','whale',['while','whole','wheel','white']),question('水','water',['waiter','weather','winter','warmer']),question('貝殼','shell',['shelf','spell','smell','shall'])]}];
export function validateStage(stage){
 if(!stage.name?.trim()) throw new Error('Give your stage a name.');
 if(!themes[stage.theme]) throw new Error('Choose a supported theme.');
 if(!Array.isArray(stage.questions)||!stage.questions.length) throw new Error('Add at least one question.');
 for(const [i,q] of stage.questions.entries()) {
 if(!q.chinese?.trim()||!q.answer?.trim()) throw new Error(`Question ${i+1}: Chinese prompt and answer are required.`);
 if(!Array.isArray(q.choices)||q.choices.length!==5||q.choices.some(c=>typeof c!=='string'||!c.trim())||new Set(q.choices.map(c=>c.trim().toLowerCase())).size!==5||!q.choices.includes(q.answer)) throw new Error(`Question ${i+1}: provide five distinct words, including the exact answer.`);
 } return stage;
}
export function shuffle(items,random=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function rankings(runs,stageId){const best=new Map();for(const r of runs.filter(r=>r.stageId===stageId)){if(!best.has(r.playerId)||r.seconds<best.get(r.playerId).seconds)best.set(r.playerId,r);}return [...best.values()].sort((a,b)=>a.seconds-b.seconds).slice(0,5);}
export class Run {
 constructor(stage,now=0){this.stage=stage;this.started=now;this.index=0;this.points=0;this.mistakes=0;this.lockedUntil=0;this.finished=false;this.choices=shuffle(stage.questions[0].choices);}
 hit(lane,now){if(this.finished||now<this.lockedUntil)return 'locked';const q=this.stage.questions[this.index];if(this.choices[lane]!==q.answer){this.mistakes++;this.lockedUntil=now+1000;return 'wrong';}this.points+=100;this.index++;if(this.index===this.stage.questions.length){this.finished=true;this.seconds=(now-this.started)/1000;return 'finished';}this.choices=shuffle(this.stage.questions[this.index].choices);return 'correct';}
}

export class PracticeRun {
 constructor(stage,now=0){this.stage=stage;this.started=now;this.index=0;this.mistakes=0;this.lockedUntil=0;this.finished=false;this.completedWord='';this.prepareLetters();}
 prepareLetters(){this.answer=this.stage.questions[this.index].answer.toLowerCase();const letters=Array.from(this.answer);this.choices=shuffle(letters);if(this.choices.join('')===this.answer&&new Set(letters).size>1)this.choices.push(this.choices.shift());this.picks=[];}
 get sequence(){return this.picks.map(i=>i==null?'':this.choices[i]).join('');}
 hit(tile,now,position=this.picks.findIndex(i=>i==null)){
  if(this.finished||!Number.isInteger(tile)||tile<0||tile>=this.choices.length||this.picks.includes(tile))return 'locked';
  if(position===-1)position=this.picks.length;
  if(!Number.isInteger(position)||position<0||position>=this.choices.length||this.picks[position]!=null)return 'full';
  while(this.picks.length<=position)this.picks.push(null);
  this.picks[position]=tile;
  if(this.picks.filter(i=>i!=null).length<this.choices.length)return 'letter';
  if(this.sequence!==this.answer){this.mistakes++;return 'spelling-wrong';}
  this.completedWord=this.sequence;this.index++;
  if(this.index===this.stage.questions.length){this.finished=true;this.seconds=(now-this.started)/1000;return 'finished';}
  this.prepareLetters();return 'correct';
 }
 undo(position=this.picks.findLastIndex(i=>i!=null)){if(this.finished||position<0||this.picks[position]==null)return false;this.picks[position]=null;while(this.picks.length&&this.picks.at(-1)==null)this.picks.pop();return true;}
}
export function timedRankings(runs){
 const best=new Map();
 for(const run of runs)if(!best.has(run.playerId)||run.points>best.get(run.playerId).points)best.set(run.playerId,run);
 return [...best.values()].sort((a,b)=>b.points-a.points).slice(0,5);
}

export class TimedRun {
 constructor(stages,now=0){
  this.pool=stages.flatMap(stage=>stage.questions.map(question=>({...question,choices:[...question.choices]})));
  this.stage={name:'60-second challenge',questions:shuffle(this.pool)};
  this.started=now;this.index=0;this.points=0;this.mistakes=0;this.lockedUntil=0;this.finished=false;
  this.choices=shuffle(this.stage.questions[0].choices);
 }
 remaining(now){return Math.max(0,60-(now-this.started)/1000);}
 expire(now){if(this.remaining(now)>0&&!this.finished)return false;this.finished=true;this.seconds=60;return true;}
 hit(lane,now){
  if(this.expire(now))return 'expired';
  if(now<this.lockedUntil)return 'locked';
  if(this.choices[lane]!==this.stage.questions[this.index].answer){this.mistakes++;this.lockedUntil=now+1000;return 'wrong';}
  this.points++;this.index++;
  if(this.index===this.stage.questions.length){this.stage.questions=shuffle(this.pool);this.index=0;}
  this.choices=shuffle(this.stage.questions[this.index].choices);return 'correct';
 }
}
