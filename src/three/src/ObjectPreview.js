import * as THREE from "./three.module.min.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { DRACOLoader } from './DRACOLoader.js';
import { OrbitControls } from "./OrbitControls.js";
import { EffectComposer } from "./EffectComposer.js";
import { RenderPass } from "./RenderPass.js";
import { ShaderPass } from "./ShaderPass.js";
import { FXAAShader } from "./FXAAShader.js";

import { CustomOutlinePass } from "./CustomOutlinePass.js";
import FindSurfaces from "./FindSurfaces.js";

// Init scene
class ObjectPreviewer {
  constructor(modelName, scale, canvasNum = 0, rotationSpeed = [0.002,0,0], rotationOffset = [0,0,0], positionOffset = [0,0,0] ){
    let canvasElement = document.querySelectorAll("canvas")[canvasNum];
    let sceneWidth = canvasElement.getBoundingClientRect().width, sceneHeight=canvasElement.getBoundingClientRect().height;
    let onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const camera = new THREE.PerspectiveCamera(
      70,
      sceneWidth / sceneHeight,
      0.1,
      1000
    );
    camera.position.set(10, 2.5, 4);
    
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      alpha: true
    });
    renderer.setSize(sceneWidth, sceneHeight);
    renderer.setClearColor( 0x000000, 0 ); 
    renderer.setPixelRatio( window.devicePixelRatio );
    
    // Set up post processing
    // Create a render target that holds a depthTexture so we can use it in the outline pass
    // See: https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderTarget.depthBuffer
    const depthTexture = new THREE.DepthTexture();
    const renderTarget = new THREE.WebGLRenderTarget(
      sceneWidth,
      sceneHeight,
      {
        depthTexture: depthTexture,
        depthBuffer: true,
      }
    );
    
    // Initial render pass.
    const composer = new EffectComposer(renderer, renderTarget);
    const pass = new RenderPass(scene, camera);
    composer.addPass(pass);
    
    // Outline pass.
    const customOutline = new CustomOutlinePass(
      new THREE.Vector2(sceneWidth, sceneHeight),
      scene,
      camera
    );
    composer.addPass(customOutline);
    
    // Antialias pass.
    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms["resolution"].value.set(
      1 / sceneWidth,
      1 / sceneHeight
    );
    composer.addPass(effectFXAA);
    
    const surfaceFinder = new FindSurfaces();
    // Load model
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( './src/libs/' );
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load(modelName, function(gltf) {
      gltf.scene.scale.set(scale, scale, scale); 
      scene.add(gltf.scene);
      surfaceFinder.surfaceId = 0;
    
      scene.traverse((node) => {
        if (node.type == "Mesh") {
          const colorsTypedArray = surfaceFinder.getSurfaceIdAttribute(node);
          node.geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colorsTypedArray, 4)
          );
        }     
      });
    
      customOutline.updateMaxSurfaceId(surfaceFinder.surfaceId + 1);
      gltf.scene.rotation.x = rotationOffset[0];
      gltf.scene.rotation.y = rotationOffset[1];
      gltf.scene.rotation.z = rotationOffset[2];
      gltf.scene.position.x = positionOffset[0];
      gltf.scene.position.y = positionOffset[1];
      gltf.scene.position.z = positionOffset[2]; 
    });
    
    // Set up orbital camera controls.
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
    controls.enabled = false;
    
    // Render loop
    function update() {
      requestAnimationFrame(update);
      //Mobile might render slower, so double the speed on them
      if(onMobile){
        scene.rotation.x += rotationSpeed[0]*2;
        scene.rotation.y += rotationSpeed[1]*2;
        scene.rotation.z += rotationSpeed[2]*2;
      }
      else{
        scene.rotation.x += rotationSpeed[0];
        scene.rotation.y += rotationSpeed[1];
        scene.rotation.z += rotationSpeed[2];
      }
      composer.render();
    }
    scene.rotation.y = Math.random()*Math.PI*2
    update();
    
    function onWindowResize() {
      sceneWidth  = canvasElement.getBoundingClientRect().width;
      sceneHeight = canvasElement.getBoundingClientRect().height;
      camera.aspect = sceneWidth / sceneHeight;
      camera.updateProjectionMatrix();
    
      renderer.setSize(sceneWidth, sceneHeight);
      composer.setSize(sceneWidth, sceneHeight);
      effectFXAA.setSize(sceneWidth, sceneHeight);
      customOutline.setSize(sceneWidth, sceneHeight);
      effectFXAA.uniforms["resolution"].value.set(
        1 / sceneWidth,
        1 / sceneHeight
      );
    }
    window.addEventListener("resize", onWindowResize, false);
    
  }
}

export { ObjectPreviewer };