import * as THREE from 'three';
import {
    FresnelShader
} from 'three/examples/jsm/shaders/FresnelShader';

// tools

import Stats from 'three/examples/jsm/libs/stats.module';
import * as dat from 'dat.gui';

window.addEventListener('DOMContentLoaded', () => {
    let container;
    let camera, scene, renderer, stats;

    const spheres = [];

    let mouseX = 0;
    let mouseY = 0;

    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', onDocumentMouseMove, false);

    init();
    animate();

    function init() {
        container = document.createElement('div');
        container.classList.add('main');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100000);
        camera.position.z = 5200;

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

        const texture = new THREE.CubeTextureLoader()
            .setPath('static/textures/back/')
            .load(urls, (load) => createMesh(), null, (error) => console.error(error));

        const bgTexture = new THREE.TextureLoader().load('static/textures/back/Back.jpg', null, null, (error) => console.error(error));

        scene = new THREE.Scene();
        scene.background = bgTexture;

        // mesh

        const geometry = new THREE.SphereBufferGeometry(100, 64, 32);

        const shader = FresnelShader;
        const uniforms = THREE.UniformsUtils.clone(shader.uniforms);

        uniforms['tCube'].value = texture;

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

        const light = new THREE.DirectionalLight(0x404040, 1); // soft white light
        light.position.set(-1, 2, 4);
        scene.add(light);

        const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x999999, 1);
        scene.add(hemiLight);
        // renderer

        renderer = new THREE.WebGLRenderer({
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        stats = new Stats();
        container.appendChild(stats.dom);

        //

        window.addEventListener('resize', onWindowResize, false);

    }

    function onWindowResize() {

        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

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

    }

});