let camera, scene, renderer;
let articlesGroup;
let scrollZ = 0;
let targetScrollZ = 0;
let raycaster, mouse;
let hoveredMesh = null;
let ashParticles;

const articles = [
    { title: 'The Void', date: '2025.03', content: 'Entering the digital void, where thoughts float like dust in a sunbeam...' },
    { title: 'Quantum Dreams', date: '2025.02', content: 'Do androids dream of electric sheep? Or do they dream of quantum entanglement?' },
    { title: 'Silence', date: '2025.02', content: 'In the silence of code, logic speaks loudest.' },
    { title: 'Entropy', date: '2025.01', content: 'Order from chaos. The eternal struggle of the developer.' },
    { title: 'Light & Shadow', date: '2025.01', content: 'Rendering reality, one pixel at a time.' },
    { title: 'Echoes', date: '2024.12', content: 'Old code echoes in the repository, a ghost of versions past.' },
    { title: 'Singularity', date: '2024.11', content: 'The point of no return. When the AI writes itself.' },
    { title: 'Nebula', date: '2024.10', content: 'Clouds of data forming new stars of innovation.' }
];

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();
    // Tuned Fog for "Zoom" depth - slightly denser to hide the end
    scene.fog = new THREE.FogExp2(0x050505, 0.0025);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1000;

    // Article Group
    articlesGroup = new THREE.Group();
    scene.add(articlesGroup);

    // Create Minimalist Panels
    articles.forEach((article, index) => {
        const mesh = createMinimalistPanel(article, index);
        articlesGroup.add(mesh);
    });

    // Subtle Ash Particles
    createSubtleAshParticles();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('wheel', onWheel, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onClick, false);
    window.addEventListener('resize', onWindowResize, false);

    // Modal Close
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('article-modal').classList.remove('active');
    });
}

function createMinimalistPanel(article, index) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 512;

    // No background fill - Pure Transparency

    // Text - High Contrast White
    ctx.textAlign = 'center';

    // Title
    ctx.font = '300 90px "Noto Serif SC"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(article.title, canvas.width / 2, 220);

    // Date
    ctx.font = '300 40px "Noto Serif SC"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(article.date, canvas.width / 2, 320);

    // Texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(450, 225);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Spiral Layout (Classic 3D Structure)
    const angle = index * 0.8;
    const radius = 350;
    const z = index * -400;

    mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z
    );

    // Look at camera center axis
    mesh.lookAt(0, 0, mesh.position.z + 1000);

    mesh.userData = {
        article: article,
        originalPos: mesh.position.clone(),
        originalScale: mesh.scale.clone()
    };

    return mesh;
}

function createSubtleAshParticles() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const sizes = [];

    for (let i = 0; i < 1500; i++) {
        vertices.push(
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 3000,
            (Math.random() - 0.5) * 10000 - 2000
        );
        sizes.push(Math.random() * 3 + 1);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    // Soft circle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)'); // Lower opacity
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
        color: 0x888888, // Greyer, less intrusive
        size: 3,
        map: texture,
        transparent: true,
        opacity: 0.4, // Very subtle
        sizeAttenuation: true,
        depthWrite: false
    });

    ashParticles = new THREE.Points(geometry, material);
    scene.add(ashParticles);
}

function onWheel(event) {
    // Snappy scroll - Direct mapping with less smoothing later
    targetScrollZ -= event.deltaY * 2.5;

    // Strict Clamping
    if (targetScrollZ > 0) targetScrollZ = 0;
    const maxZ = (articles.length - 1) * 400 + 1200; // Tighter end limit
    if (targetScrollZ < -maxZ) targetScrollZ = -maxZ;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
    if (hoveredMesh) {
        const article = hoveredMesh.userData.article;
        showModal(article);
    }
}

function showModal(article) {
    document.getElementById('modal-title').innerText = article.title;
    document.getElementById('modal-meta').innerText = article.date;
    document.getElementById('modal-body').innerText = article.content;
    document.getElementById('article-modal').classList.add('active');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // Snappy Camera Movement
    // Increased lerp factor from 0.06 to 0.15 for tighter control
    scrollZ += (targetScrollZ - scrollZ) * 0.15;
    camera.position.z = 1000 + scrollZ;

    // Camera gentle float - Reduced amplitude for stability
    camera.position.y += Math.sin(time * 0.3) * 0.05;

    // Mouse Parallax - Tighter, less floaty
    const targetCamX = mouse.x * 40; // Reduced range
    const targetCamY = mouse.y * 40;
    camera.position.x += (targetCamX - camera.position.x) * 0.1; // Snappier follow
    camera.position.y += (targetCamY - camera.position.y) * 0.1;

    // Raycaster
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(articlesGroup.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (hoveredMesh !== object) {
            hoveredMesh = object;
            document.body.style.cursor = 'pointer';
        }
    } else {
        hoveredMesh = null;
        document.body.style.cursor = 'default';
    }

    // Update Articles (No Repulsion, Snappy Hover)
    articlesGroup.children.forEach(mesh => {
        const isHovered = (mesh === hoveredMesh);

        // 1. No Repulsion - Fixed Position
        // We only apply the idle float
        const idleY = Math.sin(time + mesh.position.z * 0.01) * 0.2;
        mesh.position.y = mesh.userData.originalPos.y + idleY;
        mesh.position.x = mesh.userData.originalPos.x; // Strict X lock

        // 2. Snappy Hover Scale
        // Using a simple lerp with a high factor for "instant" feel but still smooth
        const targetScale = isHovered ? 1.15 : 1.0;
        const targetOpacity = isHovered ? 1.0 : 0.85;

        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
        mesh.material.opacity += (targetOpacity - mesh.material.opacity) * 0.2;
    });

    // Update Ash Particles
    if (ashParticles) {
        ashParticles.position.z = scrollZ * 0.8; // Parallax
    }

    // Progress Bar
    const maxZ = (articles.length - 1) * 400;
    const progress = Math.abs(scrollZ) / maxZ;
    const progressBar = document.getElementById('progress-fill');
    if (progressBar) progressBar.style.width = `${Math.min(progress * 100, 100)}%`;

    renderer.render(scene, camera);
}
