// --- START OF FILE js/home.js ---
const { createApp, ref, onMounted, computed, watch, nextTick } = Vue;
        
const app = createApp({
    setup() {
        const normalizedMouseX = ref(0);
        const normalizedMouseY = ref(0);
        const smoothedMouseX = ref(0); 
        const smoothedMouseY = ref(0);
        const isMouseDown = ref(false); const isTouchActive = ref(false);
        const mouseX = ref(0); const mouseY = ref(0); 
        const lastMouseX = ref(0); const lastMouseY = ref(0);
        const mouseSpeed = ref(0);
        let trailTimer = null;
        let isPageVisible = true; let isLongPressing = false; let longPressTimer = null;
        
        const isMobile = ref(false); 
        const checkMobile = () => {
            isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
            if (isMobile.value) { 
                document.documentElement.style.setProperty('--ink-spread-speed', '0.8s');
                document.documentElement.style.setProperty('--ink-transform-speed', '0.5s');
            }
        };
        
        const currentTime = ref(new Date());
        const hitokotoText = ref("正在获取一言..."); 
        const shichenMap = [ 
            { name: '子时', nameKey: 'zishi', startHour: 23, endHour: 1 }, { name: '丑时', nameKey: 'choushi', startHour: 1, endHour: 3 },
            { name: '寅时', nameKey: 'yinshi', startHour: 3, endHour: 5 }, { name: '卯时', nameKey: 'maoshi', startHour: 5, endHour: 7 },
            { name: '辰时', nameKey: 'chenshi', startHour: 7, endHour: 9 }, { name: '巳时', nameKey: 'sishi', startHour: 9, endHour: 11 },
            { name: '午时', nameKey: 'wushi', startHour: 11, endHour: 13 }, { name: '未时', nameKey: 'weishi', startHour: 13, endHour: 15 },
            { name: '申时', nameKey: 'shenshi', startHour: 15, endHour: 17 }, { name: '酉时', nameKey: 'youshi', startHour: 17, endHour: 19 },
            { name: '戌时', nameKey: 'xushi', startHour: 19, endHour: 21 }, { name: '亥时', nameKey: 'haishi', startHour: 21, endHour: 23 }
        ];
        const currentShichenDetails = computed(() => { 
            const h = currentTime.value.getHours();
            for (const s of shichenMap) {
                if (s.startHour === 23) { if (h >= 23 || h < 1) return s; }
                else { if (h >= s.startHour && h < s.endHour) return s; }
            } return shichenMap[11]; 
        });
        const currentShichenName = computed(() => currentShichenDetails.value.name);
        const currentShichenColorVarName = computed(() => `--${currentShichenDetails.value.nameKey}-color-val`);
        
        const parseColorToRgbString = (colorValue) => {
            if (!colorValue) return '0,0,0';
            if (colorValue.startsWith('#')) {
                const r = parseInt(colorValue.substring(1, 3), 16);
                const g = parseInt(colorValue.substring(3, 5), 16);
                const b = parseInt(colorValue.substring(5, 7), 16);
                return `${r},${g},${b}`;
            } else if (colorValue.startsWith('rgba')) {
                const parts = colorValue.substring(5, colorValue.length - 1).split(',');
                return `${parseFloat(parts[0].trim())},${parseFloat(parts[1].trim())},${parseFloat(parts[2].trim())}`;
            } else if (colorValue.startsWith('rgb')) { 
                const parts = colorValue.substring(4, colorValue.length - 1).split(',');
                return `${parseFloat(parts[0].trim())},${parseFloat(parts[1].trim())},${parseFloat(parts[2].trim())}`;
            }
            return '0,0,0'; // Fallback
        };

        const updateDynamicColors = () => { 
            const currentCssVar = currentShichenColorVarName.value;
            const currentColorValue = getComputedStyle(document.documentElement).getPropertyValue(currentCssVar).trim();
            document.documentElement.style.setProperty('--current-shichen-color', currentColorValue);
            document.documentElement.style.setProperty('--current-shichen-color-rgb', parseColorToRgbString(currentColorValue));


            let currentIdx = shichenMap.findIndex(s => s.nameKey === currentShichenDetails.value.nameKey);
            let prevIdx = (currentIdx - 1 + shichenMap.length) % shichenMap.length;
            const prevCssVar = `--${shichenMap[prevIdx].nameKey}-color-val`;
            const prevColorValue = getComputedStyle(document.documentElement).getPropertyValue(prevCssVar).trim();
            document.documentElement.style.setProperty('--prev-shichen-color', prevColorValue);

            const shadowColor = getComputedStyle(document.documentElement).getPropertyValue('--current-shadow-color').trim();
            document.documentElement.style.setProperty('--current-shadow-color-rgb', parseColorToRgbString(shadowColor));
        };

        const timeFactor = computed(() => (currentTime.value.getHours() * 60 + currentTime.value.getMinutes()) / (24 * 60));
        const colorKeyframes = [ 
            { time: 0.0, bgColor: '#1a1a2e', textColor: '#e0e0e0', accentColor: '#4a4e69', shadowColor: 'rgba(0,0,0,0.3)', skyTop: '#0f0c29', name: '子夜·墨池观星' },
            { time: 0.083, bgColor: '#232539', textColor: '#d8d8d8', accentColor: '#6b6e8c', shadowColor: 'rgba(0,0,0,0.25)', skyTop: '#1c1f4a', name: '丑时·残月晓风' }, 
            { time: 0.166, bgColor: '#3a3a52', textColor: '#c0c0c0', accentColor: '#8a8dab', shadowColor: 'rgba(0,0,0,0.2)', skyTop: '#3b3b6d', name: '寅时·东方既白' }, 
            { time: 0.25, bgColor: '#f29b76', textColor: '#4a4e69', accentColor: '#ffcc66', shadowColor: 'rgba(74,78,105,0.1)', skyTop: '#fbc293', name: '卯时·旭日初升' }, 
            { time: 0.333, bgColor: '#a8c9e6', textColor: '#3a5169', accentColor: '#f9d367', shadowColor: 'rgba(58,81,105,0.1)', skyTop: '#b3d9ff', name: '辰时·薄雾辰光' }, 
            { time: 0.416, bgColor: '#f8f4e9', textColor: '#1c7349', accentColor: '#bea672', shadowColor: 'rgba(28,115,73,0.1)', skyTop: '#c5e7f1', name: '巳时·日暖风和' }, 
            { time: 0.5, bgColor: '#fffbec', textColor: '#c02c38', accentColor: '#f9d367', shadowColor: 'rgba(192,44,56,0.1)', skyTop: '#ffe0b3', name: '午时·日丽中天' }, 
            { time: 0.583, bgColor: '#d4c9ab', textColor: '#f86b1d', accentColor: '#e9c9a5', shadowColor: 'rgba(248,107,29,0.1)', skyTop: '#f0c088', name: '未时·午后小憩' }, 
            { time: 0.666, bgColor: '#cca583', textColor: '#5d3f51', accentColor: '#d6a692', shadowColor: 'rgba(93,63,81,0.1)', skyTop: '#e07b79', name: '申时·西楼夕照' }, 
            { time: 0.75, bgColor: '#aebeb4', textColor: '#3a5169', accentColor: '#f05654', shadowColor: 'rgba(58,81,105,0.15)', skyTop: '#bca0dc', name: '酉时·倦鸟归林' }, 
            { time: 0.833, bgColor: '#6a4c3d', textColor: '#e5e0dc', accentColor: '#b6afc5', shadowColor: 'rgba(229,224,220,0.1)', skyTop: '#4a3b59', name: '戌时·华灯初上' }, 
            { time: 0.916, bgColor: '#3a3a52', textColor: '#d0d0d0', accentColor: '#7a5240', shadowColor: 'rgba(0,0,0,0.25)', skyTop: '#2a2a3f', name: '亥时·夜阑人静' }, 
            { time: 1.0, bgColor: '#1a1a2e', textColor: '#e0e0e0', accentColor: '#4a4e69', shadowColor: 'rgba(0,0,0,0.3)', skyTop: '#0f0c29', name: '子夜·墨池观星' }
        ];
        const lerp = (a, b, t) => a + (b - a) * t;
        const lerpColor = (c1Str, c2Str, t) => { 
            const pC = (c) => { 
                if (c.startsWith('#')) return [parseInt(c.substring(1,3),16), parseInt(c.substring(3,5),16), parseInt(c.substring(5,7),16), 255];
                if (c.startsWith('rgba')) { const p=c.substring(5,c.length-1).split(',').map(s => parseFloat(s.trim())); return [p[0],p[1],p[2], isNaN(p[3]) ? 255 : Math.round(p[3]*255)]; }
                return [0,0,0,255]; 
            };
            const c1=pC(c1Str), c2=pC(c2Str);
            return `rgba(${Math.round(lerp(c1[0],c2[0],t))},${Math.round(lerp(c1[1],c2[1],t))},${Math.round(lerp(c1[2],c2[2],t))},${lerp(c1[3]/255,c2[3]/255,t).toFixed(2)})`;
        };
        const currentTheme = computed(() => { 
            const f = timeFactor.value; let sF=colorKeyframes[0],eF=colorKeyframes[1],t=0;
            for(let i=0;i<colorKeyframes.length-1;i++){ if(f>=colorKeyframes[i].time&&f<colorKeyframes[i+1].time){sF=colorKeyframes[i];eF=colorKeyframes[i+1];t=(f-sF.time)/(eF.time-sF.time);break;}}
            return {bgColor:lerpColor(sF.bgColor,eF.bgColor,t),textColor:lerpColor(sF.textColor,eF.textColor,t),accentColor:lerpColor(sF.accentColor,eF.accentColor,t),shadowColor:lerpColor(sF.shadowColor,eF.shadowColor,t),skyTop:lerpColor(sF.skyTop,eF.skyTop,t),name:f<0.5?(sF.name===eF.name?sF.name:sF.name):(sF.name===eF.name?sF.name:eF.name)};
        });
        const currentThemeDisplayName = computed(() => currentTheme.value.name);
        const skyStyle = computed(() => ({ background: `linear-gradient(to bottom, ${currentTheme.value.skyTop}, transparent)`, opacity: timeFactor.value < 0.21 || timeFactor.value > 0.79 ? 0.4 : 0.25 }));
        
        const timeIndicatorRef = ref(null); 
        const welcomeContainerRef = ref(null); 
        const globalNavRef = ref(null); 
        const leftWordScrollContainerRef = ref(null); 
        const leftScrollContentRef = ref(null); 
        let uiActiveTimer = null;
        let dropletCount = 0; 
        
        const poemsArray = ref([]); // For falling poems

        const isMouseStopped = ref(true);
        const isIdleModeActive = ref(false); 
        let mouseStopTimerId = null;
        let idleAnimationTimerId = null; 
        const MOUSE_STOP_DELAY = 300; 
        const IDLE_ANIMATION_DELAY = 3000; 

        const leftClickTimestamps = ref([]);
        const showLeftClickMessage = ref(false);
        const leftClickMessageText = ref("金鳞岂是池中物，一遇风云便化龙");
        let leftMsgTimer = null;

        // 一言更新回调函数
        const updateHitokotoText = (newText) => {
            hitokotoText.value = newText;
        };
        
        const checkWelcomeProximity = (x) => {
            if (!welcomeContainerRef.value || isMobile.value) return; 
            const threshold = window.innerWidth * 0.3; 
            const distanceFromRightEdge = window.innerWidth - x;
            if (distanceFromRightEdge < threshold) welcomeContainerRef.value.classList.add('visible');
            else welcomeContainerRef.value.classList.remove('visible');
        };

        const scrollCharDetails = ref([]); 
        let scrollChars = []; 
        const leftScrollActivationThreshold = 0.15;
        let charHighlightTimeout = null;
        const footerActiveState = ref(false); 

        const updateLeftWordScroll = (currentMouseX, currentMouseY) => {
            if (!leftWordScrollContainerRef.value || !scrollCharDetails.value.length) return;
            const isActiveZone = currentMouseX < window.innerWidth * leftScrollActivationThreshold;
            const containerRect = leftWordScrollContainerRef.value.getBoundingClientRect();
            const mouseYInContainer = currentMouseY - containerRect.top;

            if (isActiveZone) {
                scrollCharDetails.value.forEach(detail => {
                    if (!detail.el || detail.height <= 0) return; 
                    const distanceToCharMid = Math.abs(mouseYInContainer - detail.midY);
                    const falloff = detail.height * 0.85; 
                    let opacity = 0;
                    if (distanceToCharMid < falloff) {
                        opacity = 1 - (distanceToCharMid / falloff);
                        opacity = Math.max(0, Math.min(1, opacity * opacity)); 
                    }
                    detail.el.style.opacity = opacity;
                });
            } else {
                scrollCharDetails.value.forEach(detail => {
                    if (detail.el) detail.el.style.opacity = 0;
                });
            }
        };

        let isCharClickActive = false; // 防抖标志
        let activeRippleTimeouts = []; // 存储活跃的定时器
        
        const handleCharClick = (charElement) => {
            // 防抖：如果正在执行动画，则忽略新的点击
            if (isCharClickActive) {
                return;
            }
            
            const scrollChars = document.querySelectorAll('.scroll-char');
            const clickedIndex = Array.from(scrollChars).indexOf(charElement);
            
            // 设置防抖标志
            isCharClickActive = true;
            
            // 清除所有之前的定时器
            activeRippleTimeouts.forEach(timeout => clearTimeout(timeout));
            activeRippleTimeouts = [];
            
            if (charHighlightTimeout) {
                clearTimeout(charHighlightTimeout);
                charHighlightTimeout = null;
            }
            
            // 立即重置所有字符状态
            scrollChars.forEach(char => {
                char.classList.remove('char-highlighted', 'char-temp-visible', 'char-fading');
                char.style.opacity = '';
                char.style.color = '';
                char.style.transition = '';
            });
            
            // 立即高亮点击的字符
            charElement.classList.add('char-highlighted');
            
            // 创建扩散效果：从点击的字符向上下扩散显示其他字符
            const createRippleEffect = (centerIndex) => {
                let delay = 0;
                const maxDistance = Math.max(
                    centerIndex, 
                    scrollChars.length - 1 - centerIndex
                );
                
                for (let distance = 1; distance <= maxDistance; distance++) {
                    delay += 80; // 每层扩散间隔80ms，稍微快一点
                    
                    const timeoutId = setTimeout(() => {
                        // 向上扩散
                        const upIndex = centerIndex - distance;
                        if (upIndex >= 0 && upIndex < scrollChars.length) {
                            scrollChars[upIndex].classList.add('char-temp-visible');
                        }
                        
                        // 向下扩散
                        const downIndex = centerIndex + distance;
                        if (downIndex >= 0 && downIndex < scrollChars.length) {
                            scrollChars[downIndex].classList.add('char-temp-visible');
                        }
                    }, delay);
                    
                    activeRippleTimeouts.push(timeoutId);
                }
                
                return delay + 80; // 返回总扩散时间
            };
            
            // 开始扩散效果
            const totalRippleTime = createRippleEffect(clickedIndex);
            
            // 保持显示1.8秒，然后开始渐变消失
            charHighlightTimeout = setTimeout(() => {
                // 高亮字符开始渐变
                charElement.classList.remove('char-highlighted');
                charElement.classList.add('char-fading');
                
                // 其他字符也开始渐变
                scrollChars.forEach(char => {
                    if (char !== charElement) {
                        char.classList.remove('char-temp-visible');
                        char.classList.add('char-fading');
                    }
                });
                
                // 1.5秒后完全恢复正常状态并解除防抖
                const finalTimeout = setTimeout(() => {
                    scrollChars.forEach(char => {
                        char.classList.remove('char-highlighted', 'char-temp-visible', 'char-fading');
                        char.style.opacity = '';
                        char.style.color = '';
                        char.style.transition = '';
                    });
                    // 解除防抖标志
                    isCharClickActive = false;
                }, 1500);
                
                activeRippleTimeouts.push(finalTimeout);
            }, totalRippleTime + 1200); // 扩散完成后再保持1.2秒
        };

        const toggleFooterActive = () => {
            footerActiveState.value = !footerActiveState.value;
            const footerEl = document.querySelector('.elegant-footer');
            if (footerEl) {
                if (footerActiveState.value) {
                    footerEl.classList.add('ef-active');
                } else {
                    footerEl.classList.remove('ef-active');
                }
            }
        };
        
        const activateTemporaryUI = () => {
            if (globalNavRef.value) globalNavRef.value.classList.add('active-ui');
            if (timeIndicatorRef.value) timeIndicatorRef.value.classList.add('active-ui');
            clearTimeout(uiActiveTimer);
            uiActiveTimer = setTimeout(() => {
                if (globalNavRef.value) globalNavRef.value.classList.remove('active-ui');
                if (timeIndicatorRef.value) timeIndicatorRef.value.classList.remove('active-ui');
            }, 3000); 
        };
        
        const createClickRipple = (x,y,s=100) => { 
            const inkDiffusion = document.createElement('div'); 
            inkDiffusion.classList.add('ink-diffusion'); 
            const finalSize = s * (0.9 + Math.random()*0.3) * (isMobile.value ? 0.75:1); 
            inkDiffusion.style.width=finalSize+'px'; 
            inkDiffusion.style.height=finalSize+'px'; 
            inkDiffusion.style.left=x+'px'; 
            inkDiffusion.style.top=y+'px'; 
            inkDiffusion.style.transform = `translate(-50%, -50%) rotate(${Math.random()*360}deg)`; 
            document.body.appendChild(inkDiffusion); 
            inkDiffusion.onanimationend = () => { if(inkDiffusion.parentElement) inkDiffusion.parentElement.removeChild(inkDiffusion);}; 
            
            if (!isMobile.value || Math.random() > 0.4) { 
                const inkDiffSec = document.createElement('div'); 
                inkDiffSec.classList.add('ink-diffusion', 'ink-diffusion-secondary'); 
                inkDiffSec.style.width=(finalSize*1.25)+'px'; 
                inkDiffSec.style.height=(finalSize*1.25)+'px'; 
                inkDiffSec.style.left=x+'px'; 
                inkDiffSec.style.top=y+'px'; 
                inkDiffSec.style.transform = `translate(-50%, -50%) rotate(${Math.random()*360}deg)`; 
                document.body.appendChild(inkDiffSec); 
                inkDiffSec.onanimationend = () => {if(inkDiffSec.parentElement) inkDiffSec.parentElement.removeChild(inkDiffSec);};
            }
            
            const inkDiffLight = document.createElement('div'); 
            inkDiffLight.classList.add('ink-diffusion', 'ink-diffusion-light'); 
            inkDiffLight.style.width=(finalSize*0.7)+'px'; 
            inkDiffLight.style.height=(finalSize*0.7)+'px'; 
            inkDiffLight.style.left=x+'px'; 
            inkDiffLight.style.top=y+'px'; 
            inkDiffLight.style.transform = `translate(-50%, -50%) rotate(${Math.random()*360}deg)`; 
            document.body.appendChild(inkDiffLight); 
            inkDiffLight.onanimationend = () => {if(inkDiffLight.parentElement) inkDiffLight.parentElement.removeChild(inkDiffLight);};
            
            if (!isMobile.value || Math.random() > 0.6) { 
                const featherCount = isMobile.value ? 1 : (1 + Math.floor(Math.random() * 2)); 
                for (let i = 0; i < featherCount; i++) createInkFeather(x, y, finalSize); 
                
                const dropletCountMax = isMobile.value ? 1 : (1 + Math.floor(Math.random() * 2)); 
                createInkDroplets(x, y, dropletCountMax);
            }
        }; 

        const createInkFeather = (x,y,parentSize) => { 
            const feather = document.createElement('div'); 
            feather.classList.add('ink-diffusion-feather'); 
            const size = 2.5 + Math.random()*5; 
            feather.style.width=size+'px'; 
            feather.style.height=size+'px'; 
            const angle = Math.random()*Math.PI*2; 
            const dist = parentSize*0.1*(0.1 + Math.random()*0.2); 
            feather.style.left = (x+Math.cos(angle)*dist)+'px'; 
            feather.style.top = (y+Math.sin(angle)*dist)+'px'; 
            const featherDist = 10+Math.random()*25; 
            feather.style.setProperty('--feather-x', `${Math.cos(angle)*featherDist}px`); 
            feather.style.setProperty('--feather-y', `${Math.sin(angle)*featherDist}px`); 
            document.body.appendChild(feather); 
            feather.onanimationend = () => {if(feather.parentElement) feather.parentElement.removeChild(feather);};
        };

        const createInkDroplets = (x,y,count=3) => { for(let i=0;i<count;i++){ const d=document.createElement('div');d.classList.add('ink-droplet'); d.style.width=`${2+Math.random()*3}px`;d.style.height=`${2+Math.random()*3}px`;d.style.opacity=0.35+Math.random()*0.45;d.style.left=`${x}px`;d.style.top=`${y}px`;d.style.backgroundColor=`var(--trail-color)`;const a=Math.random()*Math.PI*2;const dist=25+Math.random()*70;d.style.setProperty('--fly-x',`${Math.cos(a)*dist}px`);d.style.setProperty('--fly-y',`${Math.sin(a)*dist}px`);document.body.appendChild(d);d.onanimationend=()=>{if(d.parentElement)d.parentElement.removeChild(d);};}}; 
        
        // 右键出现诗词掉落效果，诗句来源于 textManager
        let lastFallingPoem = ''; // 用于记录上一次掉落的诗句
        const createFallingPoem = async (x, y) => {
            let poemText = '';
            // 使用textManager获取诗词内容
            try {
                if (typeof textManager !== 'undefined' && textManager.getRandomPoem) {
                    poemText = await textManager.getRandomPoem();
                    // 如果获取的诗句与上一次相同，尝试再获取一次
                    if (poemText === lastFallingPoem) {
                        await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟，避免API调用过于频繁
                        poemText = await textManager.getRandomPoem(); 
                    }
                }
            } catch (e) {
                console.error('获取诗词失败:', e);
            }
            // 如果获取失败或仍然重复，使用备用内容
            if (!poemText || poemText === lastFallingPoem) {
                const fallbackPoems = ["落花人独立，微雨燕双飞。","春风又绿江南岸，明月何时照我还。","会当凌绝顶，一览众山小。","人生若只如初见，何事秋风悲画扇。"];
                // 从备用诗句中选择一个与上一次不同的
                let attempts = 0;
                do {
                    poemText = fallbackPoems[Math.floor(Math.random() * fallbackPoems.length)];
                    attempts++;
                } while (poemText === lastFallingPoem && attempts < fallbackPoems.length * 2); // 防止无限循环
            }
            lastFallingPoem = poemText; // 更新上一次掉落的诗句
            
            // === 优雅诗词动画：从上方缓缓进入 + 文字分解飘散 ===
            
            // 创建诗词容器
            const poemContainer = document.createElement('div');
            poemContainer.style.position = 'absolute';
            
            // 智能定位：确保诗句不会出现在屏幕外
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const estimatedPoemWidth = poemText.length * (isMobile.value ? 20 : 25); // 估算诗句宽度
            const estimatedPoemHeight = 60; // 估算诗句高度
            
            // 水平位置调整：确保诗句完全在屏幕内
            let adjustedX = x;
            if (x - estimatedPoemWidth / 2 < 20) {
                // 左侧边界保护：如果会超出左边界，调整到安全位置
                adjustedX = estimatedPoemWidth / 2 + 20;
            } else if (x + estimatedPoemWidth / 2 > viewportWidth - 20) {
                // 右侧边界保护：如果会超出右边界，调整到安全位置
                adjustedX = viewportWidth - estimatedPoemWidth / 2 - 20;
            }
            
            // 垂直位置调整：确保有足够空间向上飘散
            let adjustedY = y;
            if (y < estimatedPoemHeight + 50) {
                // 顶部边界保护：确保有足够空间显示和飘散
                adjustedY = estimatedPoemHeight + 50;
            } else if (y > viewportHeight - 50) {
                // 底部边界保护
                adjustedY = viewportHeight - 50;
            }
            
            poemContainer.style.left = adjustedX + 'px';
            poemContainer.style.top = adjustedY + 'px';
            poemContainer.style.transform = 'translateX(-50%)';
            poemContainer.style.pointerEvents = 'none';
            poemContainer.style.zIndex = '1001';
            poemContainer.style.fontFamily = '"STKaiti", "KaiTi", "FangSong", serif';
            poemContainer.style.fontSize = isMobile.value ? '1.3rem' : '1.6rem';
            poemContainer.style.fontWeight = '400';
            poemContainer.style.letterSpacing = '0.2em';
            poemContainer.style.lineHeight = '1.8';
            poemContainer.style.textAlign = 'center';
            document.body.appendChild(poemContainer);

            // 处理换行符，将诗句按行分割并创建对应的行容器
            const lines = poemText.split('\n');
            const charElements = [];
            const charData = []; // 存储每个字符的飘散数据
            
            // 智能排版：根据行长度差异调整对齐方式
            const lineLengths = lines.map(line => line.length);
            
            lines.forEach((line, lineIndex) => {
                // 为每行创建一个容器
                const lineContainer = document.createElement('div');
                lineContainer.style.display = 'block';
                
                // 智能对齐逻辑
                if (lineIndex === 0) {
                    // 第一行始终居中
                    lineContainer.style.textAlign = 'center';
                } else if (lineIndex === 1 && lines.length >= 2) {
                    // 第二行根据与第一行的字数差异进行调整
                    const firstLineLength = lineLengths[0];
                    const secondLineLength = lineLengths[1];
                    const lengthDiff = secondLineLength - firstLineLength;
                    
                    if (lengthDiff <= 2) {
                        // 字数差异不大时，右对齐（顶格处理）
                        lineContainer.style.textAlign = 'right';
                        lineContainer.style.paddingRight = '0';
                    } else if (lengthDiff > 2 && lengthDiff <= 6) {
                        // 字数差异中等时，稍微向右偏移
                        lineContainer.style.textAlign = 'center';
                        lineContainer.style.transform = 'translateX(15px)';
                    } else {
                        // 字数差异很大时，明显向右移动
                        lineContainer.style.textAlign = 'center';
                        lineContainer.style.transform = 'translateX(25px)';
                    }
                } else {
                    // 其他行（如果有）保持居中
                    lineContainer.style.textAlign = 'center';
                }
                
                poemContainer.appendChild(lineContainer);
                
                // 将每行拆分为单个字符
                const lineCharacters = Array.from(line);
                lineCharacters.forEach((char, charIndex) => {
                    const charElement = document.createElement('span');
                    charElement.textContent = char;
                    charElement.style.display = 'inline-block';
                    charElement.style.opacity = '0';
                    charElement.style.transform = 'translateY(-30px)'; // 从上方开始
                    charElement.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    
                    // 传统水墨色彩：深浅不一的墨色
                // 优化字体颜色，提高夜间可读性，选择柔和且对比度适中的颜色
                const inkShades = [
                    '#B0BEC5', // 浅灰蓝 (类似宣纸底色上的淡墨)
                    '#CFD8DC', // 更浅的灰蓝
                    '#ECEFF1', // 极浅的灰蓝 (接近白色，但更柔和)
                    '#90A4AE', // 稍深的灰蓝 (用于文字间的细微差别)
                    '#BDBDBD'  // 中性浅灰 (备选，增加多样性)
                ];
                
                    charElement.style.color = inkShades[Math.floor(Math.random() * inkShades.length)];
                    
                    // 为文字添加传统毛笔质感
                    charElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.1), 0 0 3px rgba(0,0,0,0.05)';
                    
                    lineContainer.appendChild(charElement);
                    charElements.push(charElement);
                    
                    // 为每个字符预设飘散数据，避免每帧重新计算
                    charData.push({
                        element: charElement,
                        // 预设的默认飘散方向（向上为主，略带随机性）
                        defaultDirX: (Math.random() - 0.5) * 0.4,
                        defaultDirY: -0.8 - Math.random() * 0.4,
                        // 当前的飘散方向（会受鼠标影响）
                        currentDirX: 0,
                        currentDirY: 0,
                        // 累积位移
                        totalOffsetX: 0,
                        totalOffsetY: 0,
                        // 飘散速度（每个字符略有不同）
                        speed: 0.8 + Math.random() * 0.4,
                        // 撞击相关属性
                        bounced: false, // 是否已经撞击过
                        bounceTime: 0 // 撞击时间
                    });
                });
            });

            let animationFrameId;
            const totalDuration = 4000; // 总时长4秒
            const appearDuration = 800;  // 从上方进入0.8秒
            const stayDuration = 2000;   // 静止停留1秒
            const scatterDuration = 2000; // 分解飘散2.2秒
            
            const startTime = Date.now();
            let isScattering = false;
            
            const animateElegantPoetry = () => {
                const currentTime = Date.now();
                const elapsedTime = currentTime - startTime;
                
                if (elapsedTime < appearDuration) {
                    // 阶段1：诗句从上方缓缓进入
                    const progress = elapsedTime / appearDuration;
                    const charsToShow = Math.floor(progress * charElements.length);
                    
                    charElements.forEach((charEl, index) => {
                        if (index <= charsToShow) {
                            const charProgress = Math.min((progress * charElements.length - index), 1);
                            if (charProgress > 0) {
                                const easeIn = 1 - Math.pow(1 - charProgress, 2);
                                charEl.style.opacity = easeIn.toString();
                                charEl.style.transform = `translateY(${(1 - easeIn) * -30}px)`;
                            }
                        }
                    });
                    
                } else if (elapsedTime < appearDuration + stayDuration) {
                    // 阶段2：静止停留（去除律动）
                    charElements.forEach((charEl) => {
                        charEl.style.opacity = '1';
                        charEl.style.transform = 'translateY(0px)';
                    });
                    
                } else if (elapsedTime < totalDuration) {
                    // 阶段3：文字分解并向右上角飘散（像被风吹走）
                    if (!isScattering) {
                        isScattering = true;
                        // 初始化每个字符的飘散数据
                        charData.forEach((data, index) => {
                            // 每个字符的随机性（基于索引生成固定但看似随机的值）
                            const randomSeed = (index * 7 + 13) % 100;
                            data.randomOffsetX = (randomSeed % 20 - 10) * 0.02; // -0.2 到 0.2 的随机偏移
                            data.randomOffsetY = ((randomSeed * 3) % 20 - 10) * 0.02;
                            data.randomSpeedMultiplier = 0.7 + (randomSeed % 60) * 0.01; // 0.7 到 1.3 的速度倍数
                            data.currentSpeed = 0; // 初始速度为0
                        });
                    }
                    
                    const scatterElapsed = elapsedTime - appearDuration - stayDuration;
                    const scatterProgress = scatterElapsed / scatterDuration;
                    
                    charData.forEach((data, index) => {
                        const charEl = data.element;
                        
                        // 低初始速度，固定加速度
                        const initialSpeed = 0.1; // 很低的初始速度
                        const acceleration = 0.002; // 固定加速度
                        data.currentSpeed = initialSpeed + acceleration * scatterElapsed;
                        
                        // 应用随机性的飘散方向和速度
                        const finalSpeed = data.currentSpeed * data.randomSpeedMultiplier;
                        const deltaOffsetX = finalSpeed * (0.8 + data.randomOffsetX); // 向右，带随机性
                        const deltaOffsetY = finalSpeed * (-0.6 + data.randomOffsetY); // 向上，带随机性
                        
                        // 累积位移
                        data.totalOffsetX += deltaOffsetX;
                        data.totalOffsetY += deltaOffsetY;
                        
                        // 渐隐程度与速度成正比
                        const speedBasedFade = Math.min(data.currentSpeed * 8, 1); // 速度越快，渐隐越明显
                        const opacity = Math.max(1 - speedBasedFade, 0);
                        
                        // 轻微缩放和旋转，增加随机性
                        const scale = Math.max(1 - scatterProgress * 0.3, 0.3);
                        const rotation = scatterProgress * 20 * data.randomSpeedMultiplier + 
                                       (index % 2 === 0 ? 1 : -1) * Math.sin(scatterProgress * Math.PI) * 8;
                        
                        // 模糊效果也与速度相关
                        const blurAmount = data.currentSpeed > 0.5 ? (data.currentSpeed - 0.5) * 6 : 0;
                        
                        // 应用变换
                        charEl.style.opacity = opacity.toString();
                        charEl.style.transform = `translateX(${data.totalOffsetX}px) translateY(${data.totalOffsetY}px) scale(${scale}) rotate(${rotation}deg)`;
                        charEl.style.filter = `blur(${blurAmount}px)`;
                    });
                    
                } else {
                    // 动画结束，清理元素
                    if (poemContainer.parentElement) {
                        poemContainer.parentElement.removeChild(poemContainer);
                    }
                    cancelAnimationFrame(animationFrameId);
                    return;
                }
                
                animationFrameId = requestAnimationFrame(animateElegantPoetry);
            };
            
            // 开始优雅诗词动画
            animationFrameId = requestAnimationFrame(animateElegantPoetry);
        };

        const createSharpTrail = (x,y,angle) => { const t=document.createElement('div');t.classList.add('sharp-trail');t.style.left=x+'px';t.style.top=y+'px';t.style.transform=`rotate(${angle}deg)`;t.style.background=`linear-gradient(90deg, var(--trail-color) 0%, rgba(255,255,255,0.7) 100%)`;t.style.height=`${1+Math.random()*1.5}px`;document.body.appendChild(t);if(Math.random()>0.3){const sT=document.createElement('div');sT.classList.add('sharp-trail');const oA=angle+(Math.random()*20-10);const oD=10+Math.random()*15;sT.style.left=(x+Math.cos(oA*Math.PI/180)*oD)+'px';sT.style.top=(y+Math.sin(oA*Math.PI/180)*oD)+'px';sT.style.transform=`rotate(${oA}deg)`;sT.style.width='8px';sT.style.height='1px';sT.style.opacity='0.85';document.body.appendChild(sT);sT.onanimationend=()=>{if(sT.parentElement)sT.parentElement.removeChild(sT);};}t.onanimationend=()=>{if(t.parentElement)t.parentElement.removeChild(t);};}; 
        const createParticles = (x,y,count=3) => { for(let i=0;i<count;i++){const p=document.createElement('div');p.classList.add('mouse-particle');const oX=(Math.random()-0.5)*10;const oY=(Math.random()-0.5)*10;p.style.left=(x+oX)+'px';p.style.top=(y+oY)+'px';const a=Math.random()*Math.PI*2;const d=20+Math.random()*30;p.style.setProperty('--particle-x',`${Math.cos(a)*d}px`);p.style.setProperty('--particle-y',`${Math.sin(a)*d}px`);document.body.appendChild(p);p.onanimationend=()=>{if(p.parentElement)p.parentElement.removeChild(p);};}};
        const createInkStain = (x,y,size=8) => { const s=document.createElement('div');s.classList.add('ink-stain');s.style.width=`${size}px`;s.style.height=`${size}px`;s.style.left=`${x}px`;s.style.top=`${y}px`;document.body.appendChild(s);s.onanimationend=()=>{if(s.parentElement)s.parentElement.removeChild(s);};}; 
        
        const handleUserInteractionStart = () => {
            isMouseStopped.value = false;
            isIdleModeActive.value = false; 
            clearTimeout(mouseStopTimerId);
            clearTimeout(idleAnimationTimerId);
        };

        const handleUserInteractionEnd = () => {
            clearTimeout(mouseStopTimerId);
            clearTimeout(idleAnimationTimerId); 

            mouseStopTimerId = setTimeout(() => {
                isMouseStopped.value = true;
                idleAnimationTimerId = setTimeout(() => {
                    if (isMouseStopped.value) { 
                        isIdleModeActive.value = true;
                    }
                }, IDLE_ANIMATION_DELAY);
            }, MOUSE_STOP_DELAY);
        };


        const updateCursorPosition = (e) => {
            if (!isPageVisible) return;
            activateTemporaryUI(); 
            handleUserInteractionStart(); 

            const eventX = e.clientX; const eventY = e.clientY;
            const prevRawX = mouseX.value; const prevRawY = mouseY.value; 
            mouseX.value = eventX; mouseY.value = eventY; 
            normalizedMouseX.value = (eventX / window.innerWidth) * 2 - 1;
            normalizedMouseY.value = -(eventY / window.innerHeight) * 2 + 1; 
            const dx = eventX - prevRawX; const dy = eventY - prevRawY;
            mouseSpeed.value = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            if (mouseSpeed.value > 8) { 
                clearTimeout(trailTimer);
                trailTimer = setTimeout(() => {
                    createSpeedRipple(eventX, eventY, mouseSpeed.value);
                    if (mouseSpeed.value > 25 && dropletCount % (isMobile.value ? 5 : 3) === 0) { createInkDroplets(eventX, eventY, isMobile.value ? 1 : 2); createParticles(eventX, eventY, isMobile.value ? 2 : 3); }
                    dropletCount++; lastMouseX.value = eventX; lastMouseY.value = eventY; 
                }, isMobile.value ? 70 : 40); 
            }
            if (mouseSpeed.value > (isMobile.value ? 4 : 3) ) { 
                setTimeout(() => {
                    createMouseTrail(eventX, eventY, mouseSpeed.value);
                    if (isMouseDown.value && isLongPressing) { createSharpTrail(eventX, eventY, angle); if (Math.random() < 0.08) createInkStain(eventX, eventY); }
                }, isMobile.value ? 30 : 15);
            }
            checkTimeIndicatorProximity(e); 
            checkWelcomeProximity(eventX); 
            updateLeftWordScroll(eventX, eventY);
            
            // 添加线条燃烧效果交互
            if (scene && camera && particlesData.length > 0 && coreAnchors.length > 0) {
                triggerLineBurningEffect(eventX, eventY);
            }

            handleUserInteractionEnd(); 
        };

        const createMouseTrail = (x,y,speed) => { const t=document.createElement('div');t.classList.add('mouse-trail');t.style.left=x+'px';t.style.top=y+'px';const l=Math.min(30,Math.max(10,speed*1));const dX=x-lastMouseX.value;const dY=y-lastMouseY.value;const a=Math.atan2(dY,dX)*(180/Math.PI);t.style.transform=`rotate(${a}deg)`;t.style.width=`${l}px`;t.style.background=`linear-gradient(90deg, var(--trail-color) 0%, rgba(255, 255, 255, 0.6) 100%)`;document.body.appendChild(t);t.onanimationend=()=>{if(t.parentElement)t.parentElement.removeChild(t);};};
        const checkTimeIndicatorProximity = (e) => { if (!timeIndicatorRef.value) return; const r=timeIndicatorRef.value.getBoundingClientRect(); const th=50; const isNear=e.clientX>r.left-th&&e.clientX<r.right+th&&e.clientY>r.top-th&&e.clientY<r.bottom+th; if(isNear){ timeIndicatorRef.value.classList.add('active-ui'); } };
        const createInkSplash = (x,y,s=50) => { const sp=document.createElement('div');sp.classList.add('ink-splash');sp.style.width=s+'px';sp.style.height=s+'px';sp.style.left=x+'px';sp.style.top=y+'px';sp.style.background=`radial-gradient(circle, var(--trail-color) 0%, transparent 70%)`;document.body.appendChild(sp);sp.onanimationend=()=>{if(sp.parentElement)sp.parentElement.removeChild(sp);};}; 
        const createSpeedRipple = (x,y,speed) => { if(speed<8)return;const r=document.createElement('div');r.classList.add('click-ripple');const s=Math.min(250,Math.max(80,speed*3));r.style.width=`${s}px`;r.style.height=`${s}px`;r.style.left=`${x}px`;r.style.top=`${y}px`;r.style.background=`radial-gradient(circle, var(--trail-color) 0%, transparent 70%)`;const dX=x-lastMouseX.value;const dY=y-lastMouseY.value;const a=Math.atan2(dY,dX)*(180/Math.PI);const sF=Math.min(2.5,Math.max(1,speed*0.06));r.style.transform=`translate(-50%, -50%) rotate(${a}deg) scale(${sF},1)`;document.body.appendChild(r);r.onanimationend=()=>{if(r.parentElement)r.parentElement.removeChild(r);};};
        
        watch(currentTheme, (newTheme) => {
            Object.keys(newTheme).forEach(k => {
                if (k !== 'name' && k !== 'skyTop') {
                    document.documentElement.style.setProperty(`--current-${k.replace('Color','-color').toLowerCase()}`, newTheme[k]);
                    if (k === 'bgColor' || k === 'textColor' || k === 'accentColor' || k === 'shadowColor') { // Added shadowColor
                        const colorValue = newTheme[k];
                        document.documentElement.style.setProperty(`--current-${k.replace('Color','-color').toLowerCase()}-rgb`, parseColorToRgbString(colorValue));
                    }
                }
            });
            updateDynamicColors(); 
        }, {immediate:true,deep:true});
        
        const handleVisibilityChange = () => {
            isPageVisible = document.visibilityState === 'visible';
            // 开发模式：在控制台运行时强制设为可见
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                isPageVisible = true;
            }
        };
        const handleMouseDown = (e) => { 
            isMouseDown.value=true;
            isLongPressing=true; 
            handleUserInteractionStart();
            
            if (scene && camera && particlesData.length > 0 && coreAnchors.length > 0) {
                triggerLineBurningEffect(e.clientX, e.clientY);
            }
        }; 
        const handleMouseUp = () => {isMouseDown.value=false;isLongPressing=false; handleUserInteractionEnd();};
        
        const handleTouchStart = (e) => {
            if(!isPageVisible)return;activateTemporaryUI();isTouchActive.value=true;isMouseDown.value=true;
            handleUserInteractionStart();
            const t=e.touches[0];mouseX.value=t.clientX;mouseY.value=t.clientY;
            normalizedMouseX.value=(t.clientX/window.innerWidth)*2-1;normalizedMouseY.value=-(t.clientY/window.innerHeight)*2+1;
            lastMouseX.value=t.clientX;lastMouseY.value=t.clientY;
            clearTimeout(longPressTimer);longPressTimer=setTimeout(()=>{
                isLongPressing=true;
                createInkStain(mouseX.value,mouseY.value,12);
                // For touch long press, use ink stain effect instead of poem drop to avoid spam
            },500); 
            updateLeftWordScroll(t.clientX, t.clientY);
            if (scene && camera && particlesData.length > 0 && coreAnchors.length > 0) {
                triggerLineBurningEffect(t.clientX, t.clientY);
            }
        };
        const handleTouchMove = (e) => {
            if(!isPageVisible||!isTouchActive.value)return;activateTemporaryUI();e.preventDefault();
            handleUserInteractionStart();
            const t=e.touches[0];const pX=mouseX.value;const pY=mouseY.value;
            mouseX.value=t.clientX;mouseY.value=t.clientY;
            normalizedMouseX.value=(t.clientX/window.innerWidth)*2-1;normalizedMouseY.value=-(t.clientY/window.innerHeight)*2+1;
            const dX=mouseX.value-pX;const dY=mouseY.value-pY;mouseSpeed.value=Math.sqrt(dX*dX+dY*dY);
            const a=Math.atan2(dY,dX)*(180/Math.PI);
            if(mouseSpeed.value>2){createMouseTrail(mouseX.value,mouseY.value,mouseSpeed.value);if(isLongPressing){createSharpTrail(mouseX.value,mouseY.value,a);if(Math.random()<0.1)createInkStain(mouseX.value,mouseY.value);}if(mouseSpeed.value>10){clearTimeout(trailTimer);trailTimer=setTimeout(()=>{createSpeedRipple(mouseX.value,mouseY.value,mouseSpeed.value);lastMouseX.value=mouseX.value;lastMouseY.value=mouseY.value;},50);}}
            checkTimeIndicatorProximity({clientX:t.clientX,clientY:t.clientY});checkWelcomeProximity(t.clientX);updateLeftWordScroll(t.clientX, t.clientY);
            handleUserInteractionEnd(); 
        };
        const handleTouchEnd = (e) => {
            isTouchActive.value=false;isMouseDown.value=false;isLongPressing=false;clearTimeout(longPressTimer);
            if(!isLongPressing&&e.changedTouches.length>0){const t=e.changedTouches[0];createClickRipple(t.clientX,t.clientY,120);createParticles(t.clientX,t.clientY,isMobile.value?4:8);}
            handleUserInteractionEnd();
        };
        const handleTouchCancel = () => {
            isTouchActive.value=false;isMouseDown.value=false;isLongPressing=false;clearTimeout(longPressTimer);
            handleUserInteractionEnd();
        };
        
        let scene, camera, renderer, particleSystem, linesMesh;
        const particlesData = [];
        const coreAnchors = []; 

        const PARTICLE_COUNT = ref(isMobile.value ? 120 : 250); 
        const NUM_CORE_ANCHORS = ref(isMobile.value ? 4 : 6); 
        const MAX_PARTICLE_CONNECTIONS_PER_ANCHOR = ref(isMobile.value ? 3 : 5);
        const ANCHOR_INFLUENCE_RADIUS_SQ = ref(isMobile.value ? (3.5*3.5) : (5*5));
        const INTER_ANCHOR_CONNECTION_THRESHOLD_SQ = ref(isMobile.value ? (6*6) : (10*10));
        const PARTICLE_TO_PARTICLE_THRESHOLD_SQ = ref(isMobile.value ? (1.8*1.8) : (2.5*2.5)); 
        const MAX_PARTICLE_TO_PARTICLE_CONNECTIONS = ref(isMobile.value ? 60 : 150); 

        const MOUSE_REPEL_FORCE = 0.12; 
        const RANDOM_WALK_SPEED_FACTOR = 0.010; 
        const MOUSE_LINE_FADE_RADIUS = 5.0; 

        const LINE_SPARK_COLOR = new THREE.Color(0xffffff); // White spark for initial impact
        const LINE_EMBER_COLOR = new THREE.Color(0xffcc00); // Brighter Ember/Gold for more visibility
        const BURN_SPREAD_SPEED = 4.5; // units per second, increased for faster spread
        const LINE_BURN_DURATION_AT_POINT = 1.3; // seconds for burn effect at a point (spark -> ember -> fade) 
        const SMUDGE_INTERACTION_RADIUS_SQ = ref(isMobile.value ? (1.0*1.0) : (1.8*1.8)); 

        const PARTICLE_PARAMS = { 
            normal:  { randomWalkStrength: 0.0015, friction: 0.93, maxVelocity: 0.11, lerpFactorMultiplier: 1.0  },
            stopped: { randomWalkStrength: 0.0004, friction: 0.95, maxVelocity: 0.07, lerpFactorMultiplier: 1.5  },
            idle:    { randomWalkStrength: 0.0003, friction: 0.96, maxVelocity: 0.05, lerpFactorMultiplier: 1.3  } 
        };

        const tempVec = new THREE.Vector3();
        const tempVec2 = new THREE.Vector3();
        const tempColor = new THREE.Color();

        function smoothMouseUpdate() {
            const lerpAmount = 0.18; 
            smoothedMouseX.value += (normalizedMouseX.value - smoothedMouseX.value) * lerpAmount;
            smoothedMouseY.value += (normalizedMouseY.value - smoothedMouseY.value) * lerpAmount;
            requestAnimationFrame(smoothMouseUpdate);
        }
        
        const initThree = () => { 
            const canvas = document.getElementById('three-bg');
            if (!canvas) { console.error("#three-bg canvas not found."); return; }
            try {
                scene = new THREE.Scene(); 
                camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); 
                renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); 
                renderer.setSize(window.innerWidth, window.innerHeight); 
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
                renderer.setClearColor(0x000000, 0); 
            } catch (error) { console.error("Three.js init error:", error); if(canvas) canvas.style.display = 'none'; return; }
            
            const inkDotSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><defs><filter id="blurFilter"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5"/></filter></defs><circle cx="32" cy="32" r="20" fill="rgba(255,255,255,0.1)" filter="url(#blurFilter)"/><circle cx="30" cy="30" r="18" fill="rgba(255,255,255,0.2)" /><circle cx="34" cy="35" r="15" fill="rgba(255,255,255,0.3)" /><circle cx="32" cy="32" r="12" fill="rgba(255,255,255,0.6)" /><circle cx="28" cy="33" r="10" fill="rgba(255,255,255,0.45)" /></svg>`;
            const pointTextureValue = new THREE.TextureLoader().load('data:image/svg+xml;base64,' + btoa(inkDotSVG));

            const particleGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(PARTICLE_COUNT.value * 3);
            const particleColors = new Float32Array(PARTICLE_COUNT.value * 3); 
            const sizes = new Float32Array(PARTICLE_COUNT.value);
            const alphas = new Float32Array(PARTICLE_COUNT.value);
           
            particlesData.length = 0; 
            for (let i = 0; i < PARTICLE_COUNT.value; i++) {
                const i3 = i * 3;
                const x = (Math.random() - 0.5) * 15; 
                const y = (Math.random() - 0.5) * 15;
                const initialZ = (Math.random() - 0.5) * 22;

                positions[i3 + 0] = x; positions[i3 + 1] = y; positions[i3 + 2] = initialZ;
                const baseSize = isMobile.value ? (0.7 + Math.random() * 1.0) : (0.9 + Math.random() * 1.8);
                sizes[i] = baseSize * Math.max(0.25, (1.0 - Math.abs(initialZ) / 22.0 * 0.75));
                alphas[i] = 0.2 + Math.random() * 0.30 * Math.max(0.15, (1.0 - Math.abs(initialZ) / 22.0 * 0.65));
                particleColors[i3 + 0] = 1.0; particleColors[i3 + 1] = 1.0; particleColors[i3 + 2] = 1.0;

                particlesData.push({
                    id: i, 
                    originalX: x, originalY: y, originalZ: initialZ,
                    currentPos: new THREE.Vector3(x, y, initialZ), 
                    velocity: new THREE.Vector3(),
                    targetPos: new THREE.Vector3(x, y, initialZ), 
                    lerpFactor: 0.02 + Math.random() * 0.03, 
                    randomWalkPhaseX: Math.random() * Math.PI * 2,
                    randomWalkPhaseY: Math.random() * Math.PI * 2,
                    randomWalkPhaseZ: Math.random() * Math.PI * 2,
                    baseSize: baseSize, baseAlpha: alphas[i],
                    lastInteractionTime: 0,
                    connectionStrength: 0,
                    burnEffect: null 
                });
            }
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3)); 
            particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
            particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
            particleGeometry.setAttribute('connectionStrength', new THREE.Float32BufferAttribute(new Float32Array(PARTICLE_COUNT.value).fill(0), 1));


            const particleMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    pointTexture: { value: pointTextureValue },
                    globalColor: { value: new THREE.Color(0xffffff) },
                    globalOpacity: { value: 0.65 }, 
                    time: { value: 0.0 }
                },
                vertexShader: `
                    attribute float size; /* attribute vec3 color; */ attribute float alpha; attribute float connectionStrength; // color 由 three.js 自动处理
                    varying vec3 vColor; varying float vFinalAlpha; uniform float time;
                    void main() {
                        vColor = color; // color attribute 由 three.js 自动提供
                        vFinalAlpha = alpha + connectionStrength * 0.5; 
                        vFinalAlpha = clamp(vFinalAlpha, 0.1, 0.9);
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        float pulse = 0.9 + sin(time * 0.5 + mvPosition.x * 0.1 + mvPosition.y * 0.07) * 0.1;
                        gl_PointSize = size * pulse * (300.0 / -mvPosition.z); 
                        gl_PointSize = max(1.0, gl_PointSize); 
                        gl_Position = projectionMatrix * mvPosition;
                    }`,
                fragmentShader: `
                    uniform sampler2D pointTexture; uniform vec3 globalColor; uniform float globalOpacity;
                    varying vec3 vColor; varying float vFinalAlpha;
                    void main() {
                        vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                        gl_FragColor = vec4(globalColor * vColor, texColor.a * vFinalAlpha * globalOpacity); 
                        if (gl_FragColor.a < 0.001) discard;
                    }`,
                blending: THREE.AdditiveBlending, depthTest: false, transparent: true, vertexColors: true 
            });
            particleSystem = new THREE.Points(particleGeometry, particleMaterial);
            scene.add(particleSystem);

            coreAnchors.length = 0;
            for (let i = 0; i < NUM_CORE_ANCHORS.value; i++) {
                coreAnchors.push({
                    id: `anchor_${i}`, 
                    position: new THREE.Vector3(
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 10,
                        (Math.random() - 0.5) * 10
                    ),
                    targetPosition: new THREE.Vector3(),
                    velocity: new THREE.Vector3(),
                    freqX: 0.05 + Math.random() * 0.05, ampX: 5 + Math.random() * 5, phaseX: Math.random() * Math.PI * 2,
                    freqY: 0.05 + Math.random() * 0.05, ampY: 5 + Math.random() * 5, phaseY: Math.random() * Math.PI * 2,
                    freqZ: 0.03 + Math.random() * 0.03, ampZ: 4 + Math.random() * 4, phaseZ: Math.random() * Math.PI * 2,
                    lerpFactor: 0.01 + Math.random() * 0.01,
                    burnEffect: null 
                });
            }
            
            const maxTotalLines = (NUM_CORE_ANCHORS.value * MAX_PARTICLE_CONNECTIONS_PER_ANCHOR.value) + 
                                  (NUM_CORE_ANCHORS.value * (NUM_CORE_ANCHORS.value - 1) / 2) +
                                  MAX_PARTICLE_TO_PARTICLE_CONNECTIONS.value; 

            const lineMaterial = new THREE.LineBasicMaterial({ 
                transparent: true, 
                opacity: 0.15, 
                blending: THREE.AdditiveBlending,
                depthTest: false,
                vertexColors: true 
            });
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(maxTotalLines * 2 * 3), 3));
            lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(maxTotalLines * 2 * 3), 3)); 
            
            linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
            scene.add(linesMesh);

            camera.position.z = 12; 
            animateThree(); 
        };

        const animateThree = () => { 
            if (!scene || !camera || !renderer || !particleSystem || !linesMesh) return;
            requestAnimationFrame(animateThree);

            const time = Date.now() * 0.0005; 
            const actualTime = Date.now() * 0.001; 
            if (particleSystem.material.uniforms.time) particleSystem.material.uniforms.time.value = time;

            const positionsAttr = particleSystem.geometry.attributes.position;
            const alphaAttr = particleSystem.geometry.attributes.alpha;
            const connectionStrengthAttr = particleSystem.geometry.attributes.connectionStrength;
            
            for(let i=0; i < PARTICLE_COUNT.value; i++) particlesData[i].connectionStrength = 0;

            const shichenColorValue = getComputedStyle(document.documentElement).getPropertyValue('--current-shichen-color').trim();
            const baseLineColor = new THREE.Color(shichenColorValue || 0xffffff); 
            
            if (shichenColorValue) {
                particleSystem.material.uniforms.globalColor.value.set(shichenColorValue);
            }
            
            let globalOpacityBase = 0.65;
            if (isIdleModeActive.value) globalOpacityBase = 0.7 + Math.sin(time * 0.2) * 0.1;
            else if (isMouseStopped.value) globalOpacityBase = 0.6;
            else globalOpacityBase = 0.5; 
            particleSystem.material.uniforms.globalOpacity.value = globalOpacityBase;

            const MOUSE_INFLUENCE_RADIUS_SQ = 2.0 * 2.0; 
            
            let currentParams;
            if (isIdleModeActive.value) currentParams = PARTICLE_PARAMS.idle;
            else if (isMouseStopped.value) currentParams = PARTICLE_PARAMS.stopped;
            else currentParams = PARTICLE_PARAMS.normal;

            const mouseWorld = new THREE.Vector3(
                smoothedMouseX.value * (window.innerWidth / window.innerHeight) * camera.position.z / 1.5, 
                smoothedMouseY.value * camera.position.z / 1.5, 0
            );

            coreAnchors.forEach(anchor => {
                anchor.targetPosition.x = Math.sin(actualTime * anchor.freqX + anchor.phaseX) * anchor.ampX;
                anchor.targetPosition.y = Math.cos(actualTime * anchor.freqY + anchor.phaseY) * anchor.ampY;
                anchor.targetPosition.z = Math.sin(actualTime * anchor.freqZ + anchor.phaseZ) * anchor.ampZ - 3; 

                anchor.velocity.lerp(anchor.targetPosition.clone().sub(anchor.position).multiplyScalar(anchor.lerpFactor), 0.1);
                anchor.position.add(anchor.velocity);

                if (anchor.burnEffect) {
                    const elapsed = actualTime - anchor.burnEffect.startTime;
                    if (elapsed > LINE_BURN_DURATION_AT_POINT + (anchor.position.distanceTo(anchor.burnEffect.burnOriginOnLine || anchor.position) / BURN_SPREAD_SPEED) ) { // Consider spread time for total effect duration on anchor
                        anchor.burnEffect = null;
                    }
                }
            });

            for (let i = 0; i < PARTICLE_COUNT.value; i++) {
                const p = particlesData[i];
                
                p.randomWalkPhaseX += RANDOM_WALK_SPEED_FACTOR;
                p.randomWalkPhaseY += RANDOM_WALK_SPEED_FACTOR;
                p.randomWalkPhaseZ += RANDOM_WALK_SPEED_FACTOR * 0.5;
                
                let RWS = currentParams.randomWalkStrength;
                let dRandX = Math.sin(p.randomWalkPhaseX + time * 0.15) * RWS * 100;
                let dRandY = Math.cos(p.randomWalkPhaseY + time * 0.18) * RWS * 100;
                let dRandZ = Math.sin(p.randomWalkPhaseZ + time * 0.10) * RWS * 60;

                p.targetPos.set(p.originalX + dRandX, p.originalY + dRandY, p.originalZ + dRandZ);
                
                if (isIdleModeActive.value) {
                    let closestAnchor = null; let minDistSq = Infinity;
                    coreAnchors.forEach(anchor => {
                        const distSq = anchor.position.distanceToSquared(p.currentPos);
                        if (distSq < minDistSq) { minDistSq = distSq; closestAnchor = anchor; }
                    });
                    if (closestAnchor && minDistSq < ANCHOR_INFLUENCE_RADIUS_SQ.value * 2) { 
                        const pullStrength = 0.005 * (1 - minDistSq / (ANCHOR_INFLUENCE_RADIUS_SQ.value * 2));
                        p.targetPos.lerp(closestAnchor.position, pullStrength);
                    }
                }

                const dxMouse = p.currentPos.x - mouseWorld.x;
                const dyMouse = p.currentPos.y - mouseWorld.y;
                const distSqMouse = dxMouse * dxMouse + dyMouse * dyMouse;

                if (distSqMouse < MOUSE_INFLUENCE_RADIUS_SQ && !isIdleModeActive.value) { 
                    p.lastInteractionTime = actualTime;
                    const distMouse = Math.max(0.01, Math.sqrt(distSqMouse)); 
                    const forceFactor = (MOUSE_INFLUENCE_RADIUS_SQ - distSqMouse) / MOUSE_INFLUENCE_RADIUS_SQ;
                    
                    p.targetPos.x = p.currentPos.x + (dxMouse / distMouse) * MOUSE_REPEL_FORCE * forceFactor * 10.0; 
                    p.targetPos.y = p.currentPos.y + (dyMouse / distMouse) * MOUSE_REPEL_FORCE * forceFactor * 10.0;
                    p.targetPos.z = p.currentPos.z + (smoothedMouseY.value * 0.2 - p.currentPos.z * 0.03) * MOUSE_REPEL_FORCE * forceFactor * 0.4;
                }
                
                const effectiveLerp = p.lerpFactor * currentParams.lerpFactorMultiplier;
                p.velocity.lerp(p.targetPos.clone().sub(p.currentPos).multiplyScalar(effectiveLerp), 0.1);
                p.velocity.multiplyScalar(currentParams.friction); 

                const currentSpeed = p.velocity.length();
                if (currentSpeed > currentParams.maxVelocity) {
                    p.velocity.multiplyScalar(currentParams.maxVelocity / currentSpeed);
                }
                p.currentPos.add(p.velocity);
                positionsAttr.setXYZ(i, p.currentPos.x, p.currentPos.y, p.currentPos.z);

                let dynAlpha = p.baseAlpha;
                if (actualTime - p.lastInteractionTime < 0.8 && !isIdleModeActive.value) { 
                    dynAlpha = Math.min(0.9, p.baseAlpha + 0.6 * (1.0 - (actualTime - p.lastInteractionTime) / 0.8));
                }
                alphaAttr.setX(i, dynAlpha);

                if (p.burnEffect) {
                    const elapsed = actualTime - p.burnEffect.startTime;
                    if (elapsed > LINE_BURN_DURATION_AT_POINT + (p.currentPos.distanceTo(p.burnEffect.burnOriginOnLine || p.currentPos) / BURN_SPREAD_SPEED) ) { // Consider spread time for total effect duration on particle
                        p.burnEffect = null;
                    }
                }
            }
            positionsAttr.needsUpdate = true;
            alphaAttr.needsUpdate = true;

            const linePos = linesMesh.geometry.attributes.position.array;
            const lineCol = linesMesh.geometry.attributes.color.array; 
            let lineIdx = 0;
            const baseLineOpacity = isIdleModeActive.value ? 0.25 : (isMouseStopped.value ? 0.15 : 0.1);

            const addLineSegment = (p1, p2, p1Ref, p2Ref) => { 
                if (lineIdx >= linePos.length - 6) return;

                let finalColorP1 = baseLineColor.clone();
                let finalColorP2 = baseLineColor.clone();

                const getBurnColor = (pointPosition, burnEffect, baseColorLocal, actualTime) => {
                    if (!burnEffect || !burnEffect.burnOriginOnLine) return baseColorLocal.clone();

                    const burnOrigin = burnEffect.burnOriginOnLine;
                    const startTime = burnEffect.startTime;
                    const distToOrigin = pointPosition.distanceTo(burnOrigin);
                    const timeToReachPoint = distToOrigin / BURN_SPREAD_SPEED;
                    const globalElapsedTime = actualTime - startTime;
                    let newColor = baseColorLocal.clone();

                    if (globalElapsedTime > timeToReachPoint) {
                        const localElapsedTime = globalElapsedTime - timeToReachPoint;
                        if (localElapsedTime < LINE_BURN_DURATION_AT_POINT) {
                            const burnProgress = localElapsedTime / LINE_BURN_DURATION_AT_POINT; // 0 to 1
                            let effectColor = new THREE.Color();

                            // Spark (0-0.2), Spark to Ember (0.2-0.4), Ember (0.4-0.7), Ember fades (0.7-1.0)
                            if (burnProgress < 0.2) {
                                effectColor.copy(LINE_SPARK_COLOR);
                            } else if (burnProgress < 0.4) {
                                effectColor.lerpColors(LINE_SPARK_COLOR, LINE_EMBER_COLOR, (burnProgress - 0.2) * 5); // (val-start)* (1/range)
                            } else { 
                                effectColor.copy(LINE_EMBER_COLOR);
                            }
                            
                            let intensity = 1.0;
                            if (burnProgress > 0.7) { 
                                intensity = Math.max(0, 1.0 - (burnProgress - 0.7) / 0.3);
                            }
                            newColor.lerp(effectColor, intensity);
                        }
                    }
                    return newColor;
                };

                if (p1Ref && p1Ref.burnEffect) {
                    finalColorP1 = getBurnColor(p1, p1Ref.burnEffect, finalColorP1, actualTime);
                }
                if (p2Ref && p2Ref.burnEffect) {
                    finalColorP2 = getBurnColor(p2, p2Ref.burnEffect, finalColorP2, actualTime);
                }
                
                if (!((p1Ref && p1Ref.burnEffect) || (p2Ref && p2Ref.burnEffect)) && !isIdleModeActive.value && !isMouseStopped.value) {
                    tempVec.addVectors(p1, p2).multiplyScalar(0.5); 
                    const distToMouseSq = tempVec.distanceToSquared(mouseWorld);
                    const fadeFactor = Math.min(1.0, Math.sqrt(distToMouseSq) / MOUSE_LINE_FADE_RADIUS);
                    if (fadeFactor < 0.5) { 
                        finalColorP1.multiplyScalar(0.7 + fadeFactor * 0.6); 
                        finalColorP2.multiplyScalar(0.7 + fadeFactor * 0.6);
                    }
                }

                linePos[lineIdx + 0] = p1.x; linePos[lineIdx + 1] = p1.y; linePos[lineIdx + 2] = p1.z;
                lineCol[lineIdx + 0] = finalColorP1.r; lineCol[lineIdx + 1] = finalColorP1.g; lineCol[lineIdx + 2] = finalColorP1.b; 
                linePos[lineIdx + 3] = p2.x; linePos[lineIdx + 4] = p2.y; linePos[lineIdx + 5] = p2.z;
                lineCol[lineIdx + 3] = finalColorP2.r; lineCol[lineIdx + 4] = finalColorP2.g; lineCol[lineIdx + 5] = finalColorP2.b; 
                
                lineIdx += 6;
            };
            
            coreAnchors.forEach(anchor => {
                const particlesWithDist = particlesData.map(pData => ({
                    pData,
                    distSq: anchor.position.distanceToSquared(pData.currentPos)
                })).filter(item => item.distSq < ANCHOR_INFLUENCE_RADIUS_SQ.value)
                   .sort((a, b) => a.distSq - b.distSq);

                for (let i = 0; i < Math.min(particlesWithDist.length, MAX_PARTICLE_CONNECTIONS_PER_ANCHOR.value); i++) {
                    const p = particlesWithDist[i].pData;
                    addLineSegment(anchor.position, p.currentPos, anchor, p);
                    particlesData[p.id].connectionStrength = Math.min(1.0, particlesData[p.id].connectionStrength + 0.35);
                }
            });

            for (let i = 0; i < coreAnchors.length; i++) {
                for (let j = i + 1; j < coreAnchors.length; j++) {
                    const anchor1 = coreAnchors[i];
                    const anchor2 = coreAnchors[j];
                    if (anchor1.position.distanceToSquared(anchor2.position) < INTER_ANCHOR_CONNECTION_THRESHOLD_SQ.value) {
                        addLineSegment(anchor1.position, anchor2.position, anchor1, anchor2);
                    }
                }
            }

            let p2pCount = 0;
            for (let i = 0; i < PARTICLE_COUNT.value; i++) {
                if (p2pCount >= MAX_PARTICLE_TO_PARTICLE_CONNECTIONS.value) break;
                const p1 = particlesData[i];
                for (let j = i + 1; j < PARTICLE_COUNT.value; j++) {
                    if (p2pCount >= MAX_PARTICLE_TO_PARTICLE_CONNECTIONS.value) break;
                    const p2 = particlesData[j];
                    if (p1.currentPos.distanceToSquared(p2.currentPos) < PARTICLE_TO_PARTICLE_THRESHOLD_SQ.value) {
                        addLineSegment(p1.currentPos, p2.currentPos, p1, p2);
                        p1.connectionStrength = Math.min(1.0, p1.connectionStrength + 0.1); 
                        p2.connectionStrength = Math.min(1.0, p2.connectionStrength + 0.1);
                        p2pCount++;
                    }
                }
            }
            
            for(let i=0; i < PARTICLE_COUNT.value; i++) {
                connectionStrengthAttr.setX(i, particlesData[i].connectionStrength);
            }
            connectionStrengthAttr.needsUpdate = true;

            for (let k = lineIdx; k < linePos.length; k++) linePos[k] = 0; 
            linesMesh.geometry.attributes.position.needsUpdate = true;
            linesMesh.geometry.attributes.color.needsUpdate = true; 
            linesMesh.geometry.setDrawRange(0, lineIdx / 3); 
            
            particleSystem.rotation.y += isIdleModeActive.value ? 0.00020 : 0.00025; 
            const camTargetX = normalizedMouseX.value * (isIdleModeActive.value ? 0.15 : 0.4); 
            const camTargetY = normalizedMouseY.value * (isIdleModeActive.value ? 0.15 : 0.4);
            camera.position.x += (camTargetX - camera.position.x) * 0.03;
            camera.position.y += (camTargetY - camera.position.y) * 0.03;
            camera.lookAt(scene.position);
            renderer.render(scene, camera); 
        };

        const triggerLineBurningEffect = (screenX, screenY) => {
            if (!scene || !camera) return;
        
            const mouseNDC = new THREE.Vector2(
                (screenX / window.innerWidth) * 2 - 1,
                -(screenY / window.innerHeight) * 2 + 1
            );
        
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouseNDC, camera);
        
            const clickPoint3D = new THREE.Vector3(
                smoothedMouseX.value * (window.innerWidth / window.innerHeight) * (camera.position.z / 1.5), 
                smoothedMouseY.value * (camera.position.z / 1.5),
                0 
            );
            
            const currentTimeForBurn = Date.now() * 0.001;

            const linePositions = linesMesh.geometry.attributes.position.array;
            const numSegments = linesMesh.geometry.drawRange.count / 2; 

            for (let i = 0; i < numSegments; i++) {
                const v1Index = i * 6; 
                const v2Index = v1Index + 3;

                tempVec.set(linePositions[v1Index], linePositions[v1Index+1], linePositions[v1Index+2]);
                tempVec2.set(linePositions[v2Index], linePositions[v2Index+1], linePositions[v2Index+2]);
                
                const lineSegment = new THREE.Line3(tempVec, tempVec2);
                const closestPointOnSegment = new THREE.Vector3();
                lineSegment.closestPointToPoint(clickPoint3D, true, closestPointOnSegment);
                
                if (closestPointOnSegment.distanceToSquared(clickPoint3D) < SMUDGE_INTERACTION_RADIUS_SQ.value) {
                    let pRef1 = particlesData.find(p => p.currentPos.distanceToSquared(tempVec) < 0.01);
                    if (!pRef1) pRef1 = coreAnchors.find(a => a.position.distanceToSquared(tempVec) < 0.01);
                    
                    let pRef2 = particlesData.find(p => p.currentPos.distanceToSquared(tempVec2) < 0.01);
                    if (!pRef2) pRef2 = coreAnchors.find(a => a.position.distanceToSquared(tempVec2) < 0.01);

                    if (pRef1 && (!pRef1.burnEffect || currentTimeForBurn - pRef1.burnEffect.startTime > LINE_BURN_DURATION_AT_POINT * 0.75)) { // Allow re-trigger if 3/4 done
                        pRef1.burnEffect = { startTime: currentTimeForBurn, clickPoint: clickPoint3D.clone(), burnOriginOnLine: closestPointOnSegment.clone() };
                    }
                    if (pRef2 && (!pRef2.burnEffect || currentTimeForBurn - pRef2.burnEffect.startTime > LINE_BURN_DURATION_AT_POINT * 0.75)) { // Allow re-trigger if 3/4 done
                        pRef2.burnEffect = { startTime: currentTimeForBurn, clickPoint: clickPoint3D.clone(), burnOriginOnLine: closestPointOnSegment.clone() };
                    }
                }
            }
        };


        watch(isMobile, (newVal) => { 
            PARTICLE_COUNT.value = newVal ? 120 : 250;
            NUM_CORE_ANCHORS.value = newVal ? 4 : 6;
            MAX_PARTICLE_CONNECTIONS_PER_ANCHOR.value = newVal ? 3 : 5;
            ANCHOR_INFLUENCE_RADIUS_SQ.value = newVal ? (3.5*3.5) : (5*5);
            INTER_ANCHOR_CONNECTION_THRESHOLD_SQ.value = newVal ? (6*6) : (10*10);
            PARTICLE_TO_PARTICLE_THRESHOLD_SQ.value = newVal ? (1.8*1.8) : (2.5*2.5);
            MAX_PARTICLE_TO_PARTICLE_CONNECTIONS.value = newVal ? 60 : 150;
            SMUDGE_INTERACTION_RADIUS_SQ.value = newVal ? (1.0*1.0) : (1.8*1.8);


            if (scene) { 
                scene.remove(particleSystem);
                particleSystem.geometry.dispose();
                particleSystem.material.dispose();
                if (linesMesh) {
                    scene.remove(linesMesh);
                    linesMesh.geometry.dispose();
                    linesMesh.material.dispose();
                }
                particlesData.length = 0;
                coreAnchors.length = 0; 
                initThree(); 
            }
        });

        window.addEventListener('resize', () => {
            if(camera&&renderer){
                camera.aspect=window.innerWidth/window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth,window.innerHeight);
                renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
            }
            checkMobile(); 
        });
        
        setInterval(() => { if (!isPageVisible) return; const animatedElements = document.querySelectorAll('.mouse-trail, .sharp-trail, .ink-droplet, .mouse-particle, .ink-stain, .click-ripple, .ink-diffusion, .ink-diffusion-feather, .ink-splash, .falling-poem'); const maxAllowed = isMobile.value ? 80 : 150; if (animatedElements.length > maxAllowed) { for (let i = 0; i < animatedElements.length - maxAllowed + 10; i++) { if (animatedElements[i] && animatedElements[i].parentElement) animatedElements[i].parentElement.removeChild(animatedElements[i]);}}}, 5000);
        
        const handleGlobalClick = (e) => {
            if (!isPageVisible || isTouchActive.value) return;

            const now = Date.now();
            leftClickTimestamps.value.push(now);
            leftClickTimestamps.value = leftClickTimestamps.value.filter(ts => now - ts <= 1500);

            if (leftClickTimestamps.value.length >= 5) {
                showLeftClickMessage.value = true;
                leftClickTimestamps.value = []; 
                clearTimeout(leftMsgTimer);
                leftMsgTimer = setTimeout(() => {
                    showLeftClickMessage.value = false;
                }, 3500); 
            }

            let targetElement = e.target;
            let isUIInteraction = false;
            while(targetElement != null){
                if(targetElement.tagName === 'A' || targetElement.tagName === 'BUTTON' || 
                   targetElement.classList.contains('welcome-container') || 
                   targetElement.classList.contains('global-navigation') ||
                   targetElement.classList.contains('time-indicator')) {
                    isUIInteraction = true;
                    break;
                }
                targetElement = targetElement.parentElement;
            }
            if(!isUIInteraction) {
               createClickRipple(e.clientX,e.clientY, isMobile.value ? 120 : 160); // Slightly larger base size
               createParticles(e.clientX,e.clientY,isMobile.value?4:7); // Adjusted particle count
            }
        };

        // 右键节流标志
        let lastPoemDropTime = 0;
        const POEM_DROP_COOLDOWN = 2000; // 2秒冷却时间

        // 预加载下一句诗词的函数
        const preloadNextPoem = () => {
            if (typeof textManager !== 'undefined' && textManager.fetchPoem) {
                textManager.fetchPoem();
            }
        };

        // 右键绑定
        const handleGlobalContextMenu = (e) => {
            if (!isPageVisible || isTouchActive.value) return;
            const now = Date.now();
            if (now - lastPoemDropTime < POEM_DROP_COOLDOWN) {
                // 冷却期内不进行任何反馈
                e.preventDefault(); // 阻止默认右键菜单，但无其他操作
                return false;
            }
            lastPoemDropTime = now;
            e.preventDefault();
            createFallingPoem(e.clientX, e.clientY);
            preloadNextPoem(); // 触发诗词掉落后，预加载下一句
            return false;
        };


        onMounted(async () => {
            checkMobile(); 
              // 初始化一言内容
            if (typeof textManager !== 'undefined') {
                // 设置初始一言内容
                hitokotoText.value = textManager.getCurrentHitokoto();
                // 注册一言更新回调
                textManager.onHitokotoUpdate(updateHitokotoText);
                // 触发一言获取
                textManager.fetchHitokoto().catch(error => {
                    console.error('获取一言失败:', error);
                });
            }
            
            smoothMouseUpdate();            // Initialize poems from textManager (保持兼容性)
            if (typeof textManager !== 'undefined' && textManager.getRandomPoem) {
                // 异步初始化诗词
                textManager.getRandomPoem().then(initialPoem => {
                    poemsArray.value = [initialPoem];
                }).catch(error => {
                    console.error('初始化诗词失败:', error);
                    poemsArray.value = ["春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。\n —— 《春晓》 孟浩然"];
                });
                // 触发诗词获取
                textManager.fetchAndCachePoems();
            }

            initThree(); 
            
            timeIndicatorRef.value = document.querySelector('.time-indicator');
            welcomeContainerRef.value = document.querySelector('.welcome-container'); 
            leftWordScrollContainerRef.value = document.querySelector('.left-word-scroll-container');
            leftScrollContentRef.value = document.querySelector('.left-scroll-content');
            globalNavRef.value = document.querySelector('.global-navigation');
            
            await nextTick(); 
            if (leftScrollContentRef.value && leftWordScrollContainerRef.value) {
                const containerRect = leftWordScrollContainerRef.value.getBoundingClientRect();
                scrollChars = Array.from(leftScrollContentRef.value.children); 
                scrollCharDetails.value = scrollChars.map(charEl => {
                    const charRect = charEl.getBoundingClientRect();
                    return {
                        el: charEl,
                        top: charRect.top - containerRect.top,
                        midY: (charRect.top + charRect.bottom) / 2 - containerRect.top,
                        height: charRect.height
                    };
                });
                
                // 为每个字符添加点击事件监听器
                scrollChars.forEach(charEl => {
                    charEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        handleCharClick(charEl);
                    });
                });
            }
            
            // 添加footer点击事件监听器
            const footerTrigger = document.querySelector('.ef-trigger-wrapper');
            if (footerTrigger) {
                footerTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFooterActive();
                });
            }
            
            // 点击页面其他地方时关闭footer
            document.addEventListener('click', (e) => {
                const footerEl = document.querySelector('.elegant-footer');
                if (footerEl && !footerEl.contains(e.target) && footerActiveState.value) {
                    footerActiveState.value = false;
                    footerEl.classList.remove('ef-active');
                }
            });
            setInterval(() => { if(isPageVisible){currentTime.value=new Date(); }},1000);
            document.addEventListener('mousemove',updateCursorPosition); 
            document.addEventListener('mousedown',handleMouseDown); 
            document.addEventListener('mouseup',handleMouseUp);
            document.addEventListener('touchstart',handleTouchStart,{passive:false});
            document.addEventListener('touchmove',handleTouchMove,{passive:false});
            document.addEventListener('touchend',handleTouchEnd); 
            document.addEventListener('touchcancel',handleTouchCancel);
            
            document.addEventListener('click', handleGlobalClick);
            document.addEventListener('contextmenu', handleGlobalContextMenu);

            if(!isMobile.value)document.body.style.cursor='none'; 
            document.addEventListener('visibilitychange',handleVisibilityChange); 
            updateDynamicColors(); 
            document.addEventListener('gesturestart',(e)=>e.preventDefault()); 
            // document.addEventListener('touchmove',(e)=>{if(e.touches.length>1)e.preventDefault();},{passive:false}); // Already handled by handleTouchMove
            activateTemporaryUI(); 
            updateLeftWordScroll(-1, -1); 
            handleUserInteractionEnd(); 
        });
        return { 
            currentShichenName, currentThemeDisplayName, timeIndicatorRef,
            skyStyle, hitokotoText, welcomeContainerRef,
            leftWordScrollContainerRef, leftScrollContentRef,
            showLeftClickMessage, 
            leftClickMessageText
        };
    }
});

// Real-time clock update for footer
function updateFooterTime() {
    const timeElement = document.getElementById('ef-current-time');
    const yearElement = document.getElementById('ef-dynamic-year');
    
    if (timeElement) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeElement.textContent = `${hours}:${minutes}`;
    }
    
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.textContent = `© ${currentYear}`;
    }
}

// Update time immediately and then every minute
document.addEventListener('DOMContentLoaded', function() {
    updateFooterTime();
    setInterval(updateFooterTime, 60000);
});
        
app.mount('#app');


// Navigation Bar Logic - 性能优化版本
document.addEventListener('DOMContentLoaded', () => {
    const mainNavigation = document.getElementById('main-navigation');
    const themeNameElement = document.querySelector('.theme-name');
    if (!mainNavigation) return;

    // 配置常量
    const MOUSE_INFLUENCE_RADIUS = 250;
    const FULL_ACTIVATION_RADIUS = 120;
    const NAV_EXPANDED_WIDTH = 150; // 数值而非字符串，便于计算
    const NAV_TEXT_MARGIN_LEFT = 10;
    const NAV_PADDING_VERTICAL_BASE = 8;
    const NAV_PADDING_HORIZONTAL_BASE = 8;
    const NAV_ITEM_GAP_BASE = 6;
    const NAV_PADDING_VERTICAL_ACTIVE = 12;
    const NAV_PADDING_HORIZONTAL_ACTIVE = 12;
    const NAV_ITEM_GAP_ACTIVE = 8;
    
    // 性能优化：减少重复计算
    const UPDATE_THROTTLE = 16; // 约60fps
    
    // 状态变量
    let mouseX = 0;
    let mouseY = 0;
    let lastThemeName = '';
    let lastActivationProgress = -1; // 缓存上次的激活进度
    let animationFrameId = null;
    let lastUpdateTime = 0;
    let isUpdating = false;    // 简化主题颜色配置 - 使用基础配置和变体
    const baseThemes = {
        dark: { text: '#E0E0E8', icon: '#A0A0B0', shadow: 'rgba(0,0,0,0.3)', blur: '9px', border: 'rgba(100,100,120,0.15)' },
        light: { text: '#504030', icon: '#A08060', shadow: 'rgba(80,60,50,0.15)', blur: '6px', border: 'rgba(250,240,230,0.15)' },
        warm: { text: '#603010', icon: '#C06020', shadow: 'rgba(100,50,20,0.2)', blur: '7px', border: 'rgba(255,250,220,0.15)' },
        cool: { text: '#304050', icon: '#608090', shadow: 'rgba(50,70,80,0.2)', blur: '6px', border: 'rgba(200,220,240,0.15)' }
    };

    const themeColors = {
        'default': { bg: 'linear-gradient(135deg, rgba(50, 60, 70, 0.85), rgba(30, 40, 50, 0.95))', ...baseThemes.dark },
        '晴': { bg: 'linear-gradient(135deg, rgba(135, 206, 250, 0.85), rgba(100, 149, 237, 0.95))', ...baseThemes.cool },
        '雨': { bg: 'linear-gradient(135deg, rgba(119, 136, 153, 0.85), rgba(70, 80, 90, 0.95))', ...baseThemes.dark },
        '雪': { bg: 'linear-gradient(135deg, rgba(240, 248, 255, 0.85), rgba(220, 220, 220, 0.95))', ...baseThemes.cool },
        
        // 时辰主题使用相似的基础配置
        '子夜·墨池观星': { bg: 'linear-gradient(135deg, rgba(20, 20, 40, 0.9), rgba(10, 10, 20, 0.98))', ...baseThemes.dark },
        '丑时·残月晓风': { bg: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 35, 0.98))', ...baseThemes.dark },
        '寅时·东方既白': { bg: 'linear-gradient(135deg, rgba(50, 50, 70, 0.88), rgba(40, 40, 60, 0.96))', ...baseThemes.dark },
        '卯时·旭日初升': { bg: 'linear-gradient(135deg, rgba(240, 160, 120, 0.85), rgba(230, 140, 100, 0.95))', ...baseThemes.warm },
        '辰时·薄雾辰光': { bg: 'linear-gradient(135deg, rgba(160, 200, 220, 0.85), rgba(140, 180, 200, 0.95))', ...baseThemes.cool },
        '巳时·日暖风和': { bg: 'linear-gradient(135deg, rgba(245, 240, 220, 0.85), rgba(235, 230, 210, 0.95))', ...baseThemes.light },
        '午时·日丽中天': { bg: 'linear-gradient(135deg, rgba(255, 250, 200, 0.85), rgba(255, 240, 180, 0.95))', ...baseThemes.warm },
        '未时·午后小憩': { bg: 'linear-gradient(135deg, rgba(210, 200, 170, 0.85), rgba(200, 190, 160, 0.95))', ...baseThemes.light },
        '申时·西楼夕照': { bg: 'linear-gradient(135deg, rgba(200, 160, 130, 0.85), rgba(190, 150, 120, 0.95))', ...baseThemes.warm },
        '酉时·倦鸟归林': { bg: 'linear-gradient(135deg, rgba(170, 180, 170, 0.85), rgba(150, 160, 150, 0.95))', ...baseThemes.cool },
        '戌时·华灯初上': { bg: 'linear-gradient(135deg, rgba(100, 70, 60, 0.9), rgba(80, 50, 40, 0.98))', ...baseThemes.dark },
        '亥时·夜阑人静': { bg: 'linear-gradient(135deg, rgba(50, 50, 70, 0.9), rgba(40, 40, 60, 0.98))', ...baseThemes.dark }
    };

    // 缓存主题颜色，避免重复查找
    let cachedThemeColors = themeColors['default'];
    let cachedThemeName = 'default';

    function getThemeColors(themeName) {
        if (themeName === cachedThemeName) {
            return cachedThemeColors;
        }
        
        // 精确匹配
        if (themeColors[themeName]) {
            cachedThemeColors = themeColors[themeName];
            cachedThemeName = themeName;
            return cachedThemeColors;
        }
        
        // 部分匹配
        for (const key in themeColors) {
            if (themeName.includes(key)) {
                cachedThemeColors = themeColors[key];
                cachedThemeName = themeName;
                return cachedThemeColors;
            }
        }
        
        // 默认值
        cachedThemeColors = themeColors['default'];
        cachedThemeName = themeName;
        return cachedThemeColors;
    }    // 简化的导航更新函数
    function updateNavAppearance(activationProgress) {
        if (Math.abs(activationProgress - lastActivationProgress) < 0.01) return;
        lastActivationProgress = activationProgress;

        const currentThemeName = themeNameElement ? (themeNameElement.textContent || '').trim() : 'default';
        const colors = getThemeColors(currentThemeName);
        const easedProgress = activationProgress < 0.5 
            ? 2 * activationProgress * activationProgress 
            : 1 - Math.pow(-2 * activationProgress + 2, 3) / 2;

        const overallOpacity = Math.min(1, activationProgress * 1.2);
        const updates = { '--nav-overall-opacity': overallOpacity.toFixed(3) };

        // 批量设置主题相关样式
        const themeVars = ['bg', 'text', 'icon', 'shadow', 'blur', 'border'];
        themeVars.forEach(key => {
            updates[`--theme-nav-${key}-active`] = colors[key];
        });

        if (activationProgress > 0) {
            mainNavigation.classList.toggle('proximity-active', true);
            
            // 激活状态样式
            Object.assign(updates, {
                '--nav-bg-color': 'var(--theme-nav-bg-active)',
                '--nav-text-color': 'var(--theme-nav-text-active)',
                '--nav-icon-color': 'var(--theme-nav-icon-active)',
                '--nav-shadow-color': 'var(--theme-nav-shadow-active)',
                '--nav-blur-intensity': 'var(--theme-nav-blur-active)',
                'border-color': 'var(--theme-nav-border-active)',
                '--nav-text-opacity': easedProgress.toFixed(3),
                '--nav-text-width': `${NAV_EXPANDED_WIDTH * easedProgress}px`,
                '--nav-text-margin-left': `${NAV_TEXT_MARGIN_LEFT * easedProgress}px`,
                '--nav-padding-vertical': `${NAV_PADDING_VERTICAL_BASE + (NAV_PADDING_VERTICAL_ACTIVE - NAV_PADDING_VERTICAL_BASE) * easedProgress}px`,
                '--nav-padding-horizontal': `${NAV_PADDING_HORIZONTAL_BASE + (NAV_PADDING_HORIZONTAL_ACTIVE - NAV_PADDING_HORIZONTAL_BASE) * easedProgress}px`,
                '--nav-item-gap': `${NAV_ITEM_GAP_BASE + (NAV_ITEM_GAP_ACTIVE - NAV_ITEM_GAP_BASE) * easedProgress}px`
            });
        } else {
            mainNavigation.classList.toggle('proximity-active', false);
            // 重置状态
            Object.assign(updates, {
                '--nav-bg-color': 'rgba(240, 245, 250, 0)',
                '--nav-text-color': 'rgba(226, 232, 240, 0)',
                '--nav-icon-color': 'rgba(160, 174, 192, 0)',
                '--nav-shadow-color': 'rgba(0, 0, 0, 0)',
                '--nav-blur-intensity': '0px',
                'border-color': 'transparent',
                '--nav-text-opacity': '0',
                '--nav-text-width': '0px',
                '--nav-text-margin-left': '0px',
                '--nav-padding-vertical': `${NAV_PADDING_VERTICAL_BASE}px`,
                '--nav-padding-horizontal': `${NAV_PADDING_HORIZONTAL_BASE}px`,
                '--nav-item-gap': `${NAV_ITEM_GAP_BASE}px`
            });
        }

        // 批量应用样式更新
        Object.entries(updates).forEach(([property, value]) => {
            mainNavigation.style.setProperty(property, value);
        });
    }

    // 节流的鼠标移动处理
    function handleMouseMove(event) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        
        // 使用节流避免过度更新
        if (!isUpdating) {
            isUpdating = true;
            animationFrameId = requestAnimationFrame(updateNavBasedOnMouse);
        }
    }

    function updateNavBasedOnMouse() {
        const currentTime = performance.now();
        
        // 限制更新频率
        if (currentTime - lastUpdateTime < UPDATE_THROTTLE) {
            animationFrameId = requestAnimationFrame(updateNavBasedOnMouse);
            return;
        }
        
        lastUpdateTime = currentTime;
        isUpdating = false;
        
        if (!mainNavigation) return;
        
        const navRect = mainNavigation.getBoundingClientRect();

        // 计算鼠标到导航栏的最短距离
        const closestX = Math.max(navRect.left, Math.min(mouseX, navRect.right));
        const closestY = Math.max(navRect.top, Math.min(mouseY, navRect.bottom));

        const distanceX = mouseX - closestX;
        const distanceY = mouseY - closestY;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        let activationProgress = 0;
        if (distance < MOUSE_INFLUENCE_RADIUS) {
            if (distance < FULL_ACTIVATION_RADIUS) {
                activationProgress = 1;
            } else {
                // 渐进激活
                activationProgress = 1 - (distance - FULL_ACTIVATION_RADIUS) / (MOUSE_INFLUENCE_RADIUS - FULL_ACTIVATION_RADIUS);
            }
        }
        
        updateNavAppearance(activationProgress);
    }

    // 主题变化监听 - 添加防抖
    let themeChangeTimeout = null;
    if (themeNameElement) {
        const observer = new MutationObserver(() => {
            const currentThemeName = (themeNameElement.textContent || '').trim();
            if (currentThemeName !== lastThemeName) {
                lastThemeName = currentThemeName;
                
                // 防抖处理主题变化
                if (themeChangeTimeout) {
                    clearTimeout(themeChangeTimeout);
                }
                themeChangeTimeout = setTimeout(() => {
                    // 清除缓存，强制重新获取主题颜色
                    cachedThemeName = '';
                    updateNavBasedOnMouse();
                }, 50);
            }
        });
        observer.observe(themeNameElement, { childList: true, characterData: true, subtree: true });
        lastThemeName = (themeNameElement.textContent || '').trim();
    }

    // 事件监听
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // 页面可见性变化时清理动画
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            isUpdating = false;
        }
    });
    
    // 初始化
    updateNavBasedOnMouse();
});

// --- END OF FILE js/home.js ---