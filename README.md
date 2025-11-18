# 🛡️ PhishGuard - Proteção Anti-Phishing para Chrome

Extensão para Chrome focada na proteção contra phishing para usuários leigos. Detecta e alerta sobre links suspeitos em tempo real com análises detalhadas.

## 🎯 Funcionalidades

### 🔒 Proteção Inteligente em Tempo Real

**Sistema de Interceptação de Links:**
- ✅ Todos os cliques em links externos são interceptados automaticamente
- ✅ Análise completa ANTES de acessar o site
- ✅ Links seguros: acesso imediato e automático
- ✅ Links suspeitos: tela de aviso com explicação detalhada
- ✅ Navegação interna do site: liberada sem verificação
- ✅ Funciona com links que abrem em nova aba

### Análises Implementadas

A extensão realiza verificações abrangentes em cada URL:

#### ✅ Verificações Locais (Instantâneas)

1. **Detecção de Redirecionamentos** ⭐ NOVO
   - Extrai automaticamente o destino final de links de redirecionamento
   - Suporta Google Ads, rastreadores de email, e outros serviços
   - Analisa o destino real, não apenas o link intermediário
   - Mostra ambos os URLs (intermediário e final) no aviso
   - Protege contra phishers que usam serviços legítimos para redirecionamento

2. **Encurtadores de URL**
   - Detecta uso de serviços como bit.ly, tinyurl.com, etc.
   - Alerta sobre destino oculto do link

3. **Endereço IP no lugar de domínio**
   - Identifica URLs usando IPs (ex: http://192.168.1.1)
   - Sites legítimos raramente usam IPs diretamente

4. **Caracteres Homógrafos Suspeitos**
   - Detecta caracteres Unicode que imitam letras normais
   - Protege contra ataques IDN homograph (ex: paypaІ.com usando 'І' cirílico)

5. **Ausência de HTTPS**
   - Alerta sobre conexões HTTP não seguras
   - Indica risco de interceptação de dados

6. **Domínio com Similaridade**
   - Compara com domínios legítimos conhecidos
   - Detecta typosquatting (ex: gooogle.com, amazom.com)
   - Identifica domínios que contêm nomes de sites famosos

7. **TLDs Suspeitos**
   - Verifica extensões de domínio frequentemente usadas em fraudes
   - Ex: .tk, .ml, .ga, .xyz, etc.

8. **Palavras-chave Suspeitas**
   - Detecta termos comuns em phishing (verify, urgent, update, etc.)
   - Identifica tentativas de criar senso de urgência

9. **Análises Adicionais**
   - Domínios muito longos
   - Excesso de subdomínios
   - Uso de portas não padrão

#### 🌐 Verificações com APIs Externas (Opcionais)

1. **VirusTotal**
   - Verifica se o site foi marcado como malicioso
   - Requer chave de API gratuita

2. **PhishTank**
   - Consulta banco de dados colaborativo de phishing
   - Gratuito, sem necessidade de chave

3. **URLScan.io**
   - Análise de reputação do site
   - Uso limitado sem chave

## 📦 Instalação

### Carregar Extensão no Chrome

1. Clone ou baixe este repositório
2. Abra o Chrome e acesse `chrome://extensions/`
3. Ative o "Modo do desenvolvedor" no canto superior direito
4. Clique em "Carregar sem compactação"
5. Selecione a pasta da extensão
6. A extensão será instalada e ativada automaticamente

### Configurar APIs (Opcional)

Para aproveitar todas as funcionalidades, configure as chaves de API no arquivo `config.js`:

```javascript
APIS: {
    // VirusTotal - https://www.virustotal.com/gui/join-us
    VIRUSTOTAL_KEY: 'sua-chave-aqui',
    
    // Google Safe Browsing - https://console.cloud.google.com/
    GOOGLE_SAFE_BROWSING_KEY: 'sua-chave-aqui'
}
```

**APIs Gratuitas Disponíveis:**
- VirusTotal: 500 requests/dia
- URLScan.io: uso limitado sem chave
- PhishTank: gratuito e ilimitado
- Google Safe Browsing: 10.000 requests/dia

## 🚀 Como Usar

### 1. Proteção Automática em Cliques
- **Ao clicar em qualquer link externo**, a extensão:
  - ⏸️ **Pausa a navegação** automaticamente
  - 🔍 **Analisa o link** em tempo real
  - ✅ **Se for seguro (Risco Baixo/Nenhum)**: redireciona automaticamente
  - ⚠️ **Se for suspeito (Risco Médio/Alto/Crítico)**: mostra tela de aviso com:
    - Todos os problemas detectados explicados
    - Opção de cancelar (recomendado)
    - Opção de prosseguir por sua conta e risco

### 2. Análise Manual
- Clique no ícone da extensão 🛡️
- Clique em "Analisar Site"
- Veja o relatório detalhado com todos os problemas encontrados

### 3. Indicador de Proteção Ativa
- Ícone 🛡️ no canto inferior direito de cada página
- Confirma que a proteção está ativa
- Indica que todos os links estão sendo monitorados

### 4. Navegação Interna Liberada
- Links para o mesmo site (navegação interna) **não são bloqueados**
- Apenas links externos são verificados
- Não interfere na usabilidade normal do site

## 🎨 Interface

### Níveis de Risco

A extensão classifica sites em 5 níveis:

| Nível | Cor | Descrição |
|-------|-----|-----------|
| 🟢 **Seguro** | Verde | Nenhum problema detectado |
| 🔵 **Risco Baixo** | Azul | Problemas menores detectados |
| 🟡 **Risco Médio** | Amarelo | Várias características suspeitas |
| 🔴 **Risco Alto** | Vermelho | Múltiplos indicadores de phishing |
| 🔴 **Risco Crítico** | Vermelho Escuro | Perigo confirmado por múltiplas fontes |

### Popup da Extensão

O popup mostra:
- URL atual sendo analisada
- Badge de nível de risco
- Lista detalhada de problemas encontrados
- Explicação de cada problema para usuários leigos
- Configurações rápidas

## ⚙️ Configurações

Acesse as configurações no popup da extensão:

- **Verificação automática**: Ativa/desativa análise ao navegar
- **Mostrar notificações**: Controla alertas do sistema
- **Limpar cache**: Remove análises antigas armazenadas

## 🔧 Estrutura do Projeto

```
Extensao-chrome-phishing/
├── manifest.json           # Configuração da extensão
├── background.js          # Service worker (análises em segundo plano)
├── content.js             # Script injetado nas páginas
├── popup.html             # Interface do popup
├── popup.js               # Lógica do popup
├── popup.css              # Estilos do popup
├── config.js              # Configurações e listas
├── phishing-detector.js   # Motor de detecção de phishing
├── api-examples.js        # Exemplos de uso de API
└── icons/                 # Ícones da extensão
```

## 🧪 Testando a Extensão

### Páginas de Teste Incluídas

O projeto inclui arquivos HTML para testar diversos cenários:

#### 1. `teste-links.html` - Testes Gerais
Contém links para testar as verificações básicas:
- Links suspeitos (IPs, homógrafos, sem HTTPS)
- Links seguros (domínios conhecidos)
- Links internos (não verificados)

#### 2. `teste-redirecionamentos.html` - Testes de Redirecionamento ⭐ NOVO
Página especial para testar a detecção de links de redirecionamento:
- **Google Ads** com destinos suspeitos e seguros
- **Rastreadores de email** (Mailchimp, SendGrid)
- **Redirecionadores genéricos** (diversos parâmetros)
- **URLs codificadas** e protocolos relativos

**Como usar:**
1. Abra o arquivo no navegador
2. Clique nos links de exemplo
3. Observe como a extensão:
   - Detecta o redirecionamento
   - Extrai o destino final
   - Mostra ambos os URLs no aviso
   - Analisa o destino real, não apenas o intermediário

### Exemplos de Links de Redirecionamento Detectados

A extensão identifica e extrai destinos finais de:
- `adurl` (Google Ads)
- `url`, `redirect`, `dest`, `destination` (genéricos)
- `target`, `link`, `to`, `goto` (variações comuns)
- `continue`, `next`, `out` (fluxos de autenticação)
- `return_url`, `redirect_url` (retornos)
- URLs codificadas (decodifica automaticamente)

### Sites de Teste Externos

Para testar com URLs reais de phishing (seguro):

1. **URLs de teste conhecidas:**
   - PhishTank: https://phishtank.org
   - OpenPhish: https://openphish.com

2. **Simular características suspeitas:**
   - Usar HTTP ao invés de HTTPS
   - URLs com IPs: `http://192.168.1.1`
   - Encurtadores: `bit.ly/xyz`

⚠️ **NUNCA** use dados reais em sites suspeitos durante testes!

## 🔒 Privacidade e Segurança

- ✅ Todas as verificações locais são feitas no seu navegador
- ✅ APIs externas são consultadas apenas para URLs que você visita
- ✅ Nenhum dado pessoal é coletado ou enviado
- ✅ Cache de análises armazenado localmente por 1 hora
- ✅ Código-fonte aberto para auditoria

## 📝 Limitações

- APIs externas têm limites de uso gratuito
- Verificações locais podem não detectar todos os ataques sofisticados
- Verificação de idade do domínio requer API WHOIS (não implementada)
- Certificado SSL validado apenas pelo navegador

## 🤝 Contribuindo

Sugestões de melhorias são bem-vindas! Áreas para expansão:

- [ ] Verificação de certificado SSL
- [ ] API WHOIS para idade do domínio
- [ ] Machine Learning para detecção avançada
- [ ] Lista negra local personalizável
- [ ] Relatórios de sites suspeitos
- [ ] Modo offline com lista local
- [ ] Suporte para outros navegadores (Firefox, Edge)

## 📄 Licença

Este projeto é de código aberto para fins educacionais e de proteção de usuários.

## 🆘 Suporte

Se encontrar problemas ou sites que deveriam ser detectados:

1. Abra o console do desenvolvedor (F12)
2. Verifique mensagens de erro
3. Reporte o problema com detalhes

## ⚠️ Aviso Legal

Esta extensão é uma ferramenta de auxílio e não substitui boas práticas de segurança:

- Sempre verifique URLs antes de inserir dados sensíveis
- Use gerenciador de senhas
- Ative autenticação de dois fatores
- Mantenha seu navegador atualizado
- Em caso de dúvida, não prossiga

**A segurança online é responsabilidade de todos! 🛡️**
