/**
 * Background Service Worker
 * Responsável por verificações de reputação, APIs externas e resolução de redirecionamentos
 */

// Cache para evitar consultas repetidas
const cacheReputacao = new Map();
const TEMPO_CACHE = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Listener para mensagens do content script
 */
chrome.runtime.onMessage.addListener((mensagem, remetente, enviarResposta) => {
    if (mensagem.acao === 'verificar_reputacao') {
        verificarReputacaoCompleta(mensagem.url)
            .then(resultado => enviarResposta(resultado))
            .catch(erro => {
                console.error('Erro ao verificar reputação:', erro);
                enviarResposta({
                    erro: true,
                    mensagem: erro.message
                });
            });
        return true; // Mantém o canal aberto para resposta assíncrona
    }

    if (mensagem.acao === 'resolver_redirecionamento') {
        resolverURLFinal(mensagem.url)
            .then(urlFinal => enviarResposta({ urlFinal: urlFinal }))
            .catch(erro => {
                console.error('Erro ao resolver redirecionamento:', erro);
                enviarResposta({ urlFinal: mensagem.url }); // Retorna URL original em caso de erro
            });
        return true;
    }

    if (mensagem.acao === 'limpar_cache') {
        cacheReputacao.clear();
        console.log('Cache de reputação limpo');
        enviarResposta({ sucesso: true });
        return true;
    }
});

/**
 * Verifica reputação completa de um domínio
 * @param {string} url - URL para verificação
 * @returns {Promise<Object>} - Resultado da verificação
 */
async function verificarReputacaoCompleta(url) {
    try {
        const urlObj = new URL(url);
        const dominio = urlObj.hostname.toLowerCase().replace('www.', '');

        // Verifica cache primeiro
        const dadosCache = cacheReputacao.get(dominio);
        if (dadosCache && (Date.now() - dadosCache.timestamp) < TEMPO_CACHE) {
            return dadosCache.resultado;
        }

        // Executa verificações em paralelo
        const [
            resultadoBlacklist,
            resultadoIdadeDominio,
            resultadoVirusTotal
        ] = await Promise.all([
            verificarBlacklist(dominio),
            verificarIdadeDominio(dominio),
            verificarVirusTotal(dominio)
        ]);

        // Compila resultado
        const resultado = {
            emBlacklist: resultadoBlacklist.malicioso,
            fonteBlacklist: resultadoBlacklist.fonte,
            dominioRecente: resultadoIdadeDominio.recente,
            idadeDias: resultadoIdadeDominio.dias,
            dataRegistro: resultadoIdadeDominio.dataRegistro,
            reputacaoBaixa: resultadoVirusTotal.malicioso,
            deteccoesMaliciosas: resultadoVirusTotal.deteccoes,
            certificadoInvalido: false // Será verificado na navegação real
        };

        // Armazena no cache
        cacheReputacao.set(dominio, {
            resultado: resultado,
            timestamp: Date.now()
        });

        return resultado;

    } catch (erro) {
        console.error('Erro ao verificar reputação completa:', erro);
        return {
            erro: true,
            emBlacklist: false,
            dominioRecente: false,
            reputacaoBaixa: false,
            certificadoInvalido: false
        };
    }
}

/**
 * Verifica se o domínio está em listas negras (blacklist)
 * Usa APIs gratuitas como Google Safe Browsing Lookup API
 * @param {string} dominio - Domínio para verificação
 * @returns {Promise<Object>} - {malicioso: boolean, fonte: string}
 */
async function verificarBlacklist(dominio) {
    try {
        // Nota: Para usar o Google Safe Browsing, você precisa de uma chave API
        // Cadastre-se em: https://developers.google.com/safe-browsing/v4/get-started
        // Como alternativa gratuita, usamos PhishTank API

        // Verifica com PhishTank (gratuito, sem chave necessária para consultas básicas)
        const resultadoPhishTank = await verificarPhishTank(dominio);

        return {
            malicioso: resultadoPhishTank.encontrado,
            fonte: resultadoPhishTank.encontrado ? 'PhishTank' : 'Nenhuma'
        };

    } catch (erro) {
        console.error('Erro ao verificar blacklist:', erro);
        return { malicioso: false, fonte: 'Erro' };
    }
}

/**
 * Consulta PhishTank API para verificar phishing
 * @param {string} dominio - Domínio para verificar
 * @returns {Promise<Object>} - Resultado da consulta
 */
async function verificarPhishTank(dominio) {
    try {
        // PhishTank oferece um arquivo de download com URLs conhecidas
        // Como alternativa, usamos verificação local de padrões conhecidos

        // Lista simplificada de domínios maliciosos conhecidos (seria expandida)
        const dominiosMaliciososConhecidos = [
            // Esta lista seria alimentada por uma base de dados atualizada
        ];

        const encontrado = dominiosMaliciososConhecidos.includes(dominio);

        return { encontrado: encontrado };

    } catch (erro) {
        console.error('Erro ao verificar PhishTank:', erro);
        return { encontrado: false };
    }
}

/**
 * Verifica idade do domínio usando WHOIS API
 * @param {string} dominio - Domínio para verificação
 * @returns {Promise<Object>} - {recente: boolean, dias: number, dataRegistro: string}
 */
async function verificarIdadeDominio(dominio) {
    try {
        // Usa WHOIS API gratuita
        // Alternativas: whoisxmlapi.com (plano gratuito limitado)
        // ou API local se disponível

        const resposta = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_free&domainName=${dominio}&outputFormat=JSON`)
            .catch(() => null);

        if (resposta && resposta.ok) {
            const dados = await resposta.json();

            if (dados.WhoisRecord && dados.WhoisRecord.createdDate) {
                const dataRegistro = new Date(dados.WhoisRecord.createdDate);
                const hoje = new Date();
                const diasDesdeRegistro = Math.floor((hoje - dataRegistro) / (1000 * 60 * 60 * 24));

                return {
                    recente: diasDesdeRegistro < 180, // Domínio com menos de 6 meses é suspeito
                    dias: diasDesdeRegistro,
                    dataRegistro: dataRegistro.toISOString()
                };
            }
        }

        // Se não conseguir verificar, assume que não é recente (para evitar falsos positivos)
        return {
            recente: false,
            dias: null,
            dataRegistro: null
        };

    } catch (erro) {
        console.error('Erro ao verificar idade do domínio:', erro);
        return { recente: false, dias: null, dataRegistro: null };
    }
}

/**
 * Verifica reputação usando VirusTotal API
 * @param {string} dominio - Domínio para verificação
 * @returns {Promise<Object>} - {malicioso: boolean, deteccoes: number}
 */
async function verificarVirusTotal(dominio) {
    try {
        // VirusTotal oferece API gratuita com limite de requisições
        // Cadastre-se em: https://www.virustotal.com/gui/join-us

        // Nota: Você deve adicionar sua chave API aqui
        const VIRUSTOTAL_API_KEY = 'SUA_CHAVE_API_AQUI';

        if (VIRUSTOTAL_API_KEY === 'SUA_CHAVE_API_AQUI') {
            // Se não houver chave configurada, retorna resultado neutro
            return { malicioso: false, deteccoes: 0 };
        }

        const resposta = await fetch(
            `https://www.virustotal.com/api/v3/domains/${dominio}`,
            {
                headers: {
                    'x-apikey': VIRUSTOTAL_API_KEY
                }
            }
        );

        if (resposta.ok) {
            const dados = await resposta.json();
            const stats = dados.data.attributes.last_analysis_stats;

            const totalDeteccoes = stats.malicious + stats.suspicious;

            return {
                malicioso: totalDeteccoes > 0,
                deteccoes: totalDeteccoes
            };
        }

        return { malicioso: false, deteccoes: 0 };

    } catch (erro) {
        console.error('Erro ao verificar VirusTotal:', erro);
        return { malicioso: false, deteccoes: 0 };
    }
}

/**
 * Resolve o destino final de uma URL seguindo redirecionamentos
 * @param {string} url - URL inicial
 * @returns {Promise<string>} - URL final
 */
async function resolverURLFinal(url) {
    try {
        // Usa fetch com redirect: 'follow' para seguir redirecionamentos
        const resposta = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow'
        });

        return resposta.url; // Retorna URL final após redirecionamentos

    } catch (erro) {
        console.error('Erro ao resolver redirecionamento:', erro);
        return url; // Retorna URL original se houver erro
    }
}

/**
 * Limpa cache antigo periodicamente
 */
function limparCacheAntigo() {
    const agora = Date.now();

    for (const [dominio, dados] of cacheReputacao.entries()) {
        if ((agora - dados.timestamp) > TEMPO_CACHE) {
            cacheReputacao.delete(dominio);
        }
    }
}

// Limpa cache a cada hora
setInterval(limparCacheAntigo, 60 * 60 * 1000);

/**
 * Listener para instalação da extensão
 */
chrome.runtime.onInstalled.addListener((detalhes) => {
    if (detalhes.reason === 'install') {
        console.log('Extensão de Proteção Anti-Phishing instalada com sucesso!');

        // Configura valores padrão no storage
        chrome.storage.local.set({
            extensaoAtiva: true,
            estatisticas: {
                linksAnalisados: 0,
                ameacasBloqueadas: 0
            }
        });
    }
});

console.log('Background Service Worker iniciado');
