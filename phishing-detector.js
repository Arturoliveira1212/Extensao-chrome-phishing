// PhishGuard - Motor de Detecção de Phishing

class PhishingDetector {
    constructor() {
        this.warnings = [];
        this.riskScore = 0;
        this.riskLevel = 'SAFE';
    }

    /**
     * Analisa uma URL completamente
     * @param {string} url - URL a ser analisada
     * @returns {Promise<Object>} - Resultado da análise
     */
    async analyzeURL(url) {
        this.warnings = [];
        this.riskScore = 0;

        try {
            const urlObj = new URL(url);

            // Extrair destino final de redirecionamentos conhecidos
            const finalURL = this.extractFinalDestination(url, urlObj);
            const finalUrlObj = finalURL !== url ? new URL(finalURL) : urlObj;

            // Se houver redirecionamento, informar ao usuário
            if (finalURL !== url) {
                this.addWarning(
                    'Link de Redirecionamento Detectado',
                    `Este é um link intermediário que redireciona para: ${finalURL}. Vamos analisar o destino final.`,
                    0
                );
            }

            // Verificações locais (síncronas) - no destino final
            this.checkURLShortener(finalUrlObj);
            this.checkIPAddress(finalUrlObj);
            this.checkHomographs(finalUrlObj);
            this.checkHTTPS(finalUrlObj);
            this.checkSuspiciousTLD(finalUrlObj);
            this.checkDomainSimilarity(finalUrlObj);
            this.checkSuspiciousKeywords(finalUrlObj);
            this.checkDomainLength(finalUrlObj);
            this.checkSubdomains(finalUrlObj);
            this.checkPortNumber(finalUrlObj);

            // Verificações externas (assíncronas) - executadas em paralelo
            await Promise.allSettled([
                this.checkVirusTotal(finalURL),
                this.checkPhishTank(finalURL),
                this.checkURLScan(finalURL)
            ]);

            // Calcular nível de risco
            this.calculateRiskLevel();

            return {
                url: url,
                finalURL: finalURL,
                isRedirect: finalURL !== url,
                isPhishing: this.riskScore > 0,
                riskLevel: this.riskLevel,
                riskScore: this.riskScore,
                warnings: this.warnings,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('Erro ao analisar URL:', error);
            return {
                url: url,
                isPhishing: false,
                riskLevel: 'SAFE',
                riskScore: 0,
                warnings: [{ type: 'error', message: 'Erro ao analisar URL: URL inválida' }],
                timestamp: Date.now()
            };
        }
    }

    /**
     * Extrai o destino final de URLs de redirecionamento conhecidas
     * @param {string} url - URL completa original
     * @param {URL} urlObj - Objeto URL parseado
     * @returns {string} - URL final ou URL original se não for redirecionamento
     */
    extractFinalDestination(url, urlObj) {
        // Lista de parâmetros comuns usados para redirecionamento
        const redirectParams = [
            'adurl',        // Google Ads
            'url',          // Genérico
            'redirect',     // Genérico
            'dest',         // Destination
            'destination',  // Destination
            'target',       // Target URL
            'link',         // Link
            'to',           // To
            'goto',         // Go to
            'redir',        // Redirect
            'redirect_url', // Redirect URL
            'return_url',   // Return URL
            'continue',     // Continue
            'next',         // Next
            'out',          // Outbound
            'u',            // Short for URL
            'q',            // Query (usado por alguns motores de busca)
        ];

        // Verificar cada parâmetro
        for (const param of redirectParams) {
            const value = urlObj.searchParams.get(param);
            if (value) {
                try {
                    // Decodificar URL (pode estar URL encoded)
                    const decodedValue = decodeURIComponent(value);

                    // Verificar se é uma URL válida
                    if (decodedValue.startsWith('http://') || decodedValue.startsWith('https://')) {
                        // Validar que é uma URL bem formada
                        new URL(decodedValue);
                        return decodedValue;
                    } else if (decodedValue.startsWith('//')) {
                        // URL relativa ao protocolo
                        const fullUrl = 'https:' + decodedValue;
                        new URL(fullUrl);
                        return fullUrl;
                    }
                } catch (e) {
                    // Se não for uma URL válida, continuar procurando
                    continue;
                }
            }
        }

        // Se não encontrou nenhum parâmetro de redirecionamento, retornar URL original
        return url;
    }

    /**
     * Verifica se usa encurtador de URL
     */
    checkURLShortener(urlObj) {
        const hostname = urlObj.hostname.toLowerCase();
        const isShortener = CONFIG.URL_SHORTENERS.some(shortener =>
            hostname === shortener || hostname.endsWith('.' + shortener)
        );

        if (isShortener) {
            this.addWarning(
                'URL Encurtada',
                'Este link usa um serviço de encurtamento de URL. O destino real está oculto, o que é comum em ataques de phishing.',
                2
            );
        }
    }

    /**
     * Verifica se usa IP no lugar de domínio
     */
    checkIPAddress(urlObj) {
        const hostname = urlObj.hostname;
        // Regex para IPv4
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        // Regex para IPv6
        const ipv6Regex = /^\[?([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\]?$/;

        if (ipv4Regex.test(hostname) || ipv6Regex.test(hostname)) {
            this.addWarning(
                'Endereço IP Detectado',
                'O site usa um endereço IP ao invés de um nome de domínio. Sites legítimos normalmente usam nomes de domínio. Isso é altamente suspeito.',
                3
            );
        }
    }

    /**
     * Verifica caracteres homógrafos (IDN homograph attack)
     */
    checkHomographs(urlObj) {
        const hostname = urlObj.hostname;
        let hasHomographs = false;
        let suspiciousChars = [];

        for (let char of hostname) {
            if (CONFIG.HOMOGRAPH_CHARS[char]) {
                hasHomographs = true;
                suspiciousChars.push(`'${char}' (parece '${CONFIG.HOMOGRAPH_CHARS[char]}')`);
            }
        }

        // Verifica caracteres Unicode suspeitos
        const hasUnicode = /[^\x00-\x7F]/.test(hostname);

        if (hasHomographs) {
            this.addWarning(
                'Caracteres Homógrafos Detectados',
                `O domínio contém caracteres especiais que imitam letras normais: ${suspiciousChars.join(', ')}. Isso pode ser uma tentativa de imitar um site legítimo.`,
                3
            );
        } else if (hasUnicode && !hostname.startsWith('xn--')) {
            this.addWarning(
                'Caracteres Unicode Suspeitos',
                'O domínio contém caracteres especiais (Unicode) que podem ser usados para enganar usuários.',
                2
            );
        }
    }

    /**
     * Verifica ausência de HTTPS
     */
    checkHTTPS(urlObj) {
        if (urlObj.protocol === 'http:') {
            this.addWarning(
                'Conexão Não Segura (HTTP)',
                'O site não usa HTTPS. Seus dados podem ser interceptados. Sites legítimos, especialmente os que lidam com informações sensíveis, sempre usam HTTPS.',
                2
            );
        }

        // Nota: Verificar certificado SSL só é possível no background script
    }

    /**
     * Verifica TLD suspeito
     */
    checkSuspiciousTLD(urlObj) {
        const hostname = urlObj.hostname.toLowerCase();
        const tld = hostname.substring(hostname.lastIndexOf('.'));

        if (CONFIG.SUSPICIOUS_TLDS.includes(tld)) {
            this.addWarning(
                'Domínio de Primeiro Nível Suspeito',
                `O domínio usa a extensão "${tld}", que é frequentemente associada a sites fraudulentos devido ao baixo custo e facilidade de registro.`,
                2
            );
        }
    }

    /**
     * Verifica similaridade com domínios legítimos
     */
    checkDomainSimilarity(urlObj) {
        const hostname = urlObj.hostname.toLowerCase().replace(/^www\./, '');

        for (let legitimateDomain of CONFIG.LEGITIMATE_DOMAINS) {
            const similarity = this.calculateLevenshteinDistance(hostname, legitimateDomain);
            const maxLength = Math.max(hostname.length, legitimateDomain.length);
            const similarityPercent = ((maxLength - similarity) / maxLength) * 100;

            // Se for muito similar mas não exato (typosquatting)
            if (similarityPercent > 70 && similarityPercent < 100) {
                this.addWarning(
                    'Domínio Similar a Site Legítimo',
                    `O domínio "${hostname}" é muito parecido com "${legitimateDomain}" (${similarityPercent.toFixed(0)}% similar). Isso pode ser uma tentativa de imitar um site legítimo (typosquatting).`,
                    3
                );
                break;
            }

            // Verifica se contém o domínio legítimo como substring
            if (hostname.includes(legitimateDomain) && hostname !== legitimateDomain) {
                this.addWarning(
                    'Domínio Contém Nome de Site Legítimo',
                    `O domínio contém "${legitimateDomain}", mas não é o site oficial. Exemplo: "${legitimateDomain}-secure.com" tentando se passar pelo site real.`,
                    2
                );
                break;
            }
        }
    }

    /**
     * Verifica palavras-chave suspeitas
     */
    checkSuspiciousKeywords(urlObj) {
        const fullUrl = urlObj.href.toLowerCase();
        const foundKeywords = [];

        for (let keyword of CONFIG.SUSPICIOUS_KEYWORDS) {
            if (fullUrl.includes(keyword.toLowerCase())) {
                foundKeywords.push(keyword);
            }
        }

        if (foundKeywords.length >= 2) {
            this.addWarning(
                'Palavras Suspeitas na URL',
                `A URL contém palavras frequentemente usadas em phishing: ${foundKeywords.join(', ')}. Sites de phishing usam essas palavras para criar urgência.`,
                2
            );
        }
    }

    /**
     * Verifica comprimento excessivo do domínio
     */
    checkDomainLength(urlObj) {
        const hostname = urlObj.hostname;
        if (hostname.length > 50) {
            this.addWarning(
                'Domínio Muito Longo',
                `O domínio tem ${hostname.length} caracteres. Domínios excessivamente longos são incomuns e podem indicar tentativa de confundir usuários.`,
                1
            );
        }
    }

    /**
     * Verifica excesso de subdomínios
     */
    checkSubdomains(urlObj) {
        const hostname = urlObj.hostname;
        const parts = hostname.split('.');

        // Remove TLD e domínio principal, sobram os subdomínios
        if (parts.length > 3) {
            this.addWarning(
                'Múltiplos Subdomínios',
                `O domínio possui ${parts.length - 2} subdomínios. Sites de phishing frequentemente usam vários subdomínios para parecer legítimos.`,
                1
            );
        }
    }

    /**
     * Verifica uso de porta não padrão
     */
    checkPortNumber(urlObj) {
        if (urlObj.port && urlObj.port !== '80' && urlObj.port !== '443') {
            this.addWarning(
                'Porta Não Padrão',
                `O site usa a porta ${urlObj.port}. Sites legítimos geralmente usam portas padrão (80 para HTTP, 443 para HTTPS).`,
                1
            );
        }
    }

    /**
     * Verifica com VirusTotal API
     */
    async checkVirusTotal(url) {
        // Nota: Requer chave de API do VirusTotal
        // Para usar: cadastre-se em https://www.virustotal.com e obtenha sua chave gratuita
        const apiKey = CONFIG.APIS.VIRUSTOTAL_KEY;

        if (!apiKey || apiKey === 'YOUR_VIRUSTOTAL_API_KEY') {
            return; // Pula verificação se não houver chave
        }

        try {
            const urlId = btoa(url).replace(/=/g, '');
            const response = await fetch(`${CONFIG.APIS.VIRUSTOTAL_URL}/${urlId}`, {
                headers: { 'x-apikey': apiKey }
            });

            if (response.ok) {
                const data = await response.json();
                const stats = data.data.attributes.last_analysis_stats;

                if (stats.malicious > 0) {
                    this.addWarning(
                        'Detectado como Malicioso pelo VirusTotal',
                        `${stats.malicious} mecanismos de segurança identificaram este site como malicioso no VirusTotal.`,
                        3
                    );
                }
            }
        } catch (error) {
            console.log('VirusTotal check falhou:', error.message);
        }
    }

    /**
     * Verifica com PhishTank
     */
    async checkPhishTank(url) {
        try {
            const formData = new FormData();
            formData.append('url', url);
            formData.append('format', 'json');

            const response = await fetch(CONFIG.APIS.PHISHTANK_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                if (data.results.in_database && data.results.valid) {
                    this.addWarning(
                        'Site na Base de Dados do PhishTank',
                        'Este site foi reportado como phishing no PhishTank, um banco de dados colaborativo de sites maliciosos.',
                        4
                    );
                }
            }
        } catch (error) {
            console.log('PhishTank check falhou:', error.message);
        }
    }

    /**
     * Verifica com URLScan.io
     */
    async checkURLScan(url) {
        try {
            const query = encodeURIComponent(`page.url:"${url}"`);
            const response = await fetch(`${CONFIG.APIS.URLSCAN_URL}?q=${query}`);

            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const result = data.results[0];
                    if (result.verdicts && result.verdicts.overall) {
                        const verdict = result.verdicts.overall.malicious;
                        if (verdict) {
                            this.addWarning(
                                'Marcado como Suspeito pelo URLScan.io',
                                'Este site foi analisado pelo URLScan.io e marcado como potencialmente malicioso.',
                                3
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.log('URLScan check falhou:', error.message);
        }
    }

    /**
     * Adiciona um aviso à lista
     */
    addWarning(title, message, severity) {
        this.warnings.push({
            title: title,
            message: message,
            severity: severity
        });
        this.riskScore += severity;
    }

    /**
     * Calcula o nível de risco baseado no score
     */
    calculateRiskLevel() {
        if (this.riskScore === 0) {
            this.riskLevel = 'SAFE';
        } else if (this.riskScore <= 3) {
            this.riskLevel = 'LOW';
        } else if (this.riskScore <= 6) {
            this.riskLevel = 'MEDIUM';
        } else if (this.riskScore <= 10) {
            this.riskLevel = 'HIGH';
        } else {
            this.riskLevel = 'CRITICAL';
        }
    }

    /**
     * Calcula distância de Levenshtein para similaridade de strings
     */
    calculateLevenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Verifica se o domínio é recém-registrado usando WHOIS (requer API externa)
     * Nota: Esta verificação requer uma API WHOIS, que geralmente é paga
     */
    async checkDomainAge(domain) {
        // Esta funcionalidade requer uma API WHOIS
        // APIs gratuitas limitadas: https://www.whoisxmlapi.com/ (500 requests/mês grátis)
        // Por simplicidade, não implementado aqui, mas pode ser adicionado
    }
}

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhishingDetector;
}
