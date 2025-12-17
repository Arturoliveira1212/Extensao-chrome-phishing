/**
 * TESTE COMPLETO DO ANALISADOR ANTI-PHISHING
 * Arquivo standalone que combina toda a lógica de análise estática e consultas externas
 * Permite testes em massa sem dependência da extensão Chrome
 */

// ============================================================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================================================

const CONFIGURACOES = {
    TEMPO_CACHE: 24 * 60 * 60 * 1000, // 24 horas
    VIRUSTOTAL_API_KEY: '9a8934718f64ab3e9216d5c3658effa439ed4658b862d87fbd753a54d58989b3',
    MODO_SIMULADO: true, // true = simula APIs, false = usa APIs reais
    VERBOSE: true // Mostra logs detalhados
};

const NIVEL_RISCO = {
    SEGURO: 'seguro',
    BAIXO_RISCO: 'baixo_risco',
    ALTO_RISCO: 'alto_risco'
};

// Lista de encurtadores de URL conhecidos
const ENCURTADORES_CONHECIDOS = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co',
    'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'short.io',
    'tiny.cc', 'tr.im', 'cutt.ly', 'rebrand.ly', 'rb.gy',
    'encurtador.com.br', 'migre.me', 'zip.net'
];

// Lista de domínios legítimos populares
const DOMINIOS_LEGITIMOS = [
    'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
    'whatsapp.com', 'twitter.com', 'linkedin.com', 'amazon.com',
    'mercadolivre.com.br', 'mercadopago.com.br', 'olx.com.br',
    'americanas.com.br', 'magazineluiza.com.br', 'casasbahia.com.br',
    'gov.br', 'bb.com.br', 'itau.com.br', 'bradesco.com.br',
    'santander.com.br', 'caixa.gov.br', 'nubank.com.br',
    'correios.com.br', 'receita.fazenda.gov.br'
];

// Caracteres homógrafos comuns (ataques IDN)
const HOMOGRAFOS = {
    'a': ['а', 'ɑ', 'α', 'ạ', 'ă'],
    'e': ['е', 'ė', 'ę', 'ě', 'ẹ'],
    'i': ['і', 'ı', 'į', 'ï', 'ị'],
    'o': ['о', 'ọ', 'ο', 'ő', 'ö'],
    'c': ['с', 'ç', 'ć', 'č'],
    'p': ['р', 'ṗ'],
    'x': ['х', 'ẋ'],
    'y': ['у', 'ý', 'ÿ'],
    's': ['ѕ', 'ś', 'š'],
    'h': ['һ', 'ḥ'],
    'n': ['ո', 'ń', 'ñ'],
    'm': ['м', 'ṃ'],
    'u': ['υ', 'ü', 'ú', 'ụ'],
    'b': ['Ь', 'ḅ'],
    'd': ['ԁ', 'ḍ'],
    'g': ['ց', 'ġ'],
    'l': ['ӏ', 'ĺ', '1'],
    't': ['т', 'ṭ'],
    'w': ['ԝ', 'ẁ'],
    'z': ['ᴢ', 'ź', 'ż']
};

// Cache para evitar consultas repetidas
const cacheReputacao = new Map();

// ============================================================================
// FUNÇÕES UTILITÁRIAS (utils.js)
// ============================================================================

function ehURLValida(url) {
    try {
        new URL(url);
        return true;
    } catch (erro) {
        return false;
    }
}

function ehEncurtador(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase().replace('www.', '');
        return ENCURTADORES_CONHECIDOS.some(encurtador =>
            hostname === encurtador || hostname.endsWith('.' + encurtador)
        );
    } catch (erro) {
        return false;
    }
}

function usaEnderecoIP(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const regexIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
        const regexIPv6 = /^\[?([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\]?$/;
        return regexIPv4.test(hostname) || regexIPv6.test(hostname);
    } catch (erro) {
        return false;
    }
}

function detectarHomografos(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        const caracteresSuspeitos = [];

        for (let i = 0; i < hostname.length; i++) {
            const char = hostname[i];
            for (const [original, homografos] of Object.entries(HOMOGRAFOS)) {
                if (homografos.includes(char)) {
                    caracteresSuspeitos.push({
                        posicao: i,
                        caractere: char,
                        deveSeriar: original
                    });
                }
            }
        }

        return {
            temHomografos: caracteresSuspeitos.length > 0,
            caracteresSuspeitos: caracteresSuspeitos
        };
    } catch (erro) {
        return { temHomografos: false, caracteresSuspeitos: [] };
    }
}

function usaHTTPS(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'https:';
    } catch (erro) {
        return false;
    }
}

function distanciaLevenshtein(str1, str2) {
    const matriz = [];
    for (let i = 0; i <= str2.length; i++) {
        matriz[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matriz[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matriz[i][j] = matriz[i - 1][j - 1];
            } else {
                matriz[i][j] = Math.min(
                    matriz[i - 1][j - 1] + 1,
                    matriz[i][j - 1] + 1,
                    matriz[i - 1][j] + 1
                );
            }
        }
    }
    return matriz[str2.length][str1.length];
}

function verificarSimilaridadeDominio(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase().replace('www.', '');

        let maiorSimilaridade = 0;
        let dominioMaisSimilar = '';

        for (const dominioLegitimo of DOMINIOS_LEGITIMOS) {
            if (hostname === dominioLegitimo) {
                return { ehSuspeito: false, dominioSimilar: '', similaridade: 0 };
            }

            const distancia = distanciaLevenshtein(hostname, dominioLegitimo);
            const tamanhoMax = Math.max(hostname.length, dominioLegitimo.length);
            const similaridade = 1 - (distancia / tamanhoMax);

            if (similaridade > maiorSimilaridade && similaridade > 0.7 && similaridade < 1) {
                maiorSimilaridade = similaridade;
                dominioMaisSimilar = dominioLegitimo;
            }
        }

        return {
            ehSuspeito: maiorSimilaridade > 0.7,
            dominioSimilar: dominioMaisSimilar,
            similaridade: maiorSimilaridade
        };
    } catch (erro) {
        return { ehSuspeito: false, dominioSimilar: '', similaridade: 0 };
    }
}

// ============================================================================
// FUNÇÕES DE CONSULTAS EXTERNAS (background.js)
// ============================================================================

async function verificarBlacklist(dominio) {
    if (CONFIGURACOES.MODO_SIMULADO) {
        return simularBlacklist(dominio);
    }

    try {
        const body = new URLSearchParams();
        body.append('host', dominio);

        const resposta = await fetch('https://urlhaus-api.abuse.ch/v1/host/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        if (resposta.ok) {
            const dados = await resposta.json();

            if (dados.query_status === 'ok' && dados.urls && dados.urls.length > 0) {
                const urlsOnline = dados.urls.filter(url => url.url_status === 'online');

                return {
                    malicioso: urlsOnline.length > 0,
                    fonte: urlsOnline.length > 0 ? 'URLhaus' : 'Nenhuma',
                    totalUrls: dados.urls.length,
                    urlsOnline: urlsOnline.length
                };
            }
        }

        return { malicioso: false, fonte: 'Nenhuma' };
    } catch (erro) {
        console.error('Erro ao verificar URLhaus:', erro);
        return { malicioso: false, fonte: 'Erro' };
    }
}

async function verificarIdadeDominio(dominio) {
    if (CONFIGURACOES.MODO_SIMULADO) {
        return simularIdadeDominio(dominio);
    }

    try {
        const resposta = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=at_free&domainName=${dominio}&outputFormat=JSON`)
            .catch(() => null);

        if (resposta && resposta.ok) {
            const dados = await resposta.json();

            if (dados.WhoisRecord && dados.WhoisRecord.createdDate) {
                const dataRegistro = new Date(dados.WhoisRecord.createdDate);
                const hoje = new Date();
                const diasDesdeRegistro = Math.floor((hoje - dataRegistro) / (1000 * 60 * 60 * 24));

                return {
                    recente: diasDesdeRegistro < 180,
                    dias: diasDesdeRegistro,
                    dataRegistro: dataRegistro.toISOString()
                };
            }
        }

        return { recente: false, dias: null, dataRegistro: null };
    } catch (erro) {
        console.error('Erro ao verificar idade do domínio:', erro);
        return { recente: false, dias: null, dataRegistro: null };
    }
}

async function verificarVirusTotal(dominio) {
    if (CONFIGURACOES.MODO_SIMULADO) {
        return simularVirusTotal(dominio);
    }

    try {
        if (CONFIGURACOES.VIRUSTOTAL_API_KEY === 'SUA_CHAVE_API_AQUI') {
            return { malicioso: false, deteccoes: 0 };
        }

        const body = new URLSearchParams();
        body.append('url', dominio);

        const respostaSubmissao = await fetch(
            'https://www.virustotal.com/api/v3/urls',
            {
                method: 'POST',
                headers: {
                    'x-apikey': CONFIGURACOES.VIRUSTOTAL_API_KEY,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body
            }
        );

        if (!respostaSubmissao.ok) {
            return { malicioso: false, deteccoes: 0 };
        }

        const dadosSubmissao = await respostaSubmissao.json();
        const linkAnalise = dadosSubmissao.data.links.self;

        const respostaAnalise = await fetch(linkAnalise, {
            headers: {
                'x-apikey': CONFIGURACOES.VIRUSTOTAL_API_KEY
            }
        });

        if (respostaAnalise.ok) {
            const dadosAnalise = await respostaAnalise.json();
            const stats = dadosAnalise.data.attributes.stats;
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

// ============================================================================
// FUNÇÕES SIMULADAS PARA TESTES (quando MODO_SIMULADO = true)
// ============================================================================

function simularBlacklist(dominio) {
    const url = dominio.toLowerCase();

    if ((url.includes('paypal') && !url.includes('paypal.com')) ||
        (url.includes('banco') && url.includes('verify')) ||
        (url.includes('phishing')) ||
        (url.includes('login') && url.includes('.tk'))) {
        return {
            malicioso: true,
            fonte: 'URLhaus (simulado)',
            totalUrls: 5,
            urlsOnline: 3
        };
    }

    return { malicioso: false, fonte: 'Nenhuma' };
}

function simularIdadeDominio(dominio) {
    const url = dominio.toLowerCase();

    if (url.includes('.tk') || url.includes('.ml') ||
        url.includes('.ga') || url.includes('.cf') ||
        url.includes('.gq') || url.includes('.xyz') ||
        url.includes('novo') || url.includes('site-novo')) {
        const dias = Math.floor(Math.random() * 90) + 10;
        return {
            recente: true,
            dias: dias,
            dataRegistro: new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()
        };
    }

    return { recente: false, dias: null, dataRegistro: null };
}

function simularVirusTotal(dominio) {
    const url = dominio.toLowerCase();

    if (url.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/) ||
        (url.includes('verify') && url.includes('account')) ||
        (url.includes('secure') && url.includes('update')) ||
        url.includes('phishing')) {
        return {
            malicioso: true,
            deteccoes: Math.floor(Math.random() * 10) + 1
        };
    }

    return { malicioso: false, deteccoes: 0 };
}

async function verificarReputacaoCompleta(url) {
    try {
        const urlObj = new URL(url);
        const dominio = urlObj.hostname.toLowerCase().replace('www.', '');

        // Verifica cache
        const dadosCache = cacheReputacao.get(dominio);
        if (dadosCache && (Date.now() - dadosCache.timestamp) < CONFIGURACOES.TEMPO_CACHE) {
            if (CONFIGURACOES.VERBOSE) console.log('  ↳ [CACHE] Usando dados em cache');
            return dadosCache.resultado;
        }

        if (CONFIGURACOES.VERBOSE) console.log('  ↳ Consultando APIs externas...');

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
            certificadoInvalido: !usaHTTPS(url) || usaEnderecoIP(url)
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
            emBlacklist: false,
            dominioRecente: false,
            reputacaoBaixa: false,
            certificadoInvalido: false
        };
    }
}

// ============================================================================
// CLASSE ANALISADOR DE URLs (analisador.js)
// ============================================================================

class AnalisadorURL {
    constructor() {
        this.pontuacaoRisco = 0;
        this.problemasDetectados = [];
    }

    async analisarURL(url) {
        this.pontuacaoRisco = 0;
        this.problemasDetectados = [];

        try {
            if (!ehURLValida(url)) {
                this.adicionarProblema('URL inválida ou malformada', 50);
                return this.gerarResultado(url);
            }

            // Análises estáticas
            if (ehEncurtador(url)) {
                this.adicionarProblema('URL usa serviço de encurtamento', 25);
            }

            if (usaEnderecoIP(url)) {
                this.adicionarProblema('URL usa endereço IP em vez de domínio', 40);
            }

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

            if (!usaHTTPS(url)) {
                this.adicionarProblema('URL não usa protocolo HTTPS seguro', 30);
            }

            const resultadoSimilaridade = verificarSimilaridadeDominio(url);
            if (resultadoSimilaridade.ehSuspeito) {
                this.adicionarProblema(
                    `Domínio similar a '${resultadoSimilaridade.dominioSimilar}' - possível falsificação`,
                    50
                );
            }

            this.verificarPadroesSuspeitos(url);

            // Consultas externas
            const resultadoReputacao = await verificarReputacaoCompleta(url);
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

    adicionarProblema(descricao, pontos) {
        this.problemasDetectados.push({
            descricao: descricao,
            gravidade: pontos
        });
        this.pontuacaoRisco += pontos;
    }

    verificarPadroesSuspeitos(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;

            const subdominios = hostname.split('.');
            if (subdominios.length > 4) {
                this.adicionarProblema('URL possui muitos subdomínios', 20);
            }

            const hifens = (hostname.match(/-/g) || []).length;
            if (hifens > 3) {
                this.adicionarProblema('Domínio possui muitos hífens', 15);
            }

            const numeros = (hostname.match(/\d/g) || []).length;
            if (numeros > 4) {
                this.adicionarProblema('Domínio possui muitos números', 15);
            }

            if (url.length > 200) {
                this.adicionarProblema('URL extremamente longa', 20);
            }

            if (url.includes('@')) {
                this.adicionarProblema('URL contém @ (possível tentativa de enganar usuário)', 35);
            }

            const tldsSuspeitos = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
            const tld = hostname.substring(hostname.lastIndexOf('.'));
            if (tldsSuspeitos.includes(tld)) {
                this.adicionarProblema(`TLD suspeito: ${tld}`, 25);
            }

            const palavrasSuspeitas = [
                'login', 'signin', 'account', 'verify', 'secure', 'update',
                'confirm', 'banco', 'seguro', 'validar', 'atualizar'
            ];

            const dominioLower = hostname.toLowerCase();
            for (const palavra of palavrasSuspeitas) {
                if (dominioLower.includes(palavra)) {
                    this.adicionarProblema(`Palavra suspeita no domínio: ${palavra}`, 15);
                    break;
                }
            }
        } catch (erro) {
            console.error('Erro ao verificar padrões suspeitos:', erro);
        }
    }

    processarResultadoReputacao(resultado) {
        if (resultado.emBlacklist) {
            this.adicionarProblema(
                'Domínio encontrado em lista negra de sites maliciosos',
                60
            );
        }

        if (resultado.dominioRecente) {
            this.adicionarProblema(
                `Domínio registrado recentemente (${resultado.idadeDias} dias)`,
                35
            );
        }

        if (resultado.reputacaoBaixa) {
            this.adicionarProblema(
                'Domínio possui baixa reputação',
                30
            );
        }

        if (resultado.certificadoInvalido) {
            this.adicionarProblema(
                'Certificado SSL inválido ou não confiável',
                40
            );
        }
    }

    gerarResultado(url) {
        let classificacao;
        let corAlerta;
        let mensagem;

        if (this.pontuacaoRisco === 0) {
            classificacao = NIVEL_RISCO.SEGURO;
            corAlerta = '#4CAF50';
            mensagem = 'Este link parece seguro!';
        } else if (this.pontuacaoRisco < 50) {
            classificacao = NIVEL_RISCO.BAIXO_RISCO;
            corAlerta = '#FF9800';
            mensagem = 'Este link apresenta alguns riscos. Prossiga com cautela.';
        } else {
            classificacao = NIVEL_RISCO.ALTO_RISCO;
            corAlerta = '#F44336';
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
}

// ============================================================================
// FUNÇÕES DE TESTE EM MASSA
// ============================================================================

async function testarURLs(urls, opcoes = {}) {
    const config = {
        verbose: opcoes.verbose !== undefined ? opcoes.verbose : true,
        delay: opcoes.delay || 500, // ms entre cada teste
        modoSimulado: opcoes.modoSimulado !== undefined ? opcoes.modoSimulado : CONFIGURACOES.MODO_SIMULADO
    };

    CONFIGURACOES.MODO_SIMULADO = config.modoSimulado;
    CONFIGURACOES.VERBOSE = config.verbose;

    const resultados = [];
    const estatisticas = {
        total: 0,
        seguras: 0,
        baixoRisco: 0,
        altoRisco: 0,
        tempoTotal: 0
    };

    console.log('\n' + '='.repeat(80));
    console.log('🛡️  TESTE EM MASSA - ANALISADOR ANTI-PHISHING');
    console.log('='.repeat(80));
    console.log(`📊 Total de URLs para análise: ${urls.length}`);
    console.log(`🔧 Modo: ${config.modoSimulado ? 'SIMULADO' : 'APIS REAIS'}`);
    console.log('='.repeat(80) + '\n');

    const inicio = Date.now();

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const numero = i + 1;

        if (config.verbose) {
            console.log(`\n[${numero}/${urls.length}] Analisando: ${url}`);
        }

        const analisador = new AnalisadorURL();
        const inicioUrl = Date.now();
        const resultado = await analisador.analisarURL(url);
        const tempoUrl = Date.now() - inicioUrl;

        resultado.tempoAnalise = tempoUrl;
        resultados.push(resultado);

        // Atualiza estatísticas
        estatisticas.total++;
        if (resultado.classificacao === NIVEL_RISCO.SEGURO) {
            estatisticas.seguras++;
        } else if (resultado.classificacao === NIVEL_RISCO.BAIXO_RISCO) {
            estatisticas.baixoRisco++;
        } else {
            estatisticas.altoRisco++;
        }

        if (config.verbose) {
            const emoji = resultado.classificacao === NIVEL_RISCO.SEGURO ? '✅' :
                resultado.classificacao === NIVEL_RISCO.BAIXO_RISCO ? '⚠️' : '🚨';
            console.log(`  ${emoji} Classificação: ${resultado.classificacao.toUpperCase()}`);
            console.log(`  📊 Pontuação: ${resultado.pontuacaoRisco}`);
            console.log(`  🔍 Problemas: ${resultado.problemasDetectados.length}`);
            console.log(`  ⏱️  Tempo: ${tempoUrl}ms`);
        }

        // Delay entre requisições
        if (i < urls.length - 1 && config.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, config.delay));
        }
    }

    estatisticas.tempoTotal = Date.now() - inicio;

    // Relatório final
    console.log('\n' + '='.repeat(80));
    console.log('📈 RELATÓRIO FINAL');
    console.log('='.repeat(80));
    console.log(`✅ Seguras:      ${estatisticas.seguras} (${(estatisticas.seguras / estatisticas.total * 100).toFixed(1)}%)`);
    console.log(`⚠️  Baixo Risco:  ${estatisticas.baixoRisco} (${(estatisticas.baixoRisco / estatisticas.total * 100).toFixed(1)}%)`);
    console.log(`🚨 Alto Risco:   ${estatisticas.altoRisco} (${(estatisticas.altoRisco / estatisticas.total * 100).toFixed(1)}%)`);
    console.log(`⏱️  Tempo Total:  ${(estatisticas.tempoTotal / 1000).toFixed(2)}s`);
    console.log(`⚡ Tempo Médio:  ${(estatisticas.tempoTotal / estatisticas.total).toFixed(0)}ms por URL`);
    console.log('='.repeat(80) + '\n');

    return {
        resultados: resultados,
        estatisticas: estatisticas
    };
}

function gerarRelatorioDetalhado(resultado) {
    console.log('\n' + '-'.repeat(80));
    console.log(`🔗 URL: ${resultado.url}`);
    console.log('-'.repeat(80));

    const emoji = resultado.classificacao === NIVEL_RISCO.SEGURO ? '✅' :
        resultado.classificacao === NIVEL_RISCO.BAIXO_RISCO ? '⚠️' : '🚨';

    console.log(`${emoji} CLASSIFICAÇÃO: ${resultado.classificacao.toUpperCase()}`);
    console.log(`📊 PONTUAÇÃO DE RISCO: ${resultado.pontuacaoRisco}`);
    console.log(`💬 ${resultado.mensagem}`);

    if (resultado.problemasDetectados.length > 0) {
        console.log(`\n🔍 PROBLEMAS DETECTADOS (${resultado.problemasDetectados.length}):`);
        resultado.problemasDetectados.forEach((problema, idx) => {
            console.log(`   ${idx + 1}. [${problema.gravidade} pts] ${problema.descricao}`);
        });
    } else {
        console.log('\n✓ Nenhum problema detectado');
    }

    console.log(`\n⏱️  Analisada em: ${new Date(resultado.dataAnalise).toLocaleString('pt-BR')}`);
    if (resultado.tempoAnalise) {
        console.log(`⚡ Tempo de análise: ${resultado.tempoAnalise}ms`);
    }
    console.log('-'.repeat(80));
}

// ============================================================================
// EXPORTAÇÃO E USO
// ============================================================================

// Para uso no Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AnalisadorURL,
        testarURLs,
        gerarRelatorioDetalhado,
        CONFIGURACOES,
        NIVEL_RISCO
    };
}

// Para uso no navegador
if (typeof window !== 'undefined') {
    window.AnalisadorURL = AnalisadorURL;
    window.testarURLs = testarURLs;
    window.gerarRelatorioDetalhado = gerarRelatorioDetalhado;
    window.CONFIGURACOES_TESTE = CONFIGURACOES;
    window.NIVEL_RISCO = NIVEL_RISCO;
}

console.log('✅ Módulo de teste completo carregado!');
console.log('💡 Use: testarURLs([\'url1\', \'url2\', ...]) para testar múltiplas URLs');
