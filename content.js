// PhishGuard Content Script
// Executa no contexto das páginas web e adiciona proteção visual

console.log('PhishGuard carregado na página:', window.location.href);

let warningOverlay = null;

// Inicializar content script
function initContentScript() {
    console.log('Iniciando PhishGuard content script...');

    // Adicionar verificação de links na página
    monitorLinks();

    // Adicionar indicador flutuante
    addFloatingIndicator();
}

/**
 * Monitora links na página e adiciona avisos visuais
 */
function monitorLinks() {
    // Selecionar todos os links
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        link.addEventListener('mouseenter', async (e) => {
            const url = link.href;

            // Ignorar links âncora e javascript
            if (url.startsWith('#') || url.startsWith('javascript:')) {
                return;
            }

            // Verificação rápida de indicadores óbvios
            const quickCheck = performQuickCheck(url);

            if (quickCheck.isSuspicious) {
                // Adicionar tooltip de aviso
                showLinkWarningTooltip(link, quickCheck.reason);
            }
        });

        link.addEventListener('mouseleave', () => {
            removeLinkWarningTooltip();
        });
    });
}

/**
 * Verificação rápida sem APIs (para performance)
 */
function performQuickCheck(url) {
    try {
        const urlObj = new URL(url);

        // Verifica IP
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(urlObj.hostname)) {
            return { isSuspicious: true, reason: '⚠️ Link usa endereço IP' };
        }

        // Verifica HTTP
        if (urlObj.protocol === 'http:') {
            return { isSuspicious: true, reason: '⚠️ Conexão não segura (HTTP)' };
        }

        // Verifica encurtadores
        const hostname = urlObj.hostname.toLowerCase();
        const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'is.gd'];
        if (shorteners.some(s => hostname.includes(s))) {
            return { isSuspicious: true, reason: '⚠️ URL encurtada - destino oculto' };
        }

        return { isSuspicious: false };
    } catch (e) {
        return { isSuspicious: false };
    }
}

/**
 * Mostra tooltip de aviso em link
 */
function showLinkWarningTooltip(element, reason) {
    removeLinkWarningTooltip(); // Remove tooltip anterior

    const tooltip = document.createElement('div');
    tooltip.id = 'phishguard-tooltip';
    tooltip.textContent = reason;
    tooltip.style.cssText = `
        position: absolute;
        background: #ef4444;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 999999;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 300px;
        word-wrap: break-word;
    `;

    document.body.appendChild(tooltip);

    const rect = element.getBoundingClientRect();
    tooltip.style.left = (rect.left + window.scrollX) + 'px';
    tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
}

/**
 * Remove tooltip de aviso
 */
function removeLinkWarningTooltip() {
    const tooltip = document.getElementById('phishguard-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

/**
 * Adiciona indicador flutuante de status
 */
function addFloatingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'phishguard-indicator';
    indicator.innerHTML = '🛡️';
    indicator.title = 'PhishGuard Ativo - Clique para análise completa';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        z-index: 999998;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: transform 0.2s, box-shadow 0.2s;
    `;

    indicator.addEventListener('mouseenter', () => {
        indicator.style.transform = 'scale(1.1)';
        indicator.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
    });

    indicator.addEventListener('mouseleave', () => {
        indicator.style.transform = 'scale(1)';
        indicator.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    });

    indicator.addEventListener('click', () => {
        // Abrir popup da extensão
        chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    document.body.appendChild(indicator);
}

/**
 * Mostra overlay de aviso de phishing
 */
function showPhishingWarning(result) {
    // Remove overlay anterior se existir
    if (warningOverlay) {
        warningOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'phishguard-warning-overlay';

    const riskInfo = CONFIG.RISK_LEVELS[result.riskLevel];

    overlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                padding: 32px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
                    <h1 style="color: ${riskInfo.color}; margin: 0 0 8px 0; font-size: 28px;">
                        Alerta de Segurança!
                    </h1>
                    <p style="color: #666; margin: 0; font-size: 16px;">
                        Nível de Risco: <strong style="color: ${riskInfo.color};">${riskInfo.label}</strong>
                    </p>
                </div>
                
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #374151; font-size: 15px;">
                        <strong>Site:</strong><br>
                        <code style="word-break: break-all; background: white; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">
                            ${result.url}
                        </code>
                    </p>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 16px;">
                        🔍 Problemas Detectados:
                    </h2>
                    ${result.warnings.map(w => `
                        <div style="
                            background: #fef2f2;
                            border-left: 4px solid #ef4444;
                            padding: 12px 16px;
                            margin-bottom: 12px;
                            border-radius: 4px;
                        ">
                            <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 15px;">
                                ${w.title}
                            </h3>
                            <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                                ${w.message}
                            </p>
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="phishguard-go-back" style="
                        background: #ef4444;
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.2s;
                    ">
                        ← Voltar com Segurança
                    </button>
                    <button id="phishguard-continue" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 12px 32px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.2s;
                    ">
                        Continuar Mesmo Assim →
                    </button>
                </div>
                
                <p style="
                    text-align: center;
                    color: #9ca3af;
                    font-size: 13px;
                    margin: 24px 0 0 0;
                ">
                    🛡️ Protegido por PhishGuard
                </p>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    warningOverlay = overlay;

    // Event listeners
    document.getElementById('phishguard-go-back').addEventListener('click', () => {
        window.history.back();
    });

    document.getElementById('phishguard-continue').addEventListener('click', () => {
        overlay.remove();
        warningOverlay = null;
    });
}

// Listener para mensagens do background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Mensagem recebida no content script:', message);

    if (message.action === 'showWarning') {
        showPhishingWarning(message.result);
    }

    sendResponse({ received: true });
});

// Aguardar o carregamento completo da página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContentScript);
} else {
    initContentScript();
}
