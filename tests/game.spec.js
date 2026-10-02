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

test('practice supports undo, repeated letters and long words without score or rankings',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('word-runner-v1',JSON.stringify({players:[{id:'learner',name:'Learner'}],runs:[],stages:[{id:'practice-test',name:'Spelling trail',theme:'jungle',questions:[{chinese:'樹',answer:'tree',choices:['tree','three','free','true','train']},{chinese:'森林',answer:'forest',choices:['forest','forget','frost','first','flower']}]}]})));
 await page.goto('/');await page.locator('#practice-mode').click();await expect(page.locator('#view-ranks')).toHaveCount(0);await page.locator('#start').click();await expect(page.locator('#chinese')).toHaveText('樹');await expect(page.locator('#timer')).toHaveCount(0);await expect(page.locator('#points')).toHaveCount(0);
 const collect=async(letter,expected,complete=false)=>{
  let tile=page.locator('.word:not(:disabled)').filter({has:page.getByText(letter,{exact:true})}).first();
  if(!await tile.count()){if(await page.locator('#letters-prev').isEnabled())await page.locator('#letters-prev').click();tile=page.locator('.word:not(:disabled)').filter({has:page.getByText(letter,{exact:true})}).first();if(!await tile.count())await page.locator('#letters-next').click();}
  await tile.click();await page.locator('#jump').click();await expect(page.locator('#sequence')).toHaveAttribute('data-spelling',expected);if(!complete)await expect(page.locator('#jump')).toBeEnabled();
 };
 await collect('e','e');await page.keyboard.press('ArrowDown');await expect(page.locator('#sequence')).toHaveAttribute('data-spelling','');await collect('r','r');await page.keyboard.press('Delete');await expect(page.locator('#sequence')).toHaveAttribute('data-spelling','');
 // Build a wrong order, then remove letters and try again.
 for(const [i,c] of [...'reet'].entries())await collect(c,'reet'.slice(0,i+1));await expect(page.locator('#feedback')).toContainText('Try another order');
 for(let i=0;i<4;i++)await page.getByRole('button',{name:'Remove last letter'}).click();await expect(page.locator('#sequence')).toHaveAttribute('data-spelling','');
 for(const [i,c] of [...'tree'].entries())await collect(c,'tree'.slice(0,i+1),i===3);await expect(page.locator('#chinese')).toHaveText('森林');await expect(page.locator('#sequence')).toHaveAttribute('data-spelling','');await expect(page.locator('.letter-pages')).toBeVisible();
 for(const [i,c] of [...'forest'].entries())await collect(c,'forest'.slice(0,i+1),i===5);
 await expect(page.getByText('Spelling unlocked!')).toBeVisible();await expect(page.locator('.results')).toContainText('WORDS PRACTICED');await expect(page.locator('.rankings')).toHaveCount(0);await expect(page.locator('.results')).not.toContainText('SPEED POINTS');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('word-runner-v1')).runs)).toEqual([]);
 await page.locator('#retry').click();await expect(page.locator('#chinese')).toHaveText('樹');await expect(page.locator('#sequence')).toHaveAttribute('data-spelling','');
});
