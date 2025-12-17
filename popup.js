/**
 * Script do Popup da Extensão
 * Interface de usuário da extensão
 */

// Elementos do DOM
const linksAnalisadosEl = document.getElementById('links-analisados');
const ameacasBloqueadasEl = document.getElementById('ameacas-bloqueadas');
const btnLimparCache = document.getElementById('btn-limpar-cache');
const btnSobre = document.getElementById('btn-sobre');

/**
 * Carrega e exibe estatísticas ao abrir o popup
 */
async function carregarEstatisticas() {
    try {
        const dados = await chrome.storage.local.get('estatisticas');
        const estatisticas = dados.estatisticas || {
            linksAnalisados: 0,
            ameacasBloqueadas: 0
        };

        // Anima os números
        animarNumero(linksAnalisadosEl, 0, estatisticas.linksAnalisados, 1000);
        animarNumero(ameacasBloqueadasEl, 0, estatisticas.ameacasBloqueadas, 1000);

    } catch (erro) {
        console.error('Erro ao carregar estatísticas:', erro);
    }
}

/**
 * Anima a contagem de um número
 * @param {HTMLElement} elemento - Elemento a ser animado
 * @param {number} inicio - Valor inicial
 * @param {number} fim - Valor final
 * @param {number} duracao - Duração da animação em ms
 */
function animarNumero(elemento, inicio, fim, duracao) {
    const incremento = (fim - inicio) / (duracao / 16);
    let atual = inicio;

    const timer = setInterval(() => {
        atual += incremento;
        if ((incremento > 0 && atual >= fim) || (incremento < 0 && atual <= fim)) {
            atual = fim;
            clearInterval(timer);
        }
        elemento.textContent = Math.floor(atual);
    }, 16);
}

/**
 * Limpa o cache de reputação
 */
async function limparCache() {
    try {
        const confirmacao = confirm('Deseja realmente limpar o cache? As verificações de reputação serão refeitas.');

        if (confirmacao) {
            // Envia mensagem para o background script limpar o cache
            await chrome.runtime.sendMessage({ acao: 'limpar_cache' });

            alert('Cache limpo com sucesso!');
        }
    } catch (erro) {
        console.error('Erro ao limpar cache:', erro);
        alert('Erro ao limpar cache.');
    }
}

/**
 * Mostra informações sobre a extensão
 */
function mostrarSobre() {
    const mensagem = `
🛡️ Guardião Web
Versão 1.0.0

Extensão open-source desenvolvida para proteger usuários brasileiros contra links maliciosos e tentativas de phishing.

Funcionalidades:
✓ Detecção de encurtadores de URL
✓ Identificação de IPs suspeitos
✓ Análise de caracteres homógrafos
✓ Verificação de reputação de domínios
✓ Detecção de domínios recém-registrados
✓ Verificação de HTTPS e certificados SSL

Desenvolvido como trabalho acadêmico de segurança.

GitHub: https://github.com/Arturoliveira1212/Extensao-chrome-phishing
  `;

    alert(mensagem);
}

// Event Listeners
btnLimparCache.addEventListener('click', limparCache);
btnSobre.addEventListener('click', mostrarSobre);

// Carrega estatísticas ao abrir
carregarEstatisticas();