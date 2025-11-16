// Popup Script - Lida com a interface do usuário

document.addEventListener('DOMContentLoaded', function () {
    const fetchBtn = document.getElementById('fetchDataBtn');
    const resultDiv = document.getElementById('result');

    fetchBtn.addEventListener('click', async function () {
        resultDiv.textContent = 'Carregando...';

        try {
            // Exemplo de requisição a uma API externa
            const response = await fetch('https://api.github.com/users/github');

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            resultDiv.innerHTML = `
        <strong>Usuário:</strong> ${data.login}<br>
        <strong>Nome:</strong> ${data.name}<br>
        <strong>Repos:</strong> ${data.public_repos}
      `;
        } catch (error) {
            resultDiv.textContent = `Erro: ${error.message}`;
            console.error('Erro ao buscar dados:', error);
        }
    });
});

// Exemplo de comunicação com background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Mensagem recebida no popup:', message);
    sendResponse({ status: 'ok' });
});
