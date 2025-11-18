# 🔍 Como Saber se a Verificação Está Funcionando

## ✅ Indicadores Visuais

Quando você clica em um link externo, você verá **IMEDIATAMENTE**:

### 1. **Notificação no Canto Superior Direito** 📍
```
┌─────────────────────────────────┐
│ 🛡️ PhishGuard Ativo            │
│ Verificando segurança do link...│
└─────────────────────────────────┘
```
- Aparece no canto superior direito
- Cor roxa com gradiente
- Spinner animado
- Permanece até a verificação terminar

### 2. **Overlay Central** 🎯
```
       ┌──────────────────────┐
       │   [Spinner girando]  │
       │                      │
       │ 🛡️ Verificando      │
       │    Segurança         │
       └──────────────────────┘
```
- Tela escurecida
- Caixa branca no centro
- Spinner grande girando
- Impossível de ignorar

## 📝 Logs no Console

Abra o Console do Navegador (F12) e você verá:

```javascript
🛡️ PhishGuard: Link clicado -> https://exemplo.com
🛡️ PhishGuard: Link externo detectado - iniciando verificação...
🛡️ PhishGuard: Enviando URL para análise... https://exemplo.com
🛡️ PhishGuard: Análise completa! {risco: "SAFE", avisos: 0}
✅ PhishGuard: Link seguro - redirecionando automaticamente
```

### Tipos de Mensagens:

**Link Interno (não verifica):**
```
🛡️ PhishGuard: Link clicado -> /pagina-interna
🛡️ PhishGuard: Navegação interna - permitida sem verificação
```

**Link Externo Seguro:**
```
🛡️ PhishGuard: Link clicado -> https://google.com
🛡️ PhishGuard: Link externo detectado - iniciando verificação...
🛡️ PhishGuard: Enviando URL para análise...
🛡️ PhishGuard: Análise completa! {risco: "SAFE", avisos: 0}
✅ PhishGuard: Link seguro - redirecionando automaticamente
```

**Link Suspeito:**
```
🛡️ PhishGuard: Link clicado -> http://192.168.1.1
🛡️ PhishGuard: Link externo detectado - iniciando verificação...
🛡️ PhishGuard: Enviando URL para análise...
🛡️ PhishGuard: Análise completa! {risco: "HIGH", avisos: 3}
⚠️ PhishGuard: Link suspeito detectado - mostrando aviso
```

## 🧪 Como Testar Agora

### 1. **Abra o Console**
- Pressione `F12` no Chrome
- Vá para a aba "Console"
- Deixe aberto

### 2. **Clique em um Link de Email**
- Clique em qualquer link no seu email
- **VEJA**:
  - ✅ Notificação roxa no canto superior direito
  - ✅ Overlay central com "Verificando..."
  - ✅ Mensagens no console

### 3. **O que Observar**

**Se a verificação NÃO aparecer:**
- É um link interno (mesmo domínio)
- Console mostrará: "Navegação interna - permitida sem verificação"

**Se a verificação aparecer:**
- Você verá a notificação e overlay
- Console mostrará todas as etapas
- Link seguro = redireciona automaticamente
- Link suspeito = tela de aviso

## 🎬 Fluxo Visual Completo

```
CLIQUE NO LINK
     ↓
┌────────────────────────────────────┐
│  Notificação Roxa (canto direito) │ ← VOCÊ VÊ ISSO IMEDIATAMENTE!
└────────────────────────────────────┘
     ↓
┌────────────────────────────────────┐
│   Overlay Central "Verificando"   │ ← E ISSO TAMBÉM!
└────────────────────────────────────┘
     ↓
  [Análise em 0.5-2 segundos]
     ↓
┌─────┴──────┐
│            │
↓            ↓
SEGURO     SUSPEITO
  ↓            ↓
Redireciona  Tela de Aviso
Automaticamente  Detalhada
```

## 🔧 Troubleshooting

### ❌ "Não vejo nenhuma verificação"

**Motivos possíveis:**

1. **É link interno:**
   - Mesmo domínio não é verificado
   - Veja o console: "Navegação interna"

2. **Extensão não está ativa:**
   - Vá em `chrome://extensions/`
   - Verifique se PhishGuard está ATIVADO
   - Ícone deve estar azul/roxo

3. **Não é um link <a>:**
   - Alguns sites usam JavaScript para navegação
   - Só funciona com elementos `<a href="...">`

4. **Link tem onclick que bloqueia:**
   - Alguns sites bloqueiam a extensão
   - Verifique erros no console

### ✅ "Como forçar uma verificação visível?"

Use a página de teste:
```bash
# Abra este arquivo no navegador:
teste-links.html
```

Clique nos links suspeitos - você verá a verificação funcionando!

## 📊 Estatísticas no Console

Após cada verificação, você pode ver:

```javascript
🛡️ PhishGuard: Análise completa! {
  risco: "MEDIUM",     // Nível de risco
  avisos: 3           // Quantos problemas
}
```

**Níveis de Risco:**
- `SAFE` = Seguro (verde) → Redireciona
- `LOW` = Risco Baixo (azul) → Redireciona
- `MEDIUM` = Risco Médio (amarelo) → Avisa
- `HIGH` = Risco Alto (vermelho) → Avisa
- `CRITICAL` = Crítico (vermelho escuro) → Avisa

## 💡 Dica Pro

Para ver TODAS as verificações:

1. Abra o console (`F12`)
2. Deixe aberto enquanto navega
3. Cada link externo clicado será logado
4. Você terá um histórico completo de verificações

---

**Resumo:** Se você clicar em um link externo e NÃO ver a notificação roxa + overlay, algo está errado. Verifique o console!
