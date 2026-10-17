import {test} from 'node:test';import assert from 'node:assert/strict';import {starterStages,validateStage,Run,rankings} from '../src/logic.js';
test('starter vocabulary has one exact match in five distinct choices',()=>starterStages.forEach(validateStage));
test('wrong answer locks input for exactly one second and time includes penalty',()=>{const r=new Run(starterStages[0],100);const wrong=r.choices.findIndex(c=>c!==r.stage.questions[0].answer);assert.equal(r.hit(wrong,200),'wrong');assert.equal(r.hit(0,1199),'locked');assert.equal(r.index,0);assert.equal(r.mistakes,1);assert.equal(r.hit(r.choices.indexOf(r.stage.questions[0].answer),1200),'correct');assert.equal(r.points,100);});
test('all questions complete a stage and award points once',()=>{const r=new Run(starterStages[0],0);for(let i=0;i<5;i++)assert.equal(r.hit(r.choices.indexOf(r.stage.questions[r.index].answer),(i+1)*1000),i===4?'finished':'correct');assert.equal(r.seconds,5);assert.equal(r.points,500);assert.equal(r.hit(0,6000),'locked');});
test('rankings keep each player best time and only the stage top five',()=>{const runs=Array.from({length:7},(_,i)=>({stageId:'a',playerId:String(i),seconds:10+i}));runs.push({stageId:'a',playerId:'0',seconds:9},{stageId:'b',playerId:'8',seconds:1});const top=rankings(runs,'a');assert.equal(top.length,5);assert.equal(top[0].seconds,9);assert.equal(new Set(top.map(r=>r.playerId)).size,5);});
test('admin rejects duplicate and missing choices',()=>{assert.throws(()=>validateStage({name:'x',theme:'ocean',questions:[{chinese:'水',answer:'water',choices:['water','water','a','b','c']}]}),/distinct/);assert.throws(()=>validateStage({name:'x',theme:'ocean',questions:[]}),/at least/);});

test('practice collects individual shuffled tiles, undo restores duplicates and completes spelling',async()=>{
 const {PracticeRun}=await import('../src/logic.js');const stage={questions:[{chinese:'樹',answer:'tree'}]};const r=new PracticeRun(stage,0);
 assert.deepEqual([...r.choices].sort(),['t','r','e','e'].sort());assert.notEqual(r.choices.join(''),'tree');
 const e=r.choices.indexOf('e');assert.equal(r.hit(e,100),'letter');assert.equal(r.sequence,'e');assert.equal(r.hit(e,200),'locked');assert.equal(r.undo(),true);assert.equal(r.sequence,'');assert.equal(r.undo(),false);
 for(const c of 'tree'){const tile=r.choices.findIndex((v,i)=>v===c&&!r.picks.includes(i));assert.equal(r.hit(tile,300),c==='e'&&r.finished?'finished':'letter');}
 assert.equal(r.finished,true);assert.equal(r.completedWord,'tree');assert.equal(r.undo(),false);assert.equal('points' in r,false);
});
test('practice wrong order remains editable and a new word resets collected letters',async()=>{
 const {PracticeRun}=await import('../src/logic.js');const r=new PracticeRun({questions:[{chinese:'星星',answer:'star'},{chinese:'森林',answer:'forest'}]},0);
 for(const c of 'rats'){const tile=r.choices.findIndex((v,i)=>v===c&&!r.picks.includes(i));r.hit(tile,100);}
 assert.equal(r.sequence,'rats');assert.equal(r.index,0);assert.equal(r.mistakes,1);assert.equal(r.hit(0,200),'locked');while(r.undo()){}
 for(const c of 'star'){const tile=r.choices.findIndex((v,i)=>v===c&&!r.picks.includes(i));r.hit(tile,300);}
 assert.equal(r.index,1);assert.equal(r.sequence,'');assert.equal(r.choices.length,6);assert.equal(r.completedWord,'star');
});
test('practice removes a specific middle letter without shifting other positions',async()=>{
 const {PracticeRun}=await import('../src/logic.js');const r=new PracticeRun({questions:[{answer:'balloon'}]});
 for(const [position,char] of [...'bal'].entries())r.hit(r.choices.findIndex((c,i)=>c===char&&!r.picks.includes(i)),100,position);
 const third=r.picks[2],removed=r.picks[1];assert.equal(r.undo(1),true);assert.equal(r.picks[2],third);assert.equal(r.picks[1],null);
 assert.equal(r.hit(removed,200,1),'letter');assert.equal(r.sequence,'bal');
 for(const position of [3,4,5,6])r.hit(r.choices.findIndex((c,i)=>c==='balloon'[position]&&!r.picks.includes(i)),300,position);
 assert.equal(r.finished,true);
});
test('timed challenge pools all stages, cycles without finishing, and scores one per word',async()=>{
 const {TimedRun}=await import('../src/logic.js');const r=new TimedRun(starterStages,1000);
 assert.equal(r.pool.length,15);assert.deepEqual(r.stage.questions.map(q=>q.answer).sort(),starterStages.flatMap(s=>s.questions.map(q=>q.answer)).sort());
 for(let i=0;i<16;i++)assert.equal(r.hit(r.choices.indexOf(r.stage.questions[r.index].answer),2000+i*100),'correct');
 assert.equal(r.points,16);assert.equal(r.finished,false);assert.equal(r.index,1);assert.equal(r.remaining(31000),30);
 assert.equal(r.hit(r.choices.indexOf(r.stage.questions[r.index].answer),61000),'expired');assert.equal(r.points,16);assert.equal(r.finished,true);
});
test('timed wrong-answer penalty consumes time and expiry rejects late answers',async()=>{
 const {TimedRun}=await import('../src/logic.js');const r=new TimedRun(starterStages,0);
 assert.equal(r.hit(r.choices.findIndex(c=>c!==r.stage.questions[0].answer),58900),'wrong');
 const correct=r.choices.indexOf(r.stage.questions[0].answer);assert.equal(r.hit(correct,59899),'locked');assert.equal(r.hit(correct,59900),'correct');
 assert.equal(r.expire(60000),true);assert.equal(r.points,1);assert.equal(r.remaining(70000),0);assert.equal(r.hit(0,70000),'expired');
});
test('timed rankings keep the highest score per player and return the top five',async()=>{
 const {timedRankings}=await import('../src/logic.js');const runs=Array.from({length:7},(_,i)=>({playerId:String(i),points:i}));runs.push({playerId:'0',points:20},{playerId:'0',points:3});
 const rows=timedRankings(runs);assert.equal(rows.length,5);assert.equal(rows[0].playerId,'0');assert.equal(rows[0].points,20);assert.equal(new Set(rows.map(r=>r.playerId)).size,5);
});
