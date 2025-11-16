// PhishGuard Popup Script

let currentURL = '';
let analysisResult = null;

document.addEventListener('DOMContentLoaded', function () {
    // Carregar URL atual
    loadCurrentURL();

    // Carregar configurações
    loadSettings();

    // Event listeners
    document.getElementById('analyzeBtn').addEventListener('click', analyzeCurrentURL);
    document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
    document.getElementById('autoCheckToggle').addEventListener('change', updateSettings);
    document.getElementById('notificationsToggle').addEventListener('change', updateSettings);
});

/**
 * Carrega a URL da aba atual
 */
async function loadCurrentURL() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.url) {
            currentURL = tab.url;

            // Ignorar páginas internas do navegador
            if (currentURL.startsWith('chrome://') || currentURL.startsWith('about:') ||
                currentURL.startsWith('edge://') || currentURL.startsWith('chrome-extension://')) {
                document.getElementById('currentURL').textContent = 'Página interna do navegador';
                document.getElementById('analyzeBtn').disabled = true;
                document.getElementById('analyzeBtn').textContent = 'Análise não disponível';
                return;
            }

            // Exibir URL (truncada se muito longa)
            const displayURL = currentURL.length > 50
                ? currentURL.substring(0, 47) + '...'
                : currentURL;
            document.getElementById('currentURL').textContent = displayURL;
            document.getElementById('currentURL').title = currentURL;
        } else {
            document.getElementById('currentURL').textContent = 'Nenhuma URL detectada';
            document.getElementById('analyzeBtn').disabled = true;
        }
    } catch (error) {
        console.error('Erro ao carregar URL:', error);
        document.getElementById('currentURL').textContent = 'Erro ao carregar URL';
    }
}

/**
 * Analisa a URL atual
 */
async function analyzeCurrentURL() {
    if (!currentURL) return;

    // Mostrar loading
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('loadingSection').style.display = 'block';
    document.getElementById('analyzeBtn').disabled = true;

    try {
        // Enviar mensagem para background script
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeURL',
            url: currentURL
        });

        if (response.success) {
            analysisResult = response.result;
            displayResults(analysisResult);
        } else {
            showError('Erro ao analisar URL: ' + response.error);
        }
    } catch (error) {
        console.error('Erro na análise:', error);
        showError('Erro ao comunicar com o background script');
    } finally {
        document.getElementById('loadingSection').style.display = 'none';
        document.getElementById('analyzeBtn').disabled = false;
    }
}

/**
 * Exibe os resultados da análise
 */
function displayResults(result) {
    const resultSection = document.getElementById('resultSection');
    const riskBadge = document.getElementById('riskBadge');
    const statusText = document.getElementById('statusText');
    const checksText = document.getElementById('checksText');
    const warningsSection = document.getElementById('warningsSection');
    const safeSection = document.getElementById('safeSection');
    const warningsList = document.getElementById('warningsList');

    // Mostrar seção de resultado
    resultSection.style.display = 'block';

    // Configurar badge de risco
    const riskInfo = CONFIG.RISK_LEVELS[result.riskLevel];
    riskBadge.textContent = riskInfo.label;
    riskBadge.className = 'risk-badge risk-' + result.riskLevel.toLowerCase();
    riskBadge.style.background = riskInfo.color;

    // Status
    statusText.textContent = result.isPhishing ? 'Suspeito' : 'Aparentemente Seguro';
    statusText.style.color = result.isPhishing ? '#ef4444' : '#10b981';

    // Número de verificações
    checksText.textContent = result.warnings.length + ' verificações realizadas';

    // Mostrar avisos ou mensagem de segurança
    if (result.warnings.length > 0) {
        warningsSection.style.display = 'block';
        safeSection.style.display = 'none';

        // Limpar lista anterior
        warningsList.innerHTML = '';

        // Adicionar cada aviso
        result.warnings.forEach(warning => {
            const warningItem = document.createElement('div');
            warningItem.className = 'warning-item severity-' + warning.severity;

            warningItem.innerHTML = `
                <div class="warning-header">
                    <span class="warning-icon">${getSeverityIcon(warning.severity)}</span>
                    <span class="warning-title">${warning.title}</span>
                </div>
                <div class="warning-message">${warning.message}</div>
            `;

            warningsList.appendChild(warningItem);
        });
    } else {
        warningsSection.style.display = 'none';
        safeSection.style.display = 'block';
    }
}

/**
 * Retorna ícone baseado na severidade
 */
function getSeverityIcon(severity) {
    if (severity >= 3) return '🔴';
    if (severity >= 2) return '🟡';
    return '🔵';
}

/**
 * Mostra mensagem de erro
 */
function showError(message) {
    const resultSection = document.getElementById('resultSection');
    resultSection.style.display = 'block';
    resultSection.innerHTML = `
        <div class="error-message">
            <div class="error-icon">❌</div>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Carrega configurações
 */
async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get(['autoCheck', 'showNotifications']);

        document.getElementById('autoCheckToggle').checked = settings.autoCheck !== false;
        document.getElementById('notificationsToggle').checked = settings.showNotifications !== false;
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

/**
 * Atualiza configurações
 */
async function updateSettings() {
    const autoCheck = document.getElementById('autoCheckToggle').checked;
    const showNotifications = document.getElementById('notificationsToggle').checked;

    try {
        await chrome.runtime.sendMessage({
            action: 'updateSettings',
            settings: {
                autoCheck: autoCheck,
                showNotifications: showNotifications
            }
        });

        // Feedback visual
        showToast('Configurações salvas!');
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
    }
}

/**
 * Limpa o cache de análises
 */
async function clearCache() {
    try {
        await chrome.runtime.sendMessage({ action: 'clearCache' });
        showToast('Cache limpo com sucesso!');
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
        showToast('Erro ao limpar cache');
    }
}

/**
 * Mostra toast de notificação
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
