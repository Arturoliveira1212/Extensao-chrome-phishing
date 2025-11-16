// Configurações e dados estáticos para detecção de phishing

const CONFIG = {
    // Lista de encurtadores de URL conhecidos
    URL_SHORTENERS: [
        'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'is.gd', 'buff.ly',
        'adf.ly', 'bl.ink', 'lnkd.in', 'ity.im', 'q.gs', 'viid.me', 'cutt.ly',
        'shorturl.at', 'tiny.cc', 'cli.gs', 'pic.gd', 'DwarfURL.com', 'yfrog.com',
        'migre.me', 'ff.im', 'tiny.pl', 'url4.eu', 'tr.im', 'twit.ac', 'su.pr',
        'twurl.nl', 'snipurl.com', 'short.to', 'BudURL.com', 'ping.fm', 'post.ly',
        'Just.as', 'bkite.com', 'snipr.com', 'fic.kr', 'loopt.us', 'doiop.com',
        'twitthis.com', 'htxt.it', 'AltURL.com', 'RedirX.com', 'DigBig.com',
        'short.ie', 'u.mavrev.com', 'kl.am', 'wp.me', 'rubyurl.com', 'om.ly',
        'to.ly', 'bit.do', 'lnky.fr', 'db.tt', 'qr.ae', 'adf.ly', 'bitly.com',
        'cur.lv', 'ity.im', 'q.gs', 'po.st', 'bc.vc', 't.ly', 'tny.im', 'goo.su',
        'gg.gg', 'rebrand.ly', 'clck.ru', 'v.gd', 'link.tl', '1url.com', 'urlz.fr',
        'hyperurl.co', 'smarturl.it', 'trib.al', 'branch.io'
    ],

    // Domínios legítimos populares para comparação de similaridade
    LEGITIMATE_DOMAINS: [
        'google.com', 'youtube.com', 'facebook.com', 'amazon.com', 'wikipedia.org',
        'twitter.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'netflix.com',
        'microsoft.com', 'apple.com', 'paypal.com', 'ebay.com', 'whatsapp.com',
        'zoom.us', 'github.com', 'yahoo.com', 'gmail.com', 'outlook.com',
        'mercadolivre.com.br', 'mercadolibre.com', 'globo.com', 'uol.com.br',
        'bancodobrasil.com.br', 'itau.com.br', 'bradesco.com.br', 'santander.com.br',
        'caixa.gov.br', 'nubank.com.br', 'bancodobrasil.com.br', 'correios.com.br',
        'gov.br', 'receita.fazenda.gov.br', 'dropbox.com', 'adobe.com'
    ],

    // Caracteres homógrafos comuns usados em ataques
    HOMOGRAPH_CHARS: {
        'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y',
        'і': 'i', 'ј': 'j', 'ѕ': 's', 'һ': 'h', 'ԁ': 'd', 'ց': 'g', 'ӏ': 'l',
        'ո': 'n', 'ԛ': 'q', 'ԝ': 'w', 'ο': 'o', 'ν': 'v', 'ρ': 'p', 'τ': 't',
        'υ': 'u', 'ω': 'w', 'ϲ': 'c', 'е': 'e', 'һ': 'h', 'і': 'i', 'ј': 'j',
        'о': 'o', 'р': 'p', 'ѕ': 's', 'у': 'y', 'х': 'x', 'ա': 'w', 'ḃ': 'b',
        'ḋ': 'd', 'ḟ': 'f', 'ġ': 'g', 'ḣ': 'h', 'ṁ': 'm', 'ṅ': 'n', 'ṗ': 'p',
        'ṡ': 's', 'ṫ': 't', 'ẁ': 'w', 'ẃ': 'w', 'ẅ': 'w', 'ỳ': 'y', 'ỹ': 'y'
    },

    // Palavras comuns em phishing
    SUSPICIOUS_KEYWORDS: [
        'verify', 'account', 'update', 'secure', 'banking', 'suspend', 'locked',
        'confirm', 'urgent', 'immediate', 'alert', 'warning', 'click', 'login',
        'signin', 'password', 'credential', 'billing', 'payment', 'prize', 'winner',
        'free', 'gift', 'urgent-action', 'verificar', 'conta', 'atualizar',
        'seguro', 'banco', 'suspenso', 'bloqueado', 'confirmar', 'urgente',
        'imediato', 'alerta', 'aviso', 'entrar', 'senha', 'credencial',
        'cobranca', 'pagamento', 'premio', 'ganhador', 'gratis', 'presente'
    ],

    // TLDs suspeitos
    SUSPICIOUS_TLDS: [
        '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.work', '.date',
        '.racing', '.download', '.stream', '.win', '.bid', '.trade', '.webcam',
        '.party', '.review', '.faith', '.science', '.accountant', '.loan', '.men',
        '.click', '.country', '.kim', '.cricket', '.pw'
    ],

    // Níveis de risco
    RISK_LEVELS: {
        SAFE: { score: 0, label: 'Seguro', color: '#10b981' },
        LOW: { score: 1, label: 'Risco Baixo', color: '#3b82f6' },
        MEDIUM: { score: 2, label: 'Risco Médio', color: '#f59e0b' },
        HIGH: { score: 3, label: 'Risco Alto', color: '#ef4444' },
        CRITICAL: { score: 4, label: 'Risco Crítico', color: '#991b1b' }
    },

    // Cache de verificações (tempo em milissegundos)
    CACHE_DURATION: 3600000, // 1 hora

    // APIs externas (nota: para uso em produção, considere usar variáveis de ambiente)
    APIS: {
        // VirusTotal API (requer cadastro gratuito em https://www.virustotal.com/gui/join-us)
        VIRUSTOTAL_KEY: 'YOUR_VIRUSTOTAL_API_KEY',
        VIRUSTOTAL_URL: 'https://www.virustotal.com/api/v3/urls',

        // URLScan.io (uso limitado sem chave)
        URLSCAN_URL: 'https://urlscan.io/api/v1/search/',

        // PhishTank (gratuito, sem necessidade de chave para consultas)
        PHISHTANK_URL: 'https://checkurl.phishtank.com/checkurl/',

        // Google Safe Browsing (requer chave da Google Cloud)
        GOOGLE_SAFE_BROWSING_KEY: 'YOUR_GOOGLE_API_KEY',
        GOOGLE_SAFE_BROWSING_URL: 'https://safebrowsing.googleapis.com/v4/threatMatches:find'
    }
};

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
