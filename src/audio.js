// Original procedural music and effects: no downloads or copyrighted recordings.
const TRACKS = {
 galaxy:{bpm:112,type:'triangle',melody:[76,83,80,83,74,81,78,81,72,79,76,79,74,81,78,86],bass:[52,50,48,50]},
 jungle:{bpm:128,type:'sine',melody:[72,76,79,76,74,77,81,77,76,79,83,79,74,77,79,71],bass:[48,50,52,47]},
 ocean:{bpm:96,type:'sine',melody:[74,78,81,85,73,78,81,85,71,76,80,83,73,76,80,85],bass:[50,49,47,49]}
};
const frequency=note=>440*2**((note-69)/12);
export class GameAudio {
 constructor(){
  this.context=null;this.voices=new Set();this.timer=null;this.track=null;this.step=0;this.nextNote=0;this.muted=false;this.volume=.6;this.available=!!(globalThis.AudioContext||globalThis.webkitAudioContext);
  try{const preferences=JSON.parse(localStorage.getItem('word-runner-audio'));this.muted=preferences?.muted===true;if(Number.isFinite(preferences?.volume))this.volume=Math.max(0,Math.min(1,preferences.volume));}catch{}
 }
 async unlock(){
  if(!this.available)return false;
  try{
   if(!this.context){const Context=globalThis.AudioContext||globalThis.webkitAudioContext;this.context=new Context();this.master=this.context.createGain();this.analyser=this.context.createAnalyser();this.analyser.fftSize=1024;this.master.connect(this.analyser);this.analyser.connect(this.context.destination);this.master.gain.value=this.muted?0:this.volume;}
   if(this.context.state==='suspended')await this.context.resume();return this.context.state==='running';
  }catch{return false;}
 }
 save(){try{localStorage.setItem('word-runner-audio',JSON.stringify({muted:this.muted,volume:this.volume}));}catch{}}
 setMuted(value){this.muted=value;this.updateGain();this.save();}
 setVolume(value){this.volume=Math.max(0,Math.min(1,Number(value)||0));this.updateGain();this.save();}
 updateGain(){if(this.context){const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(this.muted?0:this.volume,now,.015);}}
 tone(hz,start,duration,{type='sine',level=.1,endHz,bus='effect'}={}){
  const ctx=this.context;if(!ctx||ctx.state!=='running')return;
  const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(hz,start);if(endHz)oscillator.frequency.exponentialRampToValueAtTime(endHz,start+duration);
  gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(gain);gain.connect(this.master);
  const voice={oscillator,gain,bus};this.voices.add(voice);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.voices.delete(voice);};oscillator.start(start);oscillator.stop(start+duration+.02);
 }
 play(event){
  if(!this.context||this.context.state!=='running'||this.muted)return;
  const now=this.context.currentTime+.005;
  if(event==='letter')this.tone(660,now,.13,{type:'sine',endHz:880,level:.1});
  if(event==='undo')this.tone(450,now,.12,{type:'triangle',endHz:300,level:.1});
  if(event==='jump')this.tone(280,now,.17,{type:'triangle',endHz:700,level:.15});
  if(event==='correct'){[84,88,91].forEach((n,i)=>this.tone(frequency(n),now+i*.065,.25,{type:'sine',level:.15}));}
  if(event==='wrong'){this.tone(190,now,.26,{type:'sawtooth',endHz:80,level:.07});this.tone(145,now+.12,.22,{type:'triangle',endHz:70,level:.1});}
  if(event==='finish'){[72,76,79,84,79,84,88].forEach((n,i)=>this.tone(frequency(n),now+i*.12,i===6?.65:.3,{type:'triangle',level:.14}));}
 }
 startMusic(theme){
  if(!this.context||this.context.state!=='running')return;
  this.stopMusic();this.track=TRACKS[theme]||TRACKS.galaxy;this.theme=theme;this.step=0;this.nextNote=this.context.currentTime+.03;
  const schedule=()=>{
   if(!this.track||this.context.state!=='running')return;
   const beat=60/this.track.bpm;
   while(this.nextNote<this.context.currentTime+.15){const step=this.step%16,start=this.nextNote;
    this.tone(frequency(this.track.melody[step]),start,beat*.65,{type:this.track.type,level:.065,bus:'music'});
    if(step%4===0)this.tone(frequency(this.track.bass[step/4]),start,beat*1.6,{type:'triangle',level:.09,bus:'music'});
    if(step%2===0)this.tone(100,start,.09,{endHz:40,level:.075,bus:'music'});
    this.step++;this.nextNote+=beat/2;
   }
  };
  schedule();this.timer=setInterval(schedule,25);
 }
 stopMusic(){
  clearInterval(this.timer);this.timer=null;this.track=null;this.resumeTheme=null;
  if(!this.context)return;const now=this.context.currentTime;
  for(const voice of this.voices){if(voice.bus!=='music')continue;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(.0001,now,.015);try{voice.oscillator.stop(now+.06);}catch{}}
 }
 async handleVisibility(hidden){
  if(!this.context)return;
  if(hidden){const theme=this.track?this.theme:null;this.stopMusic();this.resumeTheme=theme;if(this.context.state==='running')await this.context.suspend();}
  else if(this.resumeTheme){const theme=this.resumeTheme;this.resumeTheme=null;if(await this.unlock())this.startMusic(theme);}
 }
}
export const audio=new GameAudio();
