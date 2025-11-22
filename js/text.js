// js/text.js - 优化的文本内容管理器

window.textManager = (function() {
    let currentHitokoto = "正在获取一言...";
    let currentPoem = "加载中...";
    let hitokotoCallbacks = [];
    
    // 验证有效的API配置
    const hitokotoAPIs = [
        {
            url: 'https://api.pwxiao.top/',
            parser: (data) => {
                const fromText = data.from_who ? `${data.from} · ${data.from_who}` : (data.from || '未知');
                return `${data.hitokoto} —— ${fromText}`;
            }
        }
    ];

    const poemAPIs = [
        {
            url: 'https://v1.jinrishici.com/all.json',
            parser: (data) => {
                let text = data.content;
                if (data.origin || data.author) {
                    text += '\n';
                    if (data.origin) text += ` —— 《${data.origin}》`;
                    if (data.author) text += ` ${data.author}`;
                }
                return text.trim();
            }
        }
    ];

    // 备用内容
    const fallbackHitokoto = "山重水复疑无路，柳暗花明又一村。 —— 陆游";
    const fallbackPoems = [
        "春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。\n —— 《春晓》 孟浩然",
        "床前明月光，疑是地上霜。\n举头望明月，低头思故乡。\n —— 《静夜思》 李白",
        "红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。\n —— 《相思》 王维",
        "独在异乡为异客，每逢佳节倍思亲。\n遥知兄弟登高处，遍插茱萸少一人。\n —— 《九月九日忆山东兄弟》 王维",
        "白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。\n —— 《登鹳雀楼》 王之涣"
    ];

    // 通用API调用函数
    async function callAPI(apiConfigs, fallbackContent) {
        for (const config of apiConfigs) {
            try {
                console.log(`尝试调用API: ${config.url}`);
                const response = await fetch(config.url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                
                console.log(`API响应状态: ${response.status} ${response.statusText}`);
                if (!response.ok) {
                    console.warn(`API响应不正常: ${response.status}`);
                    continue;
                }
                
                const data = await response.json();
                console.log('API数据接收成功:', data);
                const result = config.parser(data);
                console.log('解析结果:', result);
                return result;
                
            } catch (error) {
                console.error(`API调用失败 ${config.url}:`, error);
                continue;
            }
        }
        
        console.warn('所有API调用失败，使用备用内容');
        // 所有API失败，返回备用内容
        return Array.isArray(fallbackContent) 
            ? fallbackContent[Math.floor(Math.random() * fallbackContent.length)]
            : fallbackContent;
    }

    // 通知回调函数
    function notifyCallbacks(text) {
        hitokotoCallbacks.forEach(callback => {
            try { 
                callback(text); 
            } catch (e) { 
                console.error('回调执行错误:', e); 
            }
        });
    }

    // 核心API函数
    async function fetchHitokoto() {
        try {
            const result = await callAPI(hitokotoAPIs, fallbackHitokoto);
            currentHitokoto = result;
            notifyCallbacks(result);
            return result;
        } catch (error) {
            console.error('获取一言失败:', error);
            currentHitokoto = fallbackHitokoto;
            notifyCallbacks(fallbackHitokoto);
            return fallbackHitokoto;
        }
    }

    async function fetchPoem() {
        try {
            const result = await callAPI(poemAPIs, fallbackPoems);
            currentPoem = result;
            return result;
        } catch (error) {
            console.error('获取诗词失败:', error);
            const fallback = fallbackPoems[Math.floor(Math.random() * fallbackPoems.length)];
            currentPoem = fallback;
            return fallback;
        }
    }

    // 公开接口
    return {
        fetchHitokoto,
        fetchPoem,
        getCurrentHitokoto: () => currentHitokoto,
        getCurrentPoem: () => currentPoem,
        
        // 兼容性方法
        getRandomPoem: async () => {
            try {
                return await fetchPoem();
            } catch (error) {
                return fallbackPoems[Math.floor(Math.random() * fallbackPoems.length)];
            }
        },
        
        fetchAndCachePoems: async () => await fetchPoem(),
        
        onHitokotoUpdate: (callback) => {
            if (typeof callback === 'function') {
                hitokotoCallbacks.push(callback);
            }
        },
        
        removeHitokotoCallback: (callback) => {
            const index = hitokotoCallbacks.indexOf(callback);
            if (index > -1) hitokotoCallbacks.splice(index, 1);
        }
    };
})();
