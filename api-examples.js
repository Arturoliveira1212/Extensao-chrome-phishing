// ============================================
// EXEMPLOS DE REQUISIÇÕES A APIs EXTERNAS
// ============================================

// ==========================================
// 1. GET REQUEST SIMPLES
// ==========================================
async function exemploGET() {
    try {
        const response = await fetch('https://api.exemplo.com/dados');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Dados recebidos:', data);
        return data;
    } catch (error) {
        console.error('Erro na requisição GET:', error);
    }
}

// ==========================================
// 2. GET COM HEADERS E AUTENTICAÇÃO
// ==========================================
async function exemploGETComAuth(apiKey) {
    try {
        const response = await fetch('https://api.exemplo.com/dados-protegidos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                // Ou para API Key simples:
                // 'X-API-Key': apiKey
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ==========================================
// 3. POST REQUEST - ENVIAR DADOS
// ==========================================
async function exemploPOST(dados) {
    try {
        const response = await fetch('https://api.exemplo.com/criar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();
        return resultado;
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
    }
}

// ==========================================
// 4. PUT REQUEST - ATUALIZAR DADOS
// ==========================================
async function exemploPUT(id, dadosAtualizados) {
    try {
        const response = await fetch(`https://api.exemplo.com/atualizar/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosAtualizados)
        });

        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar:', error);
    }
}

// ==========================================
// 5. DELETE REQUEST
// ==========================================
async function exemploDELETE(id) {
    try {
        const response = await fetch(`https://api.exemplo.com/deletar/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        return await response.json();
    } catch (error) {
        console.error('Erro ao deletar:', error);
    }
}

// ==========================================
// 6. REQUISIÇÃO COM QUERY PARAMETERS
// ==========================================
async function exemploComQueryParams(filtro, limite) {
    const params = new URLSearchParams({
        filtro: filtro,
        limite: limite,
        ordem: 'desc'
    });

    try {
        const response = await fetch(`https://api.exemplo.com/buscar?${params}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro:', error);
    }
}

// ==========================================
// 7. UPLOAD DE ARQUIVO
// ==========================================
async function exemploUploadArquivo(arquivo) {
    const formData = new FormData();
    formData.append('file', arquivo);
    formData.append('descricao', 'Meu arquivo');

    try {
        const response = await fetch('https://api.exemplo.com/upload', {
            method: 'POST',
            body: formData
            // Não adicione Content-Type, o navegador define automaticamente
        });

        return await response.json();
    } catch (error) {
        console.error('Erro no upload:', error);
    }
}

// ==========================================
// 8. REQUISIÇÃO COM TIMEOUT
// ==========================================
async function exemploComTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });
        clearTimeout(id);

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Requisição expirou!');
        } else {
            console.error('Erro:', error);
        }
    }
}

// ==========================================
// 9. REQUISIÇÕES PARALELAS
// ==========================================
async function exemploRequisoesParalelas() {
    try {
        const [dados1, dados2, dados3] = await Promise.all([
            fetch('https://api.exemplo.com/endpoint1').then(r => r.json()),
            fetch('https://api.exemplo.com/endpoint2').then(r => r.json()),
            fetch('https://api.exemplo.com/endpoint3').then(r => r.json())
        ]);

        return { dados1, dados2, dados3 };
    } catch (error) {
        console.error('Erro em requisições paralelas:', error);
    }
}

// ==========================================
// 10. RETRY AUTOMÁTICO
// ==========================================
async function exemploComRetry(url, maxTentativas = 3) {
    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.log(`Tentativa ${tentativa} falhou:`, error.message);

            if (tentativa === maxTentativas) {
                throw new Error(`Falhou após ${maxTentativas} tentativas`);
            }

            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * tentativa));
        }
    }
}

// ==========================================
// 11. USANDO NO BACKGROUND SCRIPT
// ==========================================
// No background.js:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fetchAPI') {
        fetch(message.url)
            .then(response => response.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Importante para resposta assíncrona
    }
});

// No popup.js ou content.js:
function buscarViaBackground(url) {
    chrome.runtime.sendMessage(
        { action: 'fetchAPI', url: url },
        (response) => {
            if (response.success) {
                console.log('Dados:', response.data);
            } else {
                console.error('Erro:', response.error);
            }
        }
    );
}

// ==========================================
// 12. ARMAZENAR TOKEN E USAR EM REQUISIÇÕES
// ==========================================
// Salvar token
async function salvarToken(token) {
    await chrome.storage.local.set({ apiToken: token });
}

// Buscar token e fazer requisição
async function requisicaoComTokenSalvo(url) {
    const result = await chrome.storage.local.get(['apiToken']);
    const token = result.apiToken;

    if (!token) {
        throw new Error('Token não encontrado');
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    return await response.json();
}

// ==========================================
// EXEMPLOS DE APIs PÚBLICAS PARA TESTAR
// ==========================================

// JSONPlaceholder (API de teste gratuita)
async function testarJSONPlaceholder() {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    return await response.json();
}

// GitHub API
async function testarGitHub() {
    const response = await fetch('https://api.github.com/users/github');
    return await response.json();
}

// OpenWeatherMap (requer API key gratuita)
async function testarClima(cidade, apiKey) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${apiKey}`
    );
    return await response.json();
}

// The Cat API (API de fotos de gatos)
async function testarCatAPI() {
    const response = await fetch('https://api.thecatapi.com/v1/images/search');
    return await response.json();
}
