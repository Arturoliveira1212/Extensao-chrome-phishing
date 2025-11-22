# 🛡️ Proteção Anti-Phishing Brasil

![Versão](https://img.shields.io/badge/vers%C3%A3o-1.0.0-blue)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-green)
![Chrome](https://img.shields.io/badge/Chrome-Extension-yellow)

Extensão open-source para navegador Chrome desenvolvida para proteger usuários brasileiros contra links maliciosos, phishing e ameaças online.

## 📋 Sobre o Projeto

Este projeto foi desenvolvido como trabalho acadêmico de **Segurança e Auditoria de Sistemas**, com foco em **Proteção contra Phishing para Usuários Leigos no Brasil**.

A extensão analisa automaticamente todos os links clicados pelo usuário, identificando possíveis ameaças antes que a navegação ocorra.

## ✨ Funcionalidades

### 🔍 Análises Realizadas

- **Detecção de Encurtadores de URL**: Identifica links encurtados (bit.ly, tinyurl, etc.) e resolve o destino final
- **Identificação de IPs**: Detecta URLs que usam endereços IP em vez de domínios
- **Análise de Homógrafos**: Identifica caracteres suspeitos que imitam letras normais (ataques IDN)
- **Verificação de HTTPS**: Alerta sobre sites sem protocolo seguro
- **Reputação de Domínio**:
  - Verificação em blacklists de phishing
  - Detecção de domínios recém-registrados
  - Análise de similaridade com sites legítimos
  - Verificação de certificados SSL
- **Análise de Padrões Suspeitos**:
  - Excesso de subdomínios
  - Uso excessivo de números e hífens
  - URLs extremamente longas
  - Palavras suspeitas no domínio

### 🎯 Classificação de Risco

A extensão classifica cada link em três níveis:

- **✅ Seguro**: Link não apresenta riscos identificados
- **⚠️ Baixo Risco**: Alguns indicadores de risco detectados, requer cautela
- **🛑 Alto Risco**: Múltiplos indicadores de perigo, bloqueio recomendado

## 🚀 Instalação

### Requisitos

- Google Chrome ou navegador baseado em Chromium (Edge, Brave, Opera)
- Versão mínima do Chrome: 88

### Passos de Instalação

1. **Clone ou baixe este repositório**:
   ```bash
   git clone https://github.com/seu-usuario/anti-phishing-brasil.git
   ```

2. **Abra o Chrome e acesse**:
   ```
   chrome://extensions/
   ```

3. **Ative o "Modo de desenvolvedor"** (canto superior direito)

4. **Clique em "Carregar sem compactação"**

5. **Selecione a pasta** `artur-extensao` onde está o projeto

6. **Pronto!** A extensão está instalada e ativa 🎉

## 📖 Como Usar

### Uso Básico

1. **Navegue normalmente**: A extensão trabalha automaticamente em segundo plano
2. **Ao clicar em um link**: A extensão analisa o destino antes de navegar
3. **Aguarde a análise**: Uma caixa de carregamento aparece durante a verificação
4. **Veja o resultado**:
   - Links seguros navegam automaticamente
   - Links suspeitos exibem um aviso com detalhes
5. **Tome sua decisão**: Você pode voltar (recomendado) ou continuar por sua conta

### Interface do Popup

Clique no ícone da extensão para ver:
- 📊 **Estatísticas**: Links analisados e ameaças bloqueadas
- 🗑️ **Limpar Cache**: Remove dados de verificações anteriores
- ℹ️ **Sobre**: Informações sobre a extensão

## 🔧 Configuração de APIs (Opcional)

Para melhorar a detecção, você pode configurar APIs gratuitas:

### Google Safe Browsing (Recomendado)

1. Acesse: https://developers.google.com/safe-browsing/v4/get-started
2. Obtenha uma chave API gratuita
3. Edite `background.js` e adicione sua chave

### VirusTotal

1. Crie conta em: https://www.virustotal.com/gui/join-us
2. Obtenha sua chave API (4 requisições/minuto no plano gratuito)
3. Edite `background.js` linha 145 e substitua `SUA_CHAVE_API_AQUI`

### WHOIS API

1. Acesse: https://www.whoisxmlapi.com/
2. Cadastre-se no plano gratuito (500 consultas/mês)
3. A integração já está implementada no código

> **Nota**: A extensão funciona sem APIs configuradas, mas com capacidades limitadas de verificação de reputação.

## 🏗️ Arquitetura

```
artur-extensao/
├── manifest.json          # Configuração da extensão
├── content.js            # Script principal - intercepta cliques
├── background.js         # Service worker - APIs e verificações
├── analisador.js         # Lógica de análise e classificação
├── utils.js              # Funções utilitárias
├── styles.css            # Estilos dos modais
├── popup.html            # Interface do popup
├── popup.js              # Lógica do popup
├── icons/                # Ícones da extensão
└── README.md             # Este arquivo
```

## 🔐 Segurança e Privacidade

- ✅ **Open Source**: Código totalmente aberto e auditável
- ✅ **Sem Coleta de Dados**: Nenhuma informação pessoal é coletada ou enviada
- ✅ **Processamento Local**: Maioria das análises feitas localmente
- ✅ **APIs Gratuitas**: Apenas APIs públicas e confiáveis (quando configuradas)
- ✅ **Sem Rastreamento**: Não há analytics ou telemetria

## 🛠️ Desenvolvimento

### Tecnologias Utilizadas

- JavaScript (ES6+)
- Chrome Extension Manifest V3
- HTML5 / CSS3
- APIs REST (opcional)

### Estrutura do Código

Todo o código está **documentado em português** com:
- Comentários explicativos em cada função
- Nomes de variáveis e métodos em português
- Documentação JSDoc

### Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📊 Testes

### Testar a Extensão

Você pode testar com URLs conhecidas:

**Links Seguros**:
- https://www.google.com
- https://www.gov.br

**Links com Encurtadores** (testa resolução):
- http://bit.ly/example

**Links Suspeitos** (para testar detecção):
- Links com IPs: http://192.168.1.1
- Links com homógrafos: Criar domínios de teste

> ⚠️ **Atenção**: Nunca visite links maliciosos reais para teste! Use apenas ambientes controlados.

## 🐛 Problemas Conhecidos

- A resolução de redirecionamentos pode falhar em alguns encurtadores com proteção CAPTCHA
- APIs gratuitas têm limites de requisições
- Alguns sites podem não ser compatíveis com a interceptação de cliques

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autores

- **Artur** - Desenvolvimento inicial - Trabalho de Segurança de Sistemas

## 🙏 Agradecimentos

- PhishTank - Base de dados de phishing
- VirusTotal - API de verificação de ameaças
- WHOIS API - Verificação de domínios
- Google Safe Browsing - Proteção contra sites maliciosos

## 📞 Suporte

Se encontrar problemas ou tiver sugestões:

1. Abra uma [Issue no GitHub](https://github.com/seu-usuario/anti-phishing-brasil/issues)
2. Descreva o problema detalhadamente
3. Inclua prints se possível

## 🔄 Versões

### v1.0.0 (Atual)
- ✅ Lançamento inicial
- ✅ Detecção de encurtadores
- ✅ Análise de homógrafos
- ✅ Verificação de reputação
- ✅ Interface visual completa
- ✅ Sistema de classificação de risco

### Próximas Funcionalidades (Planejadas)
- 🔜 Whitelist personalizada
- 🔜 Relatórios de segurança
- 🔜 Integração com mais APIs
- 🔜 Modo offline melhorado
- 🔜 Suporte para Firefox

## 📚 Referências

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [OWASP Phishing Guide](https://owasp.org/www-community/attacks/Phishing)
- [Anti-Phishing Working Group](https://apwg.org/)

---

**⚠️ Disclaimer**: Esta extensão é uma ferramenta educacional e de auxílio. Não garante 100% de proteção contra todas as ameaças. Use sempre o bom senso ao navegar na internet.

**🔒 Mantenha-se seguro online!**
