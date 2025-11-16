// Content Script - Executa no contexto das páginas web

console.log('Content script carregado na página:', window.location.href);

// Exemplo de modificação da página
function initContentScript() {
    console.log('Iniciando content script...');

    // Aqui você pode manipular o DOM da página
    // Por exemplo, adicionar um botão flutuante
    const button = document.createElement('button');
    button.textContent = 'Botão da Extensão';
    button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;

    button.addEventListener('click', () => {
        alert('Botão da extensão clicado!');

        // Enviar mensagem para o background script
        chrome.runtime.sendMessage({
            action: 'fetchAPI',
            url: 'https://jsonplaceholder.typicode.com/posts/1'
        }, (response) => {
            if (response.success) {
                console.log('Dados da API:', response.data);
            } else {
                console.error('Erro:', response.error);
            }
        });
    });

    document.body.appendChild(button);
}

// Aguardar o carregamento completo da página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContentScript);
} else {
    initContentScript();
}

// Listener para mensagens do background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Mensagem recebida no content script:', message);
    sendResponse({ received: true });
});
