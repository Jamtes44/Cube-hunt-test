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

// Raycaster y vectores auxiliares
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
const mouse = new THREE.Vector2();

// HUD para VR
const hudCanvas = document.createElement('canvas');
hudCanvas.width = 512;
hudCanvas.height = 256;
const hudCtx = hudCanvas.getContext('2d');
hudCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
hudCtx.fillStyle = 'white';
hudCtx.font = '48px Arial';
hudCtx.textAlign = 'center';
hudCtx.fillText('Cubos golpeados: 0', hudCanvas.width / 2, hudCanvas.height / 2);

const hudTexture = new THREE.CanvasTexture(hudCanvas);
const hudMaterial = new THREE.MeshBasicMaterial({ map: hudTexture, transparent: true });
const hudGeometry = new THREE.PlaneGeometry(2, 1);
const hudMesh = new THREE.Mesh(hudGeometry, hudMaterial);
scene.add(hudMesh); // añadir a la escena para que sea visible en VR y no-VR

// Añadir líneas de guía para el HUD
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const lineGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-1, -0.5, -1),
  new THREE.Vector3(1, -0.5, -1),
  new THREE.Vector3(1, 0.5, -1),
  new THREE.Vector3(-1, 0.5, -1),
  new THREE.Vector3(-1, -0.5, -1)
]);
const line = new THREE.Line(lineGeometry, lineMaterial);
hudMesh.add(line); // añadir líneas al HUD

let score = 0;

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

// Cubos voladores
const flyingCubes = [];
for (let i = 0; i < 3; i++) {
  const cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.set((i - 1) * 2, 1.6, -2); // posiciones -2, 0, 2 en x
  cube.initialPosition = cube.position.clone(); // guardar posición inicial
  cube.isShot = false;
  cube.offset = i * Math.PI / 3; // fase diferente para cada cubo
  flyingCubes.push(cube);
  scene.add(cube);
}

// Función volar para los cubos
function volar() {
  flyingCubes.forEach(cube => {
    if (!cube.isShot) {
      cube.position.x = Math.sin(Date.now() * 0.0005 + cube.offset) * 3;
      cube.position.y += Math.sin(Date.now() * 0.002) * 0.01;
      cube.rotation.z += 0.01;
    }
  });
}

// Función disparo (para el cubo específico)
function disparo(cube) {
  cube.isShot = true;
  cube.material.color.set(0xff0000);
  cube.material.transparent = true;
  cube.material.opacity = 1;
  cube.fadeStart = Date.now();
  score++; // incrementar score al disparar
  // Detener movimiento
  cube.position.x = cube.position.x;
  cube.position.y = cube.position.y;
  cube.rotation.z = cube.rotation.z;
}

// Función para manejar disparo con raycast (desktop)
function handleShoot(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(flyingCubes);
  if (intersects.length > 0) {
    const cube = intersects[0].object;
    if (!cube.isShot) {
      disparo(cube);
    }
  }
}

// Función para actualizar HUD
function updateHUD() {
  hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
  hudCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  hudCtx.fillRect(0, 0, hudCanvas.width, hudCanvas.height);
  hudCtx.fillStyle = 'white';
  hudCtx.font = '48px Arial';
  hudCtx.textAlign = 'center';
  hudCtx.fillText(`Cubos golpeados: ${score}`, hudCanvas.width / 2, hudCanvas.height / 2);
  hudTexture.needsUpdate = true;
}

// Animación
function animate() {
    volar();
    updateHUD(); // actualizar HUD cada frame
    // Fade out del cubo disparado
    flyingCubes.forEach(cube => {
      if (cube.isShot) {
        const elapsed = (Date.now() - cube.fadeStart) / 1000;
        const fadeDur = 2.0; // duración del fade en segundos
        if (elapsed < fadeDur) {
          cube.material.opacity = 1 - (elapsed / fadeDur);
        } else {
          // regenerar cubo
          cube.position.copy(cube.initialPosition);
          cube.material.color.set(0x00ff00);
          cube.material.opacity = 1;
          cube.material.transparent = false;
          cube.isShot = false;
          cube.fadeStart = null;
          scene.add(cube); // añadir de nuevo si fue removido
        }
      }
    });
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

// Evento de clic para disparar (desktop)
window.addEventListener('click', handleShoot);

// Para VR, añadir interacción con raycaster
renderer.xr.addEventListener('sessionstart', () => {
  // Añadir controllers para VR
  const controller1 = renderer.xr.getController(0);
  controller1.addEventListener('select', () => {
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    controller1.getWorldPosition(origin);
    controller1.getWorldDirection(direction);
    raycaster.set(origin, direction);
    const intersects = raycaster.intersectObjects(flyingCubes);
    if (intersects.length > 0) {
      const cube = intersects[0].object;
      if (!cube.isShot) {
        disparo(cube);
      }
    }
  });
  scene.add(controller1);

  const controller2 = renderer.xr.getController(1);
  controller2.addEventListener('select', () => {
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    controller2.getWorldPosition(origin);
    controller2.getWorldDirection(direction);
    raycaster.set(origin, direction);
    const intersects = raycaster.intersectObjects(flyingCubes);
    if (intersects.length > 0) {
      const cube = intersects[0].object;
      if (!cube.isShot) {
        disparo(cube);
      }
    }
  });
  scene.add(controller2);
});
