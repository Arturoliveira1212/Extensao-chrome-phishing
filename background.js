// PhishGuard Background Service Worker
// Executa verificações em segundo plano e gerencia cache

// Importar scripts necessários
importScripts('config.js', 'phishing-detector.js');

console.log('PhishGuard Background Service Worker iniciado');

// Cache de verificações
const analysisCache = new Map();

// Listener para instalação da extensão
chrome.runtime.onInstalled.addListener((details) => {
    console.log('PhishGuard instalado:', details.reason);

    if (details.reason === 'install') {
        console.log('Primeira instalação do PhishGuard');

        // Configurações padrão
        chrome.storage.local.set({
            enabled: true,
            autoCheck: true,
            showNotifications: true,
            warningLevel: 'MEDIUM' // SAFE, LOW, MEDIUM, HIGH, CRITICAL
        });

        // Mostrar página de boas-vindas
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PhishGuard Instalado',
            message: 'Sua extensão de proteção contra phishing está ativa e protegendo você!'
        });
    }
});

// Monitorar navegação
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Apenas para navegação no frame principal
    if (details.frameId === 0) {
        const url = details.url;

        // Ignorar URLs internas do navegador
        if (url.startsWith('chrome://') || url.startsWith('about:') ||
            url.startsWith('edge://') || url.startsWith('chrome-extension://')) {
            return;
        }

        // Verificar configurações
        const settings = await chrome.storage.local.get(['enabled', 'autoCheck', 'warningLevel']);

        if (settings.enabled && settings.autoCheck) {
            // Analisar URL
            const result = await analyzeURLWithCache(url);

            // Se detectar risco alto ou crítico, mostrar notificação
            if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: '⚠️ Alerta de Phishing!',
                    message: `Site suspeito detectado! Nível de risco: ${CONFIG.RISK_LEVELS[result.riskLevel].label}`,
                    priority: 2
                });

                // Enviar para content script para mostrar overlay
                chrome.tabs.sendMessage(details.tabId, {
                    action: 'showWarning',
                    result: result
                });
            }
        }
    }
});

// Listener para mensagens
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Mensagem recebida no background:', message);

    if (message.action === 'analyzeURL') {
        analyzeURLWithCache(message.url)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Resposta assíncrona
    }

    if (message.action === 'getCurrentTabURL') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                sendResponse({ success: true, url: tabs[0].url });
            } else {
                sendResponse({ success: false, error: 'Nenhuma aba ativa' });
            }
        });
        return true;
    }

    if (message.action === 'clearCache') {
        analysisCache.clear();
        sendResponse({ success: true, message: 'Cache limpo' });
    }

    if (message.action === 'getSettings') {
        chrome.storage.local.get(['enabled', 'autoCheck', 'showNotifications', 'warningLevel'], (settings) => {
            sendResponse({ success: true, settings });
        });
        return true;
    }

    if (message.action === 'updateSettings') {
        chrome.storage.local.set(message.settings, () => {
            sendResponse({ success: true, message: 'Configurações atualizadas' });
        });
        return true;
    }
});

/**
 * Analisa URL com cache
 */
async function analyzeURLWithCache(url) {
    // Verificar se está no cache e ainda é válido
    if (analysisCache.has(url)) {
        const cached = analysisCache.get(url);
        const age = Date.now() - cached.timestamp;

        if (age < CONFIG.CACHE_DURATION) {
            console.log('Usando resultado do cache para:', url);
            return cached;
        }
    }

    // Analisar URL
    console.log('Analisando URL:', url);
    const detector = new PhishingDetector();
    const result = await detector.analyzeURL(url);

    // Salvar no cache
    analysisCache.set(url, result);

    // Limitar tamanho do cache
    if (analysisCache.size > 100) {
        const firstKey = analysisCache.keys().next().value;
        analysisCache.delete(firstKey);
    }

    return result;
}

/**
 * Limpa cache antigo periodicamente
 */
setInterval(() => {
    const now = Date.now();
    for (let [url, result] of analysisCache.entries()) {
        if (now - result.timestamp > CONFIG.CACHE_DURATION) {
            analysisCache.delete(url);
        }
    }
}, 600000); // A cada 10 minutos
