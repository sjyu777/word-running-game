import * as THREE from 'three';
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
 const suit=new THREE.MeshStandardMaterial({color:0xffae6c,roughness:.85});
 const skin=new THREE.MeshStandardMaterial({color:0xffdfb5,roughness:.9});
 const dark=new THREE.MeshStandardMaterial({color:0x213448,roughness:.8});
 const light=new THREE.MeshStandardMaterial({color:0xe9f6ff,roughness:.6});
 function block(parent,size,position,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...position);parent.add(mesh);return mesh;}
 block(actor,[.64,.75,.4],[0,1.15,0],suit);
 block(actor,[.7,.66,.62],[0,1.94,0],skin);
 block(actor,[.76,.17,.68],[0,2.2,0],suit);
 block(actor,[.76,.13,.68],[0,1.63,0],suit);
 block(actor,[.58,.22,.035],[0,1.98,.33],dark);
 block(actor,[.12,.08,.02],[-.16,2.01,.355],light);
 block(actor,[.12,.08,.02],[.16,2.01,.355],light);
 block(actor,[.22,.08,.025],[0,1.77,.325],dark);
 block(actor,[.2,.2,.025],[0,1.23,.215],light);
 const limbs=[];
 for(const x of [-1,1]){
  const leg=new THREE.Group();leg.position.set(x*.18,.8,0);actor.add(leg);
  block(leg,[.25,.61,.29],[0,-.3,0],suit);block(leg,[.28,.18,.4],[0,-.66,.06],dark);limbs.push(leg);
  const arm=new THREE.Group();arm.position.set(x*.47,1.45,0);actor.add(arm);
  block(arm,[.23,.49,.27],[0,-.22,0],suit);block(arm,[.23,.2,.27],[0,-.54,0],skin);limbs.push(arm);
 }
 const decorations=new THREE.Group();world.add(decorations);let theme='galaxy',lane=2,jumpAt=-10,running=false,layoutListener=null;
 function setTheme(value){theme=value;const colors={galaxy:[0x101a30,0x9180d6],jungle:[0x12362f,0x72c995],ocean:[0x08354a,0x67c9d4]};const [bg,accent]=colors[value];scene.background=new THREE.Color(bg);scene.fog=new THREE.Fog(bg,24,110);road.material.color.set(value==='jungle'?0x28483b:value==='ocean'?0x155064:0x253049);
 for(const child of [...decorations.children]){decorations.remove(child);child.geometry.dispose();child.material.dispose();}
 for(let i=0;i<65;i++){let geometry;if(value==='jungle')geometry=new THREE.ConeGeometry(1.3,4,7);else if(value==='ocean')geometry=new THREE.IcosahedronGeometry(.5+Math.random(),0);else geometry=new THREE.OctahedronGeometry(.25+Math.random()*.7);const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.15,roughness:.5}));mesh.position.set((i%2?1:-1)*(8+Math.random()*20),value==='jungle'?2:Math.random()*12,-Math.random()*120);decorations.add(mesh);}}
 setTheme(theme);
 const resize=()=>{const {width,height}=container.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;laneSpacing=laneWidth*Math.min(1,camera.aspect/.95);world.scale.x=laneSpacing/laneWidth;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);
 function project(x,y){const point=new THREE.Vector3(x,y,0).project(camera);return {x:(point.x+1)*renderer.domElement.clientWidth/2,y:(1-point.y)*renderer.domElement.clientHeight/2};}
 function layout(){const targets=Array.from({length:5},(_,i)=>project((i-2)*laneSpacing,3.98));const head=project(actor.position.x,actor.position.y+2.28);renderer.domElement.dataset.runnerHeadY=head.y.toFixed(2);renderer.domElement.dataset.runnerHeadX=head.x.toFixed(2);layoutListener?.(targets);}
 let previous=0;function frame(ms){const t=ms/1000,dt=Math.min(t-previous,.05);previous=t;actor.position.x=THREE.MathUtils.damp(actor.position.x,(lane-2)*laneSpacing,12,dt);actor.position.y=Math.max(0,Math.sin(Math.min(1,(t-jumpAt)/.48)*Math.PI)*1.7);if(running){for(let i=0;i<limbs.length;i++)limbs[i].rotation.x=Math.sin(t*12+(i<2?0:Math.PI))*(i%2?1:-1)*.6;for(const line of lines){line.position.z+=dt*13;if(line.position.z>8)line.position.z-=132;}for(const d of decorations.children){d.position.z+=dt*9;if(d.position.z>15)d.position.z=-115;}}renderer.render(scene,camera);layout();}
 renderer.setAnimationLoop(frame);
 return {setTheme,setLane:v=>lane=v,jump:()=>{actor.position.x=(lane-2)*laneSpacing;jumpAt=performance.now()/1000;},onTargetLayout:listener=>layoutListener=listener,setRunning:v=>running=v,setActor:color=>suit.color.set(color),setQuality:v=>{renderer.setPixelRatio(v==='low'?1:Math.min(devicePixelRatio,1.75));resize();},dispose:()=>{observer.disconnect();renderer.setAnimationLoop(null);renderer.dispose();}};
}
