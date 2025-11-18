# 🔀 Testando Links de Redirecionamento - Guia Prático

## Como o PhishGuard Detecta Redirecionamentos

O PhishGuard agora analisa **o destino final** de links de redirecionamento, não apenas o link intermediário. Isso é crucial porque phishers frequentemente usam serviços legítimos (como Google Ads) para esconder destinos maliciosos.

## Exemplo Real: Link do Google Ads

### URL Fornecida
```
https://www.googleadservices.com/pagead/aclk?sa=L&ai=DChcSEwi57KjkrKCLAxU8Zm0KHQjrCDUYABABGgJwYg&co=1&ase=2&gclid=Cj0KCQjwzvGFBhDfARIsANWlX-3YQ_RlTnFO1234567890abcdefg&num=1&sig=AOD_64_1234567890abcdefg&adurl=https://www.jescri.com.br/portal/financeiro/aluno
```

### Como o PhishGuard Processa

1. **Detecta o Redirecionamento:**
   - Identifica o parâmetro `adurl` na URL do Google Ads
   - Extrai o valor: `https://www.jescri.com.br/portal/financeiro/aluno`

2. **Analisa o Destino Final:**
   - URL analisada: `www.jescri.com.br` (não `googleadservices.com`)
   - Todas as verificações são feitas no destino real
   - Protege mesmo quando o intermediário é legítimo

3. **Mostra Transparência Total:**
   - Aviso mostra AMBAS as URLs
   - Usuário vê o link intermediário (Google Ads)
   - Usuário vê o destino final (jescri.com.br)
   - Deixa claro qual URL foi realmente analisada

## Testando na Prática

### Método 1: Usar a Página de Teste

1. Abra `teste-redirecionamentos.html` no navegador
2. Role até a seção "Google Ads com Destino Suspeito"
3. Clique em qualquer exemplo
4. Observe:
   - ✅ Notificação "Verificando link..."
   - ✅ Overlay central aparecer
   - ✅ Se suspeito: aviso detalhado mostrando ambas as URLs
   - ✅ Console do navegador (F12) mostrando logs detalhados

### Método 2: Criar Link de Teste Personalizado

Você pode criar um link HTML simples para testar com qualquer destino:

```html
<a href="https://www.googleadservices.com/pagead/aclk?adurl=https://DESTINO-AQUI.com">
    Clique para testar
</a>
```

Substitua `DESTINO-AQUI.com` por qualquer site que você quer testar.

### Método 3: Testar o Link Real do Email

1. Copie o link completo do email
2. Crie um arquivo HTML temporário:
```html
<!DOCTYPE html>
<html>
<body>
    <a href="SEU-LINK-AQUI">Clique aqui</a>
</body>
</html>
```
3. Abra no navegador e clique

## O Que Observar Durante o Teste

### Console do Navegador (F12 → Console)

Você verá logs detalhados como:

```
🛡️ PhishGuard: Link clicado -> https://www.googleadservices.com/pagead/aclk?...
🛡️ PhishGuard: Link externo detectado - iniciando verificação...
🛡️ PhishGuard: Enviando URL para análise...
🛡️ PhishGuard: Análise completa! {
    risco: "SAFE",
    avisos: 1,
    redirecionamento: "SIM",
    urlOriginal: "https://www.googleadservices.com/...",
    urlFinal: "https://www.jescri.com.br/..."
}
🔀 PhishGuard: Redirecionamento detectado!
   📍 Link intermediário: https://www.googleadservices.com/...
   🎯 Destino final: https://www.jescri.com.br/...
   ℹ️  O destino final foi analisado, não o link intermediário
✅ PhishGuard: Link seguro - redirecionando automaticamente
```

### Tela de Aviso (Se Suspeito)

Se o destino final for suspeito, você verá:

1. **Box Amarelo de Redirecionamento:**
   - Título: "🔀 LINK DE REDIRECIONAMENTO DETECTADO"
   - Link intermediário em cinza
   - Destino final em vermelho com borda dupla

2. **Informação de Análise:**
   - "DESTINO FINAL ANALISADO:" (não "VOCÊ ESTÁ TENTANDO ACESSAR:")
   - Mostra o destino real que foi verificado

3. **Lista de Problemas:**
   - Problemas se referem ao destino final
   - Exemplo: "Domínio Similar a Site Legítimo" → refere-se a jescri.com.br, não googleadservices.com

## Parâmetros de Redirecionamento Detectados

A extensão reconhece automaticamente estes parâmetros comuns:

- `adurl` → Google Ads
- `url` → Genérico
- `redirect`, `dest`, `destination` → Redirecionamento explícito
- `target`, `link`, `to`, `goto` → Destino
- `continue`, `next` → Fluxos de autenticação
- `return_url`, `redirect_url` → Retornos
- `out` → Links de saída
- `u`, `q` → Versões curtas

## Casos de Teste Importantes

### ✅ Caso 1: Google Ads → Site Legítimo
```
googleadservices.com?adurl=https://www.google.com
```
**Esperado:** Redirecionamento automático, sem aviso

### ⚠️ Caso 2: Google Ads → Site com IP
```
googleadservices.com?adurl=http://192.168.1.1
```
**Esperado:** Aviso mostrando que destino usa IP

### ⚠️ Caso 3: Email Tracker → Domínio Similar
```
mailchi.mp?url=https://bancodobrasil-seguro.com
```
**Esperado:** Aviso mostrando similaridade com "Banco do Brasil"

### ⚠️ Caso 4: Redirect → Site Sem HTTPS
```
redirect.example.com?dest=http://site-suspeito.com
```
**Esperado:** Aviso sobre ausência de HTTPS no destino

## Verificação de Funcionamento

✅ **Está funcionando se:**
- Console mostra "🔀 Redirecionamento detectado!"
- Aviso exibe duas URLs (intermediária e final)
- Análise se refere ao destino final
- Links seguros redirecionam automaticamente
- Links suspeitos mostram aviso detalhado

❌ **Não está funcionando se:**
- Análise menciona apenas "googleadservices.com"
- Aviso não mostra o destino final
- Console não mostra logs de redirecionamento

## Resposta à Sua Pergunta Original

> "o sistema vai ser eficais para validar o link real de direcionamento que é jescri?"

**Resposta:** SIM! 🎯

O PhishGuard agora:
1. ✅ Detecta que é um link do Google Ads
2. ✅ Extrai automaticamente `jescri.com.br` do parâmetro `adurl`
3. ✅ Analisa `jescri.com.br` (não `googleadservices.com`)
4. ✅ Mostra transparência total sobre ambas as URLs
5. ✅ Protege você do destino real, independente do intermediário

Mesmo que phishers usem serviços legítimos para redirecionamento, o PhishGuard analisa onde você realmente vai acabar.
