import * as THREE from "./three.module.min.js";
import { UnrealBloomPass } from './UnrealBloomPass.js';
import { EffectComposer } from './EffectComposer.js';
import { RenderPass } from './RenderPass.js';
import { ShaderPass } from './ShaderPass.js';
//
const fragShader = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
varying vec2 vUv;
void main() {
  gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
}`;
const vertShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;
const materials = {};
let darkMaterial;

//----------------------------------------------------------------- BASIC parameters
let onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
let canvasElement = document.querySelectorAll("canvas")[0];
let renderer = new THREE.WebGLRenderer({
  canvas: canvasElement,
  antialias:true
});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );

if (window.innerWidth > 800) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.needsUpdate = true;
};

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
};

let camera = new THREE.PerspectiveCamera( Math.sqrt(Math.min( window.innerWidth, window.innerHeight )), window.innerWidth / window.innerHeight, 0.1, 300 );

camera.position.set(0, 12, 17);

let scene = new THREE.Scene();
let city = new THREE.Object3D();
let smoke = new THREE.Object3D();
let town = new THREE.Object3D();

//Fog background
let setcolor = onMobile ? 0x020A12 : 0x040913;

scene.background = new THREE.Color(setcolor);
scene.fog = new THREE.Fog(setcolor, 3, 22);
//returns random range from (-num, num)
function mathRandom(num = 8) {
  let numValue = - Math.random() * num + Math.random() * num;
  return numValue;
};

//City Generation
let gridSize = Math.max(window.innerWidth,window.innerHeight) / 60;

//Calculate matrix offset for each window for performance optimizations with thousands of window elements
const generateMatrixWindow = function () {
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  return function ( x,y,z,rotX,rotY,rotZ, matrix ) {
    position.x = x;
    position.y = y;
    position.z = z
    rotation.x = rotX;
    rotation.y = rotY;
    rotation.z = rotZ;
    quaternion.setFromEuler( rotation );
    scale.x = scale.y = scale.z = 1;
    matrix.compose( position, quaternion, scale );
  };
}();
const generateMatrixBuilding = function () {
  const position = new THREE.Vector3();
  const rotation = new THREE.Euler();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  return function ( x,y,z,height, matrix ) {
    position.x = x;
    position.y = y;
    position.z = z
    rotation.x = 0;
    rotation.y = 0;
    rotation.z = 0;
    quaternion.setFromEuler( rotation );
    scale.x = scale.z = 0.9;
    scale.y = height;
    matrix.compose( position, quaternion, scale );
  };
}();
//build buildings
let composer;
let bloomComposer;
const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );

function init() {
  //create materials
  let buildingMaterial = new THREE.MeshStandardMaterial({
    color:0x060404,
    wireframe:false,
    flatShading:true,
    side:THREE.FrontSide,
    roughness:0.8});
  darkMaterial = buildingMaterial; //for bloom
  const windowMaterial = new THREE.MeshStandardMaterial( {
    color: 0x332215, 
    emissive: 0x332215,
    side: THREE.FrontSide
  });

  //scene generation constants
  let buildingChance = onMobile ? 0.6 : 0.9; 
  let numWindowSpawn = onMobile ? 30  : 50;
 
  //instancing for performance 
  const windowGeometry = new THREE.PlaneGeometry( 0.1, 0.1 );
  const windowObject = new THREE.InstancedMesh( windowGeometry, windowMaterial , gridSize*gridSize*12*numWindowSpawn); //max number of windows
  windowObject.layers.enable( BLOOM_SCENE );

  const buildingGeometry = new THREE.BoxGeometry(1,1,1);
  const buildingObject = new THREE.InstancedMesh( buildingGeometry, buildingMaterial , gridSize*gridSize); //max number of buildings
  buildingObject.layers.enable( ENTIRE_SCENE );
  //instancing transformation matrix
  const matrix = new THREE.Matrix4();

  let numWindows = 0, numBuildings = 0; //counters

  //generate city
  for (let i = 0; i<gridSize*gridSize; i++) {
    if(Math.random() > buildingChance) continue; //ocasionally skip some buildings

    //generate building properties
    let height = 1+Math.abs(mathRandom(12));
    let posX = i / gridSize - gridSize / 2;
    let posZ = i % gridSize - gridSize / 2;

    //generate building
    generateMatrixBuilding(posX,0,posZ, height, matrix);
    buildingObject.setMatrixAt(numBuildings++, matrix);  

    //create windows
    for(let j=0; j<height*numWindowSpawn; j++){
      let side = Math.floor(Math.random()*4);
      let randomYPos = Math.floor(Math.random() * 4*height) / (8) - 0.05
      let randomOffset = Math.floor(Math.random()*5)/5*0.7 - 0.3;
      //random size for building
      switch(side){
        case 0:
          generateMatrixWindow(posX + randomOffset, randomYPos, posZ+0.451, 0, 0, 0, matrix);
          break;
        case 1:
          generateMatrixWindow(posX+0.451,randomYPos,posZ + randomOffset, 0, Math.PI/2, 0, matrix);
          break;
        case 2:
          generateMatrixWindow(posX-0.451,randomYPos,posZ + randomOffset, 0, -Math.PI/2, 0, matrix);
          break;
        case 3:
          generateMatrixWindow(posX + randomOffset, randomYPos, posZ-0.451, 0, Math.PI, 0, matrix);
          break;
      }
      windowObject.setMatrixAt(numWindows, matrix);
      let tempChance = Math.random();
      if(tempChance > 0.5){
        //warm
        let shift = Math.random()*0.3;
        windowObject.setColorAt(numWindows++, new THREE.Color(1, 1-0.7*shift, 1-(1.5*shift)))
      }else{
        //cool 
        let shift = Math.random()*0.15;
        windowObject.setColorAt(numWindows++, new THREE.Color(1-(2*shift), 1-shift, 1))
      }
    }  
  };
  city.add(windowObject);
  city.add(buildingObject);

  //Bloom effect
  const renderScene = new RenderPass( scene, camera );
  const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
  bloomPass.threshold = 0.05;
  bloomPass.strength = 3;
  bloomPass.radius = 0.8;

  bloomComposer = new EffectComposer( renderer );
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass( renderScene );
  // bloomComposer.addPass( bloomPass ); //too much of a performance hit

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial( {
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture }
      },
      vertexShader: vertShader,
      fragmentShader: fragShader,
      defines: {}
    } ), 'baseTexture'
  );
  finalPass.needsSwap = true;

  composer = new EffectComposer( renderer );
  composer.addPass( renderScene );
  composer.addPass( finalPass );

  //Random particles
  let gmaterial = new THREE.MeshToonMaterial({color:0xFFFF00, side:THREE.DoubleSide});
  let gparticular = new THREE.CircleGeometry(0.01, 3);
  let aparticular = 5;
  
  for (let h = 1; h<300; h++) {
    let particular = new THREE.Mesh(gparticular, gmaterial);
    particular.position.set(mathRandom(aparticular), mathRandom(aparticular),mathRandom(aparticular));
    particular.rotation.set(mathRandom(),mathRandom(),mathRandom());
    smoke.add(particular);
  };
  
  let pmaterial = new THREE.MeshPhongMaterial({
    color:0x000000,
    side:THREE.FrontSide,
    transparent:true});
  let pgeometry = new THREE.PlaneGeometry(60,60);
  let pelement = new THREE.Mesh(pgeometry, pmaterial);
  pelement.rotation.x = -90 * Math.PI / 180;
  pelement.position.y = -0.001;
  pelement.receiveShadow = true;

  city.add(pelement);
};

//Mouse Panning
let mouse = new THREE.Vector2(), INTERSECTED;

function onMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};
function onDocumentTouchStart( event ) {
  if ( event.touches.length == 1 ) {
    event.preventDefault();
    mouse.x = event.touches[ 0 ].pageX -  window.innerWidth / 2;
    mouse.y = event.touches[ 0 ].pageY - window.innerHeight / 2;
  };
};
function onDocumentTouchMove( event ) {
  if ( event.touches.length == 1 ) {
    event.preventDefault();
    mouse.x = event.touches[ 0 ].pageX -  window.innerWidth / 2;
    mouse.y = event.touches[ 0 ].pageY - window.innerHeight / 2;
  }
}
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('touchstart', onDocumentTouchStart, false );
window.addEventListener('touchmove', onDocumentTouchMove, false );

//Scene elements
let ambientLight = new THREE.AmbientLight(0xFFFFFF, 4);
let lightFront = new THREE.SpotLight(0x3A3353, 20, 10000); //with bloom: 0x1A1313

lightFront.rotation.x = 45 * Math.PI / 180;
lightFront.rotation.z = -45 * Math.PI / 180;
lightFront.position.set(5, 5, 5);
lightFront.castShadow = true;
lightFront.shadow.mapSize.width = 6000;
lightFront.shadow.mapSize.height = lightFront.shadow.mapSize.width;
lightFront.penumbra = 0.1;

smoke.position.y = 2;

scene.add(ambientLight);
city.add(lightFront);
scene.add(city);
city.add(smoke);
city.add(town);

// Base Grid
let gridHelper = new THREE.GridHelper( 60, 120, 0x3ebbed, 0x3ebbed);
city.add( gridHelper );

// Car Lines
let createCars = function(cScale = 2, cColor = 0xFFFF00) {
  let cMat = new THREE.MeshToonMaterial({color:cColor, side:THREE.DoubleSide});
  let cGeo = new THREE.BoxGeometry(1, cScale/40, cScale/40);
  let cElem = new THREE.Mesh(cGeo, cMat);
  let randomPos = Math.floor(Math.random()*gridSize*2) - gridSize + 0.2;
  let randomDirection = Math.random() < 0.5;
  if (randomDirection) {
    cElem.position.x = -gridSize;
    cElem.position.z = randomPos + 0.2;

    TweenMax.to(cElem.position, 3, {x:gridSize, repeat:-1, yoyo:true, delay:mathRandom(3)});
  } else {
    cElem.position.x = randomPos;
    cElem.position.z = -gridSize;
    cElem.rotation.y = 90 * Math.PI / 180;
  
    TweenMax.to(cElem.position, 5, {z:gridSize, repeat:-1, yoyo:true, delay:mathRandom(3), ease:Power1.easeInOut});
  };
  cElem.receiveShadow = true;
  cElem.castShadow = true;
  cElem.position.y = Math.random()*5;
  city.add(cElem);
};

//main animation loop
let uSpeed = 0.0001;
let animate = function() {
  requestAnimationFrame(animate);
  let distance = Math.max(Math.min(((mouse.x * 8) - camera.rotation.y) * uSpeed, 0.001),-0.001); //clamp speed for mobile
  if(distance == 0) distance = 0.0005
  city.rotation.y -= distance;
  let vertSpeed = (-(mouse.y * 2) - camera.rotation.x) * uSpeed;
  city.rotation.x -=  Math.min(uSpeed, Math.max(vertSpeed, -uSpeed));//slower up/down panning

  //prevent clipping past plane and flipping upside down (if vertical panning enabled)
  city.rotation.x = Math.max(-0.15,city.rotation.x);
  city.rotation.x = Math.min(0.15,city.rotation.x);
  
  smoke.rotation.y += 0.01;
  smoke.rotation.x += 0.01;
  
  camera.lookAt(city.position);
  renderer.render( scene, camera );  

  scene.traverse( darkenNonBloomed );
  bloomComposer.render();
  scene.traverse( restoreMaterial );
  composer.render();
}

function darkenNonBloomed( obj ) {
  if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
    materials[ obj.uuid ] = obj.material;
    obj.material = darkMaterial;
  }
}
function restoreMaterial( obj ) {
  if ( materials[ obj.uuid ] ) {
    obj.material = materials[ obj.uuid ];
    delete materials[ obj.uuid ];
  }
}

init();
for(let i=0;i<100;i++) 
  createCars(0.1,0xaaaaaa);
animate();