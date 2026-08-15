# 🧠 ConfIA — Sistema de Verificação de Fake News com IA

<div align="center">
  <img src="./public/screenshots/logo-screenshots.png" width="300" />

  [![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://conf-ia.netlify.app/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
</div>

> Sistema inteligente de verificação de notícias que utiliza **IA (Groq)**, **APIs de notícias confiáveis** e **técnicas avançadas de detecção de desinformação** para classificar manchetes em tempo real.

Desenvolvido para a **Maratona Tech 2025**, o ConfIA combina tecnologia, ética digital e pensamento computacional para combater a desinformação.

---

## 🏅 Reconhecimentos

Este projeto foi desenvolvido durante a **Maratona Tech 2025** e recebeu os seguintes reconhecimentos:

- 🥈 **Medalha de Prata**: [Certificado de Medalha de Prata](./public/screenshots/certificado%20de%20prata.png)
- 📜 **Menção Honrosa**: [Certificado de Menção Honrosa](./public/screenshots/certificado%20de%20menção%20honrosa%20HERNANDES%20SALES%20NEVES.png)

Os certificados estão disponíveis para consulta e comprovam a avaliação externa do projeto durante a competição.

---

## ⚡ Funcionalidades

### 🔍 Verificação Inteligente
- Análise de manchetes em **texto ou imagem (OCR)**
- Verificação assistida por **IA (Groq)**
- Consulta em **NewsData.io** e **Currents API**
- Classificação em 4 níveis: Alta, Média, Neutra ou Baixa confiabilidade
- Sistema de análise em **3 camadas** (Semântica, Comportamental, Lógica)

### 🛡️ Detecção Avançada
- Identificação de **linguagem sensacionalista e clickbait**
- Detecção de **promessas irreais e teorias conspiratórias**
- Análise semântica contextual com similaridade entre fontes
- Sistema de pontuação para absurdos e sensacionalismo

### 📊 Recursos Educativos
- **Dicas educativas** contextualizadas por nível de confiabilidade
- **Histórico** das últimas 10 verificações (local, por navegador)
- **Dashboard de estatísticas** com gráficos visuais
- **Modais informativos** (Como funciona, Sobre, Histórico)

### 🎨 Interface Moderna
- Design inspirado em ChatGPT e Claude
- Modo escuro com gradientes modernos
- Responsivo para desktop e mobile
- Animações suaves e feedback visual

---

## 🏗️ Arquitetura

O ConfIA tem duas partes: um **frontend estático** (HTML/CSS/JS puro) e um **backend em Netlify Functions** que faz proxy de todas as chamadas de API externas.

```
Navegador → Netlify Functions → APIs externas (Groq, NewsData, Currents, OCR.space)
```

Isso existe por um motivo específico: **nenhuma chave de API fica exposta no código do cliente**. Nas versões anteriores desse projeto, as chaves ficavam direto no `script.js`, visíveis pra qualquer um que abrisse o DevTools. Agora elas vivem só como variável de ambiente no servidor.

```
netlify/functions/
  search-news.js      → proxy NewsData.io + Currents API
  ocr.js               → proxy OCR.space
  analyze.js           → proxy Groq (classificação assistida por IA)
  recent-news.js       → proxy do widget de notícias recentes
  _utils/rateLimit.js  → rate limiting por IP via Upstash Redis
```

Rate limiting: 8 buscas/min e 3 uploads de imagem/min por IP, aplicado **no servidor** (não só no navegador, que qualquer um contorna via DevTools).

Instruções completas de deploy (env vars, geração de chaves, etc.) em [`DEPLOY.md`](./DEPLOY.md).

---

## 💡 Como Funciona

### Fluxo de Análise (3 Camadas)

**1. Entrada e Processamento**
- Texto (máx 500 caracteres) ou imagem (JPG/PNG, máx 10MB)
- OCR para extração de texto de imagens
- Validação e sanitização

**2. Busca de Fontes**
- Extração de keywords relevantes
- Busca em NewsData.io e Currents API (via backend)
- Cache inteligente de 5 minutos

**3. Análise Multicamada**

🔍 **Camada Semântica**
- Cálculo de similaridade contextual (0-100%)
- Identificação de fontes tier-1 (G1, Folha, BBC, etc.)

🚨 **Camada Comportamental**
- Detecção de sensacionalismo (0-100 pts)
- Identificação de clickbait e urgência artificial

⚠️ **Camada Lógica**
- Detecção de absurdos (0-100 pts)
- Identificação de promessas irreais
- Teorias conspiratórias conhecidas

**4. Análise com IA e Classificação**
- Interpretação contextual via Groq
- Sistema de pontuação rigoroso
- Feedback visual com explicação detalhada

<div align="center">
  <img src="./public/screenshots/Fluxograma-ConfIA.png" width="700" alt="Fluxograma" />
</div>

---

## 🎯 Sistema de Classificação

### 🟢 ALTA Confiabilidade (88-92%)
- 3+ fontes tier-1
- Similaridade contextual > 60%
- Score de absurdidade < 15 pts
- Score de sensacionalismo < 20 pts

### 🟡 MÉDIA Confiabilidade (65-75%)
- 2+ fontes com relevância moderada
- Sensacionalismo leve ou moderado
- Score de absurdidade < 25 pts

### 🔵 NEUTRA Confiabilidade (45-50%)
- Poucas ou nenhuma fonte encontrada
- Sem sinais críticos de alerta
- Pode ser notícia local ou muito recente

### 🔴 BAIXA Confiabilidade
- Score de absurdidade ≥ 50 pts, OU
- Absurdidade ≥ 30 pts + sensacionalismo ≥ 40 pts, OU
- Sensacionalismo ≥ 50 pts sem fontes tier-1, OU
- Múltiplos padrões de desinformação

---

## 🧩 Pensamento Computacional

| Pilar | Aplicação |
|-------|-----------|
| **Decomposição** | Sistema modular: validação, OCR, keywords, busca, análise, classificação — front e back separados |
| **Reconhecimento de Padrões** | 30+ padrões de sensacionalismo, absurdos e teorias conspiratórias |
| **Abstração** | Métricas essenciais: similaridade, scores, relevância de fontes |
| **Algoritmo** | Sequência automatizada com cache, rate limiting e fallback |

---

## 🛠️ Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ |
| **Backend** | Netlify Functions (Node.js) |
| **IA** | Groq |
| **APIs** | NewsData.io, Currents API, OCR.space |
| **Rate limiting** | Upstash Redis (REST API) |
| **Gráficos** | Chart.js |
| **Hospedagem** | Netlify |

---

## 🚀 Como Usar

### Online
Acesse: **[conf-ia.netlify.app](https://conf-ia.netlify.app/)**

### Localmente
Requer as chaves de API próprias (não incluídas no repo) — veja [`DEPLOY.md`](./DEPLOY.md) pra saber onde gerar cada uma.

```bash
# Clone o repositório
git clone https://github.com/hernandessn/confia.git
cd confia

# Copie o template de variáveis de ambiente e preencha com suas chaves
cp .env.example .env

# Rode com o Netlify CLI (necessário pras Functions funcionarem)
npx netlify-cli dev
```

Abre em `http://localhost:8888`.

> ⚠️ Abrir o `index.html` direto no navegador (sem `netlify dev`) **não funciona** — as chamadas de API dependem das Netlify Functions rodando junto.

---

## 🔒 Segurança e Privacidade

✅ Chaves de API isoladas no backend — nunca expostas no código do cliente
✅ Rate limiting real, aplicado no servidor (não contornável via DevTools)
✅ Sanitização de entrada do usuário
✅ Escape de HTML em todo conteúdo vindo de fontes externas (previne XSS)
✅ Sem rastreamento — não coletamos dados pessoais
✅ Histórico local — salvo apenas no navegador de cada pessoa, não centralizado
✅ Open source — código auditável

---

## 📊 Limitações

### APIs (Planos Gratuitos)
- **NewsData.io**: 200 req/dia
- **Currents API**: 600 req/dia
- **Groq**: sujeito ao free tier da conta configurada
- **OCR.space**: 25.000 req/mês

### Otimizações
✅ Cache de 5 minutos
✅ Busca paralela
✅ Timeout de 8 segundos com fallback
✅ Rate limiting (8 buscas/min, 3 OCR/min por IP)
✅ Compressão automática de imagens

### Conhecidas
- Histórico e estatísticas são por navegador (localStorage), não compartilhados entre dispositivos ou usuários.
- Rate limiting é fail-open: se o Upstash estiver mal configurado ou fora do ar, as requisições passam sem limite em vez de travar a aplicação inteira.

---

## 💬 FAQ

**O ConfIA é 100% preciso?**
Não. É uma ferramenta educativa. Para informações críticas, sempre verifique em fact-checkers profissionais.

**Por que minha notícia apareceu como "Neutra"?**
Notícias muito recentes, locais ou regionais podem não ter cobertura ampla.

**Como o ConfIA protege minha privacidade?**
Histórico e estatísticas ficam apenas no seu navegador. As buscas passam pelo backend só pra consultar as APIs de notícia — não armazenamos nada do lado do servidor.

**Posso usar comercialmente?**
Sim! Licença MIT. Use, modifique e distribua livremente — mas gere suas próprias chaves de API, não reutilize as de outro deploy.

---

## 📞 Contato

- 📧 **Email**: hernandesneves07@gmail.com
- 💼 **LinkedIn**: [linkedin.com/in/hernandes-sales](https://linkedin.com/in/hernandes-sales)
- 🐙 **GitHub**: [@hernandessn](https://github.com/hernandessn)