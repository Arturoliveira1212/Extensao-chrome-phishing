# 🛡️ Guardião Web

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

## 👥 Autores

- [Artur Alves](https://github.com/Arturoliveira1212).
- [Guilherme Rosa](https://github.com/guilhermrosa).

**⚠️ Disclaimer**: Esta extensão é uma ferramenta educacional e de auxílio. Não garante 100% de proteção contra todas as ameaças. Use sempre o bom senso ao navegar na internet.

**🔒 Mantenha-se seguro online!**
