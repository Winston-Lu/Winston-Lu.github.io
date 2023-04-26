import * as THREE from "./three.module.min.js";
import { EffectComposer } from "./EffectComposer.js";
import { RenderPass } from "./RenderPass.js";
import { TexturePass } from "./TexturePass.js";
import { UnrealBloomPass } from "./UnrealBloomPass.js";
"use strict";

(function() {
    let scene, camera, renderer, cloudParticles = [], composer;
    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60,window.innerWidth / window.innerHeight,1,1000);
        camera.position.z = 1;
        camera.rotation.x = 1.16;
        camera.rotation.y = -0.12;
        camera.rotation.z = 0.27;

        let ambient = new THREE.AmbientLight(0x555555);
        scene.add(ambient);

        let directionalLight = new THREE.DirectionalLight(0xff8c19);
        directionalLight.position.set(0,0,1);
        scene.add(directionalLight);

        let orangeLight = new THREE.PointLight(0xcc6600,50,450,1.7);
        orangeLight.position.set(200,300,100);
        scene.add(orangeLight);
        let redLight = new THREE.PointLight(0xd8547e,50,450,1.7);
        redLight.position.set(100,300,100);
        scene.add(redLight);
        let blueLight = new THREE.PointLight(0x3677ac,50,450,1.7);
        blueLight.position.set(300,300,200);
        scene.add(blueLight);

        renderer = new THREE.WebGLRenderer({canvas: document.querySelector("canvas")});
        renderer.setSize(window.innerWidth,window.innerHeight);
        scene.fog = new THREE.FogExp2(0x03544e, 0.001);
        renderer.setClearColor(scene.fog.color);
        document.body.appendChild(renderer.domElement);

        let loader = new THREE.TextureLoader();
        loader.load("/src/three/models/smoke.png", function(texture){
            let cloudGeo = new THREE.PlaneBufferGeometry(500,500);
            let cloudMaterial = new THREE.MeshLambertMaterial({
                map:texture,
                transparent: true
            });

            for(let p=0; p<50; p++) {
                let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
                cloud.position.set(
                    Math.random()*800 -400,
                    500,
                    Math.random()*500-600
                );
                cloud.rotation.x = 1.16;
                cloud.rotation.y = -0.12;
                cloud.rotation.z = Math.random()*2*Math.PI;
                cloud.material.opacity = 0.55;
                cloudParticles.push(cloud);
                scene.add(cloud);
            }
        });
        loader.load("/src/three/models/stars.jpg", function(texture){
            const textureEffect = new TexturePass();
            textureEffect.map = texture;
            textureEffect.opacity = 0.1;

            const bloomPass = new UnrealBloomPass(new THREE.Vector2( window.innerWidth, window.innerHeight ), 0, 0, 0);
            bloomPass.strength = 0.25;
            bloomPass.threshold = 0.1;
            bloomPass.radius = 2;

            composer = new EffectComposer(renderer);
            composer.addPass(new RenderPass(scene, camera));
            composer.addPass(textureEffect);
            composer.addPass(bloomPass);
            
            window.addEventListener("resize", onWindowResize, false);
            animate();
        });
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        cloudParticles.forEach(p => {
            p.rotation.z -=0.001;
        });
        composer.render(0.1);
        requestAnimationFrame(animate);
    }

    let lastPos = 0;
    window.addEventListener("scroll", function() {
        let currentScrollPos = window.pageYOffset;
        let offset = (currentScrollPos > lastPos) ? 1.2 : -1.2;
        cloudParticles.forEach(p => {
            p.position.y -= offset;
            p.position.y = Math.max(Math.min(p.position.y, 500),200)
        });
        lastPos = currentScrollPos;
    })

    

    init();

})();