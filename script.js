// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
const CONFIG = {
    particleCount: 15000,
    particleSize: 0.15,
    colorSpeed: 0.005,
    lerpSpeed: 0.08 // How fast particles fly to new shape
};

const STATE = {
    targetShape: 'sphere', // current target shape
    handPos: { x: 0, y: 0 },
    pinchDistance: 1,
    isFist: false,
    hue: 0
};

// ==========================================
// 2. THREE.JS SETUP
// ==========================================
const scene = new THREE.Scene();
// Fog for depth
scene.fog = new THREE.FogExp2(0x000000, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// ==========================================
// 3. PARTICLE SYSTEM & SHAPES
// ==========================================
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(CONFIG.particleCount * 3);
const targets = new Float32Array(CONFIG.particleCount * 3);
const colors = new Float32Array(CONFIG.particleCount * 3);

for (let i = 0; i < CONFIG.particleCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 50;
    targets[i] = positions[i];
    colors[i] = 1.0; 
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('target', new THREE.BufferAttribute(targets, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: CONFIG.particleSize,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    opacity: 0.8
});

const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

/* —— REST OF THE FILE CONTINUES 100% UNCHANGED —— */
