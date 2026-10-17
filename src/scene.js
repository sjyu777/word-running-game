import * as THREE from 'three';
import {createCharacter} from './characters.js';
export function createScene(container){
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(52,1,.1,180);camera.position.set(0,7,15);camera.lookAt(0,1,-12);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));container.append(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xffffff,0x243c54,2.5));const sun=new THREE.DirectionalLight(0xffffff,3);sun.position.set(5,12,8);scene.add(sun);
 const world=new THREE.Group();scene.add(world);const laneWidth=2.35;let laneSpacing=laneWidth;
 const road=new THREE.Mesh(new THREE.PlaneGeometry(12,180),new THREE.MeshStandardMaterial({color:0x213449,roughness:.7}));road.rotation.x=-Math.PI/2;road.position.z=-60;world.add(road);
 const lines=[];for(let x=-2;x<=3;x++){const line=new THREE.Mesh(new THREE.BoxGeometry(.035,.025,180),new THREE.MeshBasicMaterial({color:0x7298ac}));line.position.set((x-.5)*laneWidth,.025,-60);world.add(line);}
 for(let i=0;i<22;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(11.8,.025,.07),new THREE.MeshBasicMaterial({color:0x345468}));m.position.set(0,.04,-i*6);world.add(m);lines.push(m);}
 // A voxel runner built entirely from cubes, with limbs rotating at their joints.
 const actor=new THREE.Group();scene.add(actor);
 // The model faces local +Z; turn it toward the road ahead (-Z), away from the camera.
 actor.rotation.y=Math.PI;
 let character;
 function setActor(id){if(character){actor.remove(character.root);character.dispose();}character=createCharacter(id);actor.add(character.root);renderer.domElement.dataset.character=id;}
 setActor('steve');
 const decorations=new THREE.Group();world.add(decorations);let theme='galaxy',lane=2,jumpAt=-10,running=false,layoutListener=null;
 function setTheme(value){theme=value;const colors={galaxy:[0x101a30,0x9180d6],jungle:[0x12362f,0x72c995],ocean:[0x08354a,0x67c9d4]};const [bg,accent]=colors[value];scene.background=new THREE.Color(bg);scene.fog=new THREE.Fog(bg,24,110);road.material.color.set(value==='jungle'?0x28483b:value==='ocean'?0x155064:0x253049);
 for(const child of [...decorations.children]){decorations.remove(child);child.geometry.dispose();child.material.dispose();}
 for(let i=0;i<65;i++){let geometry;if(value==='jungle')geometry=new THREE.ConeGeometry(1.3,4,7);else if(value==='ocean')geometry=new THREE.IcosahedronGeometry(.5+Math.random(),0);else geometry=new THREE.OctahedronGeometry(.25+Math.random()*.7);const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.15,roughness:.5}));mesh.position.set((i%2?1:-1)*(8+Math.random()*20),value==='jungle'?2:Math.random()*12,-Math.random()*120);decorations.add(mesh);}}
 setTheme(theme);
 const resize=()=>{const {width,height}=container.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;laneSpacing=laneWidth*Math.min(1,camera.aspect/.95);world.scale.x=laneSpacing/laneWidth;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);
 function project(x,y){const point=new THREE.Vector3(x,y,0).project(camera);return {x:(point.x+1)*renderer.domElement.clientWidth/2,y:(1-point.y)*renderer.domElement.clientHeight/2};}
 function layout(){const targets=Array.from({length:5},(_,i)=>project((i-2)*laneSpacing,character.height+1.7));const head=project(actor.position.x,actor.position.y+character.height);renderer.domElement.dataset.runnerHeadY=head.y.toFixed(2);renderer.domElement.dataset.runnerHeadX=head.x.toFixed(2);layoutListener?.(targets);}
 let speedMultiplier=1,animationTime=0;
 let previous=0;function frame(ms){const t=ms/1000,dt=Math.min(t-previous,.05);previous=t;actor.position.x=THREE.MathUtils.damp(actor.position.x,(lane-2)*laneSpacing,12,dt);actor.position.y=Math.max(0,Math.sin(Math.min(1,(t-jumpAt)/.48)*Math.PI)*1.7);if(running){const motionDt=dt*speedMultiplier;animationTime+=motionDt;character.animate(animationTime);for(const line of lines){line.position.z+=motionDt*13;if(line.position.z>8)line.position.z-=132;}for(const d of decorations.children){d.position.z+=motionDt*9;if(d.position.z>15)d.position.z=-115;}}renderer.render(scene,camera);layout();}
 renderer.setAnimationLoop(frame);
 return {setSpeed:value=>{if(Number.isFinite(value))speedMultiplier=Math.max(0,Math.min(5,value))/2.5;},setTheme,refreshLayout:layout,setLane:v=>lane=v,jump:()=>{actor.position.x=(lane-2)*laneSpacing;jumpAt=performance.now()/1000;},onTargetLayout:listener=>layoutListener=listener,setRunning:v=>running=v,setActor,setPreview:value=>{actor.rotation.y=value?.35:Math.PI;},setQuality:v=>{renderer.setPixelRatio(v==='low'?1:Math.min(devicePixelRatio,1.75));resize();},dispose:()=>{observer.disconnect();renderer.setAnimationLoop(null);character.dispose();renderer.dispose();}};
}
