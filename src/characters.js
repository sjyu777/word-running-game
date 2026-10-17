import * as THREE from 'three';

export const characters = [
 {id:'steve',name:'Steve',color:'#53cbd0',role:'The adventurer',pixels:['hhhhhhhh','hhhhhhhh','sshhhhss','sswsswss','ssbssbss','sssttsss','ssttttss','sssttsss'],palette:{h:'#493021',s:'#ba855f',w:'#fff5df',b:'#53529a',t:'#69452e'}},
 {id:'creeper',name:'Creeper',color:'#83ce57',role:'The silent sprinter',pixels:['gglgdggl','lgdgllgg','gddggddg','gddggddg','lggddggl','ggddddgg','ggddddgg','ggdggdgg'],palette:{g:'#68b646',l:'#91d766',d:'#203924'}},
 {id:'wolf',name:'Wolf',color:'#d9e3e7',role:'The loyal companion',pixels:['ddwwwwdd','dwwwwwwd','wwwwwwww','wbdwwdbw','wwwggwww','wwgddgww','wwwddwww','rrwwwwrr'],palette:{d:'#49515a',w:'#dce3e4',b:'#181e25',g:'#a0aab0',r:'#c94b47'}},
 {id:'skeleton',name:'Skeleton',color:'#e3ddc9',role:'The bone runner',pixels:['ggwwwwgg','gwwwwwwg','wwwwwwww','wddwwddw','wddwwddw','wwwddwww','gwdwwdwg','ggwwwwgg'],palette:{g:'#a6a595',w:'#e4dfcc',d:'#30383c'}}
];

export function portrait(character){
 return `<svg viewBox="0 0 8 8" class="character-portrait" aria-hidden="true" shape-rendering="crispEdges">${character.pixels.flatMap((row,y)=>[...row].map((color,x)=>`<rect x="${x}" y="${y}" width="1" height="1" fill="${character.palette[color]}"/>`)).join('')}</svg>`;
}

// All models face local +Z. Each owns its geometry/materials so switching can dispose them.
export function createCharacter(id){
 const root=new THREE.Group(),limbs=[],materials=new Map();let height=2.28;
 function block(parent,size,position,color){
  if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.85}));
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),materials.get(color));mesh.position.set(...position);parent.add(mesh);return mesh;
 }
 function joint(x,y,z,phase,amplitude=.6){const group=new THREE.Group();group.position.set(x,y,z);group.userData={phase,amplitude};root.add(group);limbs.push(group);return group;}
 if(id==='creeper'){
  block(root,[.57,.95,.46],[0,1.03,0],0x64af43);block(root,[.83,.78,.75],[0,1.89,0],0x76c84e);
  for(const x of [-1,1]){block(root,[.19,.19,.025],[x*.22,1.98,.388],0x1b3020);block(root,[.13,.26,.025],[x*.14,1.65,.388],0x1b3020);}
  block(root,[.15,.17,.025],[0,1.82,.388],0x1b3020);block(root,[.38,.17,.025],[0,1.73,.39],0x1b3020);
  for(let i=0;i<18;i++){const x=((i*7)%5-2)*.11,y=.72+(i%6)*.23;block(root,[.11,.13,.018],[x,y,-(y>1.5?.383:.238)],i%2?0x3d8735:0x99d968);}
  for(const x of [-1,1])for(const z of [-1,1]){const leg=joint(x*.29,.58,z*.28,x*z>0?0:Math.PI,.4);block(leg,[.32,.46,.38],[0,-.23,0],0x5da13c);block(leg,[.33,.12,.4],[0,-.48,.02],0x304e29);}
 }else if(id==='wolf'){
  height=1.85;
  block(root,[.62,.57,1.12],[0,1.02,-.12],0xbfc8ca);block(root,[.66,.61,.64],[0,1.33,.53],0xdce2e0);
  for(const x of [-1,1]){block(root,[.19,.33,.22],[x*.24,1.685,.41],0xc0c8c7);block(root,[.1,.19,.025],[x*.24,1.73,.53],0x69737a);block(root,[.09,.1,.025],[x*.21,1.4,.861],0x202831);}
  block(root,[.4,.26,.35],[0,1.19,.92],0xe7e9df);block(root,[.2,.13,.09],[0,1.26,1.12],0x283139);
  block(root,[.67,.14,.65],[0,1.04,.49],0xc64442);
  const tail=block(root,[.22,.24,.72],[0,1.15,-.94],0xc6cecd);tail.rotation.x=.45;
  block(root,[.23,.23,.2],[0,1.31,-1.23],0xe4e8df);
  for(const x of [-1,1])for(const z of [-1,1]){const leg=joint(x*.23,.85,z*.4-.08,x*z>0?0:Math.PI,.5);block(leg,[.19,.61,.23],[0,-.3,0],0xb8c2c4);block(leg,[.23,.18,.31],[0,-.64,.05],0xe1e5df);}
 }else if(id==='skeleton'){
  const bone=0xdad7c5,shade=0x969e96;
  block(root,[.68,.64,.58],[0,1.96,0],bone);
  for(const x of [-1,1]){block(root,[.18,.18,.025],[x*.18,2.02,.301],0x293136);block(root,[.1,.12,.025],[x*.14,1.71,.302],shade);}
  block(root,[.11,.12,.025],[0,1.86,.302],0x293136);block(root,[.48,.09,.4],[0,1.64,0],bone);
  block(root,[.13,.76,.15],[0,1.19,-.1],shade);
  for(const y of [1.02,1.2,1.38]){block(root,[.57,.09,.3],[0,y,0],bone);}
  block(root,[.52,.15,.28],[0,.85,0],bone);
  for(const x of [-1,1]){const leg=joint(x*.19,.82,0,x>0?0:Math.PI);block(leg,[.13,.64,.15],[0,-.32,0],bone);block(leg,[.19,.14,.3],[0,-.7,.06],shade);const arm=joint(x*.4,1.48,0,x>0?Math.PI:0);block(arm,[.12,.67,.14],[0,-.33,0],bone);block(arm,[.17,.18,.18],[0,-.69,0],bone);}
 }else{
  block(root,[.65,.76,.4],[0,1.2,0],0x29abb8);block(root,[.7,.66,.62],[0,1.95,0],0xb98563);
  block(root,[.72,.2,.64],[0,2.19,0],0x493024);block(root,[.72,.52,.07],[0,1.98,-.29],0x493024);
  for(const x of [-1,1]){block(root,[.18,.09,.025],[x*.19,1.99,.325],0xeeeade);block(root,[.075,.085,.03],[x*.16,1.99,.341],0x514a99);}
  block(root,[.3,.15,.03],[0,1.74,.328],0x66412e);block(root,[.14,.08,.04],[0,1.84,.33],0x9d6549);
  for(const x of [-1,1]){const leg=joint(x*.18,.83,0,x>0?0:Math.PI);block(leg,[.29,.66,.34],[0,-.33,0],0x494a9d);block(leg,[.3,.14,.4],[0,-.73,.03],0x394349);const arm=joint(x*.48,1.51,0,x>0?Math.PI:0);block(arm,[.28,.28,.34],[0,-.12,0],0x29abb8);block(arm,[.27,.48,.32],[0,-.48,0],0xb98563);}
 }
 return {root,height,animate(time){for(const limb of limbs)limb.rotation.x=Math.sin(time*12+limb.userData.phase)*limb.userData.amplitude;},dispose(){root.traverse(object=>object.geometry?.dispose());for(const material of materials.values())material.dispose();}};
}
