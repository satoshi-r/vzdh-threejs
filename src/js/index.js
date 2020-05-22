/* examples:
https://threejs.org/examples/#webgl_materials_shaders_fresnel пузыри
https://threejs.org/examples/#webgl_postprocessing_dof глубина резкости
https://threejs.org/examples/#webgl_postprocessing_dof2
*/

import * as THREE from 'three';
import { FresnelShader } from 'three/examples/jsm/shaders/FresnelShader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

// tools

import Stats from 'three/examples/jsm/libs/stats.module';
import * as dat from 'dat.gui';

window.addEventListener('DOMContentLoaded', () => {
    let container;
    let camera, scene, renderer, stats;

    const spheres = [];

    let mouseX = 0;
    let mouseY = 0;

    const width = window.innerWidth;
    const height = window.innerHeight;

    let windowHalfX = width / 2;
    let windowHalfY = height / 2;

    const postprocessing = {};

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    init();
    animate();

    function init() {
        container = document.createElement('div');
        container.classList.add('main');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
        camera.position.z = 3200;

        // texture
        // текстуры должны быть 1:1 в таком порядке: [pos-x, neg-x, pos-y, neg-y, pos-z, neg-z]

        const urls = [
            'Back1.jpg',
            'Back2.jpg',
            'Back3.jpg',
            'Back4.jpg',
            'Back5.jpg',
            'Back6.jpg'
        ];

        // нарезка Серёгиной картинки на текстуры

        // const texture = new THREE.CubeTextureLoader()
        //     .setPath('static/textures/back/')
        //     .load(urls, (load) => createMesh(), null, (error) => console.error(error));

        // Серёгина картинка

        // const bgTexture = new THREE.TextureLoader().load('static/textures/back/Back.jpg', null, null, (error) => console.error(error)); 

        const skyUrls = [
            'px.jpg',
            'nx.jpg',
            'py.jpg',
            'ny.jpg',
            'pz.jpg',
            'nz.jpg'
        ];

        const skyTexture = new THREE.CubeTextureLoader()
            .setPath('static/textures/sky/')
            .load(skyUrls, (load) => createMesh(), null, (error) => console.error(error));

        scene = new THREE.Scene();
        scene.background = skyTexture;

        // mesh

        const geometry = new THREE.SphereBufferGeometry(100, 64, 32);

        const shader = FresnelShader;
        const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

        uniforms['tCube'].value = skyTexture;

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        });

        const createMesh = () => {
            for (var i = 0; i < 500; i++) {

                const mesh = new THREE.Mesh(geometry, material);

                mesh.position.x = Math.random() * 10000 - 5000;
                mesh.position.y = Math.random() * 10000 - 5000;
                mesh.position.z = Math.random() * 10000 - 5000;

                mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 3 + 1;

                scene.add(mesh);

                spheres.push(mesh);

            }
        }

        

        // light

        scene.add(new THREE.AmbientLight(0x222222));

        var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(2, 1.2, 10).normalize();
        scene.add(directionalLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(-2, 1.2, -10).normalize();
        scene.add(directionalLight);

        // renderer

        renderer = new THREE.WebGLRenderer({
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        initPostprocessing();

        // init tools

        stats = new Stats();
        container.appendChild(stats.dom);

        const effectController = {
            focus: 3000,
            aperture: 0.1,
            maxblur: 0.01,
        };

        const matChanger = () => {
            postprocessing.bokeh.uniforms["focus"].value = effectController.focus;
            postprocessing.bokeh.uniforms["aperture"].value = effectController.aperture * 0.00001;
            postprocessing.bokeh.uniforms["maxblur"].value = effectController.maxblur;
        };

        const gui = new dat.GUI();
        gui.add(effectController, "focus", 10.0, 3000.0, 10).onChange(matChanger);
        gui.add(effectController, "aperture", 0, 10, 0.1).onChange(matChanger);
        gui.add(effectController, "maxblur", 0.0, 3.0, 0.025).onChange(matChanger);
        gui.open();

        matChanger();

        //

        window.addEventListener('resize', onWindowResize, false);

    }

    function initPostprocessing() {

        const renderPass = new RenderPass(scene, camera);

        const bokehPass = new BokehPass(scene, camera, {
            focus: 1.0,
            aperture: 0.025,
            maxblur: 1.0,

            width: width,
            height: height
        });

        const composer = new EffectComposer(renderer);

        composer.addPass(renderPass);
        composer.addPass(bokehPass);

        postprocessing.composer = composer;
        postprocessing.bokeh = bokehPass;

    }

    function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        postprocessing.composer.setSize(window.innerWidth, window.innerHeight);

    }

    function onDocumentMouseMove(event) {

        mouseX = (event.clientX - windowHalfX) * 10;
        mouseY = (event.clientY - windowHalfY) * 10;

    }

    //

    function animate() {

        requestAnimationFrame(animate);

        stats.update();
        render();

    }

    function render() {

        let timer = 0.0001 * Date.now();

        camera.position.x += (mouseX - camera.position.x) * .05;
        camera.position.y += (-mouseY - camera.position.y) * .05;

        camera.lookAt(scene.position);

        for (let i = 0, il = spheres.length; i < il; i++) {

            const sphere = spheres[i];

            sphere.position.x = 5000 * Math.cos(timer + i);
            sphere.position.y = 5000 * Math.sin(timer + i * 1.1);

        }

        renderer.render(scene, camera);
        postprocessing.composer.render(0.1);

    }

});