// Background Service Worker - Executa em segundo plano

console.log('Background service worker iniciado');

// Listener para instalação da extensão
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extensão instalada:', details.reason);

    if (details.reason === 'install') {
        console.log('Primeira instalação da extensão');
    } else if (details.reason === 'update') {
        console.log('Extensão atualizada');
    }
});

// Exemplo de requisição a API externa no background
async function fetchExternalAPI(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Adicione headers personalizados aqui, como tokens de autenticação
                // 'Authorization': 'Bearer SEU_TOKEN'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

// Listener para mensagens de outras partes da extensão
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Mensagem recebida no background:', message);

    if (message.action === 'fetchAPI') {
        fetchExternalAPI(message.url)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));

        return true; // Indica que a resposta será assíncrona
    }
});

// Exemplo de requisição POST
async function postToAPI(url, data) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro ao enviar dados:', error);
        throw error;
    }
}
