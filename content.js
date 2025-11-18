// PhishGuard Content Script
// Executa no contexto das páginas web e adiciona proteção visual

console.log('PhishGuard carregado na página:', window.location.href);

let warningOverlay = null;
let pendingNavigation = null;

// Inicializar content script
function initContentScript() {
    console.log('Iniciando PhishGuard content script...');

    // Interceptar cliques em links
    interceptLinkClicks();

    // Adicionar indicador flutuante
    addFloatingIndicator();

    // Observar novos links adicionados dinamicamente
    observeNewLinks();
}

/**
 * Intercepta cliques em todos os links da página
 */
function interceptLinkClicks() {
    // Usar capturing phase para interceptar antes de qualquer outro handler
    document.addEventListener('click', handleLinkClick, true);

    // Também interceptar links que abrem em nova aba
    document.addEventListener('auxclick', handleLinkClick, true);
}

/**
 * Handler para cliques em links
 */
async function handleLinkClick(event) {
    // Encontrar o elemento <a> mais próximo
    let target = event.target;
    while (target && target.tagName !== 'A') {
        target = target.parentElement;
    }

    // Se não for um link, permitir navegação normal
    if (!target || !target.href) {
        return;
    }

    const url = target.href;
    
    console.log('🛡️ PhishGuard: Link clicado ->', url);

    // Ignorar links âncora, javascript e extensões do navegador
    if (url.startsWith('#') ||
        url.startsWith('javascript:') ||
        url.startsWith('chrome://') ||
        url.startsWith('chrome-extension://')) {
        console.log('🛡️ PhishGuard: Link interno/especial - permitido sem verificação');
        return;
    }

    // Ignorar links para o mesmo domínio (navegação interna)
    try {
        const currentDomain = new URL(window.location.href).hostname;
        const linkDomain = new URL(url).hostname;

        if (currentDomain === linkDomain) {
            console.log('🛡️ PhishGuard: Navegação interna - permitida sem verificação');
            return; // Permitir navegação interna
        }
    } catch (e) {
        // Se houver erro ao parsear URL, bloquear por segurança
        console.warn('🛡️ PhishGuard: Erro ao parsear URL - bloqueando por segurança');
    }

    console.log('🛡️ PhishGuard: Link externo detectado - iniciando verificação...');

    // BLOQUEAR a navegação até verificar
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Detectar se deve abrir em nova aba
    const shouldOpenNewTab = 
        target.target === '_blank' || 
        target.target === '_new' ||
        event.ctrlKey || 
        event.metaKey || 
        event.button === 1; // Clique do meio

    // Salvar informações da navegação
    pendingNavigation = {
        url: url,
        openInNewTab: shouldOpenNewTab,
        event: event
    };

    // Mostrar loading
    showValidatingOverlay(url);

    // Verificar o link
    await validateAndProceed(url, target);
}

/**
 * Valida o link e decide se permite navegação
 */
async function validateAndProceed(url, linkElement) {
    try {
        console.log('🛡️ PhishGuard: Enviando URL para análise...', url);
        
        // Enviar para background script fazer análise completa
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeURL',
            url: url
        });

        if (response.success) {
            const result = response.result;
            
            console.log('🛡️ PhishGuard: Análise completa!', {
                risco: result.riskLevel,
                avisos: result.warnings.length,
                redirecionamento: result.isRedirect ? 'SIM' : 'NÃO',
                urlOriginal: result.url,
                urlFinal: result.isRedirect ? result.finalURL : 'N/A'
            });

            // Log específico para redirecionamentos
            if (result.isRedirect) {
                console.log('🔀 PhishGuard: Redirecionamento detectado!');
                console.log('   📍 Link intermediário:', result.url);
                console.log('   🎯 Destino final:', result.finalURL);
                console.log('   ℹ️  O destino final foi analisado, não o link intermediário');
            }

            // Decidir baseado no nível de risco
            if (result.riskLevel === 'SAFE' || result.riskLevel === 'LOW') {
                // Link seguro - permitir navegação
                console.log('✅ PhishGuard: Link seguro - redirecionando automaticamente');
                hideValidatingOverlay();
                proceedToLink(url, pendingNavigation.openInNewTab);
            } else {
                // Link suspeito - mostrar aviso e pedir confirmação
                console.warn('⚠️ PhishGuard: Link suspeito detectado - mostrando aviso');
                hideValidatingOverlay();
                showLinkWarningDialog(result);
            }
        } else {
            // Erro na análise - permitir mas avisar
            console.error('❌ PhishGuard: Erro na análise', response.error);
            hideValidatingOverlay();
            showErrorAndProceed(url);
        }
    } catch (error) {
        console.error('❌ PhishGuard: Erro ao validar link:', error);
        hideValidatingOverlay();
        showErrorAndProceed(url);
    }
}

/**
 * Procede para o link após validação
 */
function proceedToLink(url, openInNewTab) {
    if (openInNewTab) {
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
    pendingNavigation = null;
}

/**
 * Mostra overlay de validação
 */
function showValidatingOverlay(url) {
    // Adicionar notificação no canto superior direito também
    const notification = document.createElement('div');
    notification.id = 'phishguard-validating-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.5);
            z-index: 2147483646;
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: system-ui, -apple-system, sans-serif;
            animation: slideInRight 0.3s ease;
        ">
            <div style="
                width: 24px;
                height: 24px;
                border: 3px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <div>
                <div style="font-weight: 600; font-size: 15px;">🛡️ PhishGuard Ativo</div>
                <div style="font-size: 13px; opacity: 0.9;">Verificando segurança do link...</div>
            </div>
        </div>
        <style>
            @keyframes slideInRight {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    document.body.appendChild(notification);
    
    // Overlay principal (mais sutil)
    const overlay = document.createElement('div');
    overlay.id = 'phishguard-validating-overlay';
    overlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: system-ui, -apple-system, sans-serif;
            animation: fadeIn 0.2s ease;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                padding: 32px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            ">
                <div style="
                    width: 48px;
                    height: 48px;
                    border: 4px solid #e5e7eb;
                    border-top-color: #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                "></div>
                <h2 style="color: #1f2937; margin: 0 0 8px 0; font-size: 20px;">
                    🛡️ Verificando Segurança
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 14px; max-width: 300px;">
                    Analisando o link antes de prosseguir...
                </p>
            </div>
        </div>
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(overlay);
}/**
 * Esconde overlay de validação
 */
function hideValidatingOverlay() {
    const overlay = document.getElementById('phishguard-validating-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    const notification = document.getElementById('phishguard-validating-notification');
    if (notification) {
        notification.remove();
    }
}

/**
 * Mostra diálogo de aviso para link suspeito
 */
function showLinkWarningDialog(result) {
    const riskInfo = CONFIG.RISK_LEVELS[result.riskLevel];

    // Preparar informação sobre redirecionamento
    let redirectHtml = '';
    if (result.isRedirect && result.finalURL !== result.url) {
        redirectHtml = `
            <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 2px solid #fbbf24;">
                <p style="margin: 0 0 12px 0; color: #78350f; font-size: 14px; font-weight: 600;">
                    🔀 LINK DE REDIRECIONAMENTO DETECTADO
                </p>
                <div style="margin-bottom: 12px;">
                    <p style="margin: 0 0 4px 0; color: #78350f; font-size: 12px; font-weight: 600;">
                        Link Intermediário:
                    </p>
                    <code style="
                        word-break: break-all; 
                        background: white; 
                        padding: 6px 10px; 
                        border-radius: 4px; 
                        display: block;
                        color: #92400e;
                        font-size: 12px;
                        border: 1px solid #fbbf24;
                    ">
                        ${result.url}
                    </code>
                </div>
                <div>
                    <p style="margin: 0 0 4px 0; color: #78350f; font-size: 12px; font-weight: 600;">
                        ⚠️ Destino Final (ESTE É O LINK QUE SERÁ ANALISADO):
                    </p>
                    <code style="
                        word-break: break-all; 
                        background: white; 
                        padding: 6px 10px; 
                        border-radius: 4px; 
                        display: block;
                        color: #dc2626;
                        font-size: 12px;
                        border: 2px solid #dc2626;
                        font-weight: 600;
                    ">
                        ${result.finalURL}
                    </code>
                </div>
            </div>
        `;
    }

    const dialog = document.createElement('div');
    dialog.id = 'phishguard-link-warning';
    dialog.innerHTML = `
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
            animation: fadeIn 0.2s ease;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                padding: 32px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                animation: slideUp 0.3s ease;
            ">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">⚠️</div>
                    <h1 style="color: ${riskInfo.color}; margin: 0 0 8px 0; font-size: 28px;">
                        Link Suspeito Detectado!
                    </h1>
                    <p style="color: #666; margin: 0; font-size: 16px;">
                        Nível de Risco: <strong style="color: ${riskInfo.color};">${riskInfo.label}</strong>
                    </p>
                </div>
                
                ${redirectHtml}
                
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 600;">
                        ${result.isRedirect ? 'DESTINO FINAL ANALISADO:' : 'VOCÊ ESTÁ TENTANDO ACESSAR:'}
                    </p>
                    <code style="
                        word-break: break-all; 
                        background: white; 
                        padding: 8px 12px; 
                        border-radius: 4px; 
                        display: block;
                        color: #ef4444;
                        font-size: 13px;
                        border: 2px solid #fecaca;
                    ">
                        ${result.isRedirect ? result.finalURL : result.url}
                    </code>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 16px;">
                        🔍 Por que este link é suspeito?
                    </h2>
                    ${result.warnings.slice(0, 5).map(w => `
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
                    ${result.warnings.length > 5 ? `
                        <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 12px 0 0 0;">
                            ... e mais ${result.warnings.length - 5} problemas detectados
                        </p>
                    ` : ''}
                </div>
                
                <div style="
                    background: #fffbeb;
                    border: 2px solid #fbbf24;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 24px;
                ">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                        <strong>⚠️ Recomendação:</strong> Este link apresenta características comuns em tentativas de phishing. 
                        Evite inserir dados pessoais, senhas ou informações bancárias caso decida prosseguir.
                    </p>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button id="phishguard-cancel-nav" style="
                        background: #10b981;
                        color: white;
                        border: none;
                        padding: 14px 32px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        flex: 1;
                    " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                        ✓ Não Acessar (Seguro)
                    </button>
                    <button id="phishguard-proceed-anyway" style="
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 14px 32px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        flex: 1;
                    " onmouseover="this.style.background='#4b5563'" onmouseout="this.style.background='#6b7280'">
                        Acessar Mesmo Assim
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
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;

    document.body.appendChild(dialog);

    // Event listeners
    document.getElementById('phishguard-cancel-nav').addEventListener('click', () => {
        dialog.remove();
        pendingNavigation = null;
    });

    document.getElementById('phishguard-proceed-anyway').addEventListener('click', () => {
        dialog.remove();
        if (pendingNavigation) {
            proceedToLink(pendingNavigation.url, pendingNavigation.openInNewTab);
        }
    });
}

/**
 * Mostra erro e permite continuar
 */
function showErrorAndProceed(url) {
    const proceed = confirm(
        '⚠️ PhishGuard: Não foi possível analisar este link.\n\n' +
        'Deseja prosseguir mesmo assim?'
    );

    if (proceed && pendingNavigation) {
        proceedToLink(pendingNavigation.url, pendingNavigation.openInNewTab);
    } else {
        pendingNavigation = null;
    }
}

/**
 * Observa novos links adicionados dinamicamente
 */
function observeNewLinks() {
    const observer = new MutationObserver((mutations) => {
        // Os event listeners já estão no documento, então novos links
        // serão automaticamente interceptados
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Adiciona indicador flutuante de status
 */
function addFloatingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'phishguard-indicator';
    indicator.innerHTML = '🛡️';
    indicator.title = 'PhishGuard Ativo - Validação automática de links';
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
