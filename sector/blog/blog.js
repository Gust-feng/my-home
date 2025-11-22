let camera, scene, renderer;
let articlesGroup;
let scrollZ = 0;
let targetScrollZ = 0;
let raycaster, mouse;
let hoveredMesh = null;

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
    // 迷雾，营造深邃感
    scene.fog = new THREE.FogExp2(0x050505, 0.002);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 1000;

    // 文章组
    articlesGroup = new THREE.Group();
    scene.add(articlesGroup);

    // 创建文章面板
    articles.forEach((article, index) => {
        const mesh = createArticlePanel(article, index);
        articlesGroup.add(mesh);
    });

    // 悬浮尘埃粒子
    createDust();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 交互
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    window.addEventListener('wheel', onWheel, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onClick, false);
    window.addEventListener('resize', onWindowResize, false);

    // 模态框关闭
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('article-modal').classList.remove('active');
    });
}

function createArticlePanel(article, index) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    // 半透明背景
    ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // 文字
    ctx.font = 'bold 40px "Noto Serif SC"';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(article.title, canvas.width / 2, 100);

    ctx.font = '24px "Noto Serif SC"';
    ctx.fillStyle = '#888';
    ctx.fillText(article.date, canvas.width / 2, 160);

    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(300, 150);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);

    // 螺旋排列
    const angle = index * 0.8;
    const radius = 300;
    const z = index * -400; // 纵深排列

    mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        z
    );

    // 面向摄像机中心路径
    mesh.lookAt(0, 0, mesh.position.z + 1000);

    mesh.userData = { article: article, originalScale: 1 };

    return mesh;
}

function createDust() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 2000; i++) {
        vertices.push(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 10000 - 5000 // 延伸到远处
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({ color: 0x888888, size: 2, transparent: true, opacity: 0.5 });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
}

function onWheel(event) {
    // 滚轮控制 Z 轴推进
    targetScrollZ -= event.deltaY * 2;

    // 限制回滚
    if (targetScrollZ > 0) targetScrollZ = 0;

    // 限制最远距离
    const maxZ = (articles.length - 1) * 400 + 1000;
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

    // 平滑摄像机移动
    scrollZ += (targetScrollZ - scrollZ) * 0.05;
    camera.position.z = 1000 + scrollZ;

    // 摄像机轻微晃动，模拟飞行
    camera.position.x += (mouse.x * 100 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 100 - camera.position.y) * 0.05;

    // Raycaster 检测
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(articlesGroup.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (hoveredMesh !== object) {
            // 恢复上一个
            if (hoveredMesh) {
                gsap.to(hoveredMesh.scale, { x: 1, y: 1, duration: 0.3 });
                gsap.to(hoveredMesh.material, { opacity: 0.6, duration: 0.3 });
            }
            // 高亮当前
            hoveredMesh = object;
            gsap.to(hoveredMesh.scale, { x: 1.2, y: 1.2, duration: 0.3 });
            gsap.to(hoveredMesh.material, { opacity: 1, duration: 0.3 });
            document.body.style.cursor = 'pointer';
        }
    } else {
        if (hoveredMesh) {
            gsap.to(hoveredMesh.scale, { x: 1, y: 1, duration: 0.3 });
            gsap.to(hoveredMesh.material, { opacity: 0.6, duration: 0.3 });
            hoveredMesh = null;
            document.body.style.cursor = 'default';
        }
    }

    // 进度条
    const maxZ = (articles.length - 1) * 400;
    const progress = Math.abs(scrollZ) / maxZ;
    document.getElementById('progress-fill').style.width = `${Math.min(progress * 100, 100)}%`;

    renderer.render(scene, camera);
}
