/**
 * Analisador de URLs
 * Módulo responsável por analisar URLs e determinar níveis de risco
 */

/**
 * Níveis de classificação de risco
 */
const NIVEL_RISCO = {
    SEGURO: 'seguro',
    BAIXO_RISCO: 'baixo_risco',
    ALTO_RISCO: 'alto_risco'
};

/**
 * Classe principal para análise de URLs
 */
class AnalisadorURL {
    constructor() {
        this.pontuacaoRisco = 0;
        this.problemasDetectados = [];
    }

    /**
     * Realiza análise completa de uma URL
     * @param {string} url - URL para análise
     * @returns {Promise<Object>} - Resultado da análise com classificação e detalhes
     */
    async analisarURL(url) {
        // Reseta análise anterior
        this.pontuacaoRisco = 0;
        this.problemasDetectados = [];

        try {
            // Valida se a URL é bem formada
            if (!ehURLValida(url)) {
                this.adicionarProblema('URL inválida ou malformada', 50);
                return this.gerarResultado(url);
            }

            // 1. Verifica uso de encurtadores (risco médio)
            if (ehEncurtador(url)) {
                this.adicionarProblema('URL usa serviço de encurtamento', 25);
            }

            // 2. Verifica uso de IP em vez de domínio (risco alto)
            if (usaEnderecoIP(url)) {
                this.adicionarProblema('URL usa endereço IP em vez de domínio', 40);
            }

            // 3. Detecta caracteres homógrafos (risco alto)
            const resultadoHomografos = detectarHomografos(url);
            if (resultadoHomografos.temHomografos) {
                const detalhes = resultadoHomografos.caracteresSuspeitos
                    .map(c => `'${c.caractere}' deveria ser '${c.deveSeriar}'`)
                    .join(', ');
                this.adicionarProblema(
                    `Caracteres suspeitos detectados: ${detalhes}`,
                    45
                );
            }

            // 4. Verifica ausência de HTTPS (risco médio)
            if (!usaHTTPS(url)) {
                this.adicionarProblema('URL não usa protocolo HTTPS seguro', 30);
            }

            // 5. Verifica similaridade com domínios legítimos (risco alto)
            const resultadoSimilaridade = verificarSimilaridadeDominio(url);
            if (resultadoSimilaridade.ehSuspeito) {
                this.adicionarProblema(
                    `Domínio similar a '${resultadoSimilaridade.dominioSimilar}' - possível falsificação`,
                    50
                );
            }

            // 6. Verifica comprimento e padrões suspeitos na URL
            this.verificarPadroesSuspeitos(url);

            // 7. Solicita verificação de reputação ao background service
            const resultadoReputacao = await this.verificarReputacao(url);
            if (resultadoReputacao) {
                this.processarResultadoReputacao(resultadoReputacao);
            }

            return this.gerarResultado(url);

        } catch (erro) {
            console.error('Erro durante análise da URL:', erro);
            this.adicionarProblema('Erro ao analisar URL', 20);
            return this.gerarResultado(url);
        }
    }

    /**
     * Adiciona um problema detectado à lista
     * @param {string} descricao - Descrição do problema
     * @param {number} pontos - Pontos de risco (0-100)
     */
    adicionarProblema(descricao, pontos) {
        this.problemasDetectados.push({
            descricao: descricao,
            gravidade: pontos
        });
        this.pontuacaoRisco += pontos;
    }

    /**
     * Verifica padrões suspeitos na estrutura da URL
     * @param {string} url - URL para verificação
     */
    verificarPadroesSuspeitos(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            const pathname = urlObj.pathname;

            // Verifica excesso de subdomínios (possível ofuscação)
            const subdominios = hostname.split('.');
            if (subdominios.length > 4) {
                this.adicionarProblema('URL possui muitos subdomínios', 20);
            }

            // Verifica uso excessivo de hífens ou números (suspeito)
            const hifens = (hostname.match(/-/g) || []).length;
            if (hifens > 3) {
                this.adicionarProblema('Domínio possui muitos hífens', 15);
            }

            const numeros = (hostname.match(/\d/g) || []).length;
            if (numeros > 4) {
                this.adicionarProblema('Domínio possui muitos números', 15);
            }

            // Verifica URLs extremamente longas (possível ofuscação)
            if (url.length > 200) {
                this.adicionarProblema('URL extremamente longa', 20);
            }

            // Verifica uso de @ na URL (técnica de phishing)
            if (url.includes('@')) {
                this.adicionarProblema('URL contém @ (possível tentativa de enganar usuário)', 35);
            }

            // Verifica TLD suspeitos
            const tldsSuspeitos = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
            const tld = hostname.substring(hostname.lastIndexOf('.'));
            if (tldsSuspeitos.includes(tld)) {
                this.adicionarProblema(`TLD suspeito: ${tld}`, 25);
            }

            // Verifica palavras suspeitas no domínio
            const palavrasSuspeitas = [
                'login', 'signin', 'account', 'verify', 'secure', 'update',
                'confirm', 'banco', 'seguro', 'validar', 'atualizar'
            ];

            const dominioLower = hostname.toLowerCase();
            for (const palavra of palavrasSuspeitas) {
                if (dominioLower.includes(palavra)) {
                    this.adicionarProblema(`Palavra suspeita no domínio: ${palavra}`, 15);
                    break; // Conta apenas uma vez
                }
            }

        } catch (erro) {
            console.error('Erro ao verificar padrões suspeitos:', erro);
        }
    }

    /**
     * Solicita verificação de reputação ao background service
     * @param {string} url - URL para verificar
     * @returns {Promise<Object>} - Resultado da verificação
     */
    async verificarReputacao(url) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(
                {
                    acao: 'verificar_reputacao',
                    url: url
                },
                (resposta) => {
                    if (chrome.runtime.lastError) {
                        console.error('Erro ao comunicar com background:', chrome.runtime.lastError);
                        resolve(null);
                    } else {
                        resolve(resposta);
                    }
                }
            );
        });
    }

    /**
     * Processa resultado da verificação de reputação
     * @param {Object} resultado - Dados retornados pela verificação
     */
    processarResultadoReputacao(resultado) {
        // Verifica se está em blacklist
        if (resultado.emBlacklist) {
            this.adicionarProblema(
                'Domínio encontrado em lista negra de sites maliciosos',
                60
            );
        }

        // Verifica idade do domínio
        if (resultado.dominioRecente) {
            this.adicionarProblema(
                `Domínio registrado recentemente (${resultado.idadeDias} dias)`,
                35
            );
        }

        // Verifica reputação geral
        if (resultado.reputacaoBaixa) {
            this.adicionarProblema(
                'Domínio possui baixa reputação',
                30
            );
        }

        // Verifica certificado SSL
        if (resultado.certificadoInvalido) {
            this.adicionarProblema(
                'Certificado SSL inválido ou não confiável',
                40
            );
        }
    }

    /**
     * Gera resultado final da análise com classificação
     * @param {string} url - URL analisada
     * @returns {Object} - Resultado completo
     */
    gerarResultado(url) {
        // Define classificação baseada na pontuação
        let classificacao;
        let corAlerta;
        let mensagem;

        if (this.pontuacaoRisco === 0) {
            classificacao = NIVEL_RISCO.SEGURO;
            corAlerta = '#4CAF50'; // Verde
            mensagem = 'Este link parece seguro!';
        } else if (this.pontuacaoRisco < 50) {
            classificacao = NIVEL_RISCO.BAIXO_RISCO;
            corAlerta = '#FF9800'; // Laranja
            mensagem = 'Este link apresenta alguns riscos. Prossiga com cautela.';
        } else {
            classificacao = NIVEL_RISCO.ALTO_RISCO;
            corAlerta = '#F44336'; // Vermelho
            mensagem = '⚠️ ATENÇÃO: Este link é potencialmente perigoso!';
        }

        return {
            url: url,
            classificacao: classificacao,
            pontuacaoRisco: this.pontuacaoRisco,
            problemasDetectados: this.problemasDetectados,
            corAlerta: corAlerta,
            mensagem: mensagem,
            dataAnalise: new Date().toISOString()
        };
    }

    /**
     * Gera relatório textual dos problemas detectados
     * @returns {string} - Relatório formatado
     */
    gerarRelatorioProblemas() {
        if (this.problemasDetectados.length === 0) {
            return 'Nenhum problema detectado.';
        }

        let relatorio = 'Problemas encontrados:\n\n';
        this.problemasDetectados.forEach((problema, index) => {
            relatorio += `${index + 1}. ${problema.descricao} (Gravidade: ${problema.gravidade})\n`;
        });

        return relatorio;
    }
}

// Disponibiliza a classe globalmente para o content script
if (typeof window !== 'undefined') {
    window.AnalisadorURL = AnalisadorURL;
    window.NIVEL_RISCO = NIVEL_RISCO;
}
