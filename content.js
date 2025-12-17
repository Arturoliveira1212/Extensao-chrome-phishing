/**
 * Content Script Principal
 * Intercepta cliques em links e coordena análise de segurança
 */

// Elemento do modal de análise atual
let modalAtual = null;

// URL sendo analisada atualmente
let urlEmAnalise = null;

/**
 * Inicializa os event listeners quando a página carregar
 */
function inicializar() {
    // Intercepta todos os cliques na página
    document.addEventListener('click', interceptarClique, true);

    // Também intercepta eventos de navegação por teclado
    document.addEventListener('keydown', interceptarTeclado, true);
}

/**
 * Intercepta cliques em elementos da página
 * @param {Event} evento - Evento de clique
 */
async function interceptarClique(evento) {
    // Busca o elemento <a> mais próximo (caso o clique seja em um elemento filho)
    const link = evento.target.closest('a');

    if (!link || !link.href) {
        return; // Não é um link, permite a ação normal
    }

    // Ignora links internos (âncoras)
    if (link.href.startsWith('#') || link.href.startsWith('javascript:')) {
        return;
    }

    // Ignora links do mesmo domínio (navegação interna)
    try {
        const urlDestino = new URL(link.href);
        const urlAtual = new URL(window.location.href);

        if (urlDestino.hostname === urlAtual.hostname) {
            // Mesmo domínio, permite navegação normal
            return;
        }
    } catch (e) {
        // Se houver erro ao processar URLs, continua com análise por segurança
    }

    // Previne a navegação imediata
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();

    // Obtém a URL do link
    let urlAlvo = link.href;

    // Resolve redirecionamentos se for um encurtador
    // if (ehEncurtador(urlAlvo)) {
    urlAlvo = await resolverRedirecionamento(urlAlvo);
    // }

    // Inicia análise da URL
    await analisarEProcessarLink(urlAlvo, link);
}

/**
 * Intercepta navegação por teclado (Enter em links)
 * @param {Event} evento - Evento de teclado
 */
async function interceptarTeclado(evento) {
    if (evento.key === 'Enter') {
        const elementoAtivo = document.activeElement;

        if (elementoAtivo && elementoAtivo.tagName === 'A' && elementoAtivo.href) {
            // Ignora links do mesmo domínio
            try {
                const urlDestino = new URL(elementoAtivo.href);
                const urlAtual = new URL(window.location.href);

                if (urlDestino.hostname === urlAtual.hostname) {
                    // Mesmo domínio, permite navegação normal
                    return;
                }
            } catch (e) {
                // Se houver erro, continua com análise
            }

            evento.preventDefault();
            evento.stopPropagation();

            let urlAlvo = elementoAtivo.href;

            if (ehEncurtador(urlAlvo)) {
                urlAlvo = await resolverRedirecionamento(urlAlvo);
            }

            await analisarEProcessarLink(urlAlvo, elementoAtivo);
        }
    }
}

/**
 * Analisa um link e processa o resultado
 * @param {string} url - URL para análise
 * @param {HTMLElement} elementoLink - Elemento do link clicado
 */
async function analisarEProcessarLink(url, elementoLink) {
    try {
        urlEmAnalise = url;

        // Mostra modal de carregamento
        mostrarModalCarregamento(url);

        // Cria instância do analisador
        const analisador = new AnalisadorURL();

        // Realiza análise completa
        const resultado = await analisador.analisarURL(url);

        // Atualiza estatísticas
        await atualizarEstatisticas(resultado);

        // Processa resultado baseado na classificação
        if (resultado.classificacao === NIVEL_RISCO.SEGURO) {
            // Link seguro, fecha modal e navega diretamente
            fecharModal();
            navegarParaURL(url);
        } else {
            // Link com risco, fecha modal de carregamento e mostra aviso
            fecharModal();
            // Aguarda fechamento completo antes de mostrar modal de aviso
            setTimeout(() => {
                mostrarModalAviso(resultado, elementoLink);
            }, 350);
        }

    } catch (erro) {
        console.error('Erro ao analisar link:', erro);
        fecharModal();

        // Em caso de erro, permite navegação mas com aviso
        const confirmar = confirm('Erro ao analisar link. Deseja continuar mesmo assim?');
        if (confirmar) {
            navegarParaURL(url);
        }
    }
}

/**
 * Resolve redirecionamentos de URLs encurtadas
 * @param {string} url - URL encurtada
 * @returns {Promise<string>} - URL final
 */
async function resolverRedirecionamento(url) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            {
                acao: 'resolver_redirecionamento',
                url: url
            },
            (resposta) => {
                if (chrome.runtime.lastError || !resposta) {
                    resolve(url); // Retorna URL original em caso de erro
                } else {
                    resolve(resposta.urlFinal);
                }
            }
        );
    });
}

/**
 * Mostra modal de carregamento durante análise
 * @param {string} url - URL sendo analisada
 */
function mostrarModalCarregamento(url) {
    // Remove modal anterior se existir
    fecharModal();

    // Cria elemento do modal
    const modal = document.createElement('div');
    modal.id = 'anti-phishing-modal-loading';
    modal.className = 'anti-phishing-modal';

    // Extrai domínio para exibição
    let dominioExibicao = url;
    try {
        const urlObj = new URL(url);
        dominioExibicao = urlObj.hostname;
    } catch (e) {
        // Usa URL completa se houver erro
    }

    modal.innerHTML = `
    <div class="anti-phishing-modal-conteudo loading">
      <div class="anti-phishing-spinner"></div>
      <h3>🔍 Analisando Link</h3>
      <p>Verificando segurança de:</p>
      <div class="anti-phishing-url">${dominioExibicao}</div>
      <p class="anti-phishing-aguarde">Aguarde um momento...</p>
    </div>
  `;

    document.body.appendChild(modal);
    modalAtual = modal;

    // Mostra modal com animação
    setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Mostra modal de aviso com resultado da análise
 * @param {Object} resultado - Resultado da análise
 * @param {HTMLElement} elementoLink - Elemento do link original
 */
function mostrarModalAviso(resultado, elementoLink) {
    // Cria elemento do modal (não fecha o anterior pois já foi fechado)
    const modal = document.createElement('div');
    modal.id = 'anti-phishing-modal-aviso';
    modal.className = 'anti-phishing-modal';

    // Define ícone baseado no nível de risco
    const icone = resultado.classificacao === NIVEL_RISCO.ALTO_RISCO ? '🛑' : '⚠️';

    // Gera lista de problemas
    let listaProblemas = '';
    if (resultado.problemasDetectados.length > 0) {
        listaProblemas = '<ul class="anti-phishing-problemas">';
        resultado.problemasDetectados.forEach(problema => {
            listaProblemas += `<li>${problema.descricao}</li>`;
        });
        listaProblemas += '</ul>';
    }

    // Extrai domínio para exibição
    let dominioExibicao = resultado.url;
    try {
        const urlObj = new URL(resultado.url);
        dominioExibicao = urlObj.hostname;
    } catch (e) {
        // Usa URL completa se houver erro
    }

    modal.innerHTML = `
    <div class="anti-phishing-modal-conteudo aviso" style="border-color: ${resultado.corAlerta}">
      <div class="anti-phishing-icone" style="color: ${resultado.corAlerta}">${icone}</div>
      <h3 style="color: ${resultado.corAlerta}">${resultado.mensagem}</h3>
      
      <div class="anti-phishing-detalhes">
        <p><strong>URL:</strong></p>
        <div class="anti-phishing-url">${dominioExibicao}</div>
        
        <p><strong>Nível de Risco:</strong> <span style="color: ${resultado.corAlerta}">${formatarClassificacao(resultado.classificacao)}</span></p>
        
        ${listaProblemas ? '<p><strong>Problemas Detectados:</strong></p>' + listaProblemas : ''}
      </div>

      <div class="anti-phishing-acoes">
        <button id="anti-phishing-btn-voltar" class="anti-phishing-btn btn-seguro">
          🛡️ Não Visitar (Recomendado)
        </button>
        <button id="anti-phishing-btn-continuar" class="anti-phishing-btn btn-risco">
          ⚡ Continuar Mesmo Assim
        </button>
      </div>

      <p class="anti-phishing-rodape">
        <small>🔒 Protegido por Guardião Web</small>
      </p>
    </div>
  `;

    document.body.appendChild(modal);
    modalAtual = modal;

    // Event listeners para botões
    document.getElementById('anti-phishing-btn-voltar').addEventListener('click', () => {
        fecharModal();
    });

    document.getElementById('anti-phishing-btn-continuar').addEventListener('click', () => {
        fecharModal();
        navegarParaURL(resultado.url);
    });

    // Mostra modal com animação
    setTimeout(() => modal.classList.add('show'), 10);
}

/**
 * Fecha e remove o modal atual
 */
function fecharModal() {
    if (modalAtual) {
        modalAtual.classList.remove('show');
        setTimeout(() => {
            if (modalAtual && modalAtual.parentNode) {
                modalAtual.parentNode.removeChild(modalAtual);
            }
            modalAtual = null;
        }, 300);
    }
}

/**
 * Navega para a URL especificada
 * @param {string} url - URL de destino
 */
function navegarParaURL(url) {
    window.location.href = url;
}

/**
 * Formata a classificação para exibição
 * @param {string} classificacao - Nível de risco
 * @returns {string} - Texto formatado
 */
function formatarClassificacao(classificacao) {
    const mapa = {
        'seguro': 'Seguro ✅',
        'baixo_risco': 'Baixo Risco ⚠️',
        'alto_risco': 'Alto Risco 🛑'
    };
    return mapa[classificacao] || classificacao;
}

/**
 * Atualiza estatísticas de uso da extensão
 * @param {Object} resultado - Resultado da análise
 */
async function atualizarEstatisticas(resultado) {
    try {
        const dados = await chrome.storage.local.get('estatisticas');
        const estatisticas = dados.estatisticas || {
            linksAnalisados: 0,
            ameacasBloqueadas: 0
        };

        estatisticas.linksAnalisados++;

        if (resultado.classificacao !== NIVEL_RISCO.SEGURO) {
            estatisticas.ameacasBloqueadas++;
        }

        await chrome.storage.local.set({ estatisticas: estatisticas });
    } catch (erro) {
        console.error('Erro ao atualizar estatísticas:', erro);
    }
}

// Inicializa o content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}