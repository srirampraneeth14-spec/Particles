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
    targetShape: 'sphere',
    handPos: { x: 0, y: 0 },
    pinchDistance: 1,
    isFist: false,
    hue: 0
};

// ==========================================
// 2. THREE.JS SETUP
// ==========================================
const scene = new THREE.Scene();
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

// Fill initial positions
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

// --- SHAPE GENERATORS ---

function getSpherePoint(r) {
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
    };
}

function getHeartPoint(scale) {
    let t = Math.random() * Math.PI * 2;
    let x = 16 * Math.pow(Math.sin(t), 3);
    let y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    let z = (Math.random() - 0.5) * 5; 
    return { x: x * scale * 0.5, y: y * scale * 0.5, z: z };
}

function getSaturnPoint() {
    const isRing = Math.random() > 0.6;
    if (!isRing) {
        return getSpherePoint(6);
    } else {
        const angle = Math.random() * Math.PI * 2;
        const dist = 9 + Math.random() * 6;
        return {
            x: Math.cos(angle) * dist,
            y: (Math.random()-0.5) * 0.5,
            z: Math.sin(angle) * dist
        };
    }
}

function getFlowerPoint() {
    const u = Math.random() * Math.PI * 2; 
    const v = Math.random(); 
    const k = 4; 
    const r = Math.cos(k * u) * 10 + 2; 
    const z = (Math.random() - 0.5) * 4 * (1 - v); 
    return {
        x: r * Math.cos(u) * 1.5,
        y: r * Math.sin(u) * 1.5,
        z: z
    };
}

// --- UPDATE TARGETS ---
function setShape(shapeType) {
    const targetAttr = geometry.attributes.target;
    for (let i = 0; i < CONFIG.particleCount; i++) {
        let p;
        if (STATE.isFist) {
            p = { x: 0, y: 0, z: 0 };
        } else {
            switch (shapeType) {
                case 'heart': p = getHeartPoint(0.8); break;
                case 'saturn': p = getSaturnPoint(); break;
                case 'flower': p = getFlowerPoint(); break;
                case 'sphere': 
                default: p = getSpherePoint(12); break;
            }
        }
        targetAttr.setXYZ(i, p.x, p.y, p.z);
    }
    targetAttr.needsUpdate = true;
}

// ==========================================
// 4. ANIMATION LOOP
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    const attrPos = geometry.attributes.position;
    const attrTarget = geometry.attributes.target;
    const attrColor = geometry.attributes.color;

    STATE.hue += CONFIG.colorSpeed;

    for (let i = 0; i < CONFIG.particleCount; i++) {
        // Move current pos towards target pos
        const tx = attrTarget.getX(i) * STATE.pinchDistance;
        const ty = attrTarget.getY(i) * STATE.pinchDistance;
        const tz = attrTarget.getZ(i) * STATE.pinchDistance;

        const cx = attrPos.getX(i);
        const cy = attrPos.getY(i);
        const cz = attrPos.getZ(i);

        attrPos.setXYZ(
            i,
            cx + (tx - cx) * CONFIG.lerpSpeed,
            cy + (ty - cy) * CONFIG.lerpSpeed,
            cz + (tz - cz) * CONFIG.lerpSpeed
        );

        // Coloring
        const color = new THREE.Color();
        if (STATE.isFist) {
            color.setHSL(0, 1, 0.5); // Red
        } else {
            const hueOffset = (cx * 0.05) + STATE.hue;
            color.setHSL(hueOffset % 1, 0.7, 0.6); 
        }
        attrColor.setXYZ(i, color.r, color.g, color.b);
    }

    attrPos.needsUpdate = true;
    attrColor.needsUpdate = true;

    // Interaction Rotation
    particleSystem.rotation.y += 0.002 + (STATE.handPos.x * 0.05);
    particleSystem.rotation.x += (STATE.handPos.y * 0.05);
    
    // Idle rotation for Saturn
    if (STATE.targetShape === 'saturn') {
        particleSystem.rotation.z = 0.3;
    } else {
        particleSystem.rotation.z *= 0.95;
    }

    renderer.render(scene, camera);
}
animate();

// ==========================================
// 5. MEDIAPIPE HAND TRACKING
// ==========================================
const videoElement = document.getElementById('video');

function onResults(results) {
    document.getElementById('loading').style.display = 'none';

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Center calculation
        const wrist = landmarks[0];
        const x = (wrist.x - 0.5) * 2; 
        const y = -(wrist.y - 0.5) * 2; 
        STATE.handPos = { x, y };

        // Finger counting
        let fingersUp = 0;
        if (Math.abs(landmarks[4].x - landmarks[17].x) > 0.2) fingersUp++; // Thumb
        if (landmarks[8].y < landmarks[6].y) fingersUp++;
        if (landmarks[12].y < landmarks[10].y) fingersUp++;
        if (landmarks[16].y < landmarks[14].y) fingersUp++;
        if (landmarks[20].y < landmarks[18].y) fingersUp++;

        STATE.isFist = (fingersUp === 0);

        // Pinch Detection
        const dx = landmarks[8].x - landmarks[4].x;
        const dy = landmarks[8].y - landmarks[4].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const targetScale = Math.max(0.1, Math.min(3.0, dist * 5));
        STATE.pinchDistance += (targetScale - STATE.pinchDistance) * 0.1;

        // Shape Switch
        if (!STATE.isFist) {
            let newShape = STATE.targetShape;
            if (fingersUp === 1) newShape = 'heart';
            else if (fingersUp === 2) newShape = 'saturn';
            else if (fingersUp === 3) newShape = 'flower';
            else if (fingersUp >= 4) newShape = 'sphere';

            if (newShape !== STATE.targetShape) {
                STATE.targetShape = newShape;
                setShape(newShape);
            }
        } else {
            setShape('fist'); 
        }
    } else {
         STATE.handPos.x *= 0.95;
         STATE.handPos.y *= 0.95;
    }
}

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const cameraUtils = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 320,
    height: 240
});

cameraUtils.start();

// Resize Handle
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Init
setShape('sphere');