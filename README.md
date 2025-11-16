# Extensão Chrome - Guia Completo

## 📁 Estrutura de Arquivos

```
extensao-chrome-hello-world/
├── manifest.json          # Arquivo de configuração principal (OBRIGATÓRIO)
├── popup.html             # Interface do popup
├── popup.css              # Estilos do popup
├── popup.js               # Lógica do popup
├── background.js          # Service Worker (executa em segundo plano)
├── content.js             # Script injetado nas páginas web
├── icons/                 # Pasta para ícones
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 📋 Arquivos Essenciais

### 1. **manifest.json** (OBRIGATÓRIO)
- Arquivo de configuração principal
- Define permissões, scripts, ícones e metadados
- Versão 3 é a atual (Manifest V3)

### 2. **popup.html, popup.js, popup.css** (Opcional)
- Interface que aparece ao clicar no ícone da extensão
- Ideal para controles e configurações rápidas

### 3. **background.js** (Opcional, mas recomendado)
- Service Worker que executa em segundo plano
- Gerencia eventos, requisições, e lógica persistente
- Não tem acesso ao DOM da página

### 4. **content.js** (Opcional)
- Script injetado nas páginas web
- Pode manipular o DOM da página
- Executa no contexto da página visitada

### 5. **icons/** (Recomendado)
- Ícones da extensão em diferentes tamanhos
- 16x16, 48x48, 128x128 pixels

## 🌐 Como Fazer Requisições a APIs Externas

### Método 1: No Popup (popup.js)

```javascript
async function buscarDados() {
  try {
    const response = await fetch('https://api.exemplo.com/dados', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SEU_TOKEN'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

### Método 2: No Background Script (background.js)

```javascript
// Melhor para requisições persistentes
async function fetchAPI(url) {
  const response = await fetch(url);
  return await response.json();
}

// Comunicar com popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetchAPI') {
    fetchAPI(msg.url)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Resposta assíncrona
  }
});
```

### Método 3: POST Request

```javascript
async function enviarDados(url, dados) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados)
  });
  
  return await response.json();
}
```

## 🔑 Permissões Necessárias (manifest.json)

```json
{
  "permissions": [
    "storage",      // Para salvar dados localmente
    "activeTab"     // Para acessar a aba ativa
  ],
  "host_permissions": [
    "https://*/*",  // Requisições HTTPS
    "http://*/*"    // Requisições HTTP
  ]
}
```

## 🚀 Como Instalar a Extensão no Chrome

1. Abra o Chrome e digite: `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" (canto superior direito)
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `extensao-chrome-hello-world`
5. A extensão será instalada e aparecerá na barra de ferramentas

## 💡 Dicas Importantes

### Requisições a APIs:
- **CORS**: APIs externas precisam permitir requisições do Chrome
- **Autenticação**: Use headers para tokens (Bearer, API Key)
- **Permissões**: Adicione `host_permissions` no manifest.json
- **Background**: Melhor para requisições persistentes ou agendadas

### Comunicação entre Scripts:
```javascript
// Enviar mensagem (de qualquer script)
chrome.runtime.sendMessage({ action: 'hello' }, (response) => {
  console.log(response);
});

// Receber mensagem (em qualquer script)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg);
  sendResponse({ received: true });
});
```

### Armazenamento Local:
```javascript
// Salvar dados
chrome.storage.local.set({ chave: 'valor' });

// Recuperar dados
chrome.storage.local.get(['chave'], (result) => {
  console.log(result.chave);
});
```

## 🔧 Debugging

1. Popup: Clique com botão direito no popup → "Inspecionar"
2. Background: Em `chrome://extensions/` → "Inspecionar views"
3. Content Script: F12 na página web (aba Console)

## 📚 Recursos Úteis

- [Documentação Oficial do Chrome Extensions](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Extension Samples](https://github.com/GoogleChrome/chrome-extensions-samples)

## 🎨 Criando Ícones

Crie ícones simples em:
- [Favicon.io](https://favicon.io/)
- [Canva](https://www.canva.com/)
- Use emojis grandes e converta para PNG
