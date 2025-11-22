let camera, scene, renderer;
let particleSystem;
let particlesData = [];
let mouse = new THREE.Vector2(-9999, -9999);
let time = 0;

const PARTICLE_SIZE = 3;
const TEXT_CONTENT = 'Gust-feng';
const FONT_SIZE = 120;
const COLOR_INK = new THREE.Color(0x1d1d1f);
const COLOR_GOLD = new THREE.Color(0xd4af37);

// 简化的 Perlin Noise 实现 (用于 Curl Noise)
const noise = {
    grad3: [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]],
    p: [],
    perm: [],
    init: function () {
        for (let i = 0; i < 256; i++) this.p[i] = Math.floor(Math.random() * 256);
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    },
    dot: function (g, x, y, z) { return g[0] * x + g[1] * y + g[2] * z; },
    mix: function (a, b, t) { return (1 - t) * a + t * b; },
    fade: function (t) { return t * t * t * (t * (t * 6 - 15) + 10); },
    noise: function (x, y, z) {
        let X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        let u = this.fade(x), v = this.fade(y), w = this.fade(z);
        let A = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z,
            B = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z;
        return this.mix(this.mix(this.mix(this.dot(this.grad3[this.perm[AA] % 12], x, y, z),
            this.dot(this.grad3[this.perm[BA] % 12], x - 1, y, z), u),
            this.mix(this.dot(this.grad3[this.perm[AB] % 12], x, y - 1, z),
                this.dot(this.grad3[this.perm[BB] % 12], x - 1, y - 1, z), u), v),
            this.mix(this.mix(this.dot(this.grad3[this.perm[AA + 1] % 12], x, y, z - 1),
                this.dot(this.grad3[this.perm[BA + 1] % 12], x - 1, y, z - 1), u),
                this.mix(this.dot(this.grad3[this.perm[AB + 1] % 12], x, y - 1, z - 1),
                    this.dot(this.grad3[this.perm[BB + 1] % 12], x - 1, y - 1, z - 1), u), v), w);
    }
};
noise.init();

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf0f2f5, 0.001);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 600;

    const textData = createTextParticles(TEXT_CONTENT);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(textData.length * 3);
    const colors = new Float32Array(textData.length * 3);
    const sizes = new Float32Array(textData.length);

    for (let i = 0; i < textData.length; i++) {
        const p = textData[i];

        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;

        colors[i * 3] = COLOR_INK.r;
        colors[i * 3 + 1] = COLOR_INK.g;
        colors[i * 3 + 2] = COLOR_INK.b;

        sizes[i] = PARTICLE_SIZE;

        particlesData.push({
            originalX: p.x,
            originalY: p.y,
            originalZ: p.z,
            vx: 0,
            vy: 0,
            vz: 0,
            life: Math.random(), // 用于颜色变化
            offset: Math.random() * 100 // 噪声偏移
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: PARTICLE_SIZE,
        vertexColors: true,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.8
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
}

function createTextParticles(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 512;

    ctx.font = `bold ${FONT_SIZE}px "Noto Serif SC", serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const particles = [];

    for (let y = 0; y < canvas.height; y += 3) { // 增加密度
        for (let x = 0; x < canvas.width; x += 3) {
            const index = (y * canvas.width + x) * 4;
            if (data[index + 3] > 128) {
                particles.push({
                    x: (x - canvas.width / 2) * 2,
                    y: -(y - canvas.height / 2) * 2,
                    z: 0
                });
            }
        }
    }
    return particles;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    // Slower time increment for a more "breathing", meditative pace
    time += 0.002;

    const positions = particleSystem.geometry.attributes.position.array;
    const colors = particleSystem.geometry.attributes.color.array;

    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const mousePos = camera.position.clone().add(dir.multiplyScalar(distance));

    for (let i = 0; i < particlesData.length; i++) {
        const data = particlesData[i];

        const ox = data.originalX;
        const oy = data.originalY;
        const oz = data.originalZ;

        let px = positions[i * 3];
        let py = positions[i * 3 + 1];
        let pz = positions[i * 3 + 2];

        // Curl Noise 模拟有机流动 - Reduced scale for subtler movement
        const nScale = 0.005;
        const nx = noise.noise(px * nScale, py * nScale, time + data.offset);
        const ny = noise.noise(py * nScale, pz * nScale, time + data.offset + 100);
        const nz = noise.noise(pz * nScale, px * nScale, time + data.offset + 200);

        // Reduced noise influence for stability
        data.vx += nx * 0.15;
        data.vy += ny * 0.15;
        data.vz += nz * 0.15;

        // 鼠标交互
        const dx = mousePos.x - px;
        const dy = mousePos.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150; // Increased interaction radius

        let interactionStrength = 0;

        if (dist < maxDist) {
            interactionStrength = (maxDist - dist) / maxDist;
            const angle = Math.atan2(dy, dx);

            // Smoother repulsion
            // 强烈的排斥 + 旋转
            data.vx -= Math.cos(angle) * interactionStrength * 3;
            data.vy -= Math.sin(angle) * interactionStrength * 3;
            data.vz += interactionStrength * 1.5;
        }

        // 弹性复位 - Slightly stronger return force for crispness
        data.vx += (ox - px) * 0.035;
        data.vy += (oy - py) * 0.035;
        data.vz += (oz - pz) * 0.035;

        // 阻尼 - Increased damping for smoother motion
        data.vx *= 0.94;
        data.vy *= 0.94;
        data.vz *= 0.94;

        positions[i * 3] += data.vx;
        positions[i * 3 + 1] += data.vy;
        positions[i * 3 + 2] += data.vz;

        // 动态颜色：速度越快或受鼠标影响越大，越趋向金色
        const speed = Math.sqrt(data.vx * data.vx + data.vy * data.vy + data.vz * data.vz);
        // Smoother color transition
        const mixFactor = Math.min(speed * 0.15 + interactionStrength * 0.6, 1);

        const r = COLOR_INK.r * (1 - mixFactor) + COLOR_GOLD.r * mixFactor;
        const g = COLOR_INK.g * (1 - mixFactor) + COLOR_GOLD.g * mixFactor;
        const b = COLOR_INK.b * (1 - mixFactor) + COLOR_GOLD.b * mixFactor;

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.color.needsUpdate = true;

    renderer.render(scene, camera);
}

// --- Interaction Logic ---

document.addEventListener('DOMContentLoaded', () => {
    const infoItems = document.querySelectorAll('.info-item');
    const detailOverlay = document.getElementById('detail-overlay');
    const detailContent = document.getElementById('detail-content');
    const closeBtn = document.getElementById('close-detail');
    const detailSources = document.getElementById('detail-sources');
    const clickedTypes = new Set();
    const pendingReveals = [];
    const maxBgBlur = 12;
    let clearContentTimer = null;
    let pendingRevealTimer = null;

    // Map info items to their types based on index or content
    // Assuming order: Role, Location, Focus, Status
    const types = ['role', 'location', 'focus', 'status'];
    updateBackgroundBlur();

    infoItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            const type = types[index];
            showDetail(type, item);
        });
    });

    closeBtn.addEventListener('click', hideDetail);

    // Close on click outside content
    detailOverlay.addEventListener('click', (e) => {
        if (e.target === detailOverlay) {
            hideDetail();
        }
    });

    function showDetail(type, itemToReveal) {
        // Cancel any pending clear/reveal from previous close to avoid race blank states
        if (clearContentTimer) {
            clearTimeout(clearContentTimer);
            clearContentTimer = null;
        }
        if (pendingRevealTimer) {
            clearTimeout(pendingRevealTimer);
            pendingRevealTimer = null;
        }

        const source = detailSources.querySelector(`[data-type="${type}"]`);
        if (source) {
            detailContent.innerHTML = source.innerHTML;
            detailOverlay.classList.add('active');
            // Schedule reveal after user closes the overlay
            if (!itemToReveal.classList.contains('revealed')) {
                const exists = pendingReveals.some(entry => entry.item === itemToReveal);
                if (!exists) pendingReveals.push({ type, item: itemToReveal });
            }

            // Optional: Slow down time or blur canvas further?
            // For now, the CSS backdrop-filter handles the visual focus.
        }
    }

    function hideDetail() {
        detailOverlay.classList.remove('active');
        // Clear content after transition to avoid popping
        clearContentTimer = setTimeout(() => {
            detailContent.innerHTML = '';
            clearContentTimer = null;
        }, 500);
        // Reveal pending item after overlay fade-out
        pendingRevealTimer = setTimeout(() => {
            while (pendingReveals.length) {
                const next = pendingReveals.shift();
                revealItem(next.type, next.item);
            }
            pendingRevealTimer = null;
        }, 650);
    }

    function revealItem(type, item) {
        if (!item) return;
        if (!clickedTypes.has(type) && item.classList.contains('revealed')) {
            clickedTypes.add(type);
            updateBackgroundBlur();
            return;
        }
        if (item.classList.contains('revealed')) return;
        // Freeze current visual state to avoid flicker when stopping animation
        const computed = window.getComputedStyle(item);
        item.style.filter = computed.filter;
        item.style.opacity = computed.opacity;
        item.style.transform = computed.transform === 'none' ? 'translateY(0)' : computed.transform;
        item.style.animation = 'none';
        // Force a reflow so class transition applies cleanly
        void item.offsetWidth;
        // Drop inline overrides before revealing so CSS transition can animate blur -> clear
        requestAnimationFrame(() => {
            item.style.removeProperty('filter');
            item.style.removeProperty('opacity');
            item.style.removeProperty('transform');
            item.classList.add('revealed');
            clickedTypes.add(type);
            updateBackgroundBlur();
        });
    }

    function updateBackgroundBlur() {
        const total = types.length;
        const remaining = Math.max(0, total - clickedTypes.size);
        const fraction = remaining / total;
        const blur = maxBgBlur * fraction;
        document.documentElement.style.setProperty('--bg-blur', `${blur}px`);
    }
});
