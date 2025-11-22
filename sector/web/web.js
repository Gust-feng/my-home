// 站点数据
const sites = [
    { name: 'GITHUB', desc: 'Where the world builds software.', url: 'https://github.com', color: new THREE.Color(0xffffff) },
    { name: 'THREE.JS', desc: 'JavaScript 3D Library.', url: 'https://threejs.org', color: new THREE.Color(0x00ff00) },
    { name: 'DRIBBBLE', desc: 'Discover the world’s top designers.', url: 'https://dribbble.com', color: new THREE.Color(0xea4c89) },
    { name: 'AWWWARDS', desc: 'Website Awards.', url: 'https://www.awwwards.com', color: new THREE.Color(0x49c5b6) },
    { name: 'NOTION', desc: 'All-in-one workspace.', url: 'https://notion.so', color: new THREE.Color(0x000000) },
    { name: 'UNSPLASH', desc: 'The internet’s source for visuals.', url: 'https://unsplash.com', color: new THREE.Color(0xffffff) }
];

let camera, scene, renderer;
let particleSystem;
let raycaster, mouse;
let particlesData = [];
let positions, colors, sizes;
let pointGeometry;
let hoveredIndex = -1;

const PARTICLE_COUNT = 3000;
const CLUSTER_RADIUS = 100;
const MOUSE_RADIUS = 150;

init();
animate();

function init() {
    const container = document.getElementById('canvas-container');

    // 场景与相机
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 800;

    // 粒子系统
    pointGeometry = new THREE.BufferGeometry();
    positions = new Float32Array(PARTICLE_COUNT * 3);
    colors = new Float32Array(PARTICLE_COUNT * 3);
    sizes = new Float32Array(PARTICLE_COUNT);

    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // 将粒子分配到不同的站点簇中
        const siteIndex = i % sites.length;
        const site = sites[siteIndex];

        // 计算簇的中心位置
        const angle = (siteIndex / sites.length) * Math.PI * 2;
        const radius = 400;
        const centerX = Math.cos(angle) * radius;
        const centerY = Math.sin(angle) * radius;
        const centerZ = 0;

        // 在簇周围随机分布
        const x = centerX + (Math.random() - 0.5) * 300;
        const y = centerY + (Math.random() - 0.5) * 300;
        const z = centerZ + (Math.random() - 0.5) * 300;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // 保存原始位置用于复位
        particlesData.push({
            originalX: x,
            originalY: y,
            originalZ: z,
            vx: 0,
            vy: 0,
            vz: 0,
            siteIndex: siteIndex
        });

        // 颜色
        color.set(site.color);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        sizes[i] = 5;
    }

    pointGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointGeometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    pointGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 材质 (使用自定义着色器实现更好的光晕效果)
    // 这里为了简化，使用标准点材质，但配合贴图
    const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');

    const material = new THREE.PointsMaterial({
        size: 6,
        map: sprite,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        opacity: 0.8
    });

    particleSystem = new THREE.Points(pointGeometry, material);
    scene.add(particleSystem);

    // 渲染器
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 交互
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2(9999, 9999); // 初始移出屏幕

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('click', onDocumentClick, false);
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onDocumentClick(event) {
    if (hoveredIndex !== -1) {
        const site = sites[hoveredIndex];
        window.open(site.url, '_blank');
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const time = Date.now() * 0.001;

    // 粒子动画
    const positions = particleSystem.geometry.attributes.position.array;
    const sizes = particleSystem.geometry.attributes.size.array;

    // 转换鼠标位置到世界坐标 (近似)
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z;
    const mousePos = camera.position.clone().add(dir.multiplyScalar(distance));

    let activeSiteIndex = -1;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const data = particlesData[i];

        // 原始位置
        const ox = data.originalX;
        const oy = data.originalY;
        const oz = data.originalZ;

        // 当前位置
        let px = positions[i * 3];
        let py = positions[i * 3 + 1];
        let pz = positions[i * 3 + 2];

        // 鼠标交互 (排斥力)
        const dx = mousePos.x - px;
        const dy = mousePos.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS) {
            const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
            const angle = Math.atan2(dy, dx);

            // 粒子被推开
            data.vx -= Math.cos(angle) * force * 2;
            data.vy -= Math.sin(angle) * force * 2;

            // 检测当前悬停的站点簇
            if (force > 0.5) {
                activeSiteIndex = data.siteIndex;
            }
        }

        // 弹性复位
        data.vx += (ox - px) * 0.05;
        data.vy += (oy - py) * 0.05;
        data.vz += (oz - pz) * 0.05;

        // 阻尼
        data.vx *= 0.9;
        data.vy *= 0.9;
        data.vz *= 0.9;

        // 更新位置
        positions[i * 3] += data.vx;
        positions[i * 3 + 1] += data.vy;
        positions[i * 3 + 2] += data.vz;

        // 呼吸效果
        sizes[i] = 4 + Math.sin(time + i) * 2;

        // 如果是激活站点的粒子，放大
        if (activeSiteIndex === data.siteIndex) {
            sizes[i] *= 1.5;
        }
    }

    particleSystem.geometry.attributes.position.needsUpdate = true;
    particleSystem.geometry.attributes.size.needsUpdate = true;

    // 缓慢旋转整个场景
    particleSystem.rotation.y += 0.001;
    particleSystem.rotation.z += 0.0005;

    // 更新 UI
    updateUI(activeSiteIndex);

    renderer.render(scene, camera);
}

function updateUI(index) {
    const info = document.getElementById('site-info');
    const title = info.querySelector('.site-title');
    const desc = info.querySelector('.site-desc');
    const btn = info.querySelector('.visit-btn');

    if (index !== -1 && index !== hoveredIndex) {
        hoveredIndex = index;
        const site = sites[index];

        title.innerText = site.name;
        desc.innerText = site.desc;
        btn.href = site.url;

        info.classList.add('active');
        info.style.borderColor = '#' + site.color.getHexString();
    } else if (index === -1) {
        hoveredIndex = -1;
        info.classList.remove('active');
    }
}
