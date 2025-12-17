/**
 * Módulo de Utilidades
 * Funções auxiliares para análise e validação de URLs
 */

// Lista de encurtadores de URL conhecidos
const ENCURTADORES_CONHECIDOS = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co',
    'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'short.io',
    'tiny.cc', 'tr.im', 'cutt.ly', 'rebrand.ly', 'rb.gy',
    'encurtador.com.br', 'migre.me', 'zip.net'
];

// Lista de domínios legítimos populares no Brasil
const DOMINIOS_LEGITIMOS = [
    // 'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
    // 'whatsapp.com', 'twitter.com', 'linkedin.com', 'amazon.com',
    // 'mercadolivre.com.br', 'mercadopago.com.br', 'olx.com.br',
    // 'americanas.com.br', 'magazineluiza.com.br', 'casasbahia.com.br',
    // 'gov.br', 'bb.com.br', 'itau.com.br', 'bradesco.com.br',
    // 'santander.com.br', 'caixa.gov.br', 'nubank.com.br',
    // 'correios.com.br', 'receita.fazenda.gov.br'
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

/**
 * Verifica se a URL usa um serviço de encurtamento
 * @param {string} url - URL completa para verificação
 * @returns {boolean} - True se for um encurtador
 */
function ehEncurtador(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase().replace('www.', '');

        return ENCURTADORES_CONHECIDOS.some(encurtador =>
            hostname === encurtador || hostname.endsWith('.' + encurtador)
        );
    } catch (erro) {
        console.error('Erro ao verificar encurtador:', erro);
        return false;
    }
}

/**
 * Verifica se a URL contém um endereço IP em vez de domínio
 * @param {string} url - URL para verificação
 * @returns {boolean} - True se usar IP
 */
function usaEnderecoIP(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // Regex para IPv4
        const regexIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/;

        // Regex para IPv6
        const regexIPv6 = /^\[?([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\]?$/;

        return regexIPv4.test(hostname) || regexIPv6.test(hostname);
    } catch (erro) {
        console.error('Erro ao verificar IP:', erro);
        return false;
    }
}

/**
 * Detecta caracteres homógrafos suspeitos na URL
 * @param {string} url - URL para análise
 * @returns {Object} - {temHomografos: boolean, caracteresSuspeitos: array}
 */
function detectarHomografos(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        const caracteresSuspeitos = [];

        // Verifica cada caractere do hostname
        for (let i = 0; i < hostname.length; i++) {
            const char = hostname[i];

            // Verifica se o caractere é um homógrafo conhecido
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
        console.error('Erro ao detectar homógrafos:', erro);
        return { temHomografos: false, caracteresSuspeitos: [] };
    }
}

/**
 * Verifica se a URL usa HTTPS
 * @param {string} url - URL para verificação
 * @returns {boolean} - True se usar HTTPS
 */
function usaHTTPS(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'https:';
    } catch (erro) {
        console.error('Erro ao verificar HTTPS:', erro);
        return false;
    }
}

/**
 * Calcula distância de Levenshtein entre duas strings
 * @param {string} str1 - Primeira string
 * @param {string} str2 - Segunda string
 * @returns {number} - Distância de edição
 */
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
                    matriz[i - 1][j - 1] + 1, // substituição
                    matriz[i][j - 1] + 1,     // inserção
                    matriz[i - 1][j] + 1      // deleção
                );
            }
        }
    }

    return matriz[str2.length][str1.length];
}

/**
 * Verifica similaridade com domínios legítimos
 * @param {string} url - URL para verificação
 * @returns {Object} - {ehSuspeito: boolean, dominioSimilar: string, similaridade: number}
 */
function verificarSimilaridadeDominio(url) {
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase().replace('www.', '');

        let maiorSimilaridade = 0;
        let dominioMaisSimilar = '';

        for (const dominioLegitimo of DOMINIOS_LEGITIMOS) {
            // Se for exatamente igual, não é suspeito
            if (hostname === dominioLegitimo) {
                return { ehSuspeito: false, dominioSimilar: '', similaridade: 0 };
            }

            // Calcula distância de edição
            const distancia = distanciaLevenshtein(hostname, dominioLegitimo);
            const tamanhoMax = Math.max(hostname.length, dominioLegitimo.length);
            const similaridade = 1 - (distancia / tamanhoMax);

            // Se a similaridade for muito alta (mas não igual), é suspeito
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
        console.error('Erro ao verificar similaridade:', erro);
        return { ehSuspeito: false, dominioSimilar: '', similaridade: 0 };
    }
}

/**
 * Extrai o domínio principal de uma URL
 * @param {string} url - URL completa
 * @returns {string} - Domínio extraído
 */
function extrairDominio(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.toLowerCase().replace('www.', '');
    } catch (erro) {
        console.error('Erro ao extrair domínio:', erro);
        return '';
    }
}

/**
 * Valida se uma URL é bem formada
 * @param {string} url - URL para validação
 * @returns {boolean} - True se válida
 */
function ehURLValida(url) {
    try {
        new URL(url);
        return true;
    } catch (erro) {
        return false;
    }
}

/**
 * Resolve o destino final de uma URL de redirecionamento
 * Esta função será chamada pelo background service para seguir redirecionamentos
 * @param {string} url - URL inicial
 * @returns {Promise<string>} - URL final após redirecionamentos
 */
async function resolverRedirecionamento(url) {
    // Esta função será implementada no background service
    // pois requer fazer requisições HTTP
    return url;
}

// Exporta as funções para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ehEncurtador,
        usaEnderecoIP,
        detectarHomografos,
        usaHTTPS,
        distanciaLevenshtein,
        verificarSimilaridadeDominio,
        extrairDominio,
        ehURLValida,
        resolverRedirecionamento,
        ENCURTADORES_CONHECIDOS,
        DOMINIOS_LEGITIMOS
    };
}
