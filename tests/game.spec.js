import {test,expect} from '@playwright/test';
test('complete keyboard run, penalty, ranking, replay and persistence',async({page})=>{
const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await page.getByRole('button',{name:'+ New player'}).click();await page.getByRole('textbox',{name:'New player name'}).fill('Tester');await page.getByRole('button',{name:'Add',exact:true}).click();await expect(page.locator('#player')).toHaveValue(/.+/);await page.evaluate(async()=>{const {audio}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/audio.js').name);window.soundEvents=[];const play=audio.play.bind(audio);audio.play=event=>{window.soundEvents.push(event);play(event);};});await page.getByRole('button',{name:'Let’s run'}).click();
const wrong=page.locator('.word').filter({hasText:'storm'});await wrong.click();await page.keyboard.press('ArrowUp');await expect(page.locator('#feedback')).toContainText('Try again');const current=await page.locator('#progress').textContent();await page.keyboard.press('ArrowUp');await expect(page.locator('#progress')).toHaveText(current);await page.waitForTimeout(1100);
for(const answer of ['star','moon','sky','light','earth']){const words=await page.locator('.word strong').allTextContents();const target=words.indexOf(answer);const active=Number(await page.locator('.word.active').getAttribute('data-lane'));for(let i=0;i<Math.abs(target-active);i++)await page.keyboard.press(target>active?'ArrowRight':'ArrowLeft');await page.keyboard.press('ArrowUp');await expect(page.locator('.golden-star')).toBeVisible();if(answer!=='earth')await expect(page.locator('.word.hit-correct')).toHaveCount(0);}
await expect(page.getByText('What a run, Tester.')).toBeVisible();await expect(page.locator('.result-stats')).toContainText('500');await expect(page.locator('.rankings')).toContainText('Tester');expect(await page.evaluate(()=>window.soundEvents)).toEqual(['jump','wrong',...Array(5).fill(['jump','correct']).flat(),'finish']);await page.getByRole('button',{name:'Run it again'}).click();await expect(page.locator('#progress')).toContainText('01 / 05');await page.getByRole('button',{name:'Leave run'}).click();await page.reload();await expect(page.locator('#player option')).toContainText(['Jamie','Jeremy','Tester']);await page.getByRole('button',{name:'View this world’s top 5'}).click();await expect(page.locator('.rankings')).toContainText('Tester');expect(errors).toEqual([]);
});
test('stage editor validates, saves and loads custom vocabulary',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Stage studio'}).click();await page.locator('#edit-stage').selectOption('new');await page.locator('#stage-name').fill('Test trail');await page.locator('#questions').fill('蘋果 | apple | apple | ample | maple | angle');await page.getByRole('button',{name:'Save stage'}).click();await expect(page.locator('#studio-message')).toContainText('distinct');await page.locator('#questions').fill('蘋果 | apple | apply | ample | maple | angle');await page.getByRole('button',{name:'Save stage'}).click();await expect(page.locator('#studio-message')).toContainText('saved');await page.getByRole('button',{name:'Back',exact:false}).click();await expect(page.locator('.stage-card.selected')).toContainText('Test trail');await page.getByRole('button',{name:'Let’s run'}).click();await expect(page.locator('#chinese')).toHaveText('蘋果');await page.locator('.word').filter({hasText:'apple'}).click();await page.keyboard.press('ArrowUp');await expect(page.locator('.results')).toBeVisible();await page.reload();await expect(page.locator('.stage-list')).toContainText('Test trail');});
test('world and actor selections and mobile controls',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('[data-actor="1"]').click();await expect(page.locator('[data-actor="1"]')).toHaveClass(/selected/);await page.locator('[data-stage="ocean"]').click();await page.getByRole('button',{name:'Let’s run'}).click();await expect(page.locator('#chinese')).toHaveText('魚');await page.getByRole('button',{name:'Move right'}).click();await expect(page.locator('.word.active')).toHaveAttribute('data-lane','3');await page.getByRole('button',{name:'Move left'}).click();await expect(page.locator('.word.active')).toHaveAttribute('data-lane','2');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();for(const word of await page.locator('.word').all()){const bounds=await word.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(390);}});

test('raised targets are hit at jump apex and release a golden star',async({page})=>{
 await page.goto('/');await page.locator('#start').click();
 await expect(page.locator('#countdown')).toHaveCount(0);
 const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-runner-head-y',/.+/);
 const headY=Number(await canvas.getAttribute('data-runner-head-y'));
 const box=await page.locator('.word.active').boundingBox();const canvasBox=await canvas.boundingBox();
 expect(box.y+box.height).toBeLessThan(canvasBox.y+headY-15);
 await page.locator('.word').filter({has:page.getByText('star',{exact:true})}).click();
 await page.keyboard.press('ArrowUp');await expect(page.locator('#progress')).toContainText('01 / 05');
 await expect(page.locator('.golden-star')).toBeVisible();
 const target=await page.locator('.word.hit-correct').boundingBox();const star=await page.locator('.golden-star').boundingBox();
 expect(star.y+star.height).toBeLessThanOrEqual(target.y+4);
 await expect(page.locator('#progress')).toContainText('02 / 05');await expect(page.locator('.golden-star')).toHaveCount(0);
});


test('themed music produces audio, mute and volume persist, leaving stops music',async({page})=>{
 await page.goto('/');await page.locator('[data-stage="jungle"]').click();await page.locator('#start').click();
 await expect.poll(()=>page.evaluate(async()=>{const {audio}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/audio.js').name);return audio.context?.state;})).toBe('running');
 expect(await page.evaluate(async()=>{const {audio}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/audio.js').name);return audio.theme;})).toBe('jungle');
 const rms=()=>page.evaluate(async()=>{const {audio}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/audio.js').name);const samples=new Float32Array(audio.analyser.fftSize);audio.analyser.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);});
 await expect.poll(rms).toBeGreaterThan(.001);
 await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveText('♫ Sound off');await expect.poll(rms).toBeLessThan(.0001);
 await page.locator('#volume').fill('35');await page.reload();await expect(page.locator('#sound')).toHaveText('♫ Sound off');await expect(page.locator('#volume')).toHaveValue('35');
 await page.locator('#start').click();await expect.poll(rms).toBeLessThan(.0001);await page.locator('#sound').click();await expect.poll(rms).toBeGreaterThan(.001);
 await page.locator('#exit').click();expect(await page.evaluate(async()=>{const {audio}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/audio.js').name);return audio.track;})).toBeNull();await expect.poll(rms).toBeLessThan(.0001);
});

test('every event synthesizes a non-silent sound',async({page})=>{
 await page.goto('/');await page.locator('#sound').click();await page.locator('#sound').click();
 await expect.poll(()=>page.evaluate(async()=>{const {audio}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/audio.js').name);return audio.context?.state;})).toBe('running');
 for(const event of ['jump','correct','wrong','finish']){
  const peak=await page.evaluate(async event=>{const {audio}=await import(performance.getEntriesByType('resource').find(r=>new URL(r.name).pathname==='/src/audio.js').name);audio.play(event);let peak=0;const samples=new Float32Array(audio.analyser.fftSize);for(let i=0;i<35;i++){await new Promise(r=>setTimeout(r,30));audio.analyser.getFloatTimeDomainData(samples);peak=Math.max(peak,...samples.map(Math.abs));}return peak;},event);
  expect(peak,event).toBeGreaterThan(.005);
 }
});

test('practice shows every letter and supports position feedback and targeted removal',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('word-runner-v1',JSON.stringify({players:[{id:'learner',name:'Learner'}],runs:[],stages:[{id:'practice-test',name:'Spelling trail',theme:'jungle',questions:[{chinese:'氣球',answer:'balloon',choices:['balloon','tree','forest','star','moon']}]}]})));
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#practice-mode').click();await page.locator('#start').click();
 await expect(page.locator('.letter-tile')).toHaveCount(7);await expect(page.locator('.spelling-slot')).toHaveCount(7);
 await expect(page.locator('#timer')).toHaveCount(0);
 for(const tile of await page.locator('.letter-tile').all()){await expect(tile).toBeVisible();const box=await tile.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(390);}
 const slots=await page.locator('#sequence').boundingBox(),bank=await page.locator('#words').boundingBox();expect(bank.y).toBeGreaterThan(slots.y+slots.height);
 const place=async(char,position)=>{await page.locator('[data-slot="'+position+'"]').click();await page.locator('.letter-tile:not(:disabled)').filter({has:page.getByText(char,{exact:true})}).first().click();await page.keyboard.press('ArrowUp');await expect(page.locator('#jump')).toBeEnabled();};
 await place('a',0);await expect(page.locator('[data-slot="0"]')).toHaveClass(/incorrect/);
 await place('b',1);await expect(page.locator('[data-slot="1"]')).toHaveClass(/incorrect/);
 await page.locator('[data-slot="0"]').click();await page.keyboard.press('ArrowDown');await expect(page.locator('[data-slot="0"]')).toHaveClass(/empty/);await expect(page.locator('[data-slot="1"] strong')).toHaveText('b');
 await page.locator('[data-slot="1"]').click();await page.keyboard.press('ArrowDown');
 for(const [i,char] of [...'balloon'].entries()){if(i===6){await page.locator('[data-slot="6"]').click();await page.locator('.letter-tile:not(:disabled)').filter({has:page.getByText(char,{exact:true})}).first().click();await page.keyboard.press('ArrowUp');}else{await place(char,i);await expect(page.locator('[data-slot="'+i+'"]')).toHaveClass(/correct/);}}
 await expect(page.getByText('Spelling unlocked!')).toBeVisible();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('word-runner-v1')).runs)).toEqual([]);
 await page.locator('#retry').click();await expect(page.locator('.spelling-slot.empty')).toHaveCount(7);
});
test('adventure countdown blocks answers, excludes preparation time and cancels on exit',async({page})=>{
 await page.goto('/');await page.locator('#start').click();await expect(page.locator('#countdown strong')).toHaveText('3');
 await page.keyboard.press('ArrowUp');await expect(page.locator('#points')).toHaveText('0');await expect(page.locator('#timer')).toHaveText('0.00');
 await expect(page.locator('#countdown strong')).toHaveText('2');await expect(page.locator('#timer')).toHaveText('0.00');
 await expect(page.locator('#countdown')).toHaveCount(0);expect(Number(await page.locator('#timer').textContent())).toBeLessThan(1);
 await page.locator('#exit').click();await page.locator('#start').click();await expect(page.locator('#countdown')).toBeVisible();await page.locator('#exit').click();await page.waitForTimeout(3200);await expect(page.locator('#start')).toBeVisible();await expect(page.locator('#countdown')).toHaveCount(0);
});
test('60-second challenge uses every stage, saves word scores separately, and resets on replay',async({page})=>{
 await page.clock.install();
 await page.addInitScript(()=>localStorage.setItem('word-runner-v1',JSON.stringify({players:[{id:'learner',name:'Learner'}],runs:[],stages:[{id:'one',name:'One',theme:'galaxy',questions:[{chinese:'星星',answer:'star',choices:['star','start','stair','store','storm']}]},{id:'two',name:'Two',theme:'jungle',questions:[{chinese:'樹',answer:'tree',choices:['tree','three','free','true','train']}]}]})));
 await page.goto('/');await page.locator('#timed-mode').click();await page.locator('#start').click();await expect(page.locator('#timer')).toHaveText('60.00');
 await page.clock.runFor(3100);await expect(page.locator('#countdown')).toHaveCount(0);await expect(page.locator('#progress')).toContainText('ALL 2 STAGES');
 const seen=[];
 for(let i=0;i<2;i++){
  const prompt=await page.locator('#chinese').textContent();seen.push(prompt);const answer=prompt==='星星'?'star':'tree';
  await page.locator('.word').filter({has:page.getByText(answer,{exact:true})}).click();await page.keyboard.press('ArrowUp');await page.clock.runFor(1150);
 }
 expect(new Set(seen).size).toBe(2);await expect(page.locator('#points')).toHaveText('2');
 await page.clock.fastForward(60000);await expect(page.locator('.results')).toContainText('Time’s up');await expect(page.locator('.result-stats strong')).toHaveText('2');await expect(page.locator('.rankings')).toContainText('2 words');
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('word-runner-v1')));expect(saved.runs).toEqual([]);expect(saved.timedRuns).toHaveLength(1);expect(saved.timedRuns[0].points).toBe(2);
 await page.clock.fastForward(1000);saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('word-runner-v1')));expect(saved.timedRuns).toHaveLength(1);
 await page.locator('#retry').click();await expect(page.locator('#timer')).toHaveText('60.00');await expect(page.locator('#points')).toHaveText('0');await page.locator('#exit').click();await page.clock.fastForward(65000);await expect(page.locator('#start')).toBeVisible();
 await page.locator('#view-ranks').click();await expect(page.locator('.rankings')).toContainText('Learner');
});
