import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/webxr/VRButton.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Controladores VR
let controller1, controller2;

// Variables del juego
let greenCubes = [];
let currentRound = 1;
let cubesPerRound = 5;
let cubesShot = 0;
let score = 0;

let lives = 3;
let highScore = localStorage.getItem('highScore') || 0;
let gameStarted = false;

// Función para inicializar VR
function initVR() {
    if ('xr' in navigator) {
        navigator.xr.isSessionSupported('immersive-vr')
            .then((vrSupported) => {
                if (vrSupported) {
                    const vrButton = VRButton.createButton(renderer);
                    document.body.appendChild(vrButton);
                    initVRControllers();
                } else {
                    navigator.xr.isSessionSupported('immersive-ar')
                        .then((arSupported) => {
                            if (arSupported) {
                                createVRWarning('AR disponible, VR no soportado en este dispositivo.');
                            } else {
                                createVRWarning('VR/AR no disponible en este dispositivo.');
                            }
                        })
                        .catch(() => createVRWarning('Error verificando AR.'));
                }
            })
            .catch((error) => {
                console.error('Error verificando VR:', error);
                createVRWarning('Error al verificar soporte VR.');
            });
    } else {
        createVRWarning('WebXR no soportado. Actualiza tu navegador.');
    }
}

function createVRWarning(message = 'VR no disponible') {
    const warning = document.createElement('div');
    warning.textContent = message;
    warning.style.position = 'absolute';
    warning.style.bottom = '10px';
    warning.style.right = '10px';
    warning.style.color = 'yellow';
    warning.style.fontFamily = 'Arial, sans-serif';
    warning.style.background = 'rgba(0,0,0,0.7)';
    warning.style.padding = '5px';
    warning.style.borderRadius = '5px';
    document.body.appendChild(warning);
}

// Función para inicializar controladores VR
function initVRControllers() {
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    scene.add(controller2);

    // Líneas de rayo para feedback visual (solo en VR)
    if (renderer.xr.isPresenting) {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
        const material = new THREE.LineBasicMaterial({ color: 0xffffff });
        const line1 = new THREE.Line(geometry, material);
        line1.scale.z = 5;
        controller1.add(line1.clone());

        const line2 = new THREE.Line(geometry, material);
        line2.scale.z = 5;
        controller2.add(line2.clone());
    }
}

// Eventos para controladores VR
function onSelectStart(event) {
    if (!gameStarted || lives <= 0) return;
    const controller = event.target;
    const intersections = getIntersections(controller);
    if (intersections.length > 0) {
        const intersectedObject = intersections[0].object;
        if (greenCubes.includes(intersectedObject)) {
            disparo(intersectedObject);
        }
    }
}

function getIntersections(controller) {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(greenCubes, false);
}

// Evento de mouse para modo no-VR
window.addEventListener('click', (event) => {
    if (!gameStarted || lives <= 0 || (renderer.xr && renderer.xr.isPresenting)) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    let hit = false;
    for (let cube of greenCubes) {
        const intersects = raycaster.intersectObject(cube);
        if (intersects.length > 0) {
            disparo(cube);
            hit = true;
            break;
        }
    }
    if (!hit) {
        lives--;
        score -= 20;
        if (score < 0) score = 0;
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
        console.log(`Fallo! Puntuación: ${score}, Vidas restantes: ${lives}`);
        if (lives <= 0) {
            gameOver();
        }
    }
});

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Skybox
const cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath('uv/');
const cubeTexture = cubeTextureLoader.load([
    'px.png',
    'nx.png',
    'py.png',
    'ny.png',
    'pz.png',
    'nz.png'
]);
scene.background = cubeTexture;

// Cargar modelo OBJ
const objLoader = new THREE.OBJLoader();
objLoader.load('modelos/bosque.obj', (object) => {
    object.position.set(0, -2, 0);
    object.rotation.y = Math.PI / 2;
    object.scale.set(1, 1, 1);
    scene.add(object);

    const redCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const redCubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const redCube = new THREE.Mesh(redCubeGeometry, redCubeMaterial);
    redCube.position.set(-6, -2, 0);
    scene.add(redCube);

    document.getElementById('highScore').textContent = highScore;

    // Inicializar VR después de cargar el modelo
    initVR();
}, undefined, (error) => {
    console.error('Error cargando el modelo OBJ:', error);
});

// Evento del botón de inicio
document.getElementById('startButton').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    gameStarted = true;
    resetGame();
    startRound();
});

function resetGame() {
    currentRound = 1;
    score = 0;
    lives = 3;
    cubesShot = 0;
    greenCubes.forEach(cube => scene.remove(cube));
    greenCubes = [];
    document.getElementById('round').textContent = currentRound;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
}

function startRound() {
    console.log(`Ronda ${currentRound}`);
    document.getElementById('round').textContent = currentRound;
    greenCubes = [];

    for (let i = 0; i < cubesPerRound; i++) {
        const greenCubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const greenCubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const greenCube = new THREE.Mesh(greenCubeGeometry, greenCubeMaterial);
        greenCube.position.set(Math.random() * 12 - 6, Math.random() * 6 + 1, Math.random() * 4 - 2);
        greenCube.spawnTime = Date.now();
        scene.add(greenCube);
        greenCubes.push(greenCube);
    }
    cubesShot = 0;
}

function volar() {
    const speedMultiplier = 1 + (currentRound - 1) * 0.2;
    greenCubes.forEach(cube => {
        if (cube && !cube.isShot) {
            const time = Date.now() * 0.001 + cube.position.x * 0.1;
            cube.position.x += Math.sin(time) * 0.01 * speedMultiplier;
            cube.position.y += Math.sin(time * 1.1) * 0.01 * speedMultiplier;
            cube.position.z += Math.sin(time * 0.9) * 0.005 * speedMultiplier;
        }
    });
}

function disparo(cube) {
    if (cube && !cube.isShot) {
        cube.isShot = true;
        cube.material.color.setHex(0xff0000);
        cube.fadeStartTime = Date.now();
        const reactionTime = (Date.now() - cube.spawnTime) / 1000;
        let points = 100;
        if (reactionTime < 1) {
            points += 50;
        } else if (reactionTime > 3) {
            points -= 50;
        }
        score += points;
        lives++;
        if (lives > 3) lives = 3;
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
        console.log(`Puntuación: ${score}, Tiempo de reacción: ${reactionTime.toFixed(2)}s, Vidas: ${lives}`);
        cubesShot++;
        if (cubesShot >= cubesPerRound) {
            setTimeout(() => {
                currentRound++;
                showRoundMessage();
                startRound();
            }, 2000);
        }
    }
}

function gameOver() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }
    console.log(`Juego terminado! Puntuación final: ${score}, Mejor puntuación: ${highScore}`);
    gameStarted = false;
    setTimeout(() => {
        document.getElementById('menu').style.display = 'block';
        document.getElementById('ui').style.display = 'none';
    }, 2000);
}

// Función de animación unificada para VR y no-VR
function animate() {
    if (gameStarted) {
        volar();

        greenCubes.forEach((cube, index) => {
            if (cube && cube.isShot) {
                const elapsed = (Date.now() - cube.fadeStartTime) / 1000;
                const fadeDuration = 2;
                if (elapsed < fadeDuration) {
                    const opacity = 1 - (elapsed / fadeDuration);
                    cube.material.transparent = true;
                    cube.material.opacity = opacity;
                } else {
                    scene.remove(cube);
                    greenCubes.splice(index, 1);
                }
            }
        });
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function showRoundMessage() {
    const message = document.createElement('div');
    message.textContent = `¡Ronda ${currentRound}!`;
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.color = 'white';
    message.style.fontSize = '48px';
    message.style.fontFamily = 'Arial, sans-serif';
    message.style.background = 'rgba(0, 0, 0, 0.7)';
    message.style.padding = '20px';
    message.style.borderRadius = '10px';
    message.style.zIndex = '1000';
    document.body.appendChild(message);
    setTimeout(() => {
        document.body.removeChild(message);
    }, 2000);
}

// Manejo de errores global
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});
