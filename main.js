// main.js - Proyecto VR Básico con Skybox
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { VRButton } from "https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js";
import { OBJLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/OBJLoader.js";

// Escena, cámara, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 2);
camera.lookAt(new THREE.Vector3(0, 0, -3));

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

// Añadir VRButton
document.body.appendChild(VRButton.createButton(renderer));

// Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Skybox usando las texturas UV
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('uv/');
const cubeTexture = cubeTextureLoader.load([
    'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'
]);
scene.background = cubeTexture;

// Cargar modelo OBJ (bosque)
const loader = new OBJLoader();
loader.load(
  'modelos/bosque.obj',
  (obj) => {
    obj.position.set(0, -3, -4);
    obj.scale.set(1.5, 1.5, 1.5);
    obj.rotation.y = Math.PI / 2;
    obj.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      }
    });
    scene.add(obj);
  },
  undefined,
  (err) => console.warn('Error cargando OBJ:', err)
);

// Cubo volador
const cubeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2  );
const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const flyingCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
flyingCube.position.set(0, 2, -2);
scene.add(flyingCube);

// Función volar para el cubo
function volar() {
  flyingCube.position.x = Math.sin(Date.now() * 0.001) * 10;
  flyingCube.position.y += Math.sin(Date.now() * 0.005) * 0.01;
  flyingCube.rotation.z += 0.02;
}

// Animación
function animate() {
    volar();
    renderer.render(scene, camera);
}

// Loop de animación
renderer.setAnimationLoop(animate);

// Redimensionar
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
